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
    query.match(/(?:họ\s*(?:và\s*)?tên\s*(?:người\s*nhận)?|tên\s*(?:người\s*nhận|khách)?|người\s*nhận)\s*[:=]?\s*([^\n,;•*|]+)/i) ||
    lastUserText.match(/(?:họ\s*(?:và\s*)?tên\s*(?:người\s*nhận)?|tên\s*(?:người\s*nhận|khách)?|người\s*nhận)\s*[:=]?\s*([^\n,;•*|]+)/i);

  if (nameLabelMatch) {
    let rawName = nameLabelMatch[1].trim().replace(/^[-*•\s]+/, '').replace(/[*_]/g, '');
    rawName = rawName.replace(/^(?:tôi\s+là|mình\s+là|em\s+là|là)\s+/i, '').trim();
    rawName = rawName.replace(/[,;.•*|]?\s*(?:sđt|số\s*điện\s*thoại|điện\s*thoại|địa\s*chỉ|size|màu|số\s*lượng)[\s\S]*$/i, '').trim();
    if (rawName.length >= 2 && rawName.length <= 40 && !isInvalidName(rawName)) {
      customerName = rawName;
    }
  }
  if (!customerName) {
    const selfNameMatch = query.match(/(?:mình\s*tên\s*là|tôi\s*tên\s*là|tên\s*mình\s*là|tên\s*tôi\s*là)\s+([A-ZÀ-Ỹa-zà-ỹ\s]{2,30})/i);
    if (selfNameMatch) {
      let rawName = selfNameMatch[1].trim();
      rawName = rawName.replace(/[,;.•*|]?\s*(?:sđt|số\s*điện\s*thoại|điện\s*thoại|địa\s*chỉ|size|màu|số\s*lượng)[\s\S]*$/i, '').trim();
      if (!isInvalidName(rawName)) customerName = rawName;
    }
  }

  // Trích xuất Địa chỉ
  let address: string | null = null;
  const addressLabelMatch =
    query.match(/(?:địa\s*chỉ\s*(?:nhận\s*hàng)?|giao\s*(?:đến|về|tận)|nhận\s*tại|ship\s*(?:đến|về)|đ\/c|dc)\s*[:=]?\s*([^\n;•*|]+)/i) ||
    lastUserText.match(/(?:địa\s*chỉ\s*(?:nhận\s*hàng)?|giao\s*(?:đến|về|tận)|nhận\s*tại|ship\s*(?:đến|về)|đ\/c|dc)\s*[:=]?\s*([^\n;•*|]+)/i);

  if (addressLabelMatch) {
    let rawAddr = addressLabelMatch[1].trim().replace(/^[-*•\s]+/, '').replace(/[*_]/g, '');
    rawAddr = rawAddr.replace(/[,;.•*|]?\s*(?:màu|size|cỡ|sz|sl|số\s*lượng|sđt|số\s*điện\s*thoại|điện\s*thoại|tên|họ\s*tên)[\s\S]*$/i, '').trim();
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

    // 3. Fallback an toàn: Nếu khách đang điền thông tin (có SĐT/tên/địa chỉ) mà chưa khớp được sản phẩm,
    // quét tin nhắn gần nhất của bot để khôi phục sản phẩm bot vừa gợi ý/đang tư vấn
    if (!matchedProduct && Array.isArray(history) && history.length > 0) {
      const reversedHistory = [...history].reverse();
      for (const turn of reversedHistory) {
        if (turn.role === 'assistant') {
          for (const p of allProducts) {
            if (turn.text.includes(p.name)) {
              matchedProduct = p;
              break;
            }
          }
        }
        if (matchedProduct) break;
      }
    }
  }

  // Trích xuất Size
  let size: string | null = null;
  const sizeMatch =
    query.match(/(?:size|cỡ|sz)\s*(?:giày)?\s*[:=]?\s*(\d{2}(?:\.5)?)/i) ||
    query.match(/\b(?:cỡ|size|sz)\s+(\d{2}(?:\.5)?)\b/i) ||
    lastUserText.match(/(?:size|cỡ|sz)\s*(?:giày)?\s*[:=]?\s*(\d{2}(?:\.5)?)/i);
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
    query.match(/(?:màu\s*(?:sắc)?|color)\s*[:=]?\s*([^\n,;•*|]+)/i) ||
    lastUserText.match(/(?:màu\s*(?:sắc)?|color)\s*[:=]?\s*([^\n,;•*|]+)/i);
  if (colorMatch) {
    let rawColor = colorMatch[1].trim().replace(/^[-*•\s]+/, '').replace(/[*_]/g, '');
    rawColor = rawColor.replace(/[,;.•*|]?\s*(?:số\s*lượng|sl|họ\s*tên|tên|sđt|số\s*điện\s*thoại|điện\s*thoại|địa\s*chỉ|size)[\s\S]*$/i, '').trim();
    if (rawColor) color = rawColor;
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

  const hasAccessorySock = /(?:thêm|lấy thêm|mua thêm|kèm|đôi)?\s*(?:vớ|tất)/i.test(queryLower);
  const hasAccessorySpray = /(?:thêm|lấy thêm|mua thêm|kèm|bình|chai)?\s*(?:bình xịt|chai xịt|xịt nano|vệ sinh)/i.test(queryLower);

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
    hasAccessorySock,
    hasAccessorySpray,
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

    // TH 4: Mức ngân sách đơn lẻ (ví dụ: "có 30 triệu", "tài chính 30 triệu", "ngân sách 30 triệu", "tầm 3 triệu", "khoảng 3 triệu", "30 triệu")
    const budget = str.match(
      /(?:có|ngân sách|tài chính|tầm|khoảng|mức giá)?\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr)\b/i,
    );
    if (budget) {
      const val = parseFloat(budget[1].replace(',', '.')) * 1000000;
      if (val > 6290000) {
        return {
          min: val,
          max: val,
        };
      } else {
        return {
          min: Math.max(1800000, val - 600000),
          max: val + 600000,
        };
      }
    }

    // TH 5: Mức ngân sách đơn lẻ có đơn vị nghìn/k (ví dụ: "với 10 nghìn", "10 nghìn", "10k", "60 nghìn", "60k", "500 nghìn", "500k")
    const thousandBudget = str.match(
      /(?:có|ngân sách|tài chính|tầm|khoảng|mức giá|với)?\s*(\d+(?:[.,]\d+)?)\s*(nghìn|k)\b/i,
    );
    if (thousandBudget) {
      const val = parseFloat(thousandBudget[1].replace(',', '.')) * 1000;
      return {
        min: null,
        max: val,
      };
    }

    // TH 6: Số nguyên đầy đủ 4-7 chữ số (ví dụ: "60000", "10000", "500000", "60.000", "10.000", "500.000")
    const fullNumberBudget = str.match(
      /(?:có|ngân sách|tài chính|tầm|khoảng|mức giá|với)?\s*(\d{1,3}(?:[.]\d{3})+|\d{4,7})\s*(?:đ|đồng|vnd)?\b/i,
    );
    if (fullNumberBudget) {
      const rawNum = fullNumberBudget[1].replace(/\./g, '');
      const val = parseFloat(rawNum);
      if (!isNaN(val) && val >= 1000) {
        return {
          min: null,
          max: val,
        };
      }
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

  // 4. Thương hiệu (Brand) với Unicode regex, Typo correction & Brand Switching
  let brand: string | null = null;
  const brandAliases: Array<{ pattern: RegExp; brand: string }> = [
    { pattern: /(?:adidat|adida|didas|das|adidas)/i, brand: 'Adidas' },
    { pattern: /(?:nai ki|naiki|nike)/i, brand: 'Nike' },
    { pattern: /(?:axic|asic|asics)/i, brand: 'Asics' },
    { pattern: /(?:mizuno)/i, brand: 'Mizuno' },
    { pattern: /(?:new balance|newbalance|nb)/i, brand: 'New Balance' },
    { pattern: /(?:salomon)/i, brand: 'Salomon' },
    { pattern: /(?:pupa|puma)/i, brand: 'Puma' },
    { pattern: /(?:jordan)/i, brand: 'Jordan' },
    { pattern: /(?:hoka)/i, brand: 'Hoka' },
    { pattern: /(?:on running|onrunning)/i, brand: 'On Running' },
    { pattern: /(?:onitsuka|onitsuka tiger)/i, brand: 'Onitsuka Tiger' },
    { pattern: /(?:li-ning|lining|li ning)/i, brand: 'Li-Ning' },
    { pattern: /(?:anta)/i, brand: 'Anta' },
  ];

  // A. Kiểm tra ý định chuyển đổi thương hiệu (ví dụ: "đổi gió sang adidat", "chuyển sang adidas", "muốn thử puma", "sang nike")
  const switchMatch = currentLower.match(/(?:đổi gió sang|chuyển sang|thử sang|mua|lấy|quan tâm|tìm|sang|qua)\s+([a-zA-Z\s-]+)/i);
  if (switchMatch) {
    const targetPhrase = switchMatch[1];
    for (const item of brandAliases) {
      if (item.pattern.test(targetPhrase)) {
        brand = item.brand;
        break;
      }
    }
  }

  // B. Nếu chưa có brand từ switchMatch, quét thông thường nhưng loại trừ brand nằm trong mệnh đề "đã có" / "bộ sưu tập"
  if (!brand) {
    for (const item of brandAliases) {
      if (item.pattern.test(currentLower)) {
        const negPattern = new RegExp(`(?:đã có|bộ sưu tập|đang đi|có\\s+\\d+\\s+(?:đôi|bộ))\\s+[^,.]*?${item.brand.toLowerCase()}`, 'i');
        if (!negPattern.test(currentLower)) {
          brand = item.brand;
          break;
        }
      }
    }
  }

  if (!brand && isFollowUp) {
    for (const item of brandAliases) {
      if (item.pattern.test(historyText)) {
        brand = item.brand;
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

  // 6. Kích cỡ (Size)
  let size: string | null = null;
  const sizeMatch = currentLower.match(/(?:size|cỡ|sz)\s*(\d{2}(?:\.5)?)/i);
  if (sizeMatch) {
    size = sizeMatch[1];
  }

  return { minPrice, maxPrice, category, color, brand, modelKeyword, size, isFollowUp };
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
    /\n+\s*\*(?:\s*\(?[^?\n]*\?\s*(?:Yes|No|Đúng|Sai|Có|Không)|Đúng vai|Đúng dữ liệu|Đúng quy tắc|Giải quyết được|Tự kiểm tra|Sửa lại thứ tự|Lưu ý về size|Kết luận|Tiến hành viết|Self-Correction|Short,\s*polite|Constraints?|Direct\s*answer|Evaluation|Checklist)[\s\S]*$/i,
    '',
  );
  cleaned = cleaned.replace(
    /\n+\s*\*(?:\s*\(?Tự kiểm tra|Sửa lại thứ tự|Lưu ý về size|Kết luận|Tiến hành viết)[\s\S]*$/i,
    '',
  );

  // 3.5. Loại bỏ các dòng suy nghĩ CoT Constraint / Step / Note tiếng Anh
  cleaned = cleaned.replace(/(?:^|\n+)\s*[-*•]?\s*Constraint\s*\d+:[^\n]*/gi, '');
  cleaned = cleaned.replace(/(?:^|\n+)\s*[-*•]?\s*Step\s*\d+:[^\n]*/gi, '');
  cleaned = cleaned.replace(/(?:^|\n+)\s*[-*•]?\s*Direct\s*answer\??[^\n]*/gi, '');
  cleaned = cleaned.replace(/\s*and suggest available ones\.[^\n]*/gi, '');

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
    | 'policy_how_to_order'
    | 'policy_authenticity'
    | 'math_calculation'
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
  if (/(thêm|mua thêm|lấy thêm)\s*(?:cho tôi\s*)?(?:\d+\s*(?:đôi|bình|chai)\s*)?(vớ|tất|bình xịt|xịt nano|xịt bọt)/i.test(q)) {
    return {
      type: 'accessory_add',
      accessoryName: /xịt/i.test(q) ? 'Bình xịt bọt nano vệ sinh giày (+89.000 VND)' : 'Vớ thể thao dệt kim One Athletic (+49.000 VND)',
    };
  }

  // 2.1. Nhận diện câu hỏi có bán phụ kiện hay không ("có bán tất không", "có bán vớ không", "có bán bình xịt không", "bên mình có bình xịt")
  const isAccessoryInquiry =
    /(có\s+bán|hỏi\s+mua|mua|bán|có|bên mình có)\s*(?:phụ kiện\s*)?(tất|vớ|bình xịt|chai xịt|nano|vệ sinh giày)(\s+không)?/i.test(q) ||
    /^(tất|vớ|bình xịt)[\s!.,?~]*$/i.test(q);

  if (isAccessoryInquiry) {
    return {
      type: 'smalltalk',
      answer: 'Dạ One - Store là đơn vị chuyên phân phối độc quyền giày thể thao & sneaker chính hãng Âu - Á. Tuy nhiên, để bạn có trải nghiệm trọn vẹn nhất khi xỏ giày mới, cửa hàng CÓ phân phối kèm 2 phụ kiện thể thao chính hãng ưu đãi khi bạn đặt mua cùng giày:\n\n- **Vớ thể thao dệt kim One Athletic:** Chỉ **+49.000 VND/đôi** (Giá gốc 90.000 VND), chất liệu cotton dệt kim co giãn kháng khuẩn, ôm gót chống trượt.\n- **Bình xịt bọt nano vệ sinh giày sneaker:** Chỉ **+89.000 VND** (Giá gốc 150.000 VND), tạo bọt làm sạch nhanh không cần giặt nước, bảo vệ chất liệu da và vải dệt.\n\n*(Khi chọn được mẫu giày ưng ý, bạn chỉ cần nhắn "Thêm vớ" hoặc "Thêm bình xịt", One sẽ gộp ngay vào đơn hàng và giao tận nơi cho bạn nhé!)*',
      chips: ['Xem 70 mẫu giày', 'Thêm vớ thể thao (+49k)', 'Thêm bình xịt (+89k)', 'Tư vấn chọn size'],
    };
  }

  // 2.5. Nhận diện phép tính toán học số học đơn giản (ví dụ: "30-6", "30-6 bằng bao nhiêu", "15 + 25")
  const mathMatch = raw.match(/^\s*(\d+(?:\.\d+)?)\s*([-+*/xX÷])\s*(\d+(?:\.\d+)?)\s*(?:bằng|là|\?|=|\s*$)/i);
  if (mathMatch) {
    const n1 = parseFloat(mathMatch[1]);
    const op = mathMatch[2];
    const n2 = parseFloat(mathMatch[3]);
    let resVal = 0;
    let opSymbol = op;
    if (op === '+') resVal = n1 + n2;
    else if (op === '-') resVal = n1 - n2;
    else if (op === '*' || op.toLowerCase() === 'x') { resVal = n1 * n2; opSymbol = 'x'; }
    else if (op === '/' || op === '÷') { resVal = n2 !== 0 ? Math.round((n1 / n2) * 100) / 100 : 0; opSymbol = ':'; }

    return {
      type: 'math_calculation',
      answer: `Dạ kết quả của phép tính **${n1} ${opSymbol} ${n2}** là **${resVal}** ạ!\n\nTuy nhiên, em là trợ lý Tư vấn One chuyên biệt về giày thể thao và sneaker chính hãng tại One - Store, em không hỗ trợ giải toán được nhiều. Bạn có cần One hỗ trợ chọn size giày chuẩn dáng chân hay tìm mẫu giày chạy bộ nào đang có sẵn không ạ?`,
      chips: ['Xem 70 mẫu sneaker', 'Tư vấn chọn size', 'Chính sách freeship'],
    };
  }

  // 3. TẦNG BẢO VỆ 1C: FAST OUT-OF-SCOPE GUARDRAIL (0 ms) — BÁM SÁT CHỦ ĐỀ
  const isOutOfScope =
    /(cà phê|coffee|trà sữa|trà đào|nước ngọt|bia|rượu|nấu ăn|món ăn|công thức món|quán ăn|nhà hàng|thực phẩm|đồ ăn|thời tiết|thời triết|thái nguyên|thái nuyên|nhiệt độ|dự báo thời tiết|giải toán|viết code|lập trình|python|javascript|java|c\+\+|html|css|sửa máy tính|laptop|iphone|samsung|quần áo|áo sơ mi|áo khoác|áo len|áo thun|áo phông|áo hoodie|áo polo|áo dài|áo croptop|áo chống nắng|áo ba lỗ|quần jean|quần short|quần đùi|quần bò|quần kaki|quần tây|quần dài|quần ống rộng|quần jogger|quần lót|váy|đầm|suit|vest|chân váy|nón|mũ|kính mát|kính râm|thắt lưng|dây nịt|túi xách|ví da|đồng hồ|mỹ phẩm|son môi|kem dưỡng|nước hoa|trang sức|xe máy|ô tô|xô tô|phim ảnh|diễn viên|ca sĩ|bài hát|chính trị|tin tức xã hội|bitcoin|crypto|tiền ảo|chứng khoán|cổ phiếu|giá vàng|bao nhiêu ngày|bao nhiêu tháng|bao nhiêu tuần|thủ đô|dân số|lịch sử|địa lý|ngày mấy|hôm nay thứ mấy|năm nay năm bao nhiêu|ai là người|tại sao lại có|con người|động vật|sinh học|hóa học|vật lý|tổng thống|chủ tịch|nguyên thủ|người yêu|bạn gái|bạn trai|tán gái|lấy vợ|lấy chồng)/i.test(q) &&
    !/(giày|sneaker|chạy bộ|marathon|bóng rổ|dã ngoại|asics|nike|adidas|mizuno|puma|new balance|salomon|hoka|li-ning|anta|jordan|số điện thoại|sđt|địa chỉ|người nhận|đặt hàng|lên đơn|0\d{8,9})/i.test(q);

  if (isOutOfScope) {
    let specificMsg = 'Dạ câu hỏi này nằm ngoài phạm vi hoạt động của One - Store. Em là trợ lý chuyên biệt chỉ hỗ trợ tư vấn giày thể thao, sneaker chính hãng Âu - Á và các chính sách dịch vụ tại One - Store thôi ạ!';
    if (/(cà phê|coffee|trà sữa|nấu ăn|món ăn|đồ ăn|quán ăn)/i.test(q)) {
      specificMsg = 'Dạ câu hỏi này nằm ngoài phạm vi hoạt động của One - Store do cửa hàng chuyên phân phối độc quyền giày thể thao & sneaker chính hãng Âu - Á, không có thông tin về đồ uống và ẩm thực ạ! Bạn có cần One tư vấn mẫu giày thể thao nào đang có sẵn không ạ?';
    } else if (/(quần áo|áo sơ mi|áo khoác|áo thun|quần jean|quần tây|váy|đầm|suit|vest)/i.test(q)) {
      specificMsg = 'Dạ One - Store là đơn vị chuyên phân phối độc quyền các dòng giày thể thao và sneaker chính hãng Âu - Á, cửa hàng hiện không kinh doanh các mặt hàng quần áo thời trang khác ạ. Bạn có muốn One hỗ trợ tìm kiếm mẫu giày thể thao nào đang có sẵn không ạ?';
    } else if (/(viết code|lập trình|python|javascript|giải toán|sửa máy tính)/i.test(q)) {
      specificMsg = 'Dạ em là trợ lý bán hàng thời trang thể thao nên không hỗ trợ viết code hoặc giải bài toán kỹ thuật được ạ. Bạn có cần One hỗ trợ chọn cỡ giày chuẩn theo dáng chân mình không ạ?';
    } else if (/(thời tiết|thời triết|thái nguyên|thái nuyên|nhiệt độ|dự báo thời tiết)/i.test(q)) {
      specificMsg = 'Dạ em không có dữ liệu dự báo thời tiết trực tuyến ạ. Em là trợ lý chuyên biệt về 70 mẫu sneaker chính hãng Âu - Á tại One - Store. Bạn có cần One tư vấn mẫu giày nào phù hợp đi mưa hay dã ngoại không ạ?';
    } else if (/(ô tô|xô tô|xe máy)/i.test(q)) {
      specificMsg = 'Dạ One - Store chỉ phân phối giày thể thao & sneaker chính hãng Âu - Á, không kinh doanh phương tiện giao thông ô tô hay xe máy ạ! Bạn có muốn One gợi ý mẫu giày thể thao nào đang có sẵn không ạ?';
    } else if (/(người yêu|bạn gái|bạn trai|tán gái|lấy vợ|lấy chồng)/i.test(q)) {
      specificMsg = 'Dạ chuyện tình cảm thì em không có cẩm nang tư vấn rồi ạ! Nhưng người ta thường bảo một đôi sneaker chính hãng sạch sẽ, phong cách như Adidas Samba hay Nike Dunk Low Panda sẽ giúp bạn tự tin ghi điểm tuyệt đối trong mắt đối phương đấy ạ. Bạn có muốn One gợi ý một đôi giày dạo phố cực đẹp để đi hẹn hò không ạ?';
    } else if (/(giá vàng|chứng khoán|cổ phiếu|bitcoin|crypto)/i.test(q)) {
      specificMsg = 'Dạ em là trợ lý chuyên biệt về giày thể thao và sneaker chính hãng tại One - Store, em không có dữ liệu về thị trường tài chính, giá vàng hay chứng khoán ạ! Bạn có muốn em hỗ trợ tìm kiếm mẫu giày thể thao nào đang có sẵn tại cửa hàng không ạ?';
    } else if (/thủ đô.*pháp/i.test(q)) {
      specificMsg = 'Dạ câu hỏi này nằm ngoài cơ sở dữ liệu chuyên môn của em rồi ạ. Em chỉ hỗ trợ tư vấn giày thể thao và sneaker chính hãng Âu - Á thôi ạ! Nhắc tới nước Pháp thì One - Store đang phân phối độc quyền dòng giày Salomon danh tiếng của Pháp, bạn có muốn One giới thiệu mẫu giày này không ạ?';
    } else if (/(bao nhiêu ngày|bao nhiêu tháng|thủ đô|dân số|lịch sử|địa lý|hôm nay thứ mấy|năm nay năm bao nhiêu|động vật|sinh học|vật lý)/i.test(q)) {
      specificMsg = 'Dạ em là trợ lý AI chuyên biệt về giày thể thao và các chính sách bán hàng của One - Store, em không có cơ sở dữ liệu về kiến thức bách khoa tổng quát hay địa lý - xã hội ạ! Bạn có cần One tư vấn mẫu giày chạy bộ hay sneaker thời trang nào đang có sẵn không ạ?';
    }

    return {
      type: 'out_of_scope',
      answer: specificMsg,
      chips: ['Xem 70 mẫu sneaker', 'Tư vấn chọn size', 'Chính sách freeship', 'Chính sách đổi trả'],
    };
  }

  // 3.5. CHÍNH SÁCH CAM KẾT CHÍNH HÃNG 100% (0 ms)
  const isAuthenticity =
    /(chính hãng không|hàng auth không|hàng real không|hàng thật không|có phải chính hãng|hàng fake|hàng nhái|hàng giả|phát hiện.*giả|phát hiện.*fake|cam kết chính hãng|nguồn gốc giày|auth hay fake|real hay fake)/i.test(q) &&
    !/(đặt|chốt|tôi lấy đôi|sđt|địa chỉ)/i.test(q);

  if (isAuthenticity) {
    return {
      type: 'policy_authenticity',
      answer: 'Dạ bạn hoàn toàn yên tâm 100% ạ! Toàn bộ 70 mẫu sneaker tại One - Store đều là hàng phân phối chính hãng nhập khẩu trực tiếp từ các thương hiệu hàng đầu thế giới (Nike, Adidas, Jordan, Asics, Mizuno, New Balance, Salomon, Puma, Hoka, Li-Ning, Anta):\n\n- **Cam kết vàng:** Đền bù gấp **10 lần giá trị đơn hàng** nếu phát hiện hàng giả, hàng nhái.\n- **Chứng từ & Đóng gói:** Nguyên hộp chính hãng (Fullbox), đầy đủ tem mác phụ kiện từ nhà sản xuất.\n- **Đặc quyền khách hàng:** 100% đơn hàng được **mở hộp kiểm tra và xỏ thử giày trực tiếp tại chỗ** trước khi thanh toán COD ạ!',
      chips: ['Xem 70 mẫu sneaker', 'Chính sách bảo hành', 'Chính sách đổi size', 'Mã giảm giá ONE10'],
    };
  }

  // 3.6. CHÍNH SÁCH HƯỚNG DẪN ĐẶT HÀNG (0 ms)
  const isHowToOrder =
    /^(đặt hàng|dat hang|đặt mua|lên đơn|cách đặt|hướng dẫn đặt|hướng dẫn mua|cách mua)[\s!.,?~]*$/i.test(q) ||
    (/(làm thế nào để (đặt|mua) hàng|hướng dẫn (đặt|mua) hàng|cách (đặt|mua) hàng|mua hàng (như thế nào|thế nào|ra sao)|đặt hàng (như thế nào|thế nào|ra sao)|quy trình (đặt|mua) hàng|làm sao để mua|làm sao để đặt)/i.test(q) &&
    !/(sđt|địa chỉ|0\d{9})/i.test(q));

  if (isHowToOrder) {
    return {
      type: 'policy_how_to_order',
      answer: 'Dạ để đặt hàng tại One - Store, bạn có thể thực hiện cực kỳ đơn giản qua 3 bước sau:\n\n1. **Bước 1: Chọn mẫu giày & cỡ giày:** Bạn duyệt mẫu giày ưng ý trên website hoặc nhắn trực tiếp tên mẫu giày tại đây cho One để được tư vấn size chuẩn dáng chân.\n2. **Bước 2: Cung cấp thông tin nhận hàng:** Bạn chỉ cần gửi thông tin gồm: Họ tên, Số điện thoại và Địa chỉ nhận hàng tại khung chat này.\n3. **Bước 3: Nhận hàng và xỏ thử COD tận nơi:** Shipper giao tới tận nhà, bạn được quyền **mở hộp đồng kiểm và xỏ thử trực tiếp vào chân** trước khi thanh toán tiền mặt. Miễn phí đổi cỡ giày trong 7 ngày nếu không vừa chân ạ!',
      chips: ['Xem 70 mẫu sneaker', 'Tư vấn chọn size', 'Chính sách freeship', 'Chính sách đổi trả'],
    };
  }

  // 4. Nhận diện các câu chào hỏi xã giao, cảm ơn (Smalltalk)
  const isSmalltalk =
    /^(chào|xin chào|chào shop|chào bạn|chào em|chào ad|chào bot|hello|hi|hey|alo|shop ơi|bot ơi|ad ơi|em ơi|shop|ad)(\s+(shop|ad|em|bot|bạn|nha|nhé|ơi))*[\s!.,?~]*$/i.test(q) ||
    /^(cảm ơn|cám ơn|thank you|thanks|tạm biệt|bye)(\s+(shop|ad|em|bot|bạn|nhiều|nha|nhé))*[\s!.,?~]*$/i.test(q);

  if (isSmalltalk) {
    const greetingsList = [
      'Dạ chào bạn! Tư vấn One rất hân hạnh được đồng hành cùng bạn tại One - Store. Bạn đang quan tâm đến mẫu giày chạy bộ, sneaker thời trang nào hay cần One hỗ trợ tư vấn chọn cỡ giày chuẩn dáng chân mình ạ?',
      'Dạ One xin chào bạn! Rất vui được hỗ trợ bạn hôm nay. Bạn đang tìm mẫu giày cho mục đích chạy bộ marathon, tập gym hay dạo phố thời trang để One tư vấn nhé!',
      'Dạ chào bạn! Em là trợ lý Tư vấn One. Bạn cần One hỗ trợ kiểm tra size giày theo dáng chân, xem các mẫu sneaker mới nhất hay giải đáp chính sách freeship, đổi size ạ?',
    ];
    const greeting = greetingsList[Math.floor(Math.random() * greetingsList.length)];
    return {
      type: 'smalltalk',
      answer: greeting,
      chips: ['Tìm giày chạy bộ', 'Chân bè chọn size nào', 'Chính sách đổi trả', 'Phí vận chuyển COD'],
    };
  }

  // 4.3. NHẬN DIỆN HỎI SHOP CÓ BÁN GIÀY KHÔNG ("có bán giày không", "shop bán gì", "shop bán gì vậy")
  const isStoreProductScope =
    /^(shop\s+)?(có\s+)?bán\s+(giày|sneaker)(\s+không)?[\s!.,?~]*$/i.test(q) ||
    /(?:shop|ở đây|cửa hàng)\s*(?:bán gì|kinh doanh gì|có gì|bán những gì)(?:\s+vậy|\s+thế|\s+ạ)*[\s!.,?~]*$/i.test(q);

  if (isStoreProductScope) {
    return {
      type: 'smalltalk',
      answer: 'Dạ có chứ ạ! One - Store là hệ sinh thái chuyên phân phối độc quyền 70 mẫu giày thể thao & sneaker chính hãng từ 10 thương hiệu hàng đầu thế giới (Nike, Adidas, Jordan, Asics, Mizuno, New Balance, Salomon, Puma, Li-Ning, Anta).\n\n- **Cam kết vàng:** 100% hàng chính hãng nhập khẩu nguyên hộp (Fullbox).\n- **Đặc quyền COD:** Đồng kiểm và xỏ thử trực tiếp tại chỗ trước khi thanh toán.\n- **Chính sách đổi trả:** Miễn phí đổi size trong 7 ngày nếu không vừa chân.\n\nBạn đang quan tâm đến giày chạy bộ marathon, tập gym hay sneaker dạo phố thời trang để One tư vấn nhé!',
      chips: ['Xem 70 mẫu sneaker', 'Giày chạy bộ bán chạy', 'Sneaker thời trang', 'Tư vấn chọn size'],
    };
  }

  // 4.5. NHẬN DIỆN Ý ĐỊNH MUA HÀNG CHUNG CHUNG ("tôi muốn mua giày", "mua giày", "cần mua giày")
  const isGeneralBuy =
    /^(tôi\s+)?(muốn|cần|tìm|hỏi)?\s*(mua|order|tìm|tư vấn|chọn)\s*(giày|sneaker|đôi giày|đôi sneaker|hàng)?[\s!.,?~]*$/i.test(q) ||
    /^(tư vấn|giới thiệu)\s+(giày|sneaker|giúp tôi|cho tôi)/i.test(q);

  if (isGeneralBuy) {
    return {
      type: 'smalltalk',
      answer: 'Dạ chào bạn! One - Store rất hân hạnh được đồng hành và tư vấn cho bạn. Cửa hàng hiện phân phối độc quyền 70 mẫu giày thể thao & sneaker chính hãng từ 10 thương hiệu hàng đầu thế giới (Nike, Adidas, Asics, Mizuno, New Balance, Salomon, Puma, Hoka, Li-Ning, Anta).\n\nĐể One gợi ý mẫu giày chuẩn xác và ưng ý nhất, bạn có thể chia sẻ thêm cho One:\n- **Mục đích sử dụng chính:** Chạy bộ marathon, tập gym, đi chơi/đi làm thời trang, hay đi dã ngoại leo núi?\n- **Khoảng giá hoặc thương hiệu bạn đang quan tâm?**\n\nNgoài ra, bạn cũng có thể bấm chọn nhanh các gợi ý bên dưới để khám phá ngay nhé!',
      chips: ['Giày chạy bộ bán chạy', 'Sneaker thời trang hot', 'Giày dã ngoại đi mưa', 'Mã giảm giá ONE10'],
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

  // 6. CHÍNH SÁCH FREESHIP, PHÍ VẬN CHUYỂN & THỜI GIAN GIAO HÀNG (0 ms)
  const isFreeship =
    /(freeship|miễn phí ship|miễn phí vận chuyển|phí ship|phí vận chuyển|tiền ship|cước vận chuyển|cước ship|cước giao|bao giờ giao|khi nào nhận|mấy ngày.*(có|giao|nhận|tới)|thời gian giao|giao trong bao lâu|bao lâu.*(có|nhận|tới))/i.test(q) &&
    !/(đặt|mua|chốt|hủy|tôi lấy đôi)/i.test(q);

  if (isFreeship) {
    return {
      type: 'policy_freeship',
      answer: 'Dạ chính sách vận chuyển và thời gian giao hàng tại One - Store được áp dụng minh bạch như sau:\n\n- **Miễn phí vận chuyển toàn quốc (Freeship):** Áp dụng cho đơn hàng đặt từ **3 đôi giày** trở lên HOẶC hóa đơn từ **5.000.000 VND**.\n- **Đơn hàng tiêu chuẩn dưới 3 đôi:** Cước vận chuyển đồng giá ưu đãi **30.000 VND** trên toàn quốc.\n- **Thời gian giao hàng dự kiến:**\n  + Khu vực nội thành Hà Nội & TP.HCM: Nhận hàng từ **1 đến 2 ngày** làm việc (hỗ trợ hỏa tốc 2 - 4 giờ).\n  + Các tỉnh thành khác trên toàn quốc: Nhận hàng từ **2 đến 4 ngày** làm việc.\n- **Đặc quyền COD:** 100% đơn hàng được **mở hộp đồng kiểm và xỏ thử tại chỗ** trước khi thanh toán tiền mặt cho shipper ạ!',
      chips: ['Xem 70 mẫu giày', 'Chính sách đổi size', 'Mã giảm giá ONE10'],
    };
  }

  // 7. CHÍNH SÁCH ĐỔI SIZE & ĐỔI TRẢ 7 NGÀY (0 ms)
  const isReturn =
    !/(bảng quy đổi|quy đổi)/i.test(q) &&
    !/(rách|bung keo|đứt chỉ|lỗi keo|lỗi may|bảo hành)/i.test(q) &&
    (/(đổi size|đổi cỡ|đổi trả|đổi hàng|đổi mẫu|đổi sang size|muốn đổi|được đổi không|có được đổi|7 ngày|chật quá|rộng quá|không vừa chân|không vừa size|không vừa cỡ)/i.test(q) ||
      (/(?:muốn|cho)\s+đổi\s+giày/i.test(q) && !/(?:nên\s+)?(?:đi|chọn|mua|mang)\s+đổi\s+giày|mùa đông/i.test(q))) &&
    !/(đặt|chốt|tôi lấy đôi|mua luôn)/i.test(q);

  if (isReturn) {
    return {
      type: 'policy_return',
      answer: 'Dạ One - Store áp dụng chính sách đổi cỡ giày và đổi trả linh hoạt trong vòng **7 ngày** kể từ ngày nhận hàng:\n\n- **Miễn phí 100% cước 2 chiều:** Áp dụng cho lần đổi cỡ giày đầu tiên nếu bạn đi không vừa chân.\n- **Đổi sang mẫu khác:** Bạn hoàn toàn được đổi sang mẫu giày khác linh hoạt (bù trừ chênh lệch giá nếu có).\n- **Điều kiện hợp lệ:** Giày còn nguyên hộp chính hãng, đầy đủ tem mác phụ kiện và chưa qua sử dụng ngoài trời.\n\n*(Nếu cần đổi size, bạn chỉ cần nhắn mã đơn hàng tại đây hoặc gọi hotline 1900 8888 để được hỗ trợ gửi đôi mới tận nhà nhé!)*',
      chips: ['Bảng quy đổi size', 'Cách đo bàn chân', 'Hotline 1900 8888'],
    };
  }

  // 8. CHÍNH SÁCH BẢO HÀNH CHẤT LƯỢNG & LỖI HƯ HỎNG (0 ms)
  const isWarranty =
    /(bảo hành|dán keo|bảo trì|hỏng giày|bung keo|rách|rách giày|đứt chỉ|bảo hành bao lâu|chế độ bảo hành)/i.test(q) &&
    !/(đặt|chốt|tôi lấy đôi)/i.test(q);

  if (isWarranty) {
    return {
      type: 'policy_warranty',
      answer: 'Dạ chính sách bảo hành chất lượng chính hãng và hỗ trợ lỗi giày tại One - Store gồm các quyền lợi sau:\n\n- **Bảo hành 6 tháng:** Áp dụng cho các dòng giày chạy bộ marathon đĩa Carbon hiệu năng cao (Nike Vaporfly, Alphafly, Adidas Adios Pro, Asics Metaspeed, Li-Ning Feidian...).\n- **Bảo hành 12 tháng:** Áp dụng cho toàn bộ các dòng giày Lifestyle thời trang và Outdoor dã ngoại (Adidas Samba, Nike Air Force 1, New Balance 550, Salomon XT-6...).\n- **Bảo dưỡng trọn đời:** Hỗ trợ dán keo ép nhiệt, khâu chỉ phục hồi và vệ sinh cơ bản miễn phí trọn đời sản phẩm tại showroom.\n- **Quy định đổi mới khi rách/hỏng:** Đổi mới 100% trong vòng 7 ngày nếu sản phẩm phát sinh lỗi kỹ thuật từ nhà sản xuất (bung keo viền, đứt chỉ, xẹp đệm khí) trước khi sử dụng ngoài trời ạ!',
      chips: ['Xem giày chạy bộ', 'Xem sneaker thời trang', 'Địa chỉ showroom'],
    };
  }

  // 8.5. CHÍNH SÁCH KHỬ MÙI & THOÁNG KHÍ CHỐNG HÔI CHÂN (0 ms)
  const isSmellPolicy =
    /(hôi chân|có hôi không|mùi hôi|khử mùi|thoáng khí|bí chân|mồ hôi chân)/i.test(q) &&
    !/(đặt|chốt|tôi lấy đôi)/i.test(q);

  if (isSmellPolicy) {
    return {
      type: 'policy_sizeguide',
      answer: 'Dạ toàn bộ 70 mẫu giày tại One - Store đều sử dụng lót đệm kháng khuẩn cao cấp (như OrthoLite) và thân giày vải dệt thông khí tản nhiệt liên tục, hạn chế tối đa mùi hôi chân khi mang cả ngày.\n\nNgoài ra, để bạn có trải nghiệm xỏ giày trọn vẹn và thơm tho nhất, One có phân phối kèm:\n- **Vớ thể thao dệt kim kháng khuẩn One Athletic:** Chỉ **+49.000 VND/đôi** (cotton dệt kim co giãn kháng khuẩn, ôm gót chống trượt).\n- **Bình xịt bọt nano diệt khuẩn khử mùi:** Chỉ **+89.000 VND/bình** (làm sạch nhanh không cần giặt nước, bảo vệ chất liệu da và vải dệt) ạ!',
      chips: ['Thêm vớ thể thao (+49k)', 'Thêm bình xịt (+89k)', 'Xem giày thoáng khí'],
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

  // 11. CẨM NANG ĐO KÍCH THƯỚC BÀN CHÂN & TƯ VẤN CHÂN BÈ / CHÂN TO (0 ms)
  const isSizeGuide =
    /(cách đo.*chân|hướng dẫn đo.*chân|đo.*bàn chân|đo.*chân|bảng quy đổi size|quy đổi size|chân.*bè|chân.*to|chân.*dày|chân.*dài|chân tôi|chân em|bảng size|chọn size|tăng size|chọn đúng size|cỡ nào|size nào|đeo cỡ nào|đi cỡ nào|mang cỡ nào|chân to|chân bè)/i.test(q) &&
    !/(đặt|chốt|tôi lấy đôi)/i.test(q);

  if (isSizeGuide) {
    return {
      type: 'policy_sizeguide',
      answer: 'Dạ để chọn được cỡ giày vừa vặn và thoải mái nhất cho dáng chân của mình, One - Store xin chia sẻ cẩm nang 3 bước chuẩn xác sau:\n\n1. **Cách đo kích thước bàn chân:** Đặt bàn chân lên tờ giấy sát mép tường, đánh dấu điểm dài nhất của ngón chân rồi đo khoảng cách từ tường đến điểm đánh dấu (tính bằng cm) để tra bảng size chuẩn EUR.\n2. **Tư vấn cho người có bàn chân to / bè ngang / mu bàn chân dày (đặc trưng dáng chân Á Đông):** Bạn nên **tăng từ 0.5 đến 1 size** so với cỡ giày thông thường để ngón chân không bị ép chặt. Đặc biệt, bạn nên ưu tiên các dòng giày phom rộng (Wide / 2E / 4E) của **Asics** (dòng Novablast, Nimbus), **Mizuno** hoặc **New Balance** để các ngón chân cử động thoải mái nhất.\n3. **Đặc quyền tại One:** 100% đơn hàng được **mở hộp xỏ thử trực tiếp tại chỗ trước khi thanh toán COD**, và hỗ trợ **đổi cỡ giày miễn phí 7 ngày** nếu bạn mang không vừa chân ạ!',
      chips: ['Xem giày Asics cho chân bè', 'Xem giày New Balance', 'Bảng quy đổi size', 'Hotline 1900 8888'],
    };
  }

  // 11.5. TƯ VẤN THỂ HÌNH CAO LỚN ("tôi cao m98 thì mua đôi nào", "cao 1m90")
  const isTallHeight =
    /(cao\s*1?m[89]\d|cao\s*m98|cao\s*1m98|m98|chiều cao)/i.test(q) &&
    !/(đặt|chốt|tôi lấy đôi)/i.test(q);

  if (isTallHeight) {
    return {
      type: 'policy_sizeguide',
      answer: 'Dạ với chiều cao lý tưởng và vóc dáng cao lớn, bạn thường sẽ có kích thước bàn chân dài (khoảng size 43, 44, 45) cùng trọng lượng cơ thể tương ứng khi tiếp đất. One - Store xin tư vấn kinh nghiệm chọn giày tối ưu cho bạn:\n\n1. **Chọn đệm giày dày và đàn hồi cao:** Nên ưu tiên các dòng giày có bộ đệm dày dặn, hỗ trợ hấp thụ chấn động và bảo vệ khớp gối tối đa như **Nike Invincible 3** (đệm ZoomX dày), **Adidas Ultraboost Light**, hoặc **Asics Novablast 4 Trampoline**.\n2. **Chọn cỡ giày:** Khi mua giày chạy bộ hoặc sneaker hàng ngày, bạn nên chọn dư mũi từ **1 đến 1.5 cm** để ngón chân cử động thoải mái nhất.\n3. **Đặc quyền tại One:** Bạn hoàn toàn được **xỏ thử giày trực tiếp vào chân tại nhà trước khi thanh toán COD**, nếu đi chật hoặc rộng sẽ được đổi size miễn phí 7 ngày ạ!',
      chips: ['Xem Nike Invincible 3', 'Xem Asics Novablast 4', 'Bảng quy đổi size', 'Tư vấn chọn size'],
    };
  }

  // 11.6. TƯ VẤN CHỌN SIZE THEO CÂN NẶNG / "cỡ 38 là bao nhiêu cân"
  const isSizeByWeight =
    /(?:cỡ|size)\s*(\d{2}(?:\.5)?)\s*(?:là|thì)?\s*bao nhiêu\s*(?:cân|kg|kí)/i.test(q) ||
    /(?:nặng|cân nặng)?\s*(\d{2,3})\s*(?:cân|kg|kí)\s*(?:thì)?\s*(?:đi|đeo|mang|chọn)\s*(?:giày\s*)?(?:size|cỡ)/i.test(q) ||
    /(?:size|cỡ)\s*(?:giày)?\s*(?:theo|tính theo)\s*(?:cân nặng|cân|kg)/i.test(q);

  if (isSizeByWeight) {
    const sizeNumMatch = q.match(/(?:cỡ|size)\s*(\d{2}(?:\.5)?)/i);
    const sizeNum = sizeNumMatch ? sizeNumMatch[1] : '38';
    return {
      type: 'policy_sizeguide',
      answer: `Dạ trong tiêu chuẩn giày thể thao quốc tế (EUR, US, UK), **kích cỡ giày (size giày) được tính hoàn toàn dựa trên chiều dài và bề rộng của bàn chân (cm)**, chứ **không tính theo cân nặng** của cơ thể ạ!\n\nLý do vì hai người có cùng cân nặng (ví dụ cùng 60kg) vẫn có thể có chiều dài bàn chân rất khác nhau (người mang size 38, người mang size 40 hoặc 41 tùy theo khung xương và chiều cao).\n\nOne - Store xin hướng dẫn cách chọn size chuẩn xác nhất:\n1. **Đo chiều dài bàn chân:** Đặt bàn chân lên tờ giấy sát mép tường, đánh dấu điểm dài nhất của ngón chân rồi đo khoảng cách từ tường đến điểm đánh dấu (tính bằng cm).\n2. **Quy đổi size chuẩn:** Ví dụ bàn chân dài khoảng **24 cm** sẽ đi vừa chuẩn **size ${sizeNum}** (EUR).\n3. **Đặc quyền tại One:** 100% đơn hàng tại One đều được **mở hộp xỏ thử trực tiếp vào chân tại nhà trước khi thanh toán COD**, nếu đi chật hoặc rộng sẽ được đổi cỡ giày miễn phí 7 ngày ạ!`,
      chips: ['Bảng quy đổi size', 'Cách đo bàn chân', 'Xem 70 mẫu giày', 'Hotline 1900 8888'],
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

export function mapToProductCard(p: ProductRecord) {
  let sizesArr: string[] = [];
  let colorsArr: string[] = [];
  try { sizesArr = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : (p.sizes as any) || []; } catch { sizesArr = []; }
  try { colorsArr = typeof p.colors === 'string' ? JSON.parse(p.colors) : (p.colors as any) || []; } catch { colorsArr = []; }
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
  const cacheKey = `chat_cache_v7:${qHash}`;
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

  const questionLower = question.toLowerCase();

  // === ĐIỀU HƯỚNG ĐẶC BIỆT 1: GIÀY ĐẮT NHẤT / GIÁ CAO NHẤT / VIP NHẤT (< 80ms) ===
  const isHighestPrice =
    /(?:đôi|giày|mẫu)?\s*(?:nào\s+)?(?:đắt nhất|mắc nhất|cao cấp nhất|giá cao nhất|vip nhất)/i.test(questionLower) ||
    /(?:tìm|xem|cho tôi|gợi ý)?\s*(?:đôi|giày|mẫu)\s*(?:đắt nhất|mắc nhất|cao cấp nhất|giá cao nhất|vip nhất)/i.test(questionLower);

  if (isHighestPrice) {
    const highestRes = await c.env.DB.prepare(
      'SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 ORDER BY price DESC LIMIT 3',
    ).all();
    const highestProducts = (highestRes.results || []) as ProductRecord[];
    const topNames = highestProducts.map((p) => `**${p.name}** (${p.price.toLocaleString('vi-VN')} VND)`).join(', ');

    const highAnswer = `Dạ tại One - Store, các mẫu giày chạy bộ cao cấp và đắt giá nhất hiện có trong kho là: ${topNames}.\n\nĐây là các siêu phẩm giày thi đấu marathon đỉnh cao thế giới với công nghệ đĩa đệm Carbon trợ lực bứt tốc tối đa. Toàn bộ sản phẩm đều là hàng phân phối chính hãng 100%, bảo hành 6 tháng chính hãng, miễn phí vận chuyển toàn quốc và được quyền **đồng kiểm, xỏ thử tại chỗ 100%** trước khi thanh toán COD ạ!`;

    const suggested = highestProducts.map(mapToProductCard);
    await emitter.delta(highAnswer);
    await emitter.products(suggested);
    await emitter.chips?.(['Xem 70 mẫu sneaker', 'Chính sách bảo hành', 'Chính sách freeship', 'Tư vấn chọn size']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: highAnswer,
          products: suggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem 70 mẫu sneaker', 'Chính sách bảo hành', 'Chính sách freeship', 'Tư vấn chọn size'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  // === ĐIỀU HƯỚNG ĐẶC BIỆT 2: GIÀY RẺ NHẤT / GIÁ THẤP NHẤT / TIẾT KIỆM NHẤT (< 80ms) ===
  const isLowestPrice =
    /(?:đôi|giày|mẫu)?\s*(?:nào\s+)?(?:rẻ nhất|giá thấp nhất|giá rẻ nhất|bình dân nhất|tiết kiệm nhất)/i.test(questionLower) ||
    /(?:tìm|xem|cho tôi|gợi ý)?\s*(?:đôi|giày|mẫu)\s*(?:rẻ nhất|giá thấp nhất|giá rẻ nhất|bình dân nhất|tiết kiệm nhất)/i.test(questionLower);

  if (isLowestPrice) {
    const lowestRes = await c.env.DB.prepare(
      'SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 ORDER BY price ASC LIMIT 2',
    ).all();
    const lowestProducts = (lowestRes.results || []) as ProductRecord[];
    const lowNames = lowestProducts.map((p) => `**${p.name}** (${p.price.toLocaleString('vi-VN')} VND)`).join(' và ');

    const lowAnswer = `Dạ tại One - Store, 2 mẫu sneaker chính hãng có mức giá ưu đãi và tiết kiệm nhất trong kho hiện tại là ${lowNames}.\n\nCả hai đều là dòng sneaker thời trang trẻ trung, phom dáng êm ái, bảo hành chính hãng 12 tháng, áp dụng mã ưu đãi **ONE10** giảm ngay 10% và chính sách **đồng kiểm, xỏ thử tại chỗ 100%** trước khi thanh toán COD ạ!`;

    const suggested = lowestProducts.map(mapToProductCard);
    await emitter.delta(lowAnswer);
    await emitter.products(suggested);
    await emitter.chips?.(['Xem 70 mẫu sneaker', 'Mã giảm giá ONE10', 'Tư vấn chọn size', 'Chính sách freeship']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: lowAnswer,
          products: suggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem 70 mẫu sneaker', 'Mã giảm giá ONE10', 'Tư vấn chọn size', 'Chính sách freeship'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  // === ĐIỀU HƯỚNG ĐẶC BIỆT 3: GIÀY ĐI MƯA / CHỐNG NƯỚC GORE-TEX / ĐỊA HÌNH TRAIL (< 80ms) ===
  const isRainShoe = /(trời mưa|đi mưa|chạy trời mưa|mưa gió|chống nước|chống trơn|đường ướt|gore-tex|trơn trượt)/i.test(questionLower);

  if (isRainShoe) {
    const rainRes = await c.env.DB.prepare(
      "SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 AND (name LIKE '%GORE-TEX%' OR name LIKE '%Trail%' OR name LIKE '%Speedcross%' OR category = 'Outdoor') ORDER BY price DESC LIMIT 3",
    ).all();
    const rainProducts = (rainRes.results || []) as ProductRecord[];
    const rainNames = rainProducts.map((p) => `- **${p.name}**: **${p.price.toLocaleString('vi-VN')} VND** (${p.category})`).join('\n');

    const rainAnswer = `Dạ chào bạn! Để đi hoặc chạy bộ trong điều kiện trời mưa, đường ướt trơn trượt, One - Store khuyên bạn nên chọn các dòng giày trang bị màng chống thấm nước **GORE-TEX** hoặc dòng giày địa hình **Trail** có đế gai chống trơn trượt cực tốt.\n\nDưới đây là các mẫu giày đi mưa chuyên dụng chính hãng đang có sẵn tại One:\n\n${rainNames}\n\nToàn bộ các mẫu trên đều có khả năng kháng nước và chống trượt vượt trội, bảo hành chính hãng 12 tháng và được **xỏ thử trực tiếp tại nhà** trước khi thanh toán COD ạ!`;

    const suggested = rainProducts.map(mapToProductCard);
    await emitter.delta(rainAnswer);
    await emitter.products(suggested);
    await emitter.chips?.(['Xem giày GORE-TEX', 'Tư vấn chọn size', 'Chính sách freeship', 'Chính sách đổi size']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: rainAnswer,
          products: suggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem giày GORE-TEX', 'Tư vấn chọn size', 'Chính sách freeship', 'Chính sách đổi size'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  // === ĐIỀU HƯỚNG ĐẶC BIỆT 3.1: GIÀY CHẠY TRỜI NẮNG / MÙA HÈ / THOÁNG KHÍ (< 80ms) ===
  const isSunnyShoe = /(trời nắng|mùa hè|nắng nóng|nóng bức|thoáng khí|mát mẻ|thoát mồ hôi)/i.test(questionLower);

  if (isSunnyShoe) {
    const sunnyRes = await c.env.DB.prepare(
      "SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 AND category = 'Running' AND (name LIKE '%Pegasus%' OR name LIKE '%Ultraboost%' OR name LIKE '%Novablast%' OR name LIKE '%Boston%') ORDER BY price ASC LIMIT 3",
    ).all();
    const sunnyProducts = (sunnyRes.results || []) as ProductRecord[];
    const sunnyNames = sunnyProducts.map((p) => `- **${p.name}**: **${p.price.toLocaleString('vi-VN')} VND** (${p.category})`).join('\n');

    const sunnyAnswer = `Dạ đối với thời tiết trời nắng nóng hoặc mùa hè, tiêu chí quan trọng nhất khi chọn giày chạy bộ là **độ thông thoáng khí** và **khả năng tản nhiệt nhanh** của phần thân trên (Upper) để bàn chân luôn khô ráo và không bị phồng rộp.\n\nOne - Store xin gợi ý bạn 3 mẫu giày chạy bộ trang bị thân vải dệt lưới khí kỹ thuật (Engineered Mesh) siêu thoáng mát và êm ái đang có sẵn:\n\n${sunnyNames}\n\nToàn bộ các mẫu trên đều có thiết kế thân dệt lưu thông không khí tối đa, đế đệm êm ái hấp thụ chấn động và được **xỏ thử tại nhà** trước khi thanh toán COD ạ!`;

    const suggested = sunnyProducts.map(mapToProductCard);
    await emitter.delta(sunnyAnswer);
    await emitter.products(suggested);
    await emitter.chips?.(['Xem giày chạy bộ', 'Tư vấn chọn size', 'Chính sách freeship', 'Chính sách đổi size']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: sunnyAnswer,
          products: suggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem giày chạy bộ', 'Tư vấn chọn size', 'Chính sách freeship', 'Chính sách đổi size'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  // === ĐIỀU HƯỚNG ĐẶC BIỆT 3.2: GIÀY TẬP GYM / CHẠY MÁY TREADMILL (< 80ms) ===
  const isGymShoe = /(phòng gym|tập gym|phòng tập|chạy máy|treadmill|trong nhà|fitness)/i.test(questionLower);

  if (isGymShoe) {
    const gymRes = await c.env.DB.prepare(
      "SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 AND (name LIKE '%Pegasus%' OR name LIKE '%Ultraboost%' OR name LIKE '%Novablast%' OR name LIKE '%Nitro%') ORDER BY price ASC LIMIT 3",
    ).all();
    const gymProducts = (gymRes.results || []) as ProductRecord[];
    const gymNames = gymProducts.map((p) => `- **${p.name}**: **${p.price.toLocaleString('vi-VN')} VND** (${p.category})`).join('\n');

    const gymAnswer = `Dạ khi chạy bộ trên máy (Treadmill) hoặc tập luyện trong phòng gym, bạn nên chọn các dòng giày có **đế bằng phẳng, độ bám sàn cao, độ dốc gót vừa phải và bộ đệm ổn định đa năng** để vừa hỗ trợ chạy bộ êm ái vừa giữ thăng bằng tốt khi tập các bài vận động tổng hợp.\n\nDưới đây là các mẫu giày chạy bộ đa năng tối ưu cho phòng gym đang có sẵn tại One:\n\n${gymNames}\n\nToàn bộ sản phẩm đều có đế cao su chống trơn trượt sàn gỗ/thảm cao su, bảo hành chính hãng và được **xỏ thử tại chỗ** trước khi thanh toán COD ạ!`;

    const suggested = gymProducts.map(mapToProductCard);
    await emitter.delta(gymAnswer);
    await emitter.products(suggested);
    await emitter.chips?.(['Xem giày tập gym', 'Tư vấn chọn size', 'Chính sách freeship', 'Chính sách đổi size']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: gymAnswer,
          products: suggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem giày tập gym', 'Tư vấn chọn size', 'Chính sách freeship', 'Chính sách đổi size'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  // === ĐIỀU HƯỚNG ĐẶC BIỆT 3.3: GIÀY THỜI TRANG LIFESTYLE DẠO PHỐ (< 80ms) ===
  const isFashionShoe = /^(vậy\s+)?(?:nếu\s+)?(?:tôi\s+)?(?:chọn|thích|tìm|xem|mua)\s*(?:giày|đôi)?\s*(?:thời trang|lifestyle|dạo phố|đi chơi|casual)$/i.test(questionLower);

  if (isFashionShoe) {
    const fashionRes = await c.env.DB.prepare(
      "SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 AND category = 'Lifestyle' ORDER BY featured DESC, price ASC LIMIT 4",
    ).all();
    const fashionProducts = (fashionRes.results || []) as ProductRecord[];
    const fashionNames = fashionProducts.map((p) => `- **${p.name}**: **${p.price.toLocaleString('vi-VN')} VND** (${p.category})`).join('\n');

    const fashionAnswer = `Dạ nếu bạn đang tìm kiếm các mẫu sneaker thời trang (Lifestyle) để dạo phố, đi học, đi làm hay phối đồ hàng ngày, One - Store xin gợi ý các mẫu sneaker kinh điển, trẻ trung và dễ phối đồ nhất đang có sẵn tại kho:\n\n${fashionNames}\n\nToàn bộ sản phẩm đều là hàng phân phối chính hãng 100%, được áp dụng mã ưu đãi **ONE10** giảm 10%, chính sách **đồng kiểm và xỏ thử tại chỗ 100%**, cùng chế độ bảo hành 12 tháng chính hãng ạ!`;

    const suggested = fashionProducts.map(mapToProductCard);
    await emitter.delta(fashionAnswer);
    await emitter.products(suggested);
    await emitter.chips?.(['Xem sneaker thời trang', 'Mã giảm giá ONE10', 'Tư vấn chọn size', 'Chính sách đổi size']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: fashionAnswer,
          products: suggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem sneaker thời trang', 'Mã giảm giá ONE10', 'Tư vấn chọn size', 'Chính sách đổi size'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  // === ĐIỀU HƯỚNG ĐẶC BIỆT 3.4: GIÀY CHẠY BỘ HÀNG NGÀY / ĐEO 360 NGÀY (< 80ms) ===
  const isDailyShoe = /(?:chạy bộ|chạy|đeo giày)?\s*(?:hàng ngày|mỗi ngày|daily|360 ngày)/i.test(questionLower) &&
    !/(đắt nhất|rẻ nhất|mưa|nắng|gym|tập tạ)/i.test(questionLower);

  if (isDailyShoe) {
    const dailyRes = await c.env.DB.prepare(
      "SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 AND (name LIKE '%Pegasus%' OR name LIKE '%Novablast%' OR name LIKE '%PG7%' OR name LIKE '%Samba%') ORDER BY price ASC LIMIT 4",
    ).all();
    const dailyProducts = (dailyRes.results || []) as ProductRecord[];
    const dailyNames = dailyProducts.map((p) => `- **${p.name}**: **${p.price.toLocaleString('vi-VN')} VND** (${p.category})`).join('\n');

    const dailyAnswer = `Dạ đối với nhu cầu chạy bộ hoặc sử dụng hàng ngày (Daily Training / 360 ngày quanh năm), tiêu chí quan trọng nhất là **độ bền của đế ngoài cao su chống mài mòn**, **bộ đệm êm ái đàn hồi** và **phom dáng thoải mái** cho bàn chân.\n\nOne - Store xin gợi ý các mẫu giày luyện tập hàng ngày bền bỉ và đa năng nhất đang có sẵn tại kho:\n\n${dailyNames}\n\nToàn bộ các dòng giày trên đều được bảo hành chính hãng, miễn phí đổi size trong 7 ngày và được **đồng kiểm, xỏ thử tại chỗ 100%** trước khi thanh toán COD ạ!`;

    const suggested = dailyProducts.map(mapToProductCard);
    await emitter.delta(dailyAnswer);
    await emitter.products(suggested);
    await emitter.chips?.(['Xem giày chạy bộ', 'Xem 70 mẫu sneaker', 'Tư vấn chọn size', 'Mã giảm giá ONE10']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: dailyAnswer,
          products: suggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem giày chạy bộ', 'Xem 70 mẫu sneaker', 'Tư vấn chọn size', 'Mã giảm giá ONE10'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  // === ĐIỀU HƯỚNG ĐẶC BIỆT 3.5: GIÀY ĐI MÙA ĐÔNG / GIỮ ẤM (< 80ms) ===
  const isWinterShoe = /(mùa đông|trời lạnh|mùa lạnh|giữ ấm|đi đổi giày nào cho mùa đông|đổi giày nào cho mùa đông|đi đôi giày nào cho mùa đông)/i.test(questionLower);

  if (isWinterShoe) {
    const winterRes = await c.env.DB.prepare(
      "SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 AND (name LIKE '%Samba%' OR name LIKE '%530%' OR name LIKE '%XT-6%' OR name LIKE '%Superstar%') ORDER BY price ASC LIMIT 3",
    ).all();
    const winterProducts = (winterRes.results || []) as ProductRecord[];
    const winterNames = winterProducts.map((p) => `- **${p.name}**: **${p.price.toLocaleString('vi-VN')} VND** (${p.category})`).join('\n');

    const winterAnswer = `Dạ vào mùa đông thời tiết lạnh, bạn nên ưu tiên các mẫu sneaker có chất liệu da tổng hợp cao cấp, da lộn hoặc vải dệt dày dặn phủ TPU để chắn gió lạnh và giữ ấm tốt cho bàn chân:\n\n${winterNames}\n\nToàn bộ sản phẩm đều là hàng phân phối chính hãng 100%, áp dụng mã ưu đãi **ONE10** giảm 10% và được **xỏ thử tại nhà** trước khi thanh toán COD ạ!`;

    const suggested = winterProducts.map(mapToProductCard);
    await emitter.delta(winterAnswer);
    await emitter.products(suggested);
    await emitter.chips?.(['Xem sneaker thời trang', 'Mã giảm giá ONE10', 'Tư vấn chọn size']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: winterAnswer,
          products: suggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem sneaker thời trang', 'Mã giảm giá ONE10', 'Tư vấn chọn size'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  // === ĐIỀU HƯỚNG ĐẶC BIỆT 3.6: ĐỨNG LÂU 8 TIẾNG / ĐAU KHỚP GỐI / BẢO VỆ GỐI (< 80ms) ===
  const isStandingOrKneeShoe = /(đứng lâu|đứng 8 tiếng|đứng nhiều|đi bộ nhiều|đau khớp gối|đau gối|bảo vệ gối|cân gan chân|mỏi chân)/i.test(questionLower);

  if (isStandingOrKneeShoe) {
    const standRes = await c.env.DB.prepare(
      "SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 AND (name LIKE '%Nimbus%' OR name LIKE '%Kayano%' OR name LIKE '%Ultraboost%' OR name LIKE '%Wave%') ORDER BY price ASC LIMIT 3",
    ).all();
    const standProducts = (standRes.results || []) as ProductRecord[];
    const standNames = standProducts.map((p) => `- **${p.name}**: **${p.price.toLocaleString('vi-VN')} VND** (${p.category})`).join('\n');

    const standAnswer = `Dạ nếu bạn thường xuyên phải đứng lâu từ 8 đến 10 tiếng, đi bộ nhiều hoặc cần bảo vệ khớp gối, tiêu chí quan trọng nhất là **khả năng hấp thụ phản lực từ mặt đất** và **độ nâng đỡ vòm chân** để giảm thiểu mỏi cơ và chấn thương xương khớp.\n\nOne - Store xin gợi ý 3 siêu phẩm bảo vệ chân và đệm êm hàng đầu thế giới đang có sẵn:\n\n${standNames}\n\nToàn bộ sản phẩm đều được hỗ trợ **xỏ thử trực tiếp tại nhà** trước khi thanh toán COD và đổi size miễn phí 7 ngày ạ!`;

    const suggested = standProducts.map(mapToProductCard);
    await emitter.delta(standAnswer);
    await emitter.products(suggested);
    await emitter.chips?.(['Xem giày Asics bảo vệ gối', 'Tư vấn chọn size', 'Chính sách freeship']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: standAnswer,
          products: suggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem giày Asics bảo vệ gối', 'Tư vấn chọn size', 'Chính sách freeship'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  // === ĐIỀU HƯỚNG ĐẶC BIỆT 3.7: GIÀY BÓNG RỔ CHUYÊN NGHIỆP (< 80ms) ===
  const isBasketballShoe = /(bóng rổ|basketball|bật nhảy)/i.test(questionLower);

  if (isBasketballShoe) {
    const bballRes = await c.env.DB.prepare(
      "SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 AND (name LIKE '%Wade%' OR name LIKE '%KT%' OR name LIKE '%MB.03%' OR category = 'Basketball') ORDER BY price ASC LIMIT 3",
    ).all();
    const bballProducts = (bballRes.results || []) as ProductRecord[];
    const bballNames = bballProducts.map((p) => `- **${p.name}**: **${p.price.toLocaleString('vi-VN')} VND** (${p.category})`).join('\n');

    const bballAnswer = `Dạ One - Store phân phối các mẫu giày bóng rổ chính hãng đỉnh cao với khả năng bám sân chống trượt vượt trội và bộ đệm trợ lực bật nhảy bùng nổ:\n\n${bballNames}\n\nToàn bộ các mẫu đều được thiết kế khóa cổ chân vững vàng, đế cao su chống mài mòn cực tốt cho cả sân trong nhà và sân bê tông ngoài trời ạ!`;

    const suggested = bballProducts.map(mapToProductCard);
    await emitter.delta(bballAnswer);
    await emitter.products(suggested);
    await emitter.chips?.(['Xem giày bóng rổ', 'Mã giảm giá ONE10', 'Tư vấn chọn size']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: bballAnswer,
          products: suggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem giày bóng rổ', 'Mã giảm giá ONE10', 'Tư vấn chọn size'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
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

  if (filters.minPrice) {
    whereClauses.push('price >= ?');
    bindParams.push(filters.minPrice);
  }

  if (filters.maxPrice) {
    whereClauses.push('price <= ?');
    bindParams.push(filters.maxPrice);
  }

  if (filters.color) {
    const cLower = filters.color.toLowerCase();
    const cUpper = filters.color.charAt(0).toUpperCase() + filters.color.slice(1);
    whereClauses.push('(colors LIKE ? OR colors LIKE ?)');
    bindParams.push('%' + cLower + '%', '%' + cUpper + '%');
  }

  const hasSpecificFilter = Boolean(filters.brand || filters.modelKeyword || filters.category || filters.minPrice || filters.maxPrice || filters.color);
  const sqlQuery = 'SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE ' + whereClauses.join(' AND ') + ' ORDER BY featured DESC, id ASC LIMIT 20';

  const productStmt = c.env.DB.prepare(sqlQuery);
  const productRes = await (bindParams.length > 0 ? productStmt.bind(...bindParams) : productStmt).all();
  const matchedProducts = (productRes.results || []) as ProductRecord[];

  // === ĐIỀU HƯỚNG ĐẶC BIỆT 4: NGÂN SÁCH VƯỢT TRẦN HOẶC NGÂN SÁCH LỚN (> 6.290.000 VND hoặc 30 triệu) (< 80ms) ===
  const isBigBudget =
    Boolean(filters.minPrice && filters.minPrice > 6290000) ||
    Boolean(filters.maxPrice && filters.maxPrice > 6290000 && matchedProducts.length === 0) ||
    /(?:có|ngân sách|tài chính|tầm|khoảng|giá)?\s*(\d{2,3})\s*(?:triệu|tr)\b/i.test(questionLower);

  if (isBigBudget) {
    const highestRes = await c.env.DB.prepare(
      'SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 ORDER BY price DESC LIMIT 3',
    ).all();
    const highestProducts = (highestRes.results || []) as ProductRecord[];
    const maxPriceStr = highestProducts.length > 0 ? highestProducts[0].price.toLocaleString('vi-VN') + ' VND' : '6.290.000 VND';
    const topNames = highestProducts.map((p) => `**${p.name}** (${p.price.toLocaleString('vi-VN')} VND)`).join(', ');

    const budgetAnswer = `Dạ tại One - Store, toàn bộ sản phẩm đều là sneaker và giày chạy bộ phân phối chính hãng 100% với mức giá niêm yết cao nhất hiện tại là **${maxPriceStr}** (mẫu ${topNames}). Cửa hàng hiện chưa có mẫu giày đơn lẻ nào vượt quá mức giá này ạ.\n\nVới mức ngân sách dồi dào của bạn, bạn hoàn toàn có thể lựa chọn sở hữu combo từ 2 đến 5 đôi sneaker hiệu năng cao hàng đầu thế giới phục vụ đa dạng nhu cầu (chạy bộ marathon, tập gym và dạo phố thời trang). One xin gợi ý bạn các siêu phẩm cao cấp nhất tại kho để bạn tham khảo:`;

    const suggested = highestProducts.map(mapToProductCard);
    await emitter.delta(budgetAnswer);
    await emitter.products(suggested);
    await emitter.chips?.(['Xem 70 mẫu sneaker', 'Chính sách bảo hành', 'Chính sách freeship', 'Tư vấn chọn size']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: budgetAnswer,
          products: suggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem 70 mẫu sneaker', 'Chính sách bảo hành', 'Chính sách freeship', 'Tư vấn chọn size'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  // === MŨI NHỌN 0: XỬ LÝ TRƯỜNG HỢP NGÂN SÁCH DƯỚI GIÁ SÀN KHO D1 (< 80ms) ===
  // Khách hỏi mua giày với mức giá thấp hơn mẫu rẻ nhất hiện có (ví dụ: dưới 1 triệu, dưới 1.5 triệu)
  if (filters.maxPrice && matchedProducts.length === 0) {
    const minPriceRes = await c.env.DB.prepare(
      'SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 ORDER BY price ASC LIMIT 2',
    ).all();
    const lowestProducts = (minPriceRes.results || []) as ProductRecord[];
    const lowestPriceStr = lowestProducts.length > 0 ? lowestProducts[0].price.toLocaleString('vi-VN') + ' VND' : '1.890.000 VND';
    const lowestNames = lowestProducts.map((p) => `**${p.name}** (${p.price.toLocaleString('vi-VN')} VND)`).join(' và ');

    let outOfBudgetMsg = `Dạ hiện tại tại One - Store, toàn bộ 70 mẫu giày thể thao & sneaker đều là hàng phân phối chính hãng 100% nhập khẩu từ các thương hiệu hàng đầu thế giới (Nike, Adidas, Asics, Mizuno, Puma, New Balance, Anta...), nên mức giá khởi điểm tốt nhất hiện tại là từ **${lowestPriceStr}** (mẫu ${lowestNames}). Cửa hàng hiện chưa có mẫu giày chính hãng nào dưới ${filters.maxPrice.toLocaleString('vi-VN')} VND ạ.`;

    if (filters.maxPrice <= 100000) {
      outOfBudgetMsg += `\n\nTuy nhiên, với mức ngân sách này, bạn hoàn toàn có thể lựa chọn sản phẩm **Vớ thể thao dệt kim One Athletic** chỉ **+49.000 VND/đôi** hoặc **Bình xịt bọt nano vệ sinh giày sneaker** chỉ **+89.000 VND/bình** khi mua kèm đơn hàng ạ!`;
    }

    outOfBudgetMsg += `\n\nOne xin gợi ý bạn 2 mẫu sneaker chính hãng có mức giá ưu đãi và tốt nhất tại kho hiện tại để bạn tham khảo:`;

    const budgetSuggested = lowestProducts.map(mapToProductCard);

    await emitter.delta(outOfBudgetMsg);
    await emitter.products(budgetSuggested);
    await emitter.chips?.(['Xem 70 mẫu sneaker', 'Mã giảm giá ONE10', 'Tư vấn chọn size', 'Chính sách freeship']);
    await emitter.done();

    if (c.env.CACHE) {
      await c.env.CACHE.put(
        cacheKey,
        JSON.stringify({
          answer: outOfBudgetMsg,
          products: budgetSuggested,
          sources: ['Kho giày chính hãng D1'],
          chips: ['Xem 70 mẫu sneaker', 'Mã giảm giá ONE10', 'Tư vấn chọn size', 'Chính sách freeship'],
        }),
        { expirationTtl: 14400 },
      ).catch(() => {});
    }
    return;
  }

  // === MŨI NHỌN 1: FAST CATALOG DIRECT RESOLVER (< 80ms, 0 Token LLM) ===
  // Trực tiếp xử lý câu hỏi hỏi giá tiền, kích cỡ, màu sắc hoặc tìm kiếm danh mục/ngân sách từ CSDL D1
  const isDirectCatalogQuery =
    hasSpecificFilter ||
    /(giá bao nhiêu|nhiêu tiền|bao tiền|có giá|cho xin giá|hỏi giá|giá cả|giá sao|bán giá|bao nhiêu 1 đôi|bao nhiêu một đôi|có size|còn size|còn hàng không|còn mẫu không|tìm đôi|tìm giày|có đôi nào|mẫu nào|đôi nào|dưới|trên|tầm|khoảng|giá rẻ|màu|nên đeo đôi|nên mua đôi|thích màu|đôi.*nào|mẫu.*nào|mua được|triệu|tr\b)/i.test(
      question.toLowerCase(),
    );

  if (isDirectCatalogQuery && matchedProducts.length > 0) {
    const displayProducts = matchedProducts.slice(0, 4);
    let fastAnswer = '';
    if (displayProducts.length === 1) {
      const p = displayProducts[0];
      let sizesStr = p.sizes;
      let colorsStr = p.colors;
      try { sizesStr = JSON.parse(p.sizes).join(', '); } catch {}
      try { colorsStr = JSON.parse(p.colors).join(', '); } catch {}
      fastAnswer = `Dạ chào bạn, tại One - Store mẫu **${p.name}** (${p.category}) chính hãng hiện có giá niêm yết là **${p.price.toLocaleString('vi-VN')} VND**.\n\n- **Tình trạng kho:** Còn sẵn ${p.stock} đôi tại showroom.\n- **Cỡ giày có sẵn:** ${sizesStr}.\n- **Màu sắc:** ${colorsStr}.\n\nKhi đặt mua đôi này, bạn được áp dụng mã voucher **ONE10** giảm ngay 10%, miễn phí ship khi mua từ 3 đôi hoặc hóa đơn từ 5.000.000 VND, và quyền **đồng kiểm, xỏ thử giày tận nơi** trước khi thanh toán COD ạ!`;
    } else {
      const itemsList = displayProducts.map((p) => {
        let sizesStr = p.sizes;
        let colorsStr = p.colors;
        try { sizesStr = JSON.parse(p.sizes).join(', '); } catch {}
        try { colorsStr = JSON.parse(p.colors).join(', '); } catch {}
        return `- **${p.name}**: **${p.price.toLocaleString('vi-VN')} VND** (Phối màu: ${colorsStr} | Size: ${sizesStr})`;
      }).join('\n');

      const extraText = matchedProducts.length > 4 ? `\n\n*(Kho One - Store còn có thêm ${matchedProducts.length - 4} mẫu khác phù hợp tiêu chí của bạn)*` : '';
      fastAnswer = `Dạ One - Store xin gửi bạn gợi ý các mẫu giày phù hợp với tiêu chí của bạn đang có sẵn tại kho:\n\n${itemsList}${extraText}\n\nToàn bộ sản phẩm đều là hàng phân phối chính hãng 100%, được áp dụng mã ưu đãi **ONE10** giảm 10%, chính sách **đồng kiểm và xỏ thử tại chỗ 100%**, cùng chế độ bảo hành 6-12 tháng chính hãng ạ!`;
    }

    const fastSuggested = displayProducts.map(mapToProductCard);

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

  const FALLBACK_RESPONSES = [
    'Dạ One - Store xin phép lắng nghe thêm thông tin từ bạn ạ. Bạn có thể chia sẻ cụ thể hơn về nhu cầu sử dụng (chạy bộ marathon, tập gym hay dạo phố thời trang) hoặc khoảng giá mong muốn để One tư vấn mẫu giày chuẩn nhất nhé!',
    'Dạ câu hỏi của bạn rất thú vị! Để One - Store chọn đúng đôi giày ưng ý nhất cho bạn từ kho 70 mẫu sneaker chính hãng Âu - Á, bạn đang quan tâm đến thương hiệu nào (Nike, Adidas, Asics...) hoặc cần đo size chân chuẩn dáng không ạ?',
    'Dạ One - Store luôn sẵn sàng đồng hành cùng bạn. Bạn có thể cho One biết thêm về cỡ giày thường đi, dáng chân (chân bè hay thon) hoặc mức ngân sách dự kiến để One lọc ngay đôi giày êm ái nhất gửi bạn nhé!',
  ];

  // 4. GỌI MÔ HÌNH LLM (STREAMING HOẶC NON-STREAMING - TỐC ĐỘ CAO <= 3S)
  if (isStream) {
    try {
      const aiResult = (await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: conversationMessages,
        max_tokens: 450,
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
      console.error('[Workers AI Llama Stream Error]', err?.message || err);
    }
  } else {
    try {
      const aiResult = (await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: conversationMessages,
        max_tokens: 450,
        temperature: 0.1,
      })) as any;

      const message = aiResult?.choices?.[0]?.message;
      const content = (message?.content || aiResult?.response || aiResult?.text || '').trim();
      const reasoning = message?.reasoning_content ? String(message.reasoning_content) : '';

      if (!content && reasoning) {
        const extracted = extractAnswerFromReasoning(reasoning);
        aiResponseText = extracted || '';
      } else {
        aiResponseText = content;
      }
    } catch (err: any) {
      console.error('[Workers AI Error]', err?.message || err);
      aiResponseText = '';
    }

    aiResponseText = cleanModelOutput(aiResponseText);
    if (!aiResponseText) {
      const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
      aiResponseText = fallback;
    }
    await emitter.delta(aiResponseText);
  }

  // Fallback an toàn nếu chuỗi stream rỗng
  if (!aiResponseText.trim()) {
    const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    aiResponseText = fallback;
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

  const suggestedProducts = matchedSuggested.slice(0, 4).map(mapToProductCard);

  await emitter.products(suggestedProducts);
  await emitter.sources(sources);
  await emitter.chips?.(['Tư vấn chọn size', 'Chính sách freeship', 'Xem thêm mẫu']);
  await emitter.done();

  // 6. LƯU KẾT QUẢ VÀO CLOUDFLARE KV CACHE (< 30ms cho các lần truy vấn tiếp theo, trừ trường hợp fallback)
  const isFallbackText = FALLBACK_RESPONSES.some((f) => aiResponseText.includes(f.slice(0, 30)));
  if (c.env.CACHE && (!history || history.length === 0) && aiResponseText && !isFallbackText) {
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
    llm_model: '@cf/meta/llama-3-8b-instruct',
  });
});
