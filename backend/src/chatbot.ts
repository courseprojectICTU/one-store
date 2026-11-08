import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { transcribeAudio } from './speech';
import { z } from 'zod';
import type { ShopBindings } from './commerce';
import { getAdminUser, requireWritePermission } from './admin';

export const chatbot = new Hono<{ Bindings: ShopBindings }>();

export interface KnowledgeDocument {
  id: string;
  title: string;
  created_at: string;
  chunks_count?: number;
}

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
}

export interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface ProductRecord {
  id?: number;
  name: string;
  slug?: string;
  category: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  stock: number;
  sizes: string;
  colors: string;
  image_key?: string | null;
  featured?: number;
  created_at?: string;
}

const fail = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const allowedAdmin = async (c: any) => {
  const user = await getAdminUser(c);
  return Boolean(user);
};

const knowledgeSchema = z.object({
  title: z.string().trim().min(2).max(150),
  content: z.string().trim().min(20).max(30000),
});

const chatRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .min(2, 'Câu hỏi quá ngắn, vui lòng nhập tối thiểu 2 ký tự')
    .max(600, 'Câu hỏi quá dài, tối đa 600 ký tự'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().max(5000),
      }),
    )
    .optional()
    .default([]),
  pendingOrder: z.any().optional(),
  stream: z.boolean().optional().default(false),
});

/**
 * Băm chuỗi truy vấn để làm khóa lưu trữ bộ đệm Cloudflare KV
 */
export async function hashQuery(str: string): Promise<string> {
  const norm = str
    .normalize('NFC')
    .toLowerCase()
    .replace(/[?!.,;:"'~`@#$%^&*()_+=\-[\]{}|\\/<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(norm);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(hash));
  return bytes.slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Trích xuất các trường từ Bảng tóm tắt đơn hàng (Order Summary Table) trong lịch sử chat
 */
export function parseSummaryTable(text: string) {
  if (!text) return null;
  const productMatch = text.match(/[-*•]\s*\*\*Sản\s*phẩm:\*\*\s*([^\n]+)/i);
  const sizeColorMatch = text.match(/[-*•]\s*\*\*Phân\s*loại:\*\*\s*Size\s*(\d{2}(?:\.5)?)\s*\|\s*Màu\s*([^\n|]+)/i);
  const qtyMatch = text.match(/[-*•]\s*\*\*Số\s*lượng:\*\*\s*(\d+)/i);
  const recipientMatch = text.match(/[-*•]\s*\*\*Người\s*nhận:\*\*\s*([^|\n]+)\s*\|\s*([0-9+.\s-]{9,15})/i);
  const addressMatch = text.match(/[-*•]\s*\*\*Địa\s*chỉ(?:\s*nhận)?:\*\*\s*([^\n]+)/i);

  if (!productMatch && !recipientMatch) return null;

  return {
    productName: productMatch ? productMatch[1].trim() : null,
    size: sizeColorMatch ? sizeColorMatch[1].trim() : null,
    color: sizeColorMatch ? sizeColorMatch[2].trim() : null,
    quantity: qtyMatch ? parseInt(qtyMatch[1], 10) : 1,
    customerName: recipientMatch ? recipientMatch[1].trim() : null,
    phone: recipientMatch ? recipientMatch[2].trim().replace(/[\s.-]/g, '') : null,
    address: addressMatch ? addressMatch[1].trim() : null,
  };
}

/**
 * Bóc tách thực thể và ý định chốt đơn hàng từ hội thoại và người dùng (Agentic In-Chat Ordering)
 */
export function extractOrderDetails(
  query: string,
  history: ChatHistoryTurn[] = [],
  pendingOrder: any = null,
  allProducts: ProductRecord[] = [],
) {
  const queryLower = query.toLowerCase().trim();

  // 1. Ý định hủy đặt hàng
  const isCancelIntent = /(?:hủy đơn|hủy đặt|không mua nữa|thôi không mua|hủy đi|thôi bỏ qua|không đặt nữa|hủy mua|hủy giúp|bỏ đơn)/i.test(queryLower);

  // 2. Ý định chốt đơn trực tiếp
  const isConfirmIntent = /(?:^|\s)(?:chốt đơn|chốt|xác nhận đơn|xác nhận|đồng ý|ok chốt|chốt luôn|mua luôn|đặt luôn|chốt nhé|chốt nha|chốt giúp|xác nhận mua)(?:\s*!*|$)/i.test(queryLower);

  // 3. Ý định tìm kiếm, khám phá hoặc lọc sản phẩm (Discovery & Filter Intent)
  const isDiscoveryIntent = /(?:tìm|kiếm|xem|tư vấn|gợi ý|có mẫu nào|mẫu nào|đôi nào|dưới|trên|khoảng|tầm|dao động|giao động|giá rẻ|giá tốt|chạy bộ|thời trang|bóng rổ|dã ngoại|đổi mẫu|mẫu khác|đôi khác|size khác|màu khác)/i.test(queryLower);

  // 4. Phát hiện chuyển ngữ cảnh (Context Switch): Khách đổi sang tìm kiếm/hỏi giá/hỏi chính sách hoặc hủy đơn
  const isContextSwitch =
    isCancelIntent ||
    (Boolean(pendingOrder) && isDiscoveryIntent && !isConfirmIntent);

  // 5. Ý định đặt hàng: CHỈ xét trên lượt nói hiện tại của khách hàng (queryLower)
  const isOrderIntent =
    isConfirmIntent ||
    /(?:^|\s)(?:mua|đặt\s+(?:\d+\s+)?(?:đôi|chiếc|hàng|giày)?|lấy\s+(?:\d+\s+)?(?:đôi|chiếc)?|lên đơn|ship\s+(?:cho|đến|về)|order|cho tôi đặt|cho mình đặt|tôi muốn lấy|muốn mua|muốn đặt)(?:\s|$)/i.test(queryLower) ||
    /(?:họ\s*tên|người\s*nhận|sđt|điện\s*thoại|địa\s*chỉ)/i.test(query);

  // Trích xuất Số điện thoại (Chỉ từ câu hỏi hiện tại hoặc lượt nói của khách gần nhất)
  let phone: string | null = null;
  const phonePattern = /(?:(?:\+84|84|0)[35789]\d{8})\b/;
  const phoneLabelPattern = /(?:sđt|số\s*điện\s*thoại|điện\s*thoại|sdt|phone|tel)\s*[:=]?\s*([0-9+.\s-]{9,15})/i;

  const userTurns = history.filter((h) => h.role === 'user');
  const lastUserText = userTurns.length > 0 ? userTurns[userTurns.length - 1].text : '';

  const phoneLabelMatch = query.match(phoneLabelPattern) || lastUserText.match(phoneLabelPattern);
  if (phoneLabelMatch) {
    const raw = phoneLabelMatch[1].replace(/[\s.-]/g, '').replace(/^\+84/, '0').replace(/^84/, '0');
    if (/^0[35789]\d{8}$/.test(raw)) phone = raw;
  }
  if (!phone) {
    const rawMatch = query.match(phonePattern) || lastUserText.match(phonePattern);
    if (rawMatch) {
      const raw = rawMatch[0].replace(/[\s.-]/g, '').replace(/^\+84/, '0').replace(/^84/, '0');
      if (/^0[35789]\d{8}$/.test(raw)) phone = raw;
    }
  }

  // Danh sách từ khóa cấm khi trích xuất họ tên (Blacklist chống rách câu/nuốt nhãn)
  const isInvalidName = (str: string) => {
    return /(?:sđt|số\s*điện\s*thoại|điện\s*thoại|địa\s*chỉ|size|màu|nhận\s*hàng|họ\s*tên|tên\s*sản\s*phẩm|số\s*lượng)/i.test(str);
  };

  // Trích xuất Họ tên
  let customerName: string | null = null;
  const nameLabelMatch =
    query.match(/(?:họ\s*(?:và\s*)?tên|tên\s*(?:người\s*nhận|khách)?|người\s*nhận)\s*[:=]\s*([^\n,;]+)/i) ||
    lastUserText.match(/(?:họ\s*(?:và\s*)?tên|tên\s*(?:người\s*nhận|khách)?|người\s*nhận)\s*[:=]\s*([^\n,;]+)/i);

  if (nameLabelMatch) {
    let rawName = nameLabelMatch[1].trim().replace(/^[-*•\s]+/, '').replace(/[*_]/g, '');
    rawName = rawName.replace(/[,;.]?\s*(?:sđt|địa chỉ|size|màu|số lượng)[\s\S]*$/i, '').trim();
    if (rawName.length >= 2 && rawName.length <= 40 && !isInvalidName(rawName)) {
      customerName = rawName;
    }
  }
  if (!customerName) {
    const selfNameMatch = query.match(/(?:mình\s*tên\s*là|tôi\s*tên\s*là|tên\s*mình\s*là|tên\s*tôi\s*là)\s+([A-ZÀ-Ỹa-zà-ỹ\s]{2,30})/i);
    if (selfNameMatch) {
      let rawName = selfNameMatch[1].trim();
      rawName = rawName.replace(/[,;.]?\s*(?:sđt|địa chỉ|size|màu|số lượng)[\s\S]*$/i, '').trim();
      if (!isInvalidName(rawName)) customerName = rawName;
    }
  }

  // Trích xuất Địa chỉ
  let address: string | null = null;
  const addressLabelMatch =
    query.match(/(?:địa\s*chỉ|giao\s*(?:đến|về|tận)|nhận\s*tại|ship\s*(?:đến|về)|đ\/c|dc)\s*[:=]?\s*([^\n;]+)/i) ||
    lastUserText.match(/(?:địa\s*chỉ|giao\s*(?:đến|về|tận)|nhận\s*tại|ship\s*(?:đến|về)|đ\/c|dc)\s*[:=]?\s*([^\n;]+)/i);

  if (addressLabelMatch) {
    let rawAddr = addressLabelMatch[1].trim().replace(/^[-*•\s]+/, '').replace(/[*_]/g, '');
    rawAddr = rawAddr.replace(/[,;.]?\s*(?:màu|size|cỡ|sz|sl|số\s*lượng|sđt|điện\s*thoại|tên|họ\s*tên)[\s\S]*$/i, '').trim();
    // Loại trừ nếu dính văn bản mẫu hướng dẫn của bot
    if (rawAddr.length >= 6 && !rawAddr.toLowerCase().startsWith('nhận hàng (số nhà')) {
      address = rawAddr;
    }
  }
  if (!address) {
    const addrLine = query.split('\n').find((line) => /(?:số\s*\d+|đường|phố|phường|xã|quận|huyện|thành\s*phố|tp\.|tỉnh|hà\s*nội|hồ\s*chí\s*minh|tphcm|đà\s*nẵng)/i.test(line));
    if (addrLine && addrLine.trim().length >= 8 && !/(?:sđt|điện thoại|size|màu|tên)/i.test(addrLine) && !addrLine.toLowerCase().includes('ví dụ')) {
      address = addrLine.trim().replace(/^[-*•\s]+/, '');
    }
  }

  // Trích xuất Số lượng
  let quantity = 1;
  const qtyMatch =
    query.match(/(?:số\s*lượng|sl|qty)\s*[:=]?\s*(\d+)/i) ||
    query.match(/(\d+)\s*(?:đôi|chiếc)/i) ||
    lastUserText.match(/(?:số\s*lượng|sl|qty)\s*[:=]?\s*(\d+)/i);
  if (qtyMatch) {
    const parsedQty = parseInt(qtyMatch[1], 10);
    if (!isNaN(parsedQty) && parsedQty > 0 && parsedQty <= 50) {
      quantity = parsedQty;
    }
  }

  // Trích xuất Sản phẩm phù hợp nhất (Role-Gated Product Scorer)
  let matchedProduct: ProductRecord | null = null;
  // Chỉ sử dụng pendingOrder nếu không có sự chuyển đổi ngữ cảnh
  if (!isContextSwitch && pendingOrder && pendingOrder.productId) {
    matchedProduct = allProducts.find((p) => p.id === pendingOrder.productId) || null;
  }

  if (!matchedProduct) {
    let bestScore = 0;
    const scores = new Map<number, number>();

    // 1. Chấm điểm trực tiếp trên câu hỏi hiện tại của khách (queryLower)
    for (const p of allProducts) {
      const pNameLower = p.name.toLowerCase();
      const pTokens = pNameLower.split(' ').slice(1);
      const modelKeywords = pTokens.join(' ');

      let score = 0;
      const brand = pNameLower.split(' ')[0];
      if (queryLower.includes(pNameLower)) score += 100;
      else if (queryLower.includes(modelKeywords)) score += 80;
      else {
        const matchCount = pTokens.filter((t) => t.length > 2 && queryLower.includes(t)).length;
        if (matchCount >= 2) score += 60;
        else if (matchCount === 1) score += queryLower.includes(brand) ? 55 : 30;
      }
      if (score > 0) scores.set(p.id!, score);
    }

    // 2. Nếu câu hỏi hiện tại chưa có tên sản phẩm cụ thể, quét ngược lịch sử chat
    // QUY TẮC BẢO MẬT: CHỈ QUÉT LƯỢT NÓI CỦA NGƯỜI DÙNG (turn.role === 'user')
    // Tuyệt đối không quét tin nhắn của Assistant để chống tự ngộ nhận ví dụ minh họa
    if ([...scores.values()].every((s) => s < 60) && Array.isArray(history) && history.length > 0) {
      const reversedHistory = [...history].reverse();
      for (let hIdx = 0; hIdx < reversedHistory.length; hIdx++) {
        const turn = reversedHistory[hIdx];
        if (turn.role !== 'user') continue; // BỎ QUA 100% TIN NHẮN BOT

        const turnLower = turn.text.toLowerCase();
        const recencyMultiplier = Math.max(0.5, 1 - hIdx * 0.2);

        for (const p of allProducts) {
          const pNameLower = p.name.toLowerCase();
          const pTokens = pNameLower.split(' ').slice(1);
          const modelKeywords = pTokens.join(' ');

          let turnScore = 0;
          if (turnLower.includes(pNameLower)) turnScore = 70;
          else if (turnLower.includes(modelKeywords)) turnScore = 55;
          else {
            const matchCount = pTokens.filter((t) => t.length > 2 && turnLower.includes(t)).length;
            if (matchCount >= 2) turnScore = 35;
          }

          if (turnScore > 0) {
            const finalWeighted = Math.round(turnScore * recencyMultiplier * 2.5);
            const current = scores.get(p.id!) || 0;
            if (finalWeighted > current) {
              scores.set(p.id!, finalWeighted);
            }
          }
        }

        if ([...scores.values()].some((s) => s >= 70)) {
          break;
        }
      }
    }

    for (const [id, score] of scores.entries()) {
      if (score > bestScore && score >= 40) {
        bestScore = score;
        matchedProduct = allProducts.find((p) => p.id === id) || null;
      }
    }
  }

  // Trích xuất Size
  let size: string | null = null;
  const sizeMatch =
    query.match(/(?:size|cỡ|sz)\s*[:=]?\s*(\d{2}(?:\.5)?)/i) ||
    query.match(/\b(?:cỡ|size|sz)\s+(\d{2}(?:\.5)?)\b/i) ||
    lastUserText.match(/(?:size|cỡ|sz)\s*[:=]?\s*(\d{2}(?:\.5)?)/i);
  if (sizeMatch) {
    size = sizeMatch[1];
  } else if (matchedProduct) {
    try {
      const validSizes = JSON.parse(matchedProduct.sizes);
      for (const vs of validSizes) {
        if (new RegExp(`(?:^|[^\\d])${vs}(?:[^\\d]|$)`).test(query)) {
          size = String(vs);
          break;
        }
      }
    } catch {}
  }

  // Trích xuất Màu sắc
  let color: string | null = null;
  const colorMatch =
    query.match(/(?:màu\s*(?:sắc)?|color)\s*[:=]?\s*([^\n,;.]+)/i) ||
    lastUserText.match(/(?:màu\s*(?:sắc)?|color)\s*[:=]?\s*([^\n,;.]+)/i);
  if (colorMatch) {
    color = colorMatch[1].trim().replace(/^[-*•\s]+/, '').replace(/[*_]/g, '');
  }
  if (matchedProduct) {
    try {
      const validColors = JSON.parse(matchedProduct.colors);
      for (const vc of validColors) {
        if (queryLower.includes(vc.toLowerCase()) || (lastUserText && lastUserText.toLowerCase().includes(vc.toLowerCase()))) {
          color = vc;
          break;
        }
      }
      if (!color && validColors.length === 1) {
        color = validColors[0];
      }
    } catch {}
  }

  return {
    product: matchedProduct,
    size,
    color,
    quantity,
    customerName,
    phone,
    address,
    isOrderIntent,
    isConfirmIntent,
    isCancelIntent,
    isDiscoveryIntent,
    isContextSwitch,
  };
}

export function splitIntoChunks(
  text: string,
  maxLength = 1100,
  overlap = 140,
): string[] {
  if (!text || !text.trim()) return [];
  const normalized = text.trim();
  if (normalized.length <= maxLength) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + maxLength, normalized.length);

    if (end < normalized.length) {
      // Tìm điểm ngắt tự nhiên từ ngưỡng an toàn (60% maxLength)
      const minCut = start + Math.floor(maxLength * 0.6);
      const nl2 = normalized.lastIndexOf('\n\n', end);
      const nl1 = normalized.lastIndexOf('\n', end);
      const dot = normalized.lastIndexOf('. ', end);
      const sp = normalized.lastIndexOf(' ', end);

      let boundary = -1;
      if (nl2 >= minCut) {
        boundary = nl2;
      } else if (nl1 >= minCut) {
        boundary = nl1;
      } else if (dot >= minCut) {
        boundary = dot + 1; // Giữ lại dấu chấm câu
      } else if (sp >= minCut) {
        boundary = sp;
      }

      if (boundary > start) {
        end = boundary;
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= normalized.length) break;
    // Bước nhảy start có gối đầu (overlap)
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

/**
 * Tạo vector nhúng ngữ nghĩa (Embedding 1024 chiều) bằng mô hình BGE-M3 của Cloudflare Workers AI:
 * - Hỗ trợ đa ngôn ngữ xuất sắc (đặc biệt là Tiếng Việt).
 * - Phân nhóm thành các batch tối đa 10 trích đoạn nhằm tối ưu hiệu năng và tránh vượt ngưỡng kích thước yêu cầu.
 */
export async function embed(
  c: { env: ShopBindings },
  texts: string[],
): Promise<number[][]> {
  if (!texts.length) return [];
  const batchSize = 10;
  const allVectors: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const result = (await c.env.AI.run('@cf/baai/bge-m3', { text: batch })) as {
      data?: number[][];
    };
    if (!Array.isArray(result?.data) || result.data.length !== batch.length) {
      throw new Error(
        `Workers AI BGE-M3 trả về vector không hợp lệ (kỳ vọng ${batch.length} vectors, nhận được ${result?.data?.length || 0})`,
      );
    }
    allVectors.push(...result.data);
  }

  return allVectors;
}

/**
 * TRỤ CỘT 1: HÀM TRÍCH XUẤT Ý ĐỊNH & BỘ LỌC CÓ CẤU TRÚC (SQL ATTRIBUTE FILTER)
 * - Tự động bóc tách khoảng giá (minPrice, maxPrice), phân loại (category), màu sắc (color), thương hiệu (brand)
 * - Hỗ trợ đa lượt: Kế thừa tiêu chí từ lịch sử hội thoại nếu người dùng hỏi nối tiếp ("vẫn tiêu chí trên", "như trên", "khoảng 2-3 triệu")
 */
export function extractProductFilters(
  query: string,
  history: ChatHistoryTurn[] = [],
) {
  const isFollowUp = /(?:tiêu chí trên|như trên|ở trên|nhưng|vẫn|còn đôi nào|mẫu nào khác|tiêu chuẩn trên)/i.test(
    query,
  );
  const historyText = history
    .filter((h) => h.role === 'user')
    .map((h) => h.text)
    .join(' ');
  const currentLower = query.toLowerCase();

  let minPrice: number | null = null;
  let maxPrice: number | null = null;

  // 1. Phân tích khoảng giá (Ưu tiên câu hỏi hiện tại)
  const parsePrice = (str: string) => {
    // TH 1: Khoảng giá (ví dụ: "từ 2 đến 3 triệu", "2 - 3 triệu", "2 -3 triệu", "2tr - 3tr", "giao động 2 - 3 triệu")
    const range = str.match(
      /(?:giá\s*)?(?:từ|khoảng|tầm|trong khoảng|dao động|giao động)?\s*(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k|nghìn)?\s*(?:đến|-|tới)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|đ|vnd)?/i,
    );
    if (range) {
      const unit = (range[3] || 'triệu').toLowerCase();
      const mult = unit === 'k' || unit === 'nghìn' ? 1000 : 1000000;
      return {
        min: parseFloat(range[1].replace(',', '.')) * mult,
        max: parseFloat(range[2].replace(',', '.')) * mult,
      };
    }

    // TH 2: Dưới X (ví dụ: "dưới 2 triệu", "< 2tr", "tối đa 2 triệu")
    const under = str.match(
      /(?:giá\s*)?(?:dưới|nhỏ hơn|ít hơn|thấp hơn|tối đa|<|<=)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|đ|vnd)?/i,
    );
    if (under) {
      const unit = (under[2] || 'triệu').toLowerCase();
      const mult = unit === 'k' || unit === 'nghìn' ? 1000 : 1000000;
      return {
        min: null,
        max: parseFloat(under[1].replace(',', '.')) * mult,
      };
    }

    // TH 3: Trên X (ví dụ: "trên 3 triệu", "> 3tr", "tối thiểu 3 triệu")
    const above = str.match(
      /(?:giá\s*)?(?:trên|lớn hơn|nhiều hơn|cao hơn|tối thiểu|>|>=)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|đ|vnd)?/i,
    );
    if (above) {
      const unit = (above[2] || 'triệu').toLowerCase();
      const mult = unit === 'k' || unit === 'nghìn' ? 1000 : 1000000;
      return {
        min: parseFloat(above[1].replace(',', '.')) * mult,
        max: null,
      };
    }

    return null;
  };

  const currentPrices = parsePrice(currentLower);
  const historyPrices = isFollowUp ? parsePrice(historyText.toLowerCase()) : null;
  const finalPrices = currentPrices || historyPrices;

  if (finalPrices) {
    minPrice = finalPrices.min;
    maxPrice = finalPrices.max;
  }

  // 2. Phân loại giày (Category)
  let category: string | null = null;
  if (/chạy bộ|running|marathon|chạy/i.test(currentLower)) category = 'Running';
  else if (/bóng rổ|basketball/i.test(currentLower)) category = 'Basketball';
  else if (/dã ngoại|leo núi|trail|outdoor|trekking/i.test(currentLower)) category = 'Outdoor';
  else if (/thời trang|lifestyle|dạo phố|casual|đi học|đi làm/i.test(currentLower)) category = 'Lifestyle';
  else if (isFollowUp) {
    if (/chạy bộ|running|marathon|chạy/i.test(historyText)) category = 'Running';
    else if (/bóng rổ|basketball/i.test(historyText)) category = 'Basketball';
    else if (/dã ngoại|leo núi|trail|outdoor|trekking/i.test(historyText)) category = 'Outdoor';
    else if (/thời trang|lifestyle|dạo phố|casual|đi học|đi làm/i.test(historyText)) category = 'Lifestyle';
  }

  // 3. Màu sắc (Color) với Unicode regex hỗ trợ tiếng Việt có dấu
  let color: string | null = null;
  const colorsList = ['đỏ', 'cam', 'trắng', 'đen', 'xanh', 'vàng', 'hồng', 'tím', 'xám', 'bạc'];
  for (const c of colorsList) {
    if (new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:màu\\s+)?${c}(?=[^\\p{L}\\p{N}]|$)`, 'ui').test(currentLower)) {
      color = c;
      break;
    }
  }
  if (!color && isFollowUp) {
    for (const c of colorsList) {
      if (new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:màu\\s+)?${c}(?=[^\\p{L}\\p{N}]|$)`, 'ui').test(historyText)) {
        color = c;
        break;
      }
    }
  }

  // 4. Thương hiệu (Brand) với Unicode regex
  let brand: string | null = null;
  const brandsList = [
    'Nike',
    'Adidas',
    'Asics',
    'Mizuno',
    'New Balance',
    'Salomon',
    'Puma',
    'Jordan',
    'Hoka',
    'On Running',
    'Onitsuka Tiger',
    'Li-Ning',
    'Anta',
  ];
  for (const b of brandsList) {
    if (new RegExp(`(?:^|[^\\p{L}\\p{N}])${b}(?=[^\\p{L}\\p{N}]|$)`, 'ui').test(currentLower)) {
      brand = b;
      break;
    }
  }
  if (!brand && isFollowUp) {
    for (const b of brandsList) {
      if (new RegExp(`(?:^|[^\\p{L}\\p{N}])${b}(?=[^\\p{L}\\p{N}]|$)`, 'ui').test(historyText)) {
        brand = b;
        break;
      }
    }
  }

  // 5. Tên dòng giày / Model (Model Keyword)
  let modelKeyword: string | null = null;
  const modelsList = [
    'Pegasus',
    'Novablast',
    'Nimbus',
    'Kayano',
    'Vaporfly',
    'Alphafly',
    'Metaspeed',
    'Ultraboost',
    'Samba',
    'Gazelle',
    'Superstar',
    'Forum',
    'Adios Pro',
    'Adios',
    '550',
    '574',
    '1906',
    '2002r',
    '990',
    'Speedcross',
    'XT-6',
    'Clifton',
    'Bondi',
    'Speedgoat',
    'Cloudmonster',
    'Cloudsurfer',
    'Feidian',
    'Shadow',
    'C202',
    'Jordan 1',
    'Jordan 4',
  ];
  for (const m of modelsList) {
    if (new RegExp(`(?:^|[^\\p{L}\\p{N}])${m}(?=[^\\p{L}\\p{N}]|$)`, 'ui').test(currentLower)) {
      modelKeyword = m;
      break;
    }
  }
  if (!modelKeyword && isFollowUp) {
    for (const m of modelsList) {
      if (new RegExp(`(?:^|[^\\p{L}\\p{N}])${m}(?=[^\\p{L}\\p{N}]|$)`, 'ui').test(historyText)) {
        modelKeyword = m;
        break;
      }
    }
  }

  return { minPrice, maxPrice, category, color, brand, modelKeyword, isFollowUp };
}

/**
 * Trích xuất bản thảo câu trả lời khách hàng từ reasoning_content khi mô hình Gemma 4 cạn tokens (finish_reason === 'length')
 */
export function extractAnswerFromReasoning(reasoning: string): string {
  if (!reasoning) return '';

  const draftBlocks = [
    ...reasoning.matchAll(
      /(?:Greeting:\s*"?(Chào bạn[^"\n]*)"?|Introduction:\s*"?(Dạ[^"\n]*)"?|(?:^|\n)\s*(Chào bạn!?[^\n]*|Dạ chào bạn!?[^\n]*))/gi,
    ),
  ];

  if (draftBlocks.length > 0) {
    const lastMatch = draftBlocks[draftBlocks.length - 1];
    const startIdx = lastMatch.index ?? 0;
    let slice = reasoning.slice(startIdx);

    // Cắt bỏ phần tự kiểm tra / checklist ở cuối nếu có
    slice = slice.replace(
      /\n+\s*\*(?:Direct answer|\(Self-Correction|Self-Correction|Short,\s*polite|Constraints)[\s\S]*$/i,
      '',
    );

    // Xóa tiền tố nhãn
    slice = slice.replace(/^(?:Greeting|Introduction|Draft):\s*"?/i, '');

    // Làm sạch các thẻ nhãn kỹ thuật
    slice = slice.replace(
      /\*\s*(?:\*)?(?:Greeting|Introduction|Product \d+|Closing[A-Za-z/ ]*|Summary of matches|Size Correction|Running Tip|Selection|Address the size|Advice for wide feet|Policy)(?:\*)?:?\s*"?/gi,
      '',
    );
    slice = slice.replace(/"$/g, '').trim();
    if (slice.length > 80) return slice;
  }

  // Fallback nếu không có cấu trúc trên
  const viMatch = reasoning.match(
    /(?:Chào bạn|Dạ|Chào quý khách|One - Store)[\s\S]+?(?=\n+\s*\*(?:Direct answer|\(Self-Correction|Self-Correction|Short,\s*polite)|\s*$)/i,
  );
  if (!viMatch) return '';
  let res = viMatch[0].trim();
  res = res.replace(
    /\*\s*\*(?:Greeting|Size Correction|Running Tip|Product \d+|Closing\/Policy|Clarification|Recommendation \d+)[^*]*\*:\s*/gi,
    '',
  );
  return res.trim();
}

/**
 * TRỤ CỘT 2: BỘ LÀM SẠCH VĂN BẢN ĐẦU RA (OUTPUT SANITIZER & COT SUPPRESSION)
 * - Cắt bỏ hoàn toàn các dòng nhẩm so sánh Yes/No của LLM
 * - Cắt bỏ các khối checklist rubric tự kiểm tra (Short, polite? Yes... Self-Correction...)
 * - Cắt bỏ các tiêu đề suy nghĩ tiếng Anh (Final Plan, Clarification, Recommendation...)
 * - Trích xuất đúng câu trả lời giao tiếp lịch sự với khách hàng
 */
export function cleanModelOutput(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();

  // 1. Loại bỏ Markdown code blocks nếu toàn bộ phản hồi bị bọc trong ```
  cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');

  // 2. Loại bỏ dấu ngoặc kép bao quanh toàn bộ phản hồi (nếu LLM bọc toàn bộ trong "")
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // 3. Loại bỏ các khối rubric, checklist, format instructions
  cleaned = cleaned.replace(
    /(?:^|\n+)One\s*-\s*Store\s*\(One\)\.?\s*\n+(?:\*\s*[A-Za-z ]+:[^\n]*\n*)+/gi,
    '\n',
  );
  cleaned = cleaned.replace(
    /(?:^|\n+)(?:\*\s*(?:Tone|Constraints|Goal|Role|Task|Requirement|Step|Output|Format):[^\n]*\n*)+/gi,
    '\n',
  );
  cleaned = cleaned.replace(
    /\n+\s*\*(?:\s*\(?[^?\n]*\?\s*(?:Yes|No|Đúng|Sai|Có|Không)|Đúng vai|Đúng dữ liệu|Đúng quy tắc|Giải quyết được|Tự kiểm tra|Sửa lại thứ tự|Lưu ý về size|Kết luận|Tiến hành viết|Self-Correction|Short,\s*polite|Constraints|Direct\s*answer|Evaluation|Checklist)[\s\S]*$/i,
    '',
  );
  cleaned = cleaned.replace(
    /\n+\s*\*(?:\s*\(?Tự kiểm tra|Sửa lại thứ tự|Lưu ý về size|Kết luận|Tiến hành viết)[\s\S]*$/i,
    '',
  );

  // 4. Loại bỏ các dòng nhẩm so sánh Keep/Skip
  cleaned = cleaned.replace(/(?:\*\s*[^\n]+(?:\bKeep\b|\bSkip\b)[^\n]*\n*)+/gi, '');

  // 5. Loại bỏ các tiêu đề kỹ thuật tiếng Anh (Final Plan, Clarification, Recommendation, Thinking...)
  cleaned = cleaned.replace(
    /^\s*\*\s*(?:\*)?(?:Final Plan|Clarification|Recommendation|Plan|Analysis|Thought|Thinking|Draft)(?:\*)?:?\s*\n*/gim,
    '',
  );
  cleaned = cleaned.replace(
    /\n+\s*\*\s*(?:\*)?(?:Final Plan|Clarification|Recommendation|Plan|Analysis|Thought|Thinking|Draft)(?:\*)?:?\s*\n*/gim,
    '\n\n',
  );

  // 6. Loại bỏ bản nháp suy nghĩ ở đầu văn bản (nếu có)
  cleaned = cleaned.replace(
    /^\s*One\s*-\s*Store\s*\(One\)\.?\s*\n+(?:\*\s*[A-Za-z]+:[^\n]*\n+)+(?=\s*\*|Chào|Dạ|Hiện|Dưới)/i,
    '',
  );
  cleaned = cleaned.replace(
    /^\s*(?:Lập kế hoạch|Bản nháp|Kế hoạch suy nghĩ|Thought|Thinking):[\s\S]*?\n+(?=Chào|Dạ|Hiện|One|Dưới)/i,
    '',
  );

  // 6. Xử lý trường hợp mô hình nhẩm danh sách Yes/No
  const noYesPattern = /(?:\*\s*[^\n]+(?:\(No\)|\(\*\*No\*\*\)|\(YES\)|\(\*\*YES\*\*\))\s*\n*)+/gi;
  if (noYesPattern.test(cleaned)) {
    const yesMatches = [
      ...cleaned.matchAll(
        /\*\s*([^\n:]+):\s*([0-9.,]+(?:\s*VND|₫)?)[^\n]*\((?:\*\*)?YES(?:\*\*)?\)/gi,
      ),
    ];
    if (yesMatches.length > 0) {
      const items = yesMatches.map((m) => `- **${m[1].trim()}**: ${m[2].trim()}`).join('\n');
      cleaned = `Dạ chào bạn, One - Store xin gợi ý các mẫu giày phù hợp với tiêu chí của bạn:\n\n${items}\n\nNếu bạn cần thêm thông tin về size giày hay hình ảnh chi tiết, hãy nhắn One nhé!`;
    } else {
      cleaned = cleaned.replace(noYesPattern, '').trim();
    }
  }

  // 7. Nếu câu trả lời chỉ bắt đầu bằng danh sách bullet point, chèn câu chào thân thiện
  if (/^\s*[-*]\s+/m.test(cleaned) && !/^(?:Chào|Dạ|One - Store|Hiện tại)/i.test(cleaned)) {
    cleaned = 'Chào bạn! One - Store xin gợi ý các mẫu giày phù hợp với tiêu chí của bạn:\n\n' + cleaned;
  }

  // 8. Định vị câu chào tiếng Việt hoàn chỉnh cuối cùng (loại bỏ sạch các ghi chú nháp tiếng Anh phía trước nếu có)
  const idxDa = cleaned.lastIndexOf('Dạ chào bạn');
  const idxChao = cleaned.lastIndexOf('Chào bạn');
  const startGreetingIdx = Math.max(idxDa, idxChao);
  if (startGreetingIdx > 100) {
    cleaned = cleaned.slice(startGreetingIdx).trim();
  }

  // Xóa các nhãn gạch đầu dòng kỹ thuật in nghiêng/in đậm và ghi chú dàn ý tiếng Anh
  cleaned = cleaned.replace(/\*\s*\*(?:Sản phẩm|Chốt|Lưu ý|Khuyến nghị|Tư vấn)\*:\s*/gi, '');

  // 1. Cắt bỏ khối rubric / checklist tự nhắc ở đuôi văn bản
  cleaned = cleaned.replace(
    /\n+\s*\*\s*(?:Polite|friendly|concise|No English|Only use|Direct answer\?|Checklist|Evaluation|Constraints|Short,\s*polite)[\s\S]*$/gi,
    '',
  );

  // 2. Xóa các chỉ dẫn tiếng Anh trong ngoặc đơn dạng (Mention ...), (Note ...), (Warn ...)
  cleaned = cleaned.replace(/\s*\((?:Mention|Note|Warn|Crucial|Ask if|Suggest)[^)]*\)/gi, '');

  // 3. Xóa các dòng hướng dẫn dàn ý thuần tiếng Anh như "* Closing: Ask if they want..."
  cleaned = cleaned.replace(/(?:^|\n)\s*[-*•]\s*(?:Closing|Call to action|Next step):\s*[A-Za-z ]+\.?/gi, '');

  // 4. Xóa các nhãn dàn ý tiếng Anh ở đầu dòng nhưng giữ lại nội dung tiếng Việt phía sau
  cleaned = cleaned.replace(
    /(?:^|\n)\s*[-*•]\s*(?:Direct answer|Proactive suggestion|Detail \d+|Step \d+|Option \d+|Recommendation \d+|Recommendation|Clarification|Greeting|Summary|Intro|Note|Feature):\s*/gi,
    '\n- ',
  );

  // 5. Chuẩn hóa gạch đầu dòng kép nhưng bảo vệ dấu in đậm ** (ví dụ: "- * " -> "- ", không ăn vào "**")
  cleaned = cleaned.replace(/(?:^|\n)\s*[-*•]\s+[-*•]\s+(?!\*)/g, '\n- ');
  cleaned = cleaned.replace(/(?:^|\n)\s*[-*•]\s*\*(?!\*)\s*/g, '\n- ');
  cleaned = cleaned.replace(/(?:^|\n)\s*\*\s+(?=\*\*)/g, '\n- ');

  // 6. Khôi phục nếu mô hình sinh tiêu đề thiếu dấu mở ** trước :** (ví dụ: "- Tiêu đề:**" -> "- **Tiêu đề:**")
  cleaned = cleaned.replace(/^([-*•]\s+)?([^*:\n]+):(\*{2,})/gm, '$1**$2:**');
  cleaned = cleaned.replace(/^["]|["$]/g, '');
  cleaned = cleaned.replace(/"\s*\n\s*\*/g, '\n*');
  cleaned = cleaned.replace(/\n\s*"\s*/g, '\n');

  // 10. Chặn rò rỉ prompt chỉ dẫn kỹ thuật và closed-domain reasoning
  if (
    cleaned.includes('Closed-domain') ||
    cleaned.includes('DANH MỤC GIÀY SẴN CÓ') ||
    cleaned.includes('TRÍCH ĐOẠN TRI THỨC') ||
    cleaned.includes('Use *only* provided data') ||
    cleaned.includes('strict grounding')
  ) {
    cleaned = 'Dạ câu hỏi này hiện nằm ngoài phạm vi cơ sở dữ liệu tri thức của One - Store. Em chỉ được cung cấp dữ liệu chính thức về 70 mẫu giày sneaker chính hãng Âu - Á và các chính sách bán hàng của cửa hàng. Bạn có muốn em hỗ trợ tìm kiếm mẫu giày thể thao nào đang có sẵn không ạ?';
  }

  // 9. Rút gọn các dòng trống dư thừa
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

/**
 * PIPELINE RAG BACKEND (RETRIEVAL + GENERATION):
 * POST /api/chat
 * - Nhận question & history từ client
 * - Áp dụng Hybrid Search: SQL Attribute Filter + Vectorize Retrieval
 * - Truyền hội thoại đa lượt vào Workers AI Gemma 4
 * - Làm sạch câu trả lời bằng Output Sanitizer
 */

export interface FastRouteResult {
  type:
    | 'smalltalk'
    | 'store_info'
    | 'order_lookup'
    | 'accessory_add'
    | 'policy_freeship'
    | 'policy_return'
    | 'policy_warranty'
    | 'policy_inspection'
    | 'policy_voucher'
    | 'policy_sizeguide'
    | 'out_of_scope'
    | 'catalog_or_policy';
  answer?: string;
  chips?: string[];
  orderCode?: string;
  accessoryName?: string;
}

/**
 * FAST LOCAL PRE-ROUTER (0 ms):
 * Phân tích cú pháp Regex và từ khóa cục bộ tại Edge Worker trước khi gọi LLM
 * - Nhánh 1: Smalltalk (Chào hỏi, cảm ơn, tạm biệt) -> Phản hồi tức thì < 30ms, 0 token LLM
 * - Nhánh 2: Store Info (Địa chỉ showroom, hotline, giờ mở cửa) -> Phản hồi tức thì < 40ms, 0 token LLM
 * - Nhánh 3: Tra cứu đơn hàng bằng mã ONE-... -> Đối soát trực tiếp bảng orders của D1
 * - Nhánh 4: Mua kèm phụ kiện thể thao (Cross-selling)
 * - Mơ hồ: Rơi về luồng Catalog & Policy RAG đầy đủ
 */
export function fastLocalRouter(query: string): FastRouteResult {
  const raw = query.trim();
  const q = raw
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‍⁠﻿]/g, '')
    .replace(/\s+/g, ' ');

  // 1. Nhận diện tra cứu đơn hàng bằng mã đơn ONE-...
  const codeMatch = raw.match(/\b(ONE-[A-Z0-9-]{6,16})\b/i);
  if (codeMatch) {
    return {
      type: 'order_lookup',
      orderCode: codeMatch[1].toUpperCase(),
    };
  }

  // 2. Nhận diện câu hỏi thêm phụ kiện mua kèm
  if (/^(thêm|mua thêm|lấy thêm)\s*(vớ|tất|bình xịt|xịt nano|xịt bọt)/i.test(q)) {
    return {
      type: 'accessory_add',
      accessoryName: /xịt/i.test(q) ? 'Bình xịt bọt nano vệ sinh giày (+89.000 VND)' : 'Vớ thể thao dệt kim One Athletic (+49.000 VND)',
    };
  }

  // 3. TẦNG BẢO VỆ 1C: FAST OUT-OF-SCOPE GUARDRAIL (0 ms)
  // Nhận diện tức thì các chủ đề bên ngoài thế giới không thuộc phạm vi kinh doanh của One - Store
  const isOutOfScope =
    /(cà phê|coffee|trà sữa|trà đào|nước ngọt|bia|rượu|nấu ăn|món ăn|công thức món|quán ăn|nhà hàng|thực phẩm|đồ ăn|thời tiết|nhiệt độ|trời mưa|dự báo thời tiết|giải toán|viết code|lập trình|python|javascript|java|c\+\+|html|css|sửa máy tính|laptop|điện thoại|iphone|samsung|quần áo|áo sơ mi|áo khoác|áo len|áo thun|áo phông|áo hoodie|áo polo|áo dài|áo croptop|áo chống nắng|áo ba lỗ|quần jean|quần short|quần đùi|quần bò|quần kaki|quần tây|quần dài|quần ống rộng|quần jogger|quần lót|váy|đầm|suit|vest|chân váy|nón|mũ|kính mát|kính râm|thắt lưng|dây nịt|túi xách|ví da|đồng hồ|mỹ phẩm|son môi|kem dưỡng|nước hoa|trang sức|xe máy|ô tô|phim ảnh|diễn viên|ca sĩ|bài hát|chính trị|tin tức xã hội|bitcoin|crypto|tiền ảo|chứng khoán)/i.test(q) &&
    !/(giày|sneaker|chạy bộ|marathon|bóng rổ|dã ngoại|asics|nike|adidas|mizuno|puma|new balance|salomon|hoka|li-ning|anta|jordan)/i.test(q);

  if (isOutOfScope) {
    return {
      type: 'out_of_scope',
      answer: 'Dạ Tư vấn One rất tiếc không thể hỗ trợ thông tin này do nằm ngoài phạm vi hoạt động của One - Store. Em là trợ lý chuyên biệt chỉ hỗ trợ tư vấn giày thể thao, sneaker chính hãng Âu - Á và các chính sách dịch vụ tại One - Store thôi ạ!',
      chips: ['Xem 70 mẫu sneaker', 'Tư vấn chọn size', 'Chính sách freeship', 'Chính sách đổi trả'],
    };
  }

  // 4. Nhận diện các câu chào hỏi xã giao, cảm ơn (Smalltalk)
  const isSmalltalk =
    /^(xin chào|chào shop|chào bạn|chào em|chào ad|chào bot|hello|hi|hey|alo|shop ơi|bot ơi)(\s+(shop|ad|em|bot|bạn|nha|nhé|ơi))*[\s!.,?~]*$/i.test(q) ||
    /^(cảm ơn|cám ơn|thank you|thanks|tạm biệt|bye)(\s+(shop|ad|em|bot|bạn|nhiều|nha|nhé))*[\s!.,?~]*$/i.test(q);

  if (isSmalltalk) {
    return {
      type: 'smalltalk',
      answer: 'Dạ chào bạn! Tư vấn One rất hân hạnh được đồng hành cùng bạn tại One - Store. Bạn đang quan tâm đến mẫu giày chạy bộ, sneaker thời trang nào hay cần One hỗ trợ tư vấn chọn cỡ giày chuẩn dáng chân mình ạ?',
      chips: ['Tìm giày chạy bộ', 'Chân bè chọn size nào', 'Chính sách đổi trả', 'Phí vận chuyển COD'],
    };
  }

  // 5. Nhận diện hỏi thông tin showroom, địa chỉ, hotline, giờ mở cửa
  const isStoreInfo =
    /(địa chỉ|ở đâu|showroom|chi nhánh|cửa hàng|giờ mở cửa|mấy giờ đóng|hotline|số điện thoại|sđt shop|liên hệ)/i.test(q) &&
    !/(đặt|mua|chốt|hủy|size|màu|giá)/i.test(q);

  if (isStoreInfo) {
    return {
      type: 'store_info',
      answer: 'Dạ showroom chính hãng One - Store tọa lạc tại trục đường thể thao trung tâm TP.HCM, mở cửa phục vụ từ 08:30 đến 21:30 tất cả các ngày trong tuần (kể cả Thứ Bảy, Chủ Nhật và các ngày Lễ Tết).\n\n- **Hotline hỗ trợ 24/7:** 1900 8888\n- **Email chăm sóc:** support@one-store.vn\n- **Cam kết:** 100% sản phẩm phân phối độc quyền chính hãng Âu - Á. Khi đặt online, bạn hoàn toàn được **đồng kiểm và xỏ thử tại chỗ** trước khi thanh toán COD ạ!',
      chips: ['Xem 70 mẫu giày chính hãng', 'Chính sách freeship', 'Tư vấn chọn size'],
    };
  }

  // 6. CHÍNH SÁCH FREESHIP & PHÍ VẬN CHUYỂN (0 ms)
  const isFreeship =
    /(freeship|miễn phí ship|miễn phí vận chuyển|phí ship|phí vận chuyển|tiền ship|cước vận chuyển|cước ship|cước giao)/i.test(q) &&
    !/(đặt|mua|chốt|hủy|tôi lấy đôi)/i.test(q);

  if (isFreeship) {
    return {
      type: 'policy_freeship',
      answer: 'Dạ chính sách vận chuyển tại One - Store được áp dụng minh bạch như sau:\n\n- **Miễn phí vận chuyển toàn quốc (Freeship):** Áp dụng cho đơn hàng đặt từ **3 đôi giày** trở lên HOẶC hóa đơn từ **5.000.000 VND**.\n- **Đơn hàng dưới 3 đôi (dưới 5.000.000 VND):** Cước vận chuyển đồng giá ưu đãi **30.000 VND** trên toàn quốc.\n- **Thời gian giao hàng dự kiến:** Từ 2 đến 3 ngày làm việc (Nội địa toàn quốc).\n- **Đặc quyền COD:** 100% đơn hàng được **mở hộp đồng kiểm và xỏ thử tại chỗ** trước khi thanh toán tiền mặt cho shipper ạ!',
      chips: ['Xem 70 mẫu giày', 'Chính sách đổi size', 'Mã giảm giá ONE10'],
    };
  }

  // 7. CHÍNH SÁCH ĐỔI SIZE & ĐỔI TRẢ 7 NGÀY (0 ms)
  const isReturn =
    /(đổi size|đổi cỡ|đổi trả|đổi hàng|đổi giày|7 ngày|chật quá|rộng quá|không vừa chân|đổi mẫu)/i.test(q) &&
    !/(đặt|chốt|tôi lấy đôi|mua luôn)/i.test(q);

  if (isReturn) {
    return {
      type: 'policy_return',
      answer: 'Dạ One - Store áp dụng chính sách đổi cỡ giày và đổi trả linh hoạt trong vòng **7 ngày** kể từ ngày nhận hàng:\n\n- **Miễn phí 100% cước 2 chiều:** Áp dụng cho lần đổi cỡ giày đầu tiên nếu bạn đi không vừa chân.\n- **Đổi sang mẫu khác:** Bạn hoàn toàn được đổi sang mẫu giày khác linh hoạt (bù trừ chênh lệch giá nếu có).\n- **Điều kiện hợp lệ:** Giày còn nguyên hộp chính hãng, đầy đủ tem mác phụ kiện và chưa qua sử dụng ngoài trời.\n\n*(Nếu cần đổi size, bạn chỉ cần nhắn mã đơn hàng tại đây hoặc gọi hotline 1900 8888 để được hỗ trợ gửi đôi mới tận nhà nhé!)*',
      chips: ['Bảng quy đổi size', 'Cách đo bàn chân', 'Hotline 1900 8888'],
    };
  }

  // 8. CHÍNH SÁCH BẢO HÀNH CHẤT LƯỢNG (0 ms)
  const isWarranty =
    /(bảo hành|dán keo|bảo trì|hỏng giày|bung keo|bảo hành bao lâu|chế độ bảo hành)/i.test(q) &&
    !/(đặt|chốt|tôi lấy đôi)/i.test(q);

  if (isWarranty) {
    return {
      type: 'policy_warranty',
      answer: 'Dạ chính sách bảo hành chất lượng chính hãng tại One - Store gồm các quyền lợi sau:\n\n- **Bảo hành 6 tháng:** Áp dụng cho các dòng giày chạy bộ marathon đĩa Carbon hiệu năng cao (Nike Vaporfly, Alphafly, Adidas Adios Pro, Asics Metaspeed, Li-Ning Feidian...).\n- **Bảo hành 12 tháng:** Áp dụng cho toàn bộ các dòng giày Lifestyle thời trang và Outdoor dã ngoại (Adidas Samba, Nike Air Force 1, New Balance 550, Salomon XT-6...).\n- **Bảo dưỡng trọn đời:** Hỗ trợ dán keo ép nhiệt và vệ sinh cơ bản miễn phí trọn đời sản phẩm tại showroom.\n- **Cam kết chính hãng:** Bồi hoàn 200% nếu phát hiện hàng không chính hãng ạ!',
      chips: ['Xem giày chạy bộ', 'Xem sneaker thời trang', 'Địa chỉ showroom'],
    };
  }

  // 9. CHÍNH SÁCH ĐỒNG KIỂM & XỎ THỬ COD (0 ms)
  const isInspection =
    /(đồng kiểm|xỏ thử|đi thử|thử giày|xem hàng|kiểm tra hàng|cho xem không|cho thử không|thanh toán khi nhận|nhận hàng trả tiền|cod)/i.test(q) &&
    !/(đặt|chốt|tôi lấy đôi|sđt|địa chỉ)/i.test(q);

  if (isInspection) {
    return {
      type: 'policy_inspection',
      answer: 'Dạ bạn hoàn toàn yên tâm! One - Store áp dụng **100% hình thức giao hàng COD đồng kiểm tận nơi**:\n\n- Khi shipper giao tới, bạn được quyền **mở hộp kiểm tra đúng mẫu mã, màu sắc và xỏ thử trực tiếp vào chân tại chỗ**.\n- Bạn cảm thấy đi êm ái, đúng kích cỡ vừa vặn mới thanh toán tiền mặt cho nhân viên giao hàng.\n- Nếu không đúng mẫu hoặc không vừa chân, bạn có thể từ chối nhận hoặc yêu cầu đổi cỡ giày khác mà không mất phí ạ!',
      chips: ['Tìm giày chạy bộ', 'Mã giảm giá ONE10', 'Xem 70 mẫu giày'],
    };
  }

  // 10. CHÍNH SÁCH VOUCHER & MÃ GIẢM GIÁ (0 ms)
  const isVoucher =
    /(mã giảm giá|voucher|khuyến mãi|ưu đãi|one10|mã giảm|có giảm giá không)/i.test(q) &&
    !/(đặt|chốt|tôi lấy đôi)/i.test(q);

  if (isVoucher) {
    return {
      type: 'policy_voucher',
      answer: 'Dạ One - Store hiện đang áp dụng mã ưu đãi độc quyền dành cho khách hàng:\n\n- **Mã voucher:** **ONE10**\n- **Mức giảm:** **Giảm ngay 10%** trên tổng giá trị đơn hàng.\n- **Phạm vi áp dụng:** Áp dụng cho toàn bộ 70 mẫu giày thể thao và sneaker chính hãng Âu - Á đang có sẵn trong kho.\n\n*(Khi chốt đơn trong khung chat hoặc tại trang thanh toán, hệ thống sẽ tự động áp dụng mã ONE10 để giảm trừ trực tiếp cho bạn nhé!)*',
      chips: ['Áp dụng mã ONE10', 'Xem giày bán chạy', 'Chính sách freeship'],
    };
  }

  // 11. CẨM NANG ĐO KÍCH THƯỚC BÀN CHÂN & TƯ VẤN CHÂN BÈ (0 ms)
  const isSizeGuide =
    /(cách đo chân|hướng dẫn đo chân|đo bàn chân|bảng quy đổi size|chân bè|chân to|bảng size|chọn size thế nào)/i.test(q) &&
    !/(đặt|chốt|tôi lấy đôi)/i.test(q);

  if (isSizeGuide) {
    return {
      type: 'policy_sizeguide',
      answer: 'Dạ để chọn được size giày vừa vặn chuẩn xác nhất, bạn có thể áp dụng cẩm nang đo chân 3 bước của One - Store:\n\n1. **Bước 1:** Đặt tờ giấy A4 sát mép tường, đặt bàn chân lên giấy sao cho gót chân chạm nhẹ vào tường.\n2. **Bước 2:** Dùng bút đánh dấu điểm đầu ngón chân dài nhất trên giấy.\n3. **Bước 3:** Dùng thước đo khoảng cách từ mép tường đến điểm đánh dấu (tính bằng cm) rồi tra bảng size chuẩn EUR.\n\n**Mẹo chọn giày cho dáng chân Á Đông:**\n- Nếu bạn có **bàn chân bè ngang hoặc mu bàn chân dày**, bạn nên **tăng từ 0.5 đến 1 size** so với kích thước tiêu chuẩn, hoặc ưu tiên chọn các dòng giày phom rộng Wide 2E/4E của Asics, Mizuno hay Li-Ning để các ngón chân cử động thoải mái nhất nhé!',
      chips: ['Bảng quy đổi size', 'Mẫu giày cho chân bè', 'Xem giày Asics'],
    };
  }

  return { type: 'catalog_or_policy' };
}

chatbot.post('/chat/transcribe', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    let audioBuffer: ArrayBuffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      const body = await c.req.parseBody();
      const file = body['audio'] || body['file'];
      if (file instanceof File) {
        audioBuffer = await file.arrayBuffer();
      }
    } else {
      audioBuffer = await c.req.arrayBuffer();
    }

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return fail('Dữ liệu âm thanh không hợp lệ hoặc rỗng', 400);
    }

    const result = await transcribeAudio(c.env.AI, audioBuffer, 'vi');
    return c.json({ text: result.text, wordCount: result.wordCount });
  } catch (err: any) {
    console.error('[Whisper Transcribe Error]', err);
    return fail(err?.message || 'Lỗi nhận dạng giọng nói', 500);
  }
});

export interface ChatResponseEmitter {
  status: (msg: string) => Promise<void>;
  delta: (text: string) => Promise<void>;
  products: (prods: any[]) => Promise<void>;
  sources: (srcs: string[]) => Promise<void>;
  orderReady: (data: { pendingOrder: any; readyToConfirm: boolean }) => Promise<void>;
  orderCreated: (createdOrder: any) => Promise<void>;
  chips?: (chipList: string[]) => Promise<void>;
  done: () => Promise<void>;
}

/**
 * PIPELINE XỬ LÝ HỘI THOẠI ĐA PHƯƠNG THỨC THỜI GIAN THỰC (CHAT PIPELINE CORE)
 * Dùng chung cho cả luồng SSE Streaming và luồng JSON truyền thống
 */
async function processChatPipeline(
  c: any,
  parsedData: { question: string; history?: ChatHistoryTurn[]; pendingOrder?: any; stream?: boolean },
  emitter: ChatResponseEmitter,
  isStream: boolean,
) {
  const { question, history = [], pendingOrder } = parsedData;

  // 1. FAST LOCAL PRE-ROUTER (0 ms)
  const fastRoute = fastLocalRouter(question);

  // Xử lý tức thì tất cả các nhánh phản hồi nhanh (Smalltalk, Store Info, 5 Chính sách, Size Guide, Out-of-Scope)
  if (
    fastRoute.type !== 'catalog_or_policy' &&
    fastRoute.type !== 'order_lookup' &&
    fastRoute.type !== 'accessory_add' &&
    fastRoute.answer
  ) {
    await emitter.delta(fastRoute.answer);
    if (fastRoute.chips) await emitter.chips?.(fastRoute.chips);
    await emitter.done();
    return;
  }

  if (fastRoute.type === 'accessory_add' && fastRoute.accessoryName) {
    const answer = 'Dạ One - Store đã ghi nhận yêu cầu thêm **' + fastRoute.accessoryName + '** vào đơn hàng của bạn! Sản phẩm phụ kiện sẽ được gộp chung đóng gói cùng giày thể thao, giữ nguyên chính sách miễn phí vận chuyển và cho phép đồng kiểm xỏ thử tận nơi ạ.';
    await emitter.delta(answer);
    await emitter.chips?.(['Xem lại đơn hàng', 'Chính sách đổi trả', 'Hotline 1900 8888']);
    await emitter.done();
    return;
  }

  if (fastRoute.type === 'order_lookup' && fastRoute.orderCode) {
    const code = fastRoute.orderCode;
    const order = (await c.env.DB.prepare(
      'SELECT id, code, customer_name, phone, address, total, discount, created_at FROM orders WHERE code = ?',
    ).bind(code).first()) as any;

    if (order) {
      const itemsRes = await c.env.DB.prepare(
        'SELECT product_name, size, color, quantity, unit_price FROM order_items WHERE order_id = ?',
      ).bind(order.id).all();
      const items = (itemsRes.results || []) as any[];

      const itemsSummary = items.map((i: any) => '- **' + i.product_name + '**: Size ' + i.size + ' | Màu ' + i.color + ' | Số lượng: ' + i.quantity + ' đôi').join('\n');

      const answer = '**TRA CỨU HÀNH TRÌNH ĐƠN HÀNG COD**\n\n' +
        'Dạ One - Store đã tra cứu thành công đơn hàng **' + code + '** trên hệ thống:\n\n' +
        '- **Mã đơn hàng:** ' + code + '\n' +
        '- **Người nhận:** ' + order.customer_name + ' | ' + order.phone + '\n' +
        '- **Địa chỉ giao hàng:** ' + order.address + '\n' +
        '- **Thời gian đặt:** ' + new Date(order.created_at as string).toLocaleString('vi-VN') + '\n' +
        '- **Danh sách sản phẩm:**\n' + itemsSummary + '\n' +
        '- **Tổng thanh toán COD:** ' + Number(order.total).toLocaleString('vi-VN') + ' VND\n' +
        '- **Trạng thái:** Đang đóng gói chuẩn bị giao (COD xỏ thử tại chỗ)\n\n' +
        '*(Lưu ý: Nếu cần thay đổi size hoặc cập nhật địa chỉ trước khi xuất kho, bạn hãy nhắn ngay tại đây hoặc gọi hotline 1900 8888 để được hỗ trợ nhé!)*';

      await emitter.delta(answer);
      await emitter.chips?.(['Xem 70 mẫu giày', 'Chính sách đổi size', 'Hotline 1900 8888']);
      await emitter.done();
      return;
    } else {
      const answer = 'Dạ One - Store đã kiểm tra trên hệ thống nhưng chưa tìm thấy đơn hàng với mã **' + code + '**. Bạn vui lòng kiểm tra lại chính xác mã đơn (dạng ONE-YYYYMMDD-XXXX hoặc ONE-XXXXXXXX) hoặc gửi số điện thoại đặt hàng để One hỗ trợ tra cứu chi tiết nhé!';
      await emitter.delta(answer);
      await emitter.chips?.(['Kiểm tra lại mã đơn', 'Hotline 1900 8888']);
      await emitter.done();
      return;
    }
  }

  // 2. LẤY TOÀN BỘ DANH SÁCH SẢN PHẨM CÒN HÀNG TỪ CSDL D1
  const allProductsRes = await c.env.DB.prepare(
    'SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0',
  ).all();
  const allAvailableProducts = (allProductsRes.results || []) as ProductRecord[];

  // Bóc tách ý định & thực thể đặt hàng
  const orderDetails = extractOrderDetails(question, history, pendingOrder, allAvailableProducts);

  // === NHÁNH 1: KHÁCH HÀNG HỦY YÊU CẦU ĐẶT HÀNG HOẶC CHUYỂN NGỮ CẢNH ===
  if (orderDetails.isCancelIntent) {
    await emitter.orderReady({ readyToConfirm: false, pendingOrder: null });
    await emitter.delta(
      'Dạ vâng ạ, One - Store đã hủy yêu cầu lên đơn này. Nếu bạn muốn tham khảo thêm mẫu giày thể thao nào khác hoặc cần tư vấn chọn size theo dáng chân, bạn cứ nhắn cho One bất kỳ lúc nào nhé!',
    );
    await emitter.chips?.(['Tìm giày chạy bộ', 'Xem sneaker thời trang', 'Tư vấn dáng chân']);
    await emitter.done();
    return;
  }

  // NẾU PHÁT HIỆN CHUYỂN NGỮ CẢNH (Khách đổi sang hỏi tìm kiếm, hỏi giá, hỏi chính sách):
  // Xóa bỏ pendingOrder và chuyển quyền điều khiển cho Nhánh 4 (Bộ lọc SQL & RAG)
  if (orderDetails.isContextSwitch && pendingOrder) {
    await emitter.orderReady({ readyToConfirm: false, pendingOrder: null });
  }

  // === NHÁNH 2: KHÁCH HÀNG NHẮN "CHỐT ĐƠN" / XÁC NHẬN ĐƠN HÀNG THỰC TẾ ===
  if (orderDetails.isConfirmIntent) {
    const lastAssistantTurn = [...history].reverse().find((h) => h.role === 'assistant');
    const parsedSummary = lastAssistantTurn ? parseSummaryTable(lastAssistantTurn.text) : null;

    const targetProduct =
      orderDetails.product ||
      allAvailableProducts.find(
        (p: ProductRecord) =>
          (parsedSummary?.productName && p.name.toLowerCase().includes(parsedSummary.productName.toLowerCase())) ||
          p.id === pendingOrder?.productId,
      ) ||
      null;

    const finalSize = orderDetails.size || parsedSummary?.size || pendingOrder?.size || null;
    const finalColor = orderDetails.color || parsedSummary?.color || pendingOrder?.color || null;
    const finalQty = orderDetails.quantity || parsedSummary?.quantity || pendingOrder?.quantity || 1;
    const finalName = orderDetails.customerName || parsedSummary?.customerName || pendingOrder?.customerName || null;
    const finalPhone = orderDetails.phone || parsedSummary?.phone || pendingOrder?.phone || null;
    const finalAddress = orderDetails.address || parsedSummary?.address || pendingOrder?.address || null;

    if (!targetProduct || !finalSize || !finalColor || !finalName || !finalPhone || !finalAddress) {
      await emitter.delta(
        'Dạ chào bạn! Để One - Store có thể chốt đơn và giao hàng tận nơi cho bạn, bạn vui lòng cung cấp đầy đủ thông tin đơn hàng theo mẫu sau nhé:\n- Tên sản phẩm:\n- Size giày & Màu sắc:\n- Số lượng:\n- Họ và tên người nhận:\n- Số điện thoại:\n- Địa chỉ nhận hàng:\n\nSau khi có đủ thông tin, One sẽ gửi bạn bảng tóm tắt để bạn xác nhận chốt đơn ngay ạ!',
      );
      await emitter.done();
      return;
    }

    if (targetProduct.stock < finalQty) {
      await emitter.delta(
        'Dạ rất tiếc, sản phẩm **' + targetProduct.name + '** hiện chỉ còn lại ' + targetProduct.stock + ' đôi trong kho (bạn đặt ' + finalQty + ' đôi). Bạn có muốn lấy ' + targetProduct.stock + ' đôi hoặc One tư vấn mẫu khác nhé!',
      );
      await emitter.done();
      return;
    }

    let validSizes: string[] = [];
    let validColors: string[] = [];
    try { validSizes = JSON.parse(targetProduct.sizes); } catch {}
    try { validColors = JSON.parse(targetProduct.colors); } catch {}

    if (!validSizes.includes(finalSize)) {
      await emitter.delta(
        'Dạ rất tiếc mẫu **' + targetProduct.name + '** hiện chỉ có sẵn các size: **' + validSizes.join(', ') + '**. Size **' + finalSize + '** hiện kho đang tạm hết ạ. Bạn có muốn đổi sang size khác vừa vặn không ạ?',
      );
      await emitter.done();
      return;
    }

    const colorMatch = validColors.find((col) =>
      col.toLowerCase() === finalColor.toLowerCase() ||
      finalColor.toLowerCase().includes(col.toLowerCase()) ||
      col.toLowerCase().includes(finalColor.toLowerCase()),
    );
    if (!colorMatch) {
      await emitter.delta(
        'Dạ mẫu **' + targetProduct.name + '** hiện có các phối màu chính hãng: **' + validColors.join(', ') + '**. Phối màu \'' + finalColor + '\' hiện chưa có sẵn. Bạn chọn màu nào trong số này giúp One nhé!',
      );
      await emitter.done();
      return;
    }

    if (!/^0[35789]\d{8}$/.test(finalPhone)) {
      await emitter.delta(
        'Dạ số điện thoại nhận hàng \'' + finalPhone + '\' dường như chưa chính xác (cần đúng 10 chữ số). Bạn vui lòng kiểm tra lại số điện thoại để One lên đơn nhé!',
      );
      await emitter.done();
      return;
    }

    if (finalAddress.length < 6) {
      await emitter.delta(
        'Dạ bạn vui lòng cung cấp địa chỉ nhận hàng chi tiết hơn (bao gồm số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố) để One giao hàng chính xác tận nơi cho bạn nhé!',
      );
      await emitter.done();
      return;
    }

    // THỰC THI GIAO DỊCH THẬT TRÊN CSDL CLOUDFLARE D1
    const orderCode = 'ONE-' + crypto.randomUUID().slice(0, 8).toUpperCase();
    const createdAt = new Date().toISOString();
    const unitPrice = targetProduct.price;
    const subtotal = unitPrice * finalQty;
    const discount = Math.floor((subtotal * 10) / 100);
    const shippingFee = finalQty >= 3 || subtotal >= 5000000 ? 0 : 30000;
    const finalTotal = subtotal - discount + shippingFee;

    const ops = [
      c.env.DB.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?').bind(
        finalQty,
        targetProduct.id,
        finalQty,
      ),
      c.env.DB.prepare(
        `INSERT INTO orders (code, customer_name, phone, address, note, total, customer_id, voucher_code, discount, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        orderCode,
        finalName,
        finalPhone,
        finalAddress,
        '[Đặt qua AI Chatbot One] [Hình thức: COD - Đồng kiểm xỏ thử]',
        finalTotal,
        null,
        'ONE10',
        discount,
        createdAt,
      ),
      c.env.DB.prepare(
        `INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, unit_price)
         VALUES ((SELECT id FROM orders WHERE code = ?), ?, ?, ?, ?, ?, ?)`,
      ).bind(
        orderCode,
        targetProduct.id,
        targetProduct.name,
        finalSize,
        colorMatch,
        finalQty,
        unitPrice,
      ),
      c.env.DB.prepare(
        `UPDATE vouchers SET used_count = used_count + 1 WHERE code = 'ONE10' AND used_count < max_uses AND active = 1`,
      ),
    ];

    try {
      const batchResults = await c.env.DB.batch(ops);
      if (batchResults[0].meta.changes !== 1) {
        await emitter.delta(
          'Dạ rất tiếc, số lượng sản phẩm **' + targetProduct.name + '** trong kho vừa có sự thay đổi và không còn đủ ' + finalQty + ' đôi để xuất hàng. Bạn vui lòng chọn lại số lượng hoặc mẫu khác nhé!',
        );
        await emitter.done();
        return;
      }

      try {
        await c.env.CACHE.delete('products:v1');
      } catch {}

      let answerText = `**XÁC NHẬN ĐẶT HÀNG THÀNH CÔNG**

Mã đơn hàng chính thức của bạn là: **${orderCode}**

- **Sản phẩm:** ${targetProduct.name}
- **Phân loại:** Size ${finalSize} | Màu ${colorMatch}
- **Số lượng:** ${finalQty} đôi
- **Đơn giá:** ${unitPrice.toLocaleString('vi-VN')} VND
- **Ưu đãi ONE10:** -${discount.toLocaleString('vi-VN')} VND (Đã giảm 10%)
- **Phí vận chuyển:** ${shippingFee === 0 ? '0 VND (Freeship toàn quốc)' : '30.000 VND (Giao toàn quốc)'}
- **Tổng thanh toán khi nhận hàng (COD):** ${finalTotal.toLocaleString('vi-VN')} VND
- **Người nhận:** ${finalName} | ${finalPhone}
- **Địa chỉ giao:** ${finalAddress}
- **Thời gian giao dự kiến:** 2 - 3 ngày làm việc (Nội địa toàn quốc)

Đơn hàng đã được lưu chính thức trên hệ thống One - Store. Bạn có thể tra cứu trạng thái đơn tại trang **"Lịch sử mua hàng"** hoặc trên thanh điều hướng bất kỳ lúc nào bằng mã đơn **${orderCode}**.
Trước khi thanh toán, bạn hoàn toàn được **đồng kiểm và xỏ thử tại chỗ**. Nếu có bất kỳ thắc mắc nào, đội ngũ One - Store luôn sẵn sàng hỗ trợ bạn 24/7!`;

      // NÂNG CẤP AGENTIC COMMERCE: GỢI Ý MUA KÈM PHỤ KIỆN (CROSS-SELLING)
      answerText += `\n\n**GỢI Ý PHỤ KIỆN MUA KÈM ƯU ĐÃI HÔM NAY:**
- **Vớ thể thao dệt kim One Athletic:** Chỉ +49.000 VND/đôi (Giá gốc 90.000 VND).
- **Bình xịt bọt nano vệ sinh giày sneaker:** Chỉ +89.000 VND (Giá gốc 150.000 VND).
*(Bạn chỉ cần nhắn "Thêm vớ thể thao" hoặc "Thêm bình xịt", One sẽ gộp ngay vào đơn hàng này cho bạn nhé!)*`;

      await emitter.delta(answerText);
      await emitter.orderCreated({
        code: orderCode,
        total: finalTotal,
        discount,
        shippingFee,
        customer_name: finalName,
        phone: finalPhone,
        address: finalAddress,
        product_name: targetProduct.name,
        size: finalSize,
        color: colorMatch,
        quantity: finalQty,
      });
      await emitter.chips?.(['Tra cứu đơn ' + orderCode, 'Thêm vớ thể thao (+49k)', 'Thêm xịt nano (+89k)']);
      await emitter.done();
      return;
    } catch (orderErr: any) {
      console.error('[Order Insertion Error]', orderErr);
      await emitter.delta('Không thể khởi tạo đơn hàng: ' + (orderErr?.message || 'Lỗi hệ thống CSDL'));
      await emitter.done();
      return;
    }
  }

  // === NHÁNH 3: KHÁCH HÀNG GỬI THÔNG TIN HOẶC BÀY TỎ Ý ĐỊNH ĐẶT HÀNG ===
  // Điều kiện kích hoạt chặt chẽ:
  // 1. Khách hàng đã chọn được sản phẩm sneaker có thật trong kho (matchedProduct !== null) VÀ có ý định mua
  // 2. HOẶC khách hàng chủ động gửi thông tin liên hệ đầy đủ (SĐT + Địa chỉ)
  // 3. VÀ tuyệt đối KHÔNG đang trong trạng thái chuyển ngữ cảnh tìm kiếm (isContextSwitch === false)
  const hasContactInfo = Boolean(orderDetails.phone && (orderDetails.address || orderDetails.customerName));
  const canEnterOrdering =
    !orderDetails.isContextSwitch &&
    ((orderDetails.product && (orderDetails.isOrderIntent || orderDetails.isConfirmIntent)) || hasContactInfo);

  if (canEnterOrdering) {
    const product = orderDetails.product;
    const { size, color, quantity, customerName, phone, address } = orderDetails;

    if (product && size && color && customerName && phone && address) {
      if (product.stock < quantity) {
        await emitter.delta(
          'Dạ rất tiếc, sản phẩm **' + product.name + '** hiện chỉ còn lại ' + product.stock + ' đôi trong kho (bạn đặt ' + quantity + ' đôi). Bạn có muốn lấy ' + product.stock + ' đôi hoặc để One tư vấn mẫu khác nhé!',
        );
        await emitter.done();
        return;
      }

      let validSizes: string[] = [];
      let validColors: string[] = [];
      try { validSizes = JSON.parse(product.sizes); } catch {}
      try { validColors = JSON.parse(product.colors); } catch {}

      if (!validSizes.includes(size)) {
        await emitter.delta(
          'Dạ rất tiếc mẫu **' + product.name + '** hiện chỉ có sẵn các size: **' + validSizes.join(', ') + '**. Size **' + size + '** hiện kho đang tạm hết ạ. Bạn có muốn đổi sang size khác vừa vặn không ạ?',
        );
        await emitter.done();
        return;
      }

      const colorMatch = validColors.find((col) =>
        col.toLowerCase() === color.toLowerCase() ||
        color.toLowerCase().includes(col.toLowerCase()) ||
        col.toLowerCase().includes(color.toLowerCase()),
      );
      if (!colorMatch) {
        await emitter.delta(
          'Dạ mẫu **' + product.name + '** hiện có các phối màu chính hãng: **' + validColors.join(', ') + '**. Phối màu \'' + color + '\' hiện chưa có sẵn. Bạn chọn màu nào trong số này giúp One nhé!',
        );
        await emitter.done();
        return;
      }

      if (!/^0[35789]\d{8}$/.test(phone)) {
        await emitter.delta(
          'Dạ số điện thoại nhận hàng \'' + phone + '\' dường như chưa chính xác (cần đúng 10 chữ số). Bạn vui lòng kiểm tra lại số điện thoại giúp One nhé!',
        );
        await emitter.done();
        return;
      }

      if (address.length < 6) {
        await emitter.delta(
          'Dạ bạn vui lòng cung cấp địa chỉ nhận hàng chi tiết hơn (bao gồm số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố) để One - Store đảm bảo giao hàng chính xác tận nơi cho bạn nhé!',
        );
        await emitter.done();
        return;
      }

      const unitPrice = product.price;
      const subtotal = unitPrice * quantity;
      const discount = Math.floor((subtotal * 10) / 100);
      const shippingFee = quantity >= 3 || subtotal >= 5000000 ? 0 : 30000;
      const finalTotal = subtotal - discount + shippingFee;

      const summaryText = `Dạ thông tin đặt hàng của bạn đã được đối soát chính xác với hệ thống kho hàng One - Store. Dưới đây là bảng tóm tắt đơn hàng dự kiến của bạn:

**THÔNG TIN ĐƠN HÀNG COD**
- **Sản phẩm:** ${product.name}
- **Phân loại:** Size ${size} | Màu ${colorMatch}
- **Số lượng:** ${quantity} đôi
- **Đơn giá:** ${unitPrice.toLocaleString('vi-VN')} VND
- **Tạm tính:** ${subtotal.toLocaleString('vi-VN')} VND
- **Ưu đãi ONE10:** -${discount.toLocaleString('vi-VN')} VND (Giảm 10% đơn hàng)
- **Phí giao hàng:** ${shippingFee === 0 ? '0 VND (Freeship toàn quốc)' : '30.000 VND (Giao toàn quốc)'}
- **Tổng thanh toán khi nhận hàng (COD):** ${finalTotal.toLocaleString('vi-VN')} VND
- **Người nhận:** ${customerName} | ${phone}
- **Địa chỉ nhận:** ${address}
- **Chính sách nhận hàng:** Đồng kiểm, xỏ thử tận nơi trước khi thanh toán. Đổi size 7 ngày miễn phí cước 2 chiều lần đầu.

Bạn vui lòng kiểm tra lại thông tin trên. Nếu mọi thứ đã chính xác, bạn chỉ cần nhắn **"Chốt đơn"** (hoặc bấm nút **"Chốt đơn ngay"** bên dưới) để One - Store xuất kho và gửi hàng ngay cho bạn nhé!`;

      await emitter.delta(summaryText);
      await emitter.products([
        {
          id: product.id || 0,
          name: product.name,
          slug: product.slug || '',
          category: product.category,
          description: product.description,
          price: product.price,
          compare_at_price: product.compare_at_price || null,
          stock: product.stock,
          sizes: validSizes,
          colors: validColors,
          image_key: product.image_key || null,
          featured: product.featured || 0,
          created_at: product.created_at || '',
          image_url: product.image_key ? '/api/images/' + encodeURIComponent(product.image_key) : null,
        },
      ]);
      await emitter.orderReady({
        readyToConfirm: true,
        pendingOrder: {
          productId: product.id,
          productName: product.name,
          size,
          color: colorMatch,
          quantity,
          unitPrice,
          subtotal,
          discount,
          shippingFee,
          total: finalTotal,
          customerName,
          phone,
          address,
        },
      });
      await emitter.chips?.(['Chốt đơn ngay', 'Đổi size khác', 'Hủy đơn']);
      await emitter.done();
      return;
    }

    let promptText = '';
    if (product) {
      let validSizes: string[] = [];
      let validColors: string[] = [];
      try { validSizes = JSON.parse(product.sizes); } catch {}
      try { validColors = JSON.parse(product.colors); } catch {}

      const missingItems: string[] = [];
      if (!size) missingItems.push('- Size giày: (Mẫu này có sẵn: ' + validSizes.join(', ') + ')');
      else missingItems.push('- Size giày: ' + size);

      if (!color) missingItems.push('- Màu sắc: (Mẫu này có sẵn: ' + validColors.join(', ') + ')');
      else missingItems.push('- Màu sắc: ' + color);

      missingItems.push('- Số lượng: ' + quantity + ' đôi');

      if (!customerName) missingItems.push('- Họ và tên người nhận:');
      else missingItems.push('- Họ và tên: ' + customerName);

      if (!phone) missingItems.push('- Số điện thoại nhận hàng:');
      else missingItems.push('- Số điện thoại: ' + phone);

      if (!address) missingItems.push('- Địa chỉ nhận hàng (Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP):');
      else missingItems.push('- Địa chỉ: ' + address);

      promptText = 'Dạ tuyệt vời ạ! Em thấy bạn đang quan tâm mẫu **' + product.name + '** (' + product.price.toLocaleString('vi-VN') + ' VND).\n\n' +
        'Để One - Store kiểm tra kho, đóng gói xỏ thử tận nơi và lên đơn giao ngay cho bạn, bạn vui lòng bổ sung giúp One các thông tin còn thiếu theo mẫu sau nhé:\n\n' +
        missingItems.join('\n') + '\n\n' +
        'One - Store hỗ trợ giao hàng COD toàn quốc, đồng kiểm và xỏ thử tận nơi trước khi thanh toán ạ!';
    } else {
      promptText = 'Dạ chào bạn! Để One - Store lên đơn và giao hàng tận nơi cho bạn, bạn vui lòng gửi giúp One các thông tin đơn hàng theo mẫu sau nhé:\n' +
        '- Tên mẫu giày bạn muốn đặt:\n' +
        '- Size giày: (ví dụ: 39)\n' +
        '- Màu sắc: (ví dụ: Đen)\n' +
        '- Số lượng: (Mặc định 1 đôi)\n' +
        '- Họ và tên người nhận:\n' +
        '- Số điện thoại nhận hàng:\n' +
        '- Địa chỉ nhận hàng (Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP):\n\n' +
        'One - Store hỗ trợ giao hàng COD toàn quốc, đồng kiểm và xỏ thử tận nơi trước khi thanh toán ạ!';
    }

    let productSizesArr: string[] = [];
    let productColorsArr: string[] = [];
    if (product) {
      try { productSizesArr = JSON.parse(product.sizes); } catch {}
      try { productColorsArr = JSON.parse(product.colors); } catch {}
    }

    await emitter.delta(promptText);
    if (product) {
      await emitter.products([
        {
          id: product.id || 0,
          name: product.name,
          slug: product.slug || '',
          category: product.category,
          description: product.description,
          price: product.price,
          compare_at_price: product.compare_at_price || null,
          stock: product.stock,
          sizes: productSizesArr,
          colors: productColorsArr,
          image_key: product.image_key || null,
          featured: product.featured || 0,
          created_at: product.created_at || '',
          image_url: product.image_key ? '/api/images/' + encodeURIComponent(product.image_key) : null,
        },
      ]);
    }
    await emitter.chips?.(['Gửi thông tin đặt hàng', 'Tư vấn thêm', 'Hủy đơn']);
    await emitter.done();
    return;
  }

  // === NHÁNH 4: TƯ VẤN SẢN PHẨM & CHÍNH SÁCH (FULL RAG + WORKERS AI GEMMA 4) ===
  // 0. TẦNG ĐỆM CACHE: CLOUDFLARE KV (env.CACHE) (< 30ms)
  const qClean = question.trim();
  const qHash = await hashQuery(qClean);
  const cacheKey = `chat_cache_v2:${qHash}`;
  if (c.env.CACHE && (!history || history.length === 0)) {
    try {
      const cached = (await c.env.CACHE.get(cacheKey, 'json')) as {
        answer: string;
        products?: any[];
        sources?: any[];
        chips?: string[];
      } | null;
      if (cached && cached.answer) {
        await emitter.delta(cached.answer);
        if (cached.products?.length) await emitter.products(cached.products);
        if (cached.sources?.length) await emitter.sources(cached.sources);
        if (cached.chips?.length) await emitter.chips?.(cached.chips);
        await emitter.done();
        return;
      }
    } catch (cacheErr) {
      console.warn('[Cache Read Warning]', cacheErr);
    }
  }

  if (isStream) {
    await emitter.status('Đang tra cứu tri thức và kho giày D1...');
  }

  // 1. Trích xuất thuộc tính lọc từ câu hỏi
  const filters = extractProductFilters(question, history);
  const whereClauses: string[] = ['stock > 0'];
  const bindParams: any[] = [];

  if (filters.brand) {
    whereClauses.push('LOWER(name) LIKE ?');
    bindParams.push('%' + filters.brand.toLowerCase() + '%');
  }

  if (filters.modelKeyword) {
    whereClauses.push('LOWER(name) LIKE ?');
    bindParams.push('%' + filters.modelKeyword.toLowerCase() + '%');
  }

  if (filters.category) {
    whereClauses.push('category = ?');
    bindParams.push(filters.category);
  }

  if (filters.maxPrice) {
    whereClauses.push('price <= ?');
    bindParams.push(filters.maxPrice);
  }

  const hasSpecificFilter = Boolean(filters.brand || filters.modelKeyword || filters.category || filters.maxPrice || filters.color);
  const sqlQuery = 'SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE ' + whereClauses.join(' AND ') + ' ORDER BY featured DESC, id ASC LIMIT 20';

  const productStmt = c.env.DB.prepare(sqlQuery);
  const productRes = await (bindParams.length > 0 ? productStmt.bind(...bindParams) : productStmt).all();
  const matchedProducts = (productRes.results || []) as ProductRecord[];

  // === MŨI NHỌN 1: FAST CATALOG DIRECT RESOLVER (< 80ms, 0 Token LLM) ===
  // Trực tiếp xử lý câu hỏi hỏi giá tiền, kích cỡ hoặc tình trạng còn hàng của sản phẩm cụ thể từ CSDL D1
  const isDirectCatalogQuery =
    /(giá bao nhiêu|nhiêu tiền|bao tiền|có giá|cho xin giá|hỏi giá|giá cả|giá sao|bán giá|bao nhiêu 1 đôi|bao nhiêu một đôi|có size|còn size|còn hàng không|còn mẫu không)/i.test(
      question.toLowerCase(),
    );

  if (isDirectCatalogQuery && matchedProducts.length > 0 && matchedProducts.length <= 4) {
    let fastAnswer = '';
    if (matchedProducts.length === 1) {
      const p = matchedProducts[0];
      let sizesStr = p.sizes;
      let colorsStr = p.colors;
      try { sizesStr = JSON.parse(p.sizes).join(', '); } catch {}
      try { colorsStr = JSON.parse(p.colors).join(', '); } catch {}
      fastAnswer = `Dạ chào bạn, tại One - Store mẫu **${p.name}** (${p.category}) chính hãng hiện có giá niêm yết là **${p.price.toLocaleString('vi-VN')} VND**.\n\n- **Tình trạng kho:** Còn sẵn ${p.stock} đôi tại showroom.\n- **Cỡ giày có sẵn:** ${sizesStr}.\n- **Màu sắc:** ${colorsStr}.\n\nKhi đặt mua đôi này, bạn được áp dụng mã voucher **ONE10** giảm ngay 10%, miễn phí ship khi mua từ 3 đôi hoặc hóa đơn từ 5.000.000 VND, và quyền **đồng kiểm, xỏ thử giày tận nơi** trước khi thanh toán COD ạ!`;
    } else {
      const itemsList = matchedProducts.map((p) => {
        let sizesStr = p.sizes;
        try { sizesStr = JSON.parse(p.sizes).join(', '); } catch {}
        return `- **${p.name}**: **${p.price.toLocaleString('vi-VN')} VND** (Còn ${p.stock} đôi, size: ${sizesStr})`;
      }).join('\n');
      fastAnswer = `Dạ One - Store xin gửi bạn thông tin giá và cỡ giày của các mẫu bạn đang quan tâm:\n\n${itemsList}\n\nToàn bộ sản phẩm đều là hàng chính hãng 100%, được áp dụng mã ưu đãi **ONE10** giảm 10%, chính sách **đồng kiểm và xỏ thử tại chỗ 100%**, cùng chế độ bảo hành 6-12 tháng chính hãng ạ!`;
    }

    const fastSuggested = matchedProducts.map((p) => {
      let sizesArr: string[] = [];
      let colorsArr: string[] = [];
      try { sizesArr = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes; } catch { sizesArr = []; }
      try { colorsArr = typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors; } catch { colorsArr = []; }
      return {
        id: p.id || 0,
        name: p.name,
        slug: p.slug || '',
        category: p.category,
        description: p.description,
        price: p.price,
        compare_at_price: p.compare_at_price || null,
        stock: p.stock,
        sizes: sizesArr,
        colors: colorsArr,
        image_key: p.image_key || null,
        featured: p.featured || 0,
        created_at: p.created_at || '',
        image_url: p.image_key ? '/api/images/' + encodeURIComponent(p.image_key) : null,
      };
    });

    await emitter.delta(fastAnswer);
    await emitter.products(fastSuggested);
    await emitter.chips?.(['Tư vấn chọn size', 'Chính sách freeship', 'Xem thêm mẫu']);
    await emitter.done();

    // Lưu vào KV cache
    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: fastAnswer,
          products: fastSuggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Tư vấn chọn size', 'Chính sách freeship', 'Xem thêm mẫu'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  const catalogContext = matchedProducts.slice(0, 4).map((p) => {
    let sizesStr = p.sizes;
    let colorsStr = p.colors;
    try { sizesStr = JSON.parse(p.sizes).join(', '); } catch {}
    try { colorsStr = JSON.parse(p.colors).join(', '); } catch {}
    return '- ' + p.name + ' (' + p.category + '): ' + p.price.toLocaleString('vi-VN') + ' VND | Kho: ' + p.stock + ' đôi | Size: ' + sizesStr + ' | Màu: ' + colorsStr;
  }).join('\n');

  // 2. Vectorize RAG trích xuất Top-3 chunks tri thức
  let contextChunks: Array<{ id: string; title: string; content: string; score: number }> = [];
  try {
    const embedResult = (await c.env.AI.run('@cf/baai/bge-m3', {
      text: [question],
    })) as { data?: number[][] };

    const queryVector = embedResult?.data?.[0];
    if (queryVector && Array.isArray(queryVector) && queryVector.length > 0) {
      const vecMatches = (await c.env.VECTORIZE.query(queryVector, { topK: 3 })) as any;
      const topIds = (vecMatches?.matches || []).filter((m: any) => m.score >= 0.35).map((m: any) => m.id);

      if (topIds.length > 0) {
        const placeholders = topIds.map(() => '?').join(',');
        const chunksRes = await c.env.DB.prepare(
          'SELECT c.id, c.content, d.title FROM chat_chunks c JOIN chat_knowledge d ON c.document_id = d.id WHERE c.id IN (' + placeholders + ')',
        ).bind(...topIds).all();

        const chunkRows = (chunksRes.results || []) as Array<{ id: string; content: string; title: string }>;
        const chunkMap = new Map(chunkRows.map((row) => [row.id, row]));
        for (const match of vecMatches.matches) {
          const row = chunkMap.get(match.id);
          if (row) {
            contextChunks.push({
              id: row.id,
              title: row.title,
              content: row.content,
              score: match.score,
            });
          }
        }
      }
    }
  } catch (vecErr) {
    console.error('[Vectorize Query Warning]', vecErr);
  }

  const knowledgeContext = contextChunks.map((chunk, idx) => '[' + (idx + 1) + '] ' + chunk.title + ':\n' + chunk.content).join('\n\n');

  // 2.5. TẦNG 3: KNOWLEDGE GATEKEEPER & SIMILARITY THRESHOLD GATE
  // Kiểm tra điểm tương đồng vector cao nhất từ Vectorize
  const maxVectorScore = contextChunks.reduce((max, ch) => Math.max(max, ch.score || 0), 0);
  const brandKeywords = ['nike', 'adidas', 'asics', 'mizuno', 'new balance', 'salomon', 'puma', 'on running', 'hoka', 'li-ning', 'anta', 'jordan'];
  const questionLower = question.toLowerCase();
  const mentionsBrand = brandKeywords.some((b) => questionLower.includes(b));
  const mentionsShoeDomain = /(giày|sneaker|chạy bộ|marathon|bóng rổ|dã ngoại|đế|cỡ|size|xỏ thử|đồng kiểm|đổi size|freeship|bảo hành|mã giảm|đặt hàng|mua|đơn hàng)/i.test(questionLower);

  // Nếu không khớp bất kỳ sản phẩm D1 nào, điểm tương đồng vector thấp và không liên quan tới sneaker/thương hiệu:
  const isOutOfKnowledge = matchedProducts.length === 0 && (!mentionsBrand && !mentionsShoeDomain ? maxVectorScore < 0.70 : maxVectorScore < 0.50);
  if (isOutOfKnowledge) {
    const outAnswer = 'Dạ câu hỏi này hiện nằm ngoài phạm vi cơ sở dữ liệu tri thức của One - Store. Em chỉ được cung cấp dữ liệu chính thức về 70 mẫu giày sneaker chính hãng Âu - Á và các chính sách bán hàng của cửa hàng. Bạn có muốn em hỗ trợ tìm kiếm mẫu giày thể thao nào đang có sẵn không ạ?';
    await emitter.delta(outAnswer);
    await emitter.chips?.(['Xem 70 mẫu sneaker', 'Tư vấn chọn size', 'Chính sách freeship', 'Chính sách đổi trả']);
    await emitter.done();
    return;
  }

  // 3. XÂY DỰNG SYSTEM PROMPT PHÂN VAI STRICT CLOSED-DOMAIN (ZERO-HALLUCINATION)
  const systemPrompt = `BẠN LÀ: "Tư vấn One" — Chuyên viên tư vấn bán hàng thông minh và độc quyền của hệ sinh thái thương mại điện tử One - Store (gọi ngắn gọn là One).

QUY ĐỊNH BẮT BUỘC VỀ PHẠM VI TRI THỨC ĐÓNG BĂNG (CLOSED-DOMAIN STRICT GROUNDING):
1. BẠN LÀ MỘT TRỢ LÝ ĐÓNG BĂNG PHẠM VI (CLOSED-DOMAIN AI). BẠN TUYỆT ĐỐI CHỈ ĐƯỢC PHÉP SỬ DỤNG DUY NHẤT 2 NGUỒN DỮ LIỆU ĐƯỢC CẤP TRONG CONTEXT: [DANH MỤC GIÀY SẴN CÓ TRONG KHO D1] VÀ [TRÍCH ĐOẠN TRI THỨC CHÍNH SÁCH].
2. NGHIÊM CẤM 100% SỬ DỤNG KIẾN THỨC BÊN NGOÀI THẾ GIỚI: Tuyệt đối không sử dụng kiến thức bên ngoài được huấn luyện trước (Pre-trained knowledge) để trả lời về các chủ đề ngoài One - Store (như ẩm thực, công nghệ, chính trị, quần áo, thời tiết...).
3. NGHIÊM CẤM BỊA ĐẶT THÔNG SỐ (ZERO-HALLUCINATION): Không tự bịa giá tiền, không tự bịa size, không tự tạo thương hiệu hoặc mẫu giày không có trong danh mục kho D1.
4. NGUYÊN TẮC THÀNH THẬT: Nếu thông tin không có trong tài liệu được cung cấp hoặc khách hỏi điều mà bạn không tìm thấy dữ liệu đối soát, bạn BẮT BUỘC phải thẳng thắn trả lời: "Dạ thông tin này hiện chưa có trong cơ sở dữ liệu của One - Store ạ..." và lịch sự gợi ý khách hàng tham khảo các dòng giày có sẵn.
5. One - Store CHỈ KINH DOANH DUY NHẤT: Giày thể thao & Sneaker chính hãng (Âu - Á). Không bán quần áo hay phụ kiện thời trang khác.
6. 10 THƯƠNG HIỆU PHÂN PHỐI CHÍNH HÃNG:
   - Âu - Mỹ: Nike, Adidas, Jordan, Puma, New Balance, Salomon, On Running, Hoka One One.
   - Châu Á: Asics, Mizuno, Li-Ning, Anta.
7. CHÍNH SÁCH BÁN HÀNG ĐẶC BIỆT:
   - Miễn phí vận chuyển toàn quốc cho đơn từ 3 đôi hoặc hóa đơn từ 5.000.000 VND (Đơn dưới mức này phí ship 30.000 VND).
   - Áp dụng mã ưu đãi ONE10 giảm ngay 10% tổng đơn hàng.
   - Hình thức COD: Khách hàng hoàn toàn được ĐỒNG KIỂM và XỎ THỬ TẬN NƠI trước khi thanh toán.
   - Đổi size trong vòng 7 ngày miễn phí cước 2 chiều lần đầu tiên.
   - Bảo hành 6 tháng cho giày marathon Carbon và 12 tháng cho giày Lifestyle/Outdoor; dán keo ép nhiệt trọn đời.

QUY CHUẨN TRÌNH BÀY & XƯNG HÔ (BẮT BUỘC 100%):
- QUY ĐỊNH TỐC ĐỘ & ĐỘ DÀI: Trả lời trực tiếp bằng tiếng Việt súc tích trong tối đa 3-4 câu ngắn gọn (dưới 150 từ). Tuyệt đối không viết nháp tiếng Anh, không phân tích dàn ý, tập trung ngay vào tư vấn đúng mẫu giày phù hợp từ kho D1.
- TUYỆT ĐỐI KHÔNG SỬ DỤNG BẤT KỲ KÝ TỰ BIỂU TƯỢNG CẢM XÚC (EMOJI) NÀO TRONG CÂU TRẢ LỜI.
- Sử dụng xưng hô lịch sự, thân thiện: "One", "Tư vấn One" hoặc "Em" - "Bạn" hoặc "Quý khách".
- Sử dụng định dạng Markdown rõ ràng: in đậm tên giày, giá tiền VND, gạch đầu dòng phân ý mạch lạc.`;

  const userPrompt = `CÂU HỎI CỦA KHÁCH HÀNG: ${question}

DANH MỤC GIÀY SẴN CÓ TRONG KHO D1:
${catalogContext || 'Hiện không có mẫu giày nào khớp bộ lọc chính xác, hãy tư vấn mẫu tương tự.'}

TRÍCH ĐOẠN TRI THỨC CHÍNH SÁCH & CẨM NANG LIÊN QUAN:
${knowledgeContext || 'Không tìm thấy tài liệu liên quan.'}`;

  const conversationMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  if (Array.isArray(history) && history.length > 0) {
    const validTurns = history.filter(
      (t) => t && typeof t.text === 'string' && !t.text.includes('Lỗi hệ thống') && !t.text.includes('Error') && t.text.trim().length > 0,
    );
    const recentTurns = validTurns.slice(-3);
    for (const turn of recentTurns) {
      if (turn.role === 'user' || turn.role === 'assistant') {
        const cleanedTurn = turn.role === 'assistant' ? cleanModelOutput(turn.text) : turn.text;
        conversationMessages.push({
          role: turn.role,
          content: cleanedTurn.slice(0, 450),
        });
      }
    }
  }

  conversationMessages.push({ role: 'user', content: userPrompt });

  let aiResponseText = '';

  // 4. GỌI MÔ HÌNH LLM (STREAMING HOẶC NON-STREAMING - TỐC ĐỘ CAO <= 3S)
  if (isStream) {
    try {
      const aiResult = (await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: conversationMessages,
        max_tokens: 350,
        temperature: 0.1,
        stream: true,
      })) as any;

      if (aiResult instanceof ReadableStream) {
        const reader = aiResult.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += typeof value === 'string' ? value : decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf('\n')) >= 0) {
            const line = buf.slice(0, nl).trimEnd();
            buf = buf.slice(nl + 1);
            if (line.startsWith('data:')) {
              const dataStr = line.slice(5).trim();
              if (dataStr && dataStr !== '[DONE]') {
                try {
                  const parsedChunk = JSON.parse(dataStr);
                  const delta = parsedChunk?.response || parsedChunk?.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    aiResponseText += delta;
                    await emitter.delta(delta);
                  }
                } catch {}
              }
            }
          }
        }
      } else {
        const message = aiResult?.choices?.[0]?.message;
        const content = (message?.content || aiResult?.response || aiResult?.text || '').trim();
        aiResponseText = content;
        await emitter.delta(content);
      }
    } catch (err: any) {
      console.error('[Workers AI Gemma Stream Error]', err?.message || err);
    }
  } else {
    try {
      const aiResult = (await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: conversationMessages,
        max_tokens: 350,
        temperature: 0.1,
      })) as any;

      const message = aiResult?.choices?.[0]?.message;
      const finishReason = aiResult?.choices?.[0]?.finish_reason;
      const content = (message?.content || aiResult?.response || aiResult?.text || '').trim();
      const reasoning = message?.reasoning_content ? String(message.reasoning_content) : '';

      if ((finishReason === 'length' || content.length < 150) && reasoning) {
        const extracted = extractAnswerFromReasoning(reasoning);
        aiResponseText = extracted && extracted.length > content.length ? extracted : (content || extracted);
      } else {
        aiResponseText = content;
      }
    } catch (err: any) {
      console.error('[Workers AI Gemma Error]', err?.message || err);
    }

    aiResponseText = cleanModelOutput(aiResponseText);
    if (!aiResponseText) {
      aiResponseText = 'Dạ chào bạn, One - Store hiện phân phối độc quyền và chính hãng các dòng giày thể thao từ 10 thương hiệu hàng đầu Âu - Á (Nike, Adidas, Asics, Mizuno, New Balance, Salomon, Puma, On Running, Hoka One One, Li-Ning, Anta). Bạn đang quan tâm đến mẫu giày cụ thể nào hay cần One tư vấn chọn size giày chuẩn theo dáng chân nhé!';
    }
    await emitter.delta(aiResponseText);
  }

  // Fallback an toàn nếu chuỗi stream rỗng
  if (!aiResponseText.trim()) {
    const fallback = 'Dạ chào bạn, One - Store hiện phân phối độc quyền và chính hãng các dòng giày thể thao từ 10 thương hiệu hàng đầu Âu - Á (Nike, Adidas, Asics, Mizuno, New Balance, Salomon, Puma, On Running, Hoka One One, Li-Ning, Anta). Bạn đang quan tâm đến mẫu giày cụ thể nào hay cần One tư vấn chọn size giày chuẩn theo dáng chân nhé!';
    await emitter.delta(fallback);
  }

  // 5. TRÍCH XUẤT THẺ SẢN PHẨM PHÙ HỢP TỪ D1
  const sources = [...new Set(contextChunks.map((chunk) => chunk.title))];
  const textLower = aiResponseText.toLowerCase();
  let matchedSuggested = matchedProducts.filter((p) => {
    const fullName = p.name.toLowerCase();
    const modelWords = fullName.split(' ').slice(1, 4).join(' ');
    return (
      textLower.includes(fullName) ||
      (modelWords.length > 5 && textLower.includes(modelWords))
    );
  });

  if (matchedSuggested.length === 0 && hasSpecificFilter) {
    matchedSuggested = matchedProducts.slice(0, 3);
  }

  const suggestedProducts = matchedSuggested.slice(0, 4).map((p) => {
    let sizesArr: string[] = [];
    let colorsArr: string[] = [];
    try { sizesArr = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes; } catch { sizesArr = []; }
    try { colorsArr = typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors; } catch { colorsArr = []; }
    return {
      id: p.id || 0,
      name: p.name,
      slug: p.slug || '',
      category: p.category,
      description: p.description,
      price: p.price,
      compare_at_price: p.compare_at_price || null,
      stock: p.stock,
      sizes: sizesArr,
      colors: colorsArr,
      image_key: p.image_key || null,
      featured: p.featured || 0,
      created_at: p.created_at || '',
      image_url: p.image_key ? '/api/images/' + encodeURIComponent(p.image_key) : null,
    };
  });

  await emitter.products(suggestedProducts);
  await emitter.sources(sources);
  await emitter.chips?.(['Tư vấn chọn size', 'Chính sách freeship', 'Xem thêm mẫu']);
  await emitter.done();

  // 6. LƯU KẾT QUẢ VÀO CLOUDFLARE KV CACHE (< 30ms cho các lần truy vấn tiếp theo)
  if (c.env.CACHE && (!history || history.length === 0) && aiResponseText) {
    try {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: aiResponseText,
          products: suggestedProducts,
          sources,
          chips: ['Tư vấn chọn size', 'Chính sách freeship', 'Xem thêm mẫu'],
        }),
        { expirationTtl: 14400 },
      );
    } catch (cachePutErr) {
      console.warn('[Cache Put Warning]', cachePutErr);
    }
  }
}

/**
 * ENDPOINT CHÍNH: POST /api/chat
 * Hỗ trợ đồng thời 2 giao thức:
 * 1. Server-Sent Events (SSE Streaming) khi client yêu cầu (stream: true hoặc Accept: text/event-stream)
 * 2. REST JSON đồng bộ truyền thống phục vụ kiểm thử và tương thích ngược 100%
 */
chatbot.post('/chat', async (c) => {
  const parsed = chatRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(
      parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ (câu hỏi: 2 - 600 ký tự)',
      400,
    );
  }

  const isStream = Boolean(parsed.data.stream) || (c.req.header('accept') || '').includes('text/event-stream');

  if (isStream) {
    return streamSSE(c, async (stream) => {
      const emitter: ChatResponseEmitter = {
        status: async (msg: string) => {
          await stream.writeSSE({ event: 'status', data: JSON.stringify({ message: msg }) });
        },
        delta: async (text: string) => {
          await stream.writeSSE({ event: 'delta', data: JSON.stringify({ text }) });
        },
        products: async (prods: any[]) => {
          await stream.writeSSE({ event: 'products', data: JSON.stringify({ products: prods }) });
        },
        sources: async (srcs: string[]) => {
          await stream.writeSSE({ event: 'sources', data: JSON.stringify({ sources: srcs }) });
        },
        orderReady: async (data: { pendingOrder: any; readyToConfirm: boolean }) => {
          await stream.writeSSE({ event: 'order_ready', data: JSON.stringify(data) });
        },
        orderCreated: async (order: any) => {
          await stream.writeSSE({ event: 'order_created', data: JSON.stringify({ createdOrder: order }) });
        },
        chips: async (chipList: string[]) => {
          await stream.writeSSE({ event: 'chips', data: JSON.stringify({ chips: chipList }) });
        },
        done: async () => {
          await stream.writeSSE({ event: 'done', data: JSON.stringify({ ok: true }) });
        },
      };

      try {
        await processChatPipeline(c, parsed.data, emitter, true);
      } catch (streamErr: any) {
        console.error('[Stream Error]', streamErr);
        await emitter.delta('\n\n[Lỗi kết nối stream: ' + (streamErr?.message || 'Không xác định') + ']');
        await emitter.done();
      }
    });
  } else {
    // Chế độ REST JSON truyền thống (100% backward compatible)
    const result: any = {
      answer: '',
      sources: [],
      products: [],
      readyToConfirm: false,
      chips: [],
    };

    const emitter: ChatResponseEmitter = {
      status: async () => {},
      delta: async (text: string) => {
        result.answer += text;
      },
      products: async (prods: any[]) => {
        result.products = prods;
      },
      sources: async (srcs: string[]) => {
        result.sources = srcs;
      },
      orderReady: async (data: { pendingOrder: any; readyToConfirm: boolean }) => {
        result.readyToConfirm = data.readyToConfirm;
        result.pendingOrder = data.pendingOrder;
      },
      orderCreated: async (order: any) => {
        result.createdOrder = order;
      },
      chips: async (chipList: string[]) => {
        result.chips = chipList;
      },
      done: async () => {},
    };

    await processChatPipeline(c, parsed.data, emitter, false);
    return c.json(result);
  }
});

// 1. Lấy danh sách tài liệu trong kho tri thức
chatbot.get('/admin/knowledge', async (c) => {
  if (!(await allowedAdmin(c))) return fail('Không có quyền quản trị', 401);

  const { results } = await c.env.DB.prepare(
    `SELECT chat_documents.id, chat_documents.title, chat_documents.created_at,
            COUNT(chat_chunks.id) AS chunks
     FROM chat_documents
     LEFT JOIN chat_chunks ON chat_chunks.document_id = chat_documents.id
     GROUP BY chat_documents.id
     ORDER BY chat_documents.created_at DESC`,
  ).all();

  return c.json({ documents: results });
});

// 2. Thêm mới tài liệu, tự động Smart Chunking, sinh vector BGE-M3 và Upsert vào Vectorize (kèm Rollback)
chatbot.post('/admin/knowledge', async (c) => {
  const user = await getAdminUser(c);
  const writeErr = requireWritePermission(user);
  if (writeErr) return writeErr;
  if (!user) return fail('Không có quyền quản trị', 401);

  const parsed = knowledgeSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail('Tiêu đề (2-150 ký tự) hoặc nội dung tài liệu (20-30000 ký tự) không hợp lệ', 400);
  }

  const chunks = splitIntoChunks(parsed.data.content);
  if (!chunks.length) return fail('Không thể phân đoạn văn bản', 400);

  const documentId = crypto.randomUUID();
  const chunkIds = chunks.map((_, index) => `${documentId}-${index}`);

  let embeddings: number[][];
  try {
    embeddings = await embed(c, chunks);
  } catch (embedError: any) {
    console.error('[Embedding Error]', embedError?.message || embedError);
    return fail(
      `Lỗi khi tạo vector embedding từ mô hình BGE-M3: ${embedError?.message || 'Không xác định'}`,
      500,
    );
  }

  // Bước 1: Lưu văn bản và chunks vào Cloudflare D1
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO chat_documents(id, title) VALUES(?, ?)').bind(
      documentId,
      parsed.data.title,
    ),
    ...chunks.map((content, index) =>
      c.env.DB.prepare(
        'INSERT INTO chat_chunks(id, document_id, chunk_index, content) VALUES(?, ?, ?, ?)',
      ).bind(chunkIds[index], documentId, index, content),
    ),
  ]);

  // Bước 2: Nạp vectors vào Cloudflare Vectorize (kèm rollback nếu xảy ra lỗi)
  try {
    await c.env.VECTORIZE.upsert(
      chunkIds.map((id, index) => ({ id, values: embeddings[index] })),
    );
  } catch (vectorizeError: any) {
    console.error(
      '[Vectorize Error] Tự động rollback dữ liệu trong D1:',
      vectorizeError?.message || vectorizeError,
    );

    // Rollback sạch sẽ trong D1
    try {
      await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM chat_chunks WHERE document_id = ?').bind(documentId),
        c.env.DB.prepare('DELETE FROM chat_documents WHERE id = ?').bind(documentId),
      ]);
    } catch (rollbackError: any) {
      console.error(
        '[Rollback Error] Thất bại khi xóa dữ liệu D1:',
        rollbackError?.message || rollbackError,
      );
    }

    return fail(
      `Lỗi khi nạp vector vào Cloudflare Vectorize (${vectorizeError?.message || 'Lỗi kết nối'}). Đã khôi phục dữ liệu ban đầu trong D1.`,
      500,
    );
  }

  return c.json(
    {
      id: documentId,
      title: parsed.data.title,
      chunks: chunks.length,
      vectors_indexed: chunkIds.length,
      message: 'Đã lưu và index vector thành công vào kho tri thức',
    },
    201,
  );
});

// 3. Xóa tài liệu khỏi kho tri thức: Xóa vector trong Vectorize và xóa bản ghi trong D1
chatbot.delete('/admin/knowledge/:id', async (c) => {
  const user = await getAdminUser(c);
  const writeErr = requireWritePermission(user);
  if (writeErr) return writeErr;
  if (!user) return fail('Không có quyền quản trị', 401);

  const documentId = c.req.param('id');
  const document = await c.env.DB.prepare('SELECT id, title FROM chat_documents WHERE id = ?')
    .bind(documentId)
    .first<{ id: string; title: string }>();

  if (!document) return fail('Không tìm thấy tài liệu tri thức', 404);

  const chunks = await c.env.DB.prepare('SELECT id FROM chat_chunks WHERE document_id = ?')
    .bind(documentId)
    .all<{ id: string }>();

  const chunkIds = chunks.results.map((chunk) => chunk.id);

  // 1. Xóa vectors tương ứng khỏi Vectorize
  if (chunkIds.length) {
    try {
      await c.env.VECTORIZE.deleteByIds(chunkIds);
    } catch (err: any) {
      console.warn(
        '[Vectorize Warning] Không thể xóa vectors (hoặc vector chưa tồn tại):',
        err?.message || err,
      );
    }
  }

  // 2. Xóa tài liệu và chunks trong D1
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM chat_chunks WHERE document_id = ?').bind(documentId),
    c.env.DB.prepare('DELETE FROM chat_documents WHERE id = ?').bind(documentId),
  ]);

  return c.json({
    ok: true,
    deleted_id: documentId,
    deleted_title: document.title,
    deleted_chunks: chunkIds.length,
    message: 'Đã xóa tài liệu và vector thành công',
  });
});

// 4. API đồng bộ và index toàn bộ các chunks hiện có trong D1 vào Vectorize
chatbot.post('/admin/knowledge/sync-all', async (c) => {
  const user = await getAdminUser(c);
  const writeErr = requireWritePermission(user);
  if (writeErr) return writeErr;
  if (!user) return fail('Không có quyền quản trị', 401);

  const chunks = await c.env.DB.prepare(
    'SELECT id, document_id, chunk_index, content FROM chat_chunks ORDER BY document_id, chunk_index',
  ).all<KnowledgeChunk>();

  if (!chunks.results.length) {
    return c.json({ message: 'Không có chunk nào trong CSDL để đồng bộ', synced: 0 });
  }

  const texts = chunks.results.map((chunk) => chunk.content);
  const embeddings = await embed(c, texts);

  const vectorRecords = chunks.results.map((chunk, index) => ({
    id: chunk.id,
    values: embeddings[index],
  }));

  // Upsert theo lô 10 vector vào Vectorize
  const batchSize = 10;
  for (let i = 0; i < vectorRecords.length; i += batchSize) {
    const batch = vectorRecords.slice(i, i + batchSize);
    await c.env.VECTORIZE.upsert(batch);
  }

  return c.json({
    ok: true,
    message: 'Đồng bộ toàn bộ vectors vào Cloudflare Vectorize thành công',
    synced_chunks: vectorRecords.length,
  });
});

// 5. Route trạng thái module
chatbot.get('/chat/status', (c) => {
  return c.json({
    status: 'ready',
    service: 'one-store-chatbot-rag',
    step: 'optimized-3-pillars',
    features: ['hybrid-search-sql-filter', 'output-sanitizer-cot-suppression', 'multi-turn-history'],
    embedding_model: '@cf/baai/bge-m3',
    vector_dimensions: 1024,
    vector_index: 'ba-khi-knowledge',
    llm_model: '@cf/google/gemma-4-26b-a4b-it',
  });
});
