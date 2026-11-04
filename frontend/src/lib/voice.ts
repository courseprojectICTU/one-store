/**
 * Tiện ích ghi âm giọng nói Web MediaRecorder & gửi tới API Whisper
 * Dự án One - Store — Trợ lý "Tư vấn One v2.0"
 */

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private duration = 0;
  private maxDuration = 15; // Giới hạn tối đa 15 giây

  public onTick?: (seconds: number) => void;
  public onMaxDurationReached?: () => void;

  public static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      Boolean(navigator?.mediaDevices?.getUserMedia) &&
      typeof window.MediaRecorder !== 'undefined'
    );
  }

  public async start(): Promise<void> {
    if (!VoiceRecorder.isSupported()) {
      throw new Error('Trình duyệt của bạn không hỗ trợ chức năng ghi âm giọng nói');
    }

    this.audioChunks = [];
    this.duration = 0;

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

      this.timer = setInterval(() => {
        this.duration += 1;
        this.onTick?.(this.duration);
        if (this.duration >= this.maxDuration) {
          this.onMaxDurationReached?.();
        }
      }, 1000);
    } catch (err: any) {
      this.cleanup();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Bạn đã từ chối cấp quyền micro. Vui lòng bật quyền truy cập microphone trong cài đặt trình duyệt để sử dụng tính năng nói.');
      }
      throw new Error('Không thể khởi động micro: ' + (err.message || 'Lỗi thiết bị'));
    }
  }

  public async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        reject(new Error('Bộ thu âm chưa được kích hoạt'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  public cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
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
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
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
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || `Lỗi nhận dạng âm thanh (HTTP ${res.status})`);
  }

  const data = await res.json();
  return (data?.text || '').trim();
}

