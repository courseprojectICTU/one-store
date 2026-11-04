/**
 * Module Xử lý Nhận dạng Giọng nói Đa phương thức (Multimodal Voice Speech-to-Text)
 * Dự án One - Store — Trợ lý "Tư vấn One v2.0"
 * 
 * Sử dụng mô hình @cf/openai/whisper-large-v3-turbo chạy trực tiếp trên Cloudflare Workers AI (binding c.env.AI)
 * Tích hợp kỹ thuật Acoustic Domain Prompting chuyên sâu cho 10 thương hiệu giày thể thao hàng đầu Âu - Á
 */

export const WHISPER_MODEL_NAME = '@cf/openai/whisper-large-v3-turbo';
export const MIN_AUDIO_BYTES = 1500;
export const MAX_AUDIO_BYTES = 3 * 1024 * 1024; // 3 MB

// Prompt dẫn đường ngữ cảnh âm học ngắn gọn, định hướng thương hiệu giày
export const SNEAKER_ACOUSTIC_PROMPT =
  'Khách hỏi tư vấn và mua giày thể thao, sneaker chính hãng tại One Store: Nike, Adidas, Asics, Mizuno, Hoka, Puma, Jordan, New Balance, cỡ size, phom chân bè, chạy bộ marathon, đổi trả.';

// Loại bỏ các mẫu ảo giác phổ biến của Whisper khi im lặng hoặc tiếng ồn nền
const HALLUCINATION = /đăng ký (kênh|channel)|subscribe|cảm ơn (các )?bạn đã (xem|theo dõi)|hẹn gặp lại (các )?bạn|amara\.org|phụ đề/i;

const toBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
};

// Sửa các lỗi phiên âm tên riêng phổ biến của tiếng Việt
const fixPhonetics = (t: string): string =>
  t
    .replace(/\b(one shop|văn store|oan store)\b/gi, 'One - Store')
    .replace(/\b(a xích|a xít|a sic|asic)\b/gi, 'Asics')
    .replace(/\b(mi du no|mi du nô)\b/gi, 'Mizuno')
    .replace(/\b(niu ba lăng|niu ba lơn)\b/gi, 'New Balance')
    .replace(/\b(hồ ka|hô ka)\b/gi, 'Hoka')
    .replace(/\b(swoom|sô[- ]?rum|show ?room|shop ?room)\b/gi, 'showroom');

// Gộp các cụm từ bị lặp lại vô hạn (Whisper stuttering loop)
export function collapseRepeats(text: string): string {
  const w = text.split(' ').filter(Boolean);
  const norm = w.map((x) => x.toLowerCase().replace(/[.,!?;:]+$/, ''));
  const out: string[] = [];
  for (let i = 0; i < w.length; ) {
    let skipped = false;
    const maxN = Math.min(8, Math.floor((w.length - i) / 2));
    for (let n = 1; n <= maxN && !skipped; n++) {
      const unit = norm.slice(i, i + n).join(' ');
      let r = 1;
      while (i + (r + 1) * n <= w.length && norm.slice(i + r * n, i + (r + 1) * n).join(' ') === unit) {
        r++;
      }
      if (r >= (n === 1 ? 3 : 2)) {
        out.push(...w.slice(i, i + n));
        i += r * n;
        skipped = true;
      }
    }
    if (!skipped) out.push(w[i++]);
  }
  return out.join(' ');
}

export function sanitizeTranscribedText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  const cleaned = collapseRepeats(
    fixPhonetics(
      rawText
        .trim()
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‍⁠﻿]/g, '')
        .replace(/\s+/g, ' '),
    ),
  );
  return HALLUCINATION.test(cleaned) ? '' : cleaned;
}

export interface TranscribeResult {
  text: string;
  wordCount: number;
}

/**
 * Gọi mô hình Whisper Large v3 Turbo trên Cloudflare Workers AI qua base64 encoding
 */
export async function transcribeAudio(
  aiBinding: any,
  audioBuffer: ArrayBuffer,
  language = 'vi',
): Promise<TranscribeResult> {
  if (!aiBinding) {
    throw new Error('Cloudflare Workers AI binding (c.env.AI) không khả dụng');
  }

  if (!audioBuffer || audioBuffer.byteLength < MIN_AUDIO_BYTES) {
    return { text: '', wordCount: 0 };
  }

  try {
    const base64Audio = toBase64(audioBuffer);
    const result = (await aiBinding.run(WHISPER_MODEL_NAME, {
      audio: base64Audio,
      task: 'transcribe',
      language,
      vad_filter: true,
      condition_on_previous_text: false,
      initial_prompt: SNEAKER_ACOUSTIC_PROMPT,
    })) as { text?: string };

    const rawText = result?.text || '';
    const cleanedText = sanitizeTranscribedText(rawText);
    const wordCount = cleanedText ? cleanedText.split(/\s+/).filter(Boolean).length : 0;

    return {
      text: cleanedText,
      wordCount,
    };
  } catch (err: any) {
    console.error('[Whisper Transcribe Error]', err?.message || err);
    throw new Error('Không thể chuyển đổi giọng nói: ' + (err?.message || 'Lỗi mô hình Whisper'));
  }
}
