/**
 * Tiện ích ghi âm giọng nói Web MediaRecorder, phân tích dao động âm học (Web Audio API)
 * tự động ngắt sau im lặng, và gửi tới API Whisper
 * Dự án One - Store — Trợ lý "Tư vấn One"
 */

export const DEFAULT_SILENCE_TIMEOUT_MS = 2000;
export const DEFAULT_MAX_DURATION_SEC = 15;
export const DEFAULT_WAVEFORM_BARS = 14;

export interface VoiceActivityState {
  level: number;
  bars: number[];
  isSpeaking: boolean;
  hasSpoken: boolean;
  silenceMs: number;
  silenceTimeoutMs: number;
}

export interface AudioMetrics {
  rms: number;
  peak: number;
  level: number;
  bars: number[];
}

export interface SilenceDetectorOptions {
  silenceTimeoutMs?: number;
  minSpeechFloor?: number;
  calibrationMs?: number;
}

export interface SilenceUpdateResult {
  isSpeaking: boolean;
  hasSpoken: boolean;
  silenceMs: number;
  remainingSilenceMs: number;
  shouldAutoStop: boolean;
  noiseFloor: number;
  speechThreshold: number;
}

/**
 * Tạo mảng thanh sóng ở trạng thái nghỉ ban đầu
 */
export function createIdleBars(barCount = DEFAULT_WAVEFORM_BARS): number[] {
  return Array.from({ length: barCount }, () => 0.14);
}

/**
 * Tính toán biên độ dao động RMS, đỉnh xung và dải tần sóng âm trực quan
 */
export function computeAudioMetrics(
  timeDomainBytes: Uint8Array,
  frequencyBytes?: Uint8Array,
  barCount = DEFAULT_WAVEFORM_BARS,
): AudioMetrics {
  const len = timeDomainBytes.length;
  if (len === 0) {
    return { rms: 0, peak: 0, level: 0, bars: createIdleBars(barCount) };
  }

  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < len; i++) {
    const centered = (timeDomainBytes[i] - 128) / 128;
    const absVal = Math.abs(centered);
    if (absVal > peak) peak = absVal;
    sumSq += centered * centered;
  }

  const rms = Math.sqrt(sumSq / len);
  const level = Math.min(1, Math.pow(rms / 0.11, 0.65));

  const bars: number[] = [];
  if (frequencyBytes && frequencyBytes.length >= barCount) {
    // Tập trung dải tần giọng nói (khoảng 100Hz - 4kHz ở nửa đầu phổ FFT)
    const usableBins = Math.max(barCount, Math.floor(frequencyBytes.length * 0.45));
    const step = Math.max(1, Math.floor(usableBins / barCount));
    for (let b = 0; b < barCount; b++) {
      let binSum = 0;
      const start = b * step;
      const end = Math.min(usableBins, start + step);
      for (let k = start; k < end; k++) {
        binSum += frequencyBytes[k];
      }
      const avg = end > start ? binSum / ((end - start) * 255) : 0;
      const weighted = Math.max(level * 0.65, avg * 0.85 + level * 0.35);
      bars.push(Math.min(1, Math.max(0.14, weighted)));
    }
  } else {
    const mid = (barCount - 1) / 2;
    for (let b = 0; b < barCount; b++) {
      const dist = Math.abs(b - mid) / Math.max(1, mid);
      const envelope = 1 - dist * 0.45;
      bars.push(Math.min(1, Math.max(0.14, level * envelope)));
    }
  }

  return { rms, peak, level, bars };
}

/**
 * Bộ phát hiện hoạt động giọng nói (VAD) & tự động ngắt khi im lặng 2 giây
 * Tự hiệu chỉnh ngưỡng nhiễu nền (adaptive noise floor) để ổn định trong nhiều môi trường
 */
export class SilenceDetector {
  private readonly silenceTimeoutMs: number;
  private readonly minSpeechFloor: number;
  private readonly calibrationMs: number;

  private startTimeMs: number;
  private lastSpeechAtMs: number;
  private noiseFloor = 0.008;
  private isSpeaking = false;
  private hasSpoken = false;
  private consecutiveSpeechFrames = 0;

  constructor(startTimeMs: number, options: SilenceDetectorOptions = {}) {
    this.silenceTimeoutMs = options.silenceTimeoutMs ?? DEFAULT_SILENCE_TIMEOUT_MS;
    this.minSpeechFloor = options.minSpeechFloor ?? 0.015;
    this.calibrationMs = options.calibrationMs ?? 250;
    this.startTimeMs = startTimeMs;
    this.lastSpeechAtMs = startTimeMs;
  }

  public update(rms: number, peak: number, nowMs: number): SilenceUpdateResult {
    const elapsedMs = Math.max(0, nowMs - this.startTimeMs);

    // Hiệu chỉnh ngưỡng nhiễu nền trong 250ms đầu hoặc khi đang yên lặng
    if (elapsedMs <= this.calibrationMs) {
      if (rms < 0.04) {
        this.noiseFloor = elapsedMs <= 60 ? rms : this.noiseFloor * 0.75 + rms * 0.25;
        this.noiseFloor = Math.min(0.035, Math.max(0.004, this.noiseFloor));
      }
    }

    const enterThreshold = Math.max(
      this.minSpeechFloor,
      Math.min(0.075, this.noiseFloor * 2.35),
    );
    const exitThreshold = enterThreshold * 0.72;

    if (!this.isSpeaking && elapsedMs > this.calibrationMs && rms < enterThreshold * 0.85) {
      this.noiseFloor = Math.min(0.04, Math.max(0.004, this.noiseFloor * 0.97 + rms * 0.03));
    }

    const activeTrigger =
      elapsedMs <= this.calibrationMs
        ? rms >= Math.max(0.026, enterThreshold) || peak >= 0.09
        : rms >= enterThreshold || peak >= enterThreshold * 2.5;

    if (this.isSpeaking) {
      if (rms >= exitThreshold || peak >= exitThreshold * 2.4) {
        this.lastSpeechAtMs = nowMs;
      } else {
        this.isSpeaking = false;
        this.consecutiveSpeechFrames = 0;
      }
    } else if (activeTrigger) {
      this.consecutiveSpeechFrames += 1;
      // Yêu cầu 2 khung hình liên tiếp (~100ms) để loại bỏ xung click chuột khi bấm micro
      if (this.consecutiveSpeechFrames >= 2) {
        this.isSpeaking = true;
        this.hasSpoken = true;
        this.lastSpeechAtMs = nowMs;
      }
    } else {
      this.consecutiveSpeechFrames = 0;
    }

    const silenceMs = Math.max(0, nowMs - this.lastSpeechAtMs);
    const remainingSilenceMs = Math.max(0, this.silenceTimeoutMs - silenceMs);

    return {
      isSpeaking: this.isSpeaking,
      hasSpoken: this.hasSpoken,
      silenceMs,
      remainingSilenceMs,
      shouldAutoStop: silenceMs >= this.silenceTimeoutMs,
      noiseFloor: this.noiseFloor,
      speechThreshold: enterThreshold,
    };
  }

  public getHasSpoken(): boolean {
    return this.hasSpoken;
  }
}

export interface VoiceRecorderOptions {
  maxDuration?: number;
  silenceTimeoutMs?: number;
  barCount?: number;
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private vadTimer: ReturnType<typeof setInterval> | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private silenceDetector: SilenceDetector | null = null;
  private autoStopTriggered = false;

  private duration = 0;
  private readonly maxDuration: number;
  private readonly silenceTimeoutMs: number;
  private readonly barCount: number;

  public onTick?: (seconds: number) => void;
  public onMaxDurationReached?: () => void;
  public onAudioActivity?: (state: VoiceActivityState) => void;
  public onSilenceAutoStop?: (info: { hasSpoken: boolean; silenceMs: number }) => void;

  constructor(options: VoiceRecorderOptions = {}) {
    this.maxDuration = options.maxDuration ?? DEFAULT_MAX_DURATION_SEC;
    this.silenceTimeoutMs = options.silenceTimeoutMs ?? DEFAULT_SILENCE_TIMEOUT_MS;
    this.barCount = options.barCount ?? DEFAULT_WAVEFORM_BARS;
  }

  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      Boolean(navigator?.mediaDevices?.getUserMedia) &&
      typeof window.MediaRecorder !== 'undefined'
    );
  }

  public getHasSpoken(): boolean {
    return this.silenceDetector?.getHasSpoken() ?? false;
  }

  public async start(): Promise<void> {
    if (!VoiceRecorder.isSupported()) {
      throw new Error('Trình duyệt của bạn không hỗ trợ chức năng ghi âm giọng nói');
    }

    this.audioChunks = [];
    this.duration = 0;
    this.autoStopTriggered = false;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Chọn mimeType phù hợp nhất
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      }

      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250); // Thu thập chunk mỗi 250ms

      await this.setupOscillationMonitoring();

      this.timer = setInterval(() => {
        this.duration += 1;
        this.onTick?.(this.duration);
        if (this.duration >= this.maxDuration && !this.autoStopTriggered) {
          this.autoStopTriggered = true;
          this.onMaxDurationReached?.();
        }
      }, 1000);
    } catch (err: unknown) {
      this.cleanup();
      const errName = err instanceof Error ? err.name : '';
      const errMsg = err instanceof Error ? err.message : 'Lỗi thiết bị';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        throw new Error('Bạn đã từ chối cấp quyền micro. Vui lòng bật quyền truy cập microphone trong cài đặt trình duyệt để sử dụng tính năng nói.');
      }
      throw new Error('Không thể khởi động micro: ' + errMsg);
    }
  }

  private async setupOscillationMonitoring(): Promise<void> {
    if (!this.stream || typeof window === 'undefined') return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.25;

      const source = ctx.createMediaStreamSource(this.stream);
      source.connect(analyser);

      this.audioContext = ctx;
      this.sourceNode = source;
      this.analyser = analyser;

      const timeData = new Uint8Array(analyser.fftSize);
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      this.silenceDetector = new SilenceDetector(Date.now(), {
        silenceTimeoutMs: this.silenceTimeoutMs,
      });

      // Dùng setInterval 50ms (20Hz) thay cho rAF để đảm bảo bộ đếm im lặng 2s không bị pause khi mất focus
      this.vadTimer = setInterval(() => {
        if (!this.analyser || !this.silenceDetector || this.autoStopTriggered) return;

        this.analyser.getByteTimeDomainData(timeData);
        this.analyser.getByteFrequencyData(freqData);

        const metrics = computeAudioMetrics(timeData, freqData, this.barCount);
        const vad = this.silenceDetector.update(metrics.rms, metrics.peak, Date.now());

        this.onAudioActivity?.({
          level: metrics.level,
          bars: metrics.bars,
          isSpeaking: vad.isSpeaking,
          hasSpoken: vad.hasSpoken,
          silenceMs: vad.silenceMs,
          silenceTimeoutMs: this.silenceTimeoutMs,
        });

        if (vad.shouldAutoStop && !this.autoStopTriggered) {
          this.autoStopTriggered = true;
          this.onSilenceAutoStop?.({
            hasSpoken: vad.hasSpoken,
            silenceMs: vad.silenceMs,
          });
        }
      }, 50);
    } catch {
      // Suy giảm an toàn: nếu Web Audio API bị chặn, MediaRecorder vẫn thu âm bình thường
    }
  }

  public async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        reject(new Error('Bộ thu âm chưa được kích hoạt'));
        return;
      }

      const recorder = this.mediaRecorder;
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanup();
        resolve(blob);
      };

      recorder.stop();
    });
  }

  public cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.stop();
      } catch {}
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.vadTimer) {
      clearInterval(this.vadTimer);
      this.vadTimer = null;
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }
    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch {}
      this.analyser = null;
    }
    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(() => {});
      }
      this.audioContext = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.silenceDetector = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.duration = 0;
  }
}

/**
 * Gửi Blob âm thanh lên endpoint /api/chat/transcribe
 */
export async function transcribeAudioBlob(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');

  const res = await fetch('/api/chat/transcribe', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errData?.error || `Lỗi nhận dạng âm thanh (HTTP ${res.status})`);
  }

  const data = (await res.json()) as { text?: string };
  return (data?.text || '').trim();
}
