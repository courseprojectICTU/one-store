import { Hono } from 'hono';
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
});

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
  const combinedHistory = history.map((h) => h.text).join('\n');
  const allText = `${combinedHistory}\n${query}`;
  const queryLower = query.toLowerCase().trim();

  // 1. Ý định hủy đặt hàng
  const isCancelIntent = /(?:hủy đơn|hủy đặt|không mua nữa|thôi không mua|hủy đi|thôi bỏ qua|không đặt nữa|hủy mua)/i.test(queryLower);

  // 2. Ý định chốt đơn
  const isConfirmIntent = /(?:^|\s)(?:chốt đơn|chốt|xác nhận đơn|xác nhận|đồng ý|ok chốt|chốt luôn|mua luôn|đặt luôn|chốt nhé|chốt nha|chốt giúp|xác nhận mua)(?:\s*!*|$)/i.test(queryLower);

  // 3. Ý định đặt hàng chung
  const isOrderIntent =
    isConfirmIntent ||
    /(?:mua|đặt\s+(?:\d+\s+)?(?:đôi|chiếc|hàng|giày)?|lấy\s+(?:\d+\s+)?(?:đôi|chiếc)?|lên đơn|ship\s+(?:cho|đến|về)|order|cho tôi đặt|cho mình đặt|tôi muốn lấy|muốn mua|muốn đặt)/i.test(allText) ||
    /(?:họ\s*tên|người\s*nhận|sđt|điện\s*thoại|địa\s*chỉ)/i.test(query);

  // Trích xuất Số điện thoại
  let phone: string | null = null;
  const phonePattern = /(?:(?:\+84|84|0)[35789]\d{8})\b/;
  const phoneLabelPattern = /(?:sđt|số\s*điện\s*thoại|điện\s*thoại|sdt|phone|tel)\s*[:=]?\s*([0-9+.\s-]{9,15})/i;

  const phoneLabelMatch = query.match(phoneLabelPattern) || combinedHistory.match(phoneLabelPattern);
  if (phoneLabelMatch) {
    const raw = phoneLabelMatch[1].replace(/[\s.-]/g, '').replace(/^\+84/, '0').replace(/^84/, '0');
    if (/^0[35789]\d{8}$/.test(raw)) phone = raw;
  }
  if (!phone) {
    const rawMatch = query.match(phonePattern) || combinedHistory.match(phonePattern);
    if (rawMatch) {
      const raw = rawMatch[0].replace(/[\s.-]/g, '').replace(/^\+84/, '0').replace(/^84/, '0');
      if (/^0[35789]\d{8}$/.test(raw)) phone = raw;
    }
  }

  // Trích xuất Họ tên
  let customerName: string | null = null;
  const nameLabelMatch =
    query.match(/(?:họ\s*(?:và\s*)?tên|tên\s*(?:người\s*nhận|khách)?|người\s*nhận|tên)\s*[:=]\s*([^\n,;]+)/i) ||
    combinedHistory.match(/(?:họ\s*(?:và\s*)?tên|tên\s*(?:người\s*nhận|khách)?|người\s*nhận|tên)\s*[:=]\s*([^\n,;]+)/i);
  if (nameLabelMatch) {
    let rawName = nameLabelMatch[1].trim().replace(/^[-*•\s]+/, '').replace(/[*_]/g, '');
    rawName = rawName.replace(/[,;.]?\s*(?:sđt|địa chỉ|size|màu|số lượng)[\s\S]*$/i, '').trim();
    if (rawName.length >= 2) customerName = rawName;
  }
  if (!customerName) {
    const selfNameMatch = query.match(/(?:mình\s*tên\s*là|tôi\s*tên\s*là|tên\s*mình\s*là)\s+([A-ZÀ-Ỹa-zà-ỹ\s]{2,30})/i);
    if (selfNameMatch) {
      let rawName = selfNameMatch[1].trim();
      rawName = rawName.replace(/[,;.]?\s*(?:sđt|địa chỉ|size|màu|số lượng)[\s\S]*$/i, '').trim();
      customerName = rawName;
    }
  }

  // Trích xuất Địa chỉ
  let address: string | null = null;
  const addressLabelMatch =
    query.match(/(?:địa\s*chỉ|giao\s*(?:đến|về|tận)|nhận\s*tại|ship\s*(?:đến|về)|đ\/c|dc)\s*[:=]?\s*([^\n;]+)/i) ||
    combinedHistory.match(/(?:địa\s*chỉ|giao\s*(?:đến|về|tận)|nhận\s*tại|ship\s*(?:đến|về)|đ\/c|dc)\s*[:=]?\s*([^\n;]+)/i);
  if (addressLabelMatch) {
    let rawAddr = addressLabelMatch[1].trim().replace(/^[-*•\s]+/, '').replace(/[*_]/g, '');
    rawAddr = rawAddr.replace(/[,;.]?\s*(?:màu|size|cỡ|sz|sl|số\s*lượng|sđt|điện\s*thoại|tên|họ\s*tên)[\s\S]*$/i, '').trim();
    if (rawAddr.length >= 6) {
      address = rawAddr;
    }
  }
  if (!address) {
    const addrLine = query.split('\n').find((line) => /(?:số\s*\d+|đường|phố|phường|xã|quận|huyện|thành\s*phố|tp\.|tỉnh|hà\s*nội|hồ\s*chí\s*minh|tphcm|đà\s*nẵng)/i.test(line));
    if (addrLine && addrLine.trim().length >= 8 && !/(?:sđt|điện thoại|size|màu)/i.test(addrLine)) {
      address = addrLine.trim().replace(/^[-*•\s]+/, '');
    }
  }

  // Trích xuất Số lượng
  let quantity = 1;
  const qtyMatch =
    query.match(/(?:số\s*lượng|sl|qty)\s*[:=]?\s*(\d+)/i) ||
    query.match(/(\d+)\s*(?:đôi|chiếc)/i) ||
    combinedHistory.match(/(?:số\s*lượng|sl|qty)\s*[:=]?\s*(\d+)/i);
  if (qtyMatch) {
    const parsedQty = parseInt(qtyMatch[1], 10);
    if (!isNaN(parsedQty) && parsedQty > 0 && parsedQty <= 50) {
      quantity = parsedQty;
    }
  }

  // Trích xuất Sản phẩm phù hợp nhất
  let matchedProduct: ProductRecord | null = null;
  if (pendingOrder && pendingOrder.productId) {
    matchedProduct = allProducts.find((p) => p.id === pendingOrder.productId) || null;
  }

  if (!matchedProduct) {
    let bestScore = 0;
    const scores = new Map<number, number>();

    // 1. Chấm điểm trực tiếp trên câu hỏi hiện tại (query)
    for (const p of allProducts) {
      const pNameLower = p.name.toLowerCase();
      const pTokens = pNameLower.split(' ').slice(1);
      const modelKeywords = pTokens.join(' ');

      let score = 0;
      if (queryLower.includes(pNameLower)) score += 100;
      else if (queryLower.includes(modelKeywords)) score += 80;
      else {
        const matchCount = pTokens.filter((t) => t.length > 2 && queryLower.includes(t)).length;
        if (matchCount >= 2) score += 60;
        else if (matchCount === 1) score += 30;
      }
      if (score > 0) scores.set(p.id!, score);
    }

    // 2. Nếu câu hỏi hiện tại chưa có tên sản phẩm cụ thể, quét ngược lịch sử chat từ lượt mới nhất trở về trước
    if ([...scores.values()].every((s) => s < 60) && Array.isArray(history) && history.length > 0) {
      const reversedHistory = [...history].reverse();
      for (let hIdx = 0; hIdx < reversedHistory.length; hIdx++) {
        const turn = reversedHistory[hIdx];
        const turnLower = turn.text.toLowerCase();
        // Ưu tiên cao hơn nếu khách hàng trực tiếp nêu tên sản phẩm, và ưu tiên lượt gần hơn
        const recencyMultiplier = Math.max(0.5, 1 - hIdx * 0.2);
        const roleMultiplier = turn.role === 'user' ? 2.5 : 1.0;

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
            const finalWeighted = Math.round(turnScore * recencyMultiplier * roleMultiplier);
            const current = scores.get(p.id!) || 0;
            if (finalWeighted > current) {
              scores.set(p.id!, finalWeighted);
            }
          }
        }

        // Nếu lượt user gần nhất đã chỉ đích danh sản phẩm, dừng quét để tránh nhầm với gợi ý của bot
        if (turn.role === 'user' && [...scores.values()].some((s) => s >= 70)) {
          break;
        }
      }
    }

    for (const [id, score] of scores.entries()) {
      if (score > bestScore && score >= 30) {
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
    combinedHistory.match(/(?:size|cỡ|sz)\s*[:=]?\s*(\d{2}(?:\.5)?)/i);
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
    combinedHistory.match(/(?:màu\s*(?:sắc)?|color)\s*[:=]?\s*([^\n,;.]+)/i);
  if (colorMatch) {
    color = colorMatch[1].trim().replace(/^[-*•\s]+/, '').replace(/[*_]/g, '');
  }
  if (matchedProduct) {
    try {
      const validColors = JSON.parse(matchedProduct.colors);
      for (const vc of validColors) {
        if (queryLower.includes(vc.toLowerCase()) || (combinedHistory && combinedHistory.toLowerCase().includes(vc.toLowerCase()))) {
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
  };
}

/**
 * Hàm phân đoạn văn bản thông minh (Smart Chunking) cho Chatbot AI RAG:
 * - maxLength: Giới hạn độ dài tối đa mỗi chunk (mặc định 1100 ký tự).
 * - overlap: Độ dài gối đầu giữa các chunk liền kề (mặc định 140 ký tự) nhằm bảo toàn ngữ cảnh liền mạch.
 * - Ngắt thông minh: Ưu tiên ngắt tại ranh giới xuống dòng (\n\n, \n) hoặc dấu chấm câu (. ) thay vì cắt ngang từ ngữ.
 */
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

  return { minPrice, maxPrice, category, color, brand, isFollowUp };
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
chatbot.post('/chat', async (c) => {
  const parsed = chatRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return fail(
      parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ (câu hỏi: 2 - 600 ký tự)',
      400,
    );
  }

  const { question, history, pendingOrder } = parsed.data;

  // Lấy toàn bộ danh sách sản phẩm còn hàng từ CSDL D1 để kiểm định và phục vụ bóc tách đơn hàng
  const allProductsRes = await c.env.DB.prepare(
    'SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0',
  ).all<ProductRecord>();
  const allAvailableProducts = allProductsRes.results || [];

  // Bóc tách ý định & thực thể đặt hàng
  const orderDetails = extractOrderDetails(question, history, pendingOrder, allAvailableProducts);

  // === NHÁNH 1: KHÁCH HÀNG HỦY YÊU CẦU ĐẶT HÀNG ===
  if (orderDetails.isCancelIntent) {
    return c.json({
      answer:
        'Dạ vâng ạ, One - Store đã hủy yêu cầu lên đơn này. Nếu bạn muốn tham khảo thêm mẫu giày thể thao nào khác hoặc cần tư vấn chọn size theo dáng chân, bạn cứ nhắn cho One bất kỳ lúc nào nhé!',
      sources: [],
      products: [],
      readyToConfirm: false,
    });
  }

  // === NHÁNH 2: KHÁCH HÀNG NHẮN "CHỐT ĐƠN" / XÁC NHẬN ĐƠN HÀNG THỰC TẾ ===
  if (orderDetails.isConfirmIntent) {
    const lastAssistantTurn = [...history].reverse().find((h) => h.role === 'assistant');
    const parsedSummary = lastAssistantTurn ? parseSummaryTable(lastAssistantTurn.text) : null;

    const targetProduct =
      orderDetails.product ||
      allAvailableProducts.find(
        (p) =>
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
      return c.json({
        answer:
          'Dạ chào bạn! Để One - Store có thể chốt đơn và giao hàng tận nơi cho bạn, bạn vui lòng cung cấp đầy đủ thông tin đơn hàng theo mẫu sau nhé:\n- Tên sản phẩm:\n- Size giày & Màu sắc:\n- Số lượng:\n- Họ và tên người nhận:\n- Số điện thoại:\n- Địa chỉ nhận hàng:\n\nSau khi có đủ thông tin, One sẽ gửi bạn bảng tóm tắt để bạn xác nhận chốt đơn ngay ạ!',
        sources: [],
        products: [],
        readyToConfirm: false,
      });
    }

    if (targetProduct.stock < finalQty) {
      return c.json({
        answer: `Dạ rất tiếc, sản phẩm **${targetProduct.name}** hiện chỉ còn lại ${targetProduct.stock} đôi trong kho (bạn đặt ${finalQty} đôi). Bạn có muốn lấy ${targetProduct.stock} đôi hoặc One tư vấn mẫu khác nhé!`,
        sources: [],
        products: [],
        readyToConfirm: false,
      });
    }

    let validSizes: string[] = [];
    let validColors: string[] = [];
    try { validSizes = JSON.parse(targetProduct.sizes); } catch {}
    try { validColors = JSON.parse(targetProduct.colors); } catch {}

    if (!validSizes.includes(finalSize)) {
      return c.json({
        answer: `Dạ rất tiếc mẫu **${targetProduct.name}** hiện chỉ có sẵn các size: **${validSizes.join(', ')}**. Size **${finalSize}** hiện kho đang tạm hết ạ. Bạn có muốn đổi sang size khác vừa vặn không ạ?`,
        sources: [],
        products: [],
        readyToConfirm: false,
      });
    }

    const colorMatch = validColors.find((c) =>
      c.toLowerCase() === finalColor.toLowerCase() ||
      finalColor.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(finalColor.toLowerCase()),
    );
    if (!colorMatch) {
      return c.json({
        answer: `Dạ mẫu **${targetProduct.name}** hiện có các phối màu chính hãng: **${validColors.join(', ')}**. Phối màu '${finalColor}' hiện chưa có sẵn. Bạn chọn màu nào trong số này giúp One nhé!`,
        sources: [],
        products: [],
        readyToConfirm: false,
      });
    }

    if (!/^0[35789]\d{8}$/.test(finalPhone)) {
      return c.json({
        answer: `Dạ số điện thoại nhận hàng '${finalPhone}' dường như chưa chính xác (cần đúng 10 chữ số). Bạn vui lòng kiểm tra lại số điện thoại để One lên đơn nhé!`,
        sources: [],
        products: [],
        readyToConfirm: false,
      });
    }

    if (finalAddress.length < 6) {
      return c.json({
        answer: 'Dạ bạn vui lòng cung cấp địa chỉ nhận hàng chi tiết hơn (bao gồm số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố) để One giao hàng chính xác tận nơi cho bạn nhé!',
        sources: [],
        products: [],
        readyToConfirm: false,
      });
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
        return c.json({
          answer: `Dạ rất tiếc, số lượng sản phẩm **${targetProduct.name}** trong kho vừa có sự thay đổi và không còn đủ ${finalQty} đôi để xuất hàng. Bạn vui lòng chọn lại số lượng hoặc mẫu khác nhé!`,
          sources: [],
          products: [],
          readyToConfirm: false,
        });
      }

      try {
        await c.env.CACHE.delete('products:v1');
      } catch {}

      const answerText = `**XÁC NHẬN ĐẶT HÀNG THÀNH CÔNG**

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

      return c.json({
        answer: answerText,
        sources: [],
        products: [],
        readyToConfirm: false,
        createdOrder: {
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
        },
      });
    } catch (orderErr: any) {
      console.error('[Order Insertion Error]', orderErr);
      return fail('Không thể khởi tạo đơn hàng: ' + (orderErr?.message || 'Lỗi hệ thống CSDL'), 500);
    }
  }

  // === NHÁNH 3: KHÁCH HÀNG GỬI THÔNG TIN HOẶC BÀY TỎ Ý ĐỊNH ĐẶT HÀNG ===
  if (orderDetails.isOrderIntent || (orderDetails.customerName && orderDetails.phone)) {
    const product = orderDetails.product;
    const { size, color, quantity, customerName, phone, address } = orderDetails;

    if (product && size && color && customerName && phone && address) {
      if (product.stock < quantity) {
        return c.json({
          answer: `Dạ rất tiếc, sản phẩm **${product.name}** hiện chỉ còn lại ${product.stock} đôi trong kho (bạn đặt ${quantity} đôi). Bạn có muốn lấy ${product.stock} đôi hoặc để One tư vấn mẫu khác nhé!`,
          sources: [],
          products: [],
          readyToConfirm: false,
        });
      }

      let validSizes: string[] = [];
      let validColors: string[] = [];
      try { validSizes = JSON.parse(product.sizes); } catch {}
      try { validColors = JSON.parse(product.colors); } catch {}

      if (!validSizes.includes(size)) {
        return c.json({
          answer: `Dạ rất tiếc mẫu **${product.name}** hiện chỉ có sẵn các size: **${validSizes.join(', ')}**. Size **${size}** hiện kho đang tạm hết ạ. Bạn có muốn đổi sang size khác vừa vặn không ạ?`,
          sources: [],
          products: [],
          readyToConfirm: false,
        });
      }

      const colorMatch = validColors.find((c) =>
        c.toLowerCase() === color.toLowerCase() ||
        color.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(color.toLowerCase()),
      );
      if (!colorMatch) {
        return c.json({
          answer: `Dạ mẫu **${product.name}** hiện có các phối màu chính hãng: **${validColors.join(', ')}**. Phối màu '${color}' hiện chưa có sẵn. Bạn chọn màu nào trong số này giúp One nhé!`,
          sources: [],
          products: [],
          readyToConfirm: false,
        });
      }

      if (!/^0[35789]\d{8}$/.test(phone)) {
        return c.json({
          answer: `Dạ số điện thoại nhận hàng '${phone}' dường như chưa chính xác (cần đúng 10 chữ số). Bạn vui lòng kiểm tra lại số điện thoại giúp One nhé!`,
          sources: [],
          products: [],
          readyToConfirm: false,
        });
      }

      if (address.length < 6) {
        return c.json({
          answer: 'Dạ bạn vui lòng cung cấp địa chỉ nhận hàng chi tiết hơn (bao gồm số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố) để One - Store đảm bảo giao hàng chính xác tận nơi cho bạn nhé!',
          sources: [],
          products: [],
          readyToConfirm: false,
        });
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

      return c.json({
        answer: summaryText,
        sources: [],
        products: [
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
            image_url: product.image_key ? `/api/images/${encodeURIComponent(product.image_key)}` : null,
          },
        ],
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
    }

    let promptText = '';
    if (product) {
      let validSizes: string[] = [];
      let validColors: string[] = [];
      try { validSizes = JSON.parse(product.sizes); } catch {}
      try { validColors = JSON.parse(product.colors); } catch {}

      const missingItems: string[] = [];
      if (!size) {
        missingItems.push(`- Size giày: (Mẫu này có sẵn: ${validSizes.join(', ')})`);
      } else {
        missingItems.push(`- Size giày: ${size}`);
      }

      if (!color) {
        missingItems.push(`- Màu sắc: (Mẫu này có sẵn: ${validColors.join(', ')})`);
      } else {
        missingItems.push(`- Màu sắc: ${color}`);
      }

      missingItems.push(`- Số lượng: ${quantity} đôi`);

      if (!customerName) {
        missingItems.push('- Họ và tên người nhận:');
      } else {
        missingItems.push(`- Họ và tên: ${customerName}`);
      }

      if (!phone) {
        missingItems.push('- Số điện thoại nhận hàng:');
      } else {
        missingItems.push(`- Số điện thoại: ${phone}`);
      }

      if (!address) {
        missingItems.push('- Địa chỉ nhận hàng (Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP):');
      } else {
        missingItems.push(`- Địa chỉ: ${address}`);
      }

      promptText = `Dạ tuyệt vời ạ! Em thấy bạn đang quan tâm mẫu **${product.name}** (${product.price.toLocaleString('vi-VN')} VND).

Để One - Store kiểm tra kho, đóng gói xỏ thử tận nơi và lên đơn giao ngay cho bạn, bạn vui lòng bổ sung giúp One các thông tin còn thiếu theo mẫu sau nhé:

${missingItems.join('\n')}

One - Store hỗ trợ giao hàng COD toàn quốc, đồng kiểm và xỏ thử tận nơi trước khi thanh toán ạ!`;
    } else {
      promptText = `Dạ chào bạn! Để One - Store lên đơn và giao hàng tận nơi cho bạn, bạn vui lòng gửi giúp One các thông tin đơn hàng theo mẫu sau nhé:
- Tên sản phẩm: (ví dụ: Asics Novablast 4 Trampoline)
- Size giày: (ví dụ: 39)
- Màu sắc: (ví dụ: Đen)
- Số lượng: (Mặc định 1 đôi)
- Họ và tên người nhận:
- Số điện thoại nhận hàng:
- Địa chỉ nhận hàng (Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/TP):

One - Store hỗ trợ giao hàng COD toàn quốc, đồng kiểm và xỏ thử tận nơi trước khi thanh toán ạ!`;
    }

    let productSizesArr: string[] = [];
    let productColorsArr: string[] = [];
    if (product) {
      try { productSizesArr = JSON.parse(product.sizes); } catch {}
      try { productColorsArr = JSON.parse(product.colors); } catch {}
    }

    return c.json({
      answer: promptText,
      sources: [],
      products: product
        ? [
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
              image_url: product.image_key ? `/api/images/${encodeURIComponent(product.image_key)}` : null,
            },
          ]
        : [],
      readyToConfirm: false,
    });
  }

  // 1. Vectorize câu hỏi bằng BGE-M3 (1024 chiều) với cơ chế chịu lỗi tự động (Resilience)
  let queryVector: number[] | null = null;
  try {
    const vectors = await embed(c, [question]);
    queryVector = vectors[0] || null;
  } catch (err: any) {
    console.warn('[Embedding Query Warning] Tự động chuyển chế độ tìm kiếm dự phòng:', err?.message || err);
  }

  // 2. Truy vấn Top-5 vectors tương đồng nhất trong Cloudflare Vectorize (nếu có vector)
  let matchIds: string[] = [];
  if (queryVector) {
    try {
      const matches = await c.env.VECTORIZE.query(queryVector, { topK: 5 });
      matchIds = matches.matches.map((m) => m.id).filter(Boolean);
    } catch (err: any) {
      console.warn('[Vectorize Query Warning]', err?.message || err);
    }
  }

  // 3. Trích xuất toàn văn nội dung & tiêu đề tri thức chính sách từ CSDL D1
  let contextChunks: Array<{ id: string; content: string; title: string }> = [];
  if (matchIds.length > 0) {
    const placeholders = matchIds.map(() => '?').join(',');
    const chunkResults = await c.env.DB.prepare(
      `SELECT chat_chunks.id, chat_chunks.content, chat_documents.title
       FROM chat_chunks
       JOIN chat_documents ON chat_documents.id = chat_chunks.document_id
       WHERE chat_chunks.id IN (${placeholders})`,
    )
      .bind(...matchIds)
      .all<{ id: string; content: string; title: string }>();

    const chunkMap = new Map(chunkResults.results.map((item) => [item.id, item]));
    contextChunks = matchIds
      .map((id) => chunkMap.get(id))
      .filter((item): item is { id: string; content: string; title: string } => Boolean(item));
  }

  // 4. TRỤ CỘT 1: TRUY VẤN SẢN PHẨM CÓ CẤU TRÚC QUA SQL (HYBRID SEARCH)
  const filters = extractProductFilters(question, history);
  let matchedProducts: ProductRecord[] = [];

  const hasSpecificFilter =
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.category !== null ||
    filters.brand !== null ||
    filters.color !== null;

  // Kiểm tra câu hỏi có liên quan đến chính sách / vận chuyển / đổi trả / bảo hành / cỡ giày
  const isPolicyQuery = /(?:chính sách|vận chuyển|freeship|giao hàng|đổi trả|bảo hành|đồng kiểm|size|cỡ|đo chân|thanh toán|đặt hàng|mua hàng)/i.test(
    question + ' ' + (history?.[history.length - 1]?.text || ''),
  );

  // Nếu người dùng đang tìm kiếm sản phẩm theo tiêu chí (giá, loại, hãng, màu),
  // loại bỏ các trích đoạn danh mục tổng 70 mẫu sneaker khỏi tri thức để tránh LLM bị phân tâm nhẩm lại 70 mẫu
  let filteredChunks = hasSpecificFilter
    ? contextChunks.filter(
        (chunk) =>
          !chunk.title.includes('70 Mẫu Sneaker') &&
          !chunk.title.includes('70 mau Sneaker'),
      )
    : contextChunks;

  // Nếu không hỏi về chính sách, chỉ lấy tối đa 2 chunks để giữ context window tinh gọn
  if (!isPolicyQuery) {
    filteredChunks = filteredChunks.slice(0, 2);
  }

  const knowledgeContext = filteredChunks
    .map((chunk) => `[Tài liệu: ${chunk.title}]\n${chunk.content}`)
    .join('\n\n');

  if (hasSpecificFilter) {
    const conditions: string[] = ['stock > 0'];
    const params: (string | number)[] = [];

    if (filters.minPrice !== null) {
      conditions.push('price >= ?');
      params.push(filters.minPrice);
    }
    if (filters.maxPrice !== null) {
      conditions.push('price <= ?');
      params.push(filters.maxPrice);
    }
    if (filters.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }
    if (filters.brand) {
      conditions.push('name LIKE ?');
      params.push(`%${filters.brand}%`);
    }
    if (filters.color) {
      conditions.push('(colors LIKE ? OR description LIKE ? OR name LIKE ?)');
      params.push(`%${filters.color}%`, `%${filters.color}%`, `%${filters.color}%`);
    }

    const sqlQuery = `SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE ${conditions.join(
      ' AND ',
    )} ORDER BY featured DESC, price ASC LIMIT 10`;

    const queryResult = await c.env.DB.prepare(sqlQuery)
      .bind(...params)
      .all<ProductRecord>();

    matchedProducts = queryResult.results;

    // Fallback nếu lọc theo màu quá chặt không ra kết quả, nới lỏng bỏ điều kiện màu sắc
    if (
      matchedProducts.length === 0 &&
      filters.color &&
      (filters.category || filters.minPrice !== null || filters.maxPrice !== null || filters.brand)
    ) {
      const fallbackConditions = conditions.filter((cond) => !cond.includes('colors LIKE'));
      const fallbackParams = params.filter(
        (val) => typeof val !== 'string' || !val.includes(filters.color!),
      );
      const fallbackSql = `SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE ${fallbackConditions.join(
        ' AND ',
      )} ORDER BY featured DESC, price ASC LIMIT 10`;

      const fallbackRes = await c.env.DB.prepare(fallbackSql)
        .bind(...fallbackParams)
        .all<ProductRecord>();

      matchedProducts = fallbackRes.results;
    }
  }

  // Nếu có bộ lọc giá trần (ví dụ dưới 1 triệu) mà không có sản phẩm nào khớp:
  // Không fallback lấy giày đắt tiền 4-5 triệu, mà tìm các mẫu có giá thấp nhất cửa hàng để tư vấn trung thực
  if (filters.maxPrice !== null && matchedProducts.length === 0) {
    const cheapestRes = await c.env.DB.prepare(
      'SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 ORDER BY price ASC LIMIT 3',
    ).all<ProductRecord>();
    matchedProducts = cheapestRes.results;
  } else if (matchedProducts.length === 0) {
    // Mặc định lấy 6 mẫu nổi bật (thay vì 10 để tiết kiệm context window)
    const defaultRes = await c.env.DB.prepare(
      'SELECT id, name, slug, category, description, price, compare_at_price, stock, sizes, colors, image_key, featured, created_at FROM products WHERE stock > 0 ORDER BY featured DESC, id DESC LIMIT 6',
    ).all<ProductRecord>();
    matchedProducts = defaultRes.results;
  }

  // Tinh gọn dữ liệu sản phẩm: rút gọn mô tả để tránh làm phình to context window
  const productContext = matchedProducts
    .map((p) => {
      let sizesStr = p.sizes;
      let colorsStr = p.colors;
      try {
        sizesStr = JSON.parse(p.sizes).join(', ');
      } catch {}
      try {
        colorsStr = JSON.parse(p.colors).join(', ');
      } catch {}
      const shortDesc = p.description ? p.description.split('.')[0] + '.' : '';
      return `${p.name} | ${p.category} | Giá: ${p.price.toLocaleString('vi-VN')} VND | Cỡ: ${sizesStr} | Màu: ${colorsStr} | ${shortDesc}`;
    })
    .join('\n');

  // 5. System Prompt thương hiệu & chỉ dẫn tích cực (Positive Prompting)
  const systemPrompt = `Bạn là chuyên viên tư vấn bán hàng của cửa hàng giày thể thao chính hãng One - Store (One).
Trách nhiệm của bạn:
- Tư vấn chọn giày thể thao, sneaker chạy bộ, chọn size giày theo dáng bàn chân và giải đáp chính sách bán hàng của One - Store (Freeship từ 3 đôi, đồng kiểm tận nơi, đổi trả 7 ngày miễn phí cước 2 chiều lần đầu, bảo hành 6-12 tháng).
- Giới thiệu các mẫu giày có trong DỮ LIỆU SẢN PHẨM KHỚP TIÊU CHÍ bên dưới (giá và tồn kho từ kho hàng One - Store).
- Nếu khách có câu hỏi nối tiếp (ví dụ: "vẫn tiêu chí trên", "có màu đỏ không"), hãy dựa vào hội thoại trước và dữ liệu hiện tại để giải đáp liền mạch.
- Nếu không có mẫu giày nào hoàn toàn khớp ngân sách của khách, hãy giải thích lịch sự mức giá sàn tại One - Store (mẫu tốt nhất bắt đầu từ 1.890.000 VND) và gợi ý các mẫu gần nhất.
- QUY TẮC PHẢN HỒI:
  1. Luôn trả lời trực tiếp bằng tiếng Việt lịch sự, thân thiện, súc tích như đang trò chuyện với khách tại cửa hàng. Bắt đầu bằng câu chào: "Chào bạn!", "Dạ chào bạn...".
  2. Viết câu trả lời tự nhiên dưới dạng đoạn văn hoặc danh sách số (1. , 2. ) rõ ràng.
  3. Xuất ra ngay câu trả lời hoàn chỉnh, không viết dàn ý, không dùng nhãn tiếng Anh (như Direct answer, Detail 1, Closing, Proactive suggestion).`;

  const userPrompt = `Câu hỏi của khách hàng: ${question}

DỮ LIỆU SẢN PHẨM KHỚP TIÊU CHÍ (TỪ KHO HÀNG ONE - STORE):
${productContext || 'Chưa có sản phẩm phù hợp.'}

TRÍCH ĐOẠN TRI THỨC CHÍNH SÁCH & CẨM NANG LIÊN QUAN:
${knowledgeContext || 'Không tìm thấy tài liệu liên quan.'}`;

  // 6. TRỤ CỘT 3: GHÉP HỘI THOẠI ĐA LƯỢT (MULTI-TURN CONVERSATION HISTORY)
  const conversationMessages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [{ role: 'system', content: systemPrompt }];

  // Thêm tối đa 3 lượt chat gần nhất từ lịch sử (lọc sạch tin lỗi hệ thống để chống nhiễm độc context)
  if (Array.isArray(history) && history.length > 0) {
    const validTurns = history.filter(
      (t) =>
        t &&
        typeof t.text === 'string' &&
        !t.text.includes('Lỗi hệ thống') &&
        !t.text.includes('Error') &&
        t.text.trim().length > 0,
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

  // Thêm lượt hỏi hiện tại kèm bối cảnh
  conversationMessages.push({
    role: 'user',
    content: userPrompt,
  });

  // 7. Gọi LLM Google Gemma 4 qua Workers AI
  let aiResponseText = '';
  try {
    const aiResult = (await c.env.AI.run('@cf/google/gemma-4-26b-a4b-it', {
      messages: conversationMessages,
      max_tokens: 2048,
      temperature: 0.2,
    })) as any;

    const message = aiResult?.choices?.[0]?.message;
    const finishReason = aiResult?.choices?.[0]?.finish_reason;
    const content = (message?.content || aiResult?.response || aiResult?.text || '').trim();
    const reasoning = message?.reasoning_content ? String(message.reasoning_content) : '';

    // Nếu content bị cụt do cạn tokens (finish_reason === 'length') hoặc content quá ngắn (< 150 ký tự)
    // trong khi reasoning_content chứa câu trả lời tiếng Việt hoàn chỉnh:
    if ((finishReason === 'length' || content.length < 150) && reasoning) {
      const extracted = extractAnswerFromReasoning(reasoning);
      aiResponseText = extracted && extracted.length > content.length ? extracted : (content || extracted);
    } else {
      aiResponseText = content;
    }
  } catch (err: any) {
    console.error('[Workers AI Gemma Error]', err?.message || err);
  }

  // 8. TRỤ CỘT 2: LÀM SẠCH VĂN BẢN BẰNG OUTPUT SANITIZER
  aiResponseText = cleanModelOutput(aiResponseText);

  // Fallback an toàn nếu LLM gặp sự cố
  if (!aiResponseText) {
    aiResponseText =
      'Dạ chào bạn, One - Store hiện phân phối độc quyền và chính hãng các dòng giày thể thao từ 10 thương hiệu hàng đầu Âu - Á (Nike, Adidas, Asics, Mizuno, New Balance, Salomon, Puma, Onitsuka Tiger, Li-Ning, Anta). Bạn đang quan tâm đến mẫu giày cụ thể nào hay cần One tư vấn chọn size giày chuẩn theo dáng chân nhé!';
  }

  // Trích xuất danh sách nguồn tài liệu đã tham khảo (unique)
  const sources = [...new Set(contextChunks.map((chunk) => chunk.title))];

  // 9. TRÍCH XUẤT CÁC SẢN PHẨM GỢI Ý ĐỂ HIỂN THỊ THẺ SẢN PHẨM TƯƠNG TÁC (INTERACTIVE MINI CARDS)
  const textLower = aiResponseText.toLowerCase();
  let matchedSuggested = matchedProducts.filter((p) => {
    const fullName = p.name.toLowerCase();
    // Tách các từ đặc trưng của mẫu giày (bỏ hãng ở đầu)
    const modelWords = fullName.split(' ').slice(1, 4).join(' ');
    return (
      textLower.includes(fullName) ||
      (modelWords.length > 5 && textLower.includes(modelWords))
    );
  });

  // Nếu không tìm thấy bằng so khớp tên nhưng có bộ lọc cụ thể, lấy tối đa 3-4 sản phẩm phù hợp nhất
  if (matchedSuggested.length === 0 && hasSpecificFilter) {
    matchedSuggested = matchedProducts.slice(0, 3);
  }

  const suggestedProducts = matchedSuggested.slice(0, 4).map((p) => {
    let sizesArr: string[] = [];
    let colorsArr: string[] = [];
    try {
      sizesArr = typeof p.sizes === 'string' ? JSON.parse(p.sizes) : p.sizes;
    } catch {
      sizesArr = typeof p.sizes === 'string' ? p.sizes.split(',') : [];
    }
    try {
      colorsArr = typeof p.colors === 'string' ? JSON.parse(p.colors) : p.colors;
    } catch {
      colorsArr = typeof p.colors === 'string' ? p.colors.split(',') : [];
    }

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
      image_url: p.image_key ? `/api/images/${encodeURIComponent(p.image_key)}` : null,
    };
  });

  return c.json({
    answer: aiResponseText,
    sources,
    products: suggestedProducts,
    readyToConfirm: false,
  });
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
