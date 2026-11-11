/**
 * Kiểm thử tự động tính năng Bắt dao động giọng nói & Tự ngắt sau 2 giây im lặng (VAD)
 * Dự án One - Store — Chatbot Widget UX Upgrade
 */

import fs from 'fs';
import {
  SilenceDetector,
  computeAudioMetrics,
  createIdleBars,
  DEFAULT_SILENCE_TIMEOUT_MS,
} from '../frontend/src/lib/voice';

let passed = 0;
let failed = 0;

function check(desc: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`[PASS] ${desc}`);
    passed++;
  } else {
    console.error(`[FAIL] ${desc}${detail ? ' -> ' + detail : ''}`);
    failed++;
  }
}

console.log('=== KIỂM THỬ VOICE OSCILLATION & 2S SILENCE AUTO-STOP ===\n');

// 1. Kiểm tra hằng số mặc định
check('Ngưỡng tự ngắt im lặng mặc định đúng 2000ms (2s)', DEFAULT_SILENCE_TIMEOUT_MS === 2000);

// 2. Kiểm tra tính toán biên độ sóng âm (computeAudioMetrics)
{
  const silentTime = new Uint8Array(1024).fill(128);
  const silentFreq = new Uint8Array(512).fill(0);
  const mSilent = computeAudioMetrics(silentTime, silentFreq, 14);
  check('Trạng thái im lặng trả về rms = 0, level = 0, 14 thanh sóng nghỉ', mSilent.rms === 0 && mSilent.level === 0 && mSilent.bars.length === 14);

  const speechTime = new Uint8Array(1024);
  for (let i = 0; i < speechTime.length; i++) {
    speechTime[i] = Math.round(128 + Math.sin(i * 0.25) * 42);
  }
  const speechFreq = new Uint8Array(512).fill(150);
  const mSpeech = computeAudioMetrics(speechTime, speechFreq, 14);
  check('Trạng thái có dao động giọng nói trả về rms > 0.15, level > 0.7', mSpeech.rms > 0.15 && mSpeech.level > 0.7);
  check('Các thanh waveform dao động vượt ngưỡng nghỉ', mSpeech.bars.every((b) => b > 0.5));
  check('createIdleBars tạo đúng 14 thanh sóng mặc định', createIdleBars().length === 14);
}

// 3. Kịch bản A: Khách bấm micro nhưng KHÔNG nói gì trong 2s -> ngắt lúc 2000ms với hasSpoken = false
{
  const vad = new SilenceDetector(0, { silenceTimeoutMs: 2000 });
  let last = vad.update(0.002, 0.005, 500);
  check('Kịch bản A (500ms im lặng): chưa ngắt, hasSpoken = false', !last.shouldAutoStop && !last.hasSpoken);

  last = vad.update(0.003, 0.006, 1950);
  check('Kịch bản A (1950ms im lặng): vẫn chưa ngắt trước mốc 2s', !last.shouldAutoStop);

  last = vad.update(0.002, 0.005, 2000);
  check('Kịch bản A (đạt đúng 2000ms im lặng): tự động ngắt với hasSpoken = false', last.shouldAutoStop && !last.hasSpoken);
}

// 4. Kịch bản B: Khách nói trong 1.5s, nghỉ nhịp ngắn 0.8s, nói tiếp, rồi im lặng 2s -> ngắt với hasSpoken = true
{
  const vad = new SilenceDetector(1000, { silenceTimeoutMs: 2000 });

  // Nhiễu nền ban đầu (0-250ms)
  vad.update(0.006, 0.012, 1050);
  vad.update(0.006, 0.012, 1150);

  // Khách bắt đầu nói (2 khung hình liên tiếp vượt ngưỡng -> xác nhận có tiếng nói)
  vad.update(0.07, 0.16, 1300);
  let res = vad.update(0.08, 0.18, 1350);
  check('Kịch bản B: bắt được dao động giọng nói (isSpeaking = true, hasSpoken = true)', res.isSpeaking && res.hasSpoken);

  // Ngừng nói 800ms để lấy hơi (chưa tới 2s -> KHÔNG được ngắt)
  res = vad.update(0.005, 0.01, 2150);
  check('Kịch bản B: nghỉ lấy hơi 800ms không bị ngắt sớm', !res.shouldAutoStop && res.hasSpoken);

  // Nói tiếp từ 2200ms đến 3000ms
  vad.update(0.06, 0.14, 2200);
  res = vad.update(0.09, 0.2, 3000);
  check('Kịch bản B: nói tiếp reset bộ đếm im lặng về 0', res.isSpeaking && res.silenceMs === 0);

  // Ngừng hẳn sau 3000ms
  res = vad.update(0.004, 0.009, 4500);
  check('Kịch bản B (im lặng 1.5s sau câu nói): tiếp tục chờ, remaining = 500ms', !res.shouldAutoStop && res.remainingSilenceMs === 500);

  res = vad.update(0.004, 0.009, 5000);
  check('Kịch bản B (đạt 2.0s im lặng sau khi nói xong): tự động ngắt để gửi Whisper', res.shouldAutoStop && res.hasSpoken);
}

// 5. Kịch bản C: Chống nhiễu nền quạt gió liên tục (noise floor ~ 0.015) vẫn ngắt sau 2s im lặng
{
  const vad = new SilenceDetector(0, { silenceTimeoutMs: 2000 });
  vad.update(0.015, 0.025, 50);
  vad.update(0.015, 0.025, 150);
  vad.update(0.015, 0.025, 250);
  // Nói rõ trên nền ồn
  vad.update(0.09, 0.2, 500);
  const speaking = vad.update(0.09, 0.2, 550);
  check('Kịch bản C: vẫn bắt được giọng nói trên nền ồn quạt gió', speaking.isSpeaking && speaking.hasSpoken);

  // Trở về nền ồn 0.015 trong 2s -> phải tự ngắt được
  vad.update(0.015, 0.025, 1500);
  const stopped = vad.update(0.015, 0.025, 2550);
  check('Kịch bản C: tự động ngắt sau 2s khi chỉ còn tiếng ồn nền ổn định', stopped.shouldAutoStop && stopped.hasSpoken);
}

// 6. Kiểm tra UI/CSS cho icon Micro to và tích hợp ChatbotWidget
{
  const widgetSrc = fs.readFileSync('frontend/src/components/ChatbotWidget.tsx', 'utf8');
  const cssSrc = fs.readFileSync('frontend/src/app/globals.css', 'utf8');

  check('ChatbotWidget dùng icon Mic kích thước lớn (size={24})', widgetSrc.includes('<Mic size={24}'));
  check('ChatbotWidget hiển thị thanh dao động sóng âm và đếm ngược im lặng', widgetSrc.includes('voice-waveform') && widgetSrc.includes('voice-silence-fill'));
  check('ChatbotWidget xử lý callback onSilenceAutoStop', widgetSrc.includes('recorder.onSilenceAutoStop'));
  check('globals.css đặt kích thước nút micro 48x48px và padding: 0 không bị ép icon', cssSrc.includes('width: 48px;') && cssSrc.includes('height: 48px;') && cssSrc.includes('padding: 0;'));
}

console.log(`\n=== KẾT QUẢ KIỂM THỬ VOICE VAD: ${passed} ĐẠT / ${failed} THẤT BẠI ===`);
if (failed > 0) process.exit(1);

