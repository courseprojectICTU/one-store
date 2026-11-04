'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api, money, imageOf } from '@/lib/api';
import { ChatMessage, PendingOrderInfo } from '@/types';
import Logo from './Logo';
import { useShop } from '@/context/ShopContext';
import { readSSEStream } from '@/lib/sse';
import { VoiceRecorder, transcribeAudioBlob } from '@/lib/voice';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  FileText,
  Bot,
  ChevronRight,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Mic,
  MicOff,
  Square,
} from 'lucide-react';

/**
 * Trình dựng văn bản Markdown an toàn (Zero-dependency, XSS-safe):
 * - Parse cú pháp in đậm **bold** -> <strong>
 * - Parse cú pháp in nghiêng *italic* -> <em>
 * - Loại bỏ triệt để các ký tự đặc biệt Markdown mồ côi (*, **, __, #, ~)
 * - Parse danh sách số (1. , 2. ) và gạch đầu dòng (- , * ) với thụt lề chuyên nghiệp
 * - Giữ khoảng cách phân đoạn văn bản thoáng đãng, dễ đọc
 */
function FormattedChatContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (!content) return null;

  // Tách văn bản thành từng khối đoạn văn bản qua ranh giới 2 lần xuống dòng
  const paragraphs = content.split(/\n{2,}/);

  const parseInline = (text: string): React.ReactNode[] => {
    // Tách các cụm **bold** và *italic*
    const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return tokens.map((token, idx) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        return (
          <strong
            key={idx}
            style={{
              fontWeight: 700,
              color: isUser ? '#ffffff' : '#0f172a',
            }}
          >
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
        return (
          <em key={idx} style={{ fontStyle: 'italic' }}>
            {token.slice(1, -1)}
          </em>
        );
      }
      // Nghiêm cấm hiển thị ký tự đặc biệt Markdown mồ côi ra màn hình
      const sanitized = token.replace(/[*_#~`]/g, '');
      return sanitized;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        return (
          <div key={pIdx} style={{ margin: 0 }}>
            {lines.map((line, lIdx) => {
              let normLine = line.trim();
              if (!normLine) return null;

              // 1. Chuẩn hóa "- 1. " hoặc "* 1. " -> "1. " (tránh lỗi double bullet)
              normLine = normLine.replace(/^[-*•]\s+(\d+)\.\s*/, '$1. ');

              // 2. Chuẩn hóa "**1. Tiêu đề:**" -> "1. **Tiêu đề:**"
              normLine = normLine.replace(/^\*\*(\d+)\.\s*(.*?)\*\*/, '$1. **$2**');

              // 3. Khôi phục nếu thiếu mở ** trước dấu hai chấm :**
              normLine = normLine.replace(/^(\d+)\.\s*([^*:\n]+):(\*{2,})/, '$1. **$2:**');
              normLine = normLine.replace(/^([-*•]\s+)([^*:\n]+):(\*{2,})/, '$1**$2:**');
              normLine = normLine.replace(/^([^*:\n]+):(\*{2,})/, '**$1:**');

              // 4. Kiểm tra nếu là danh sách đánh số: "1. ", "2. "
              const numMatch = normLine.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div
                    key={lIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      marginTop: lIdx > 0 ? '6px' : '2px',
                      paddingLeft: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: isUser ? '#ffffff' : '#e11d48',
                        minWidth: '18px',
                        flexShrink: 0,
                      }}
                    >
                      {numMatch[1]}.
                    </span>
                    <span style={{ flex: 1 }}>{parseInline(numMatch[2])}</span>
                  </div>
                );
              }

              // 5. Kiểm tra nếu là gạch đầu dòng: "- ", "* ", "• "
              const bulletMatch = normLine.match(/^[-*•]\s+(.*)/);
              if (bulletMatch) {
                // Loại bỏ hoa thị hoặc gạch đầu dòng lồng nhau (ví dụ: "- * ", "* * ")
                const cleanItem = bulletMatch[1].replace(/^[-*•]\s+/, '').replace(/^\*(?!\*)\s+/, '');
                return (
                  <div
                    key={lIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginTop: lIdx > 0 ? '4px' : '2px',
                      paddingLeft: '4px',
                    }}
                  >
                    <span
                      style={{
                        color: isUser ? '#ffffff' : '#e11d48',
                        fontSize: '11px',
                        lineHeight: '1.6',
                        flexShrink: 0,
                      }}
                    >
                      •
                    </span>
                    <span style={{ flex: 1 }}>{parseInline(cleanItem)}</span>
                  </div>
                );
              }

              // Dòng văn xuôi thông thường
              return (
                <div key={lIdx} style={{ marginTop: lIdx > 0 ? '4px' : 0 }}>
                  {parseInline(normLine)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function ChatbotWidget() {
  const { dict, locale, setSelectedProduct, setActiveModal, addRecentOrder } = useShop();
  const cb = dict.modals.chatbot;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingOrderInfo | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Trạng thái thu âm giọng nói (Whisper AI)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);

  // Trạng thái streaming SSE thời gian thực và ngắt luồng
  const [statusText, setStatusText] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {}
  };

  const handleViewOrder = (code: string) => {
    setIsOpen(false);
    window.location.href = `/orders?code=${encodeURIComponent(code)}`;
  };

  // Khởi tạo tin nhắn chào mừng ban đầu
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text:
          locale === 'vi'
            ? 'Dạ chào bạn! Em là trợ lý Tư vấn One. Em có thể hỗ trợ bạn chọn size giày chuẩn theo dáng chân, chọn giày chạy bộ/marathon hay giải đáp các chính sách freeship, đổi trả và bảo hành chính hãng ạ.'
            : cb.welcome,
      },
    ]);
  }, [cb.welcome, locale]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isSending]);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    setStatusText(null);
  };

  const handleVoiceToggle = async () => {
    if (isRecording) {
      if (!voiceRecorderRef.current) return;
      try {
        setIsSending(true);
        setStatusText(locale === 'vi' ? 'Đang chuyển đổi giọng nói qua Whisper AI...' : 'Transcribing voice via Whisper AI...');
        const blob = await voiceRecorderRef.current.stop();
        setIsRecording(false);
        setRecordingSeconds(0);
        const transcribed = await transcribeAudioBlob(blob);
        setStatusText(null);
        setIsSending(false);
        if (transcribed && transcribed.trim().length >= 2) {
          setInputQuestion(transcribed.trim());
          handleSend(transcribed.trim());
        }
      } catch (err: any) {
        setIsRecording(false);
        setRecordingSeconds(0);
        setStatusText(null);
        setIsSending(false);
        setVoiceError(err?.message || 'Không thể nhận dạng âm thanh');
        setTimeout(() => setVoiceError(null), 4500);
      }
    } else {
      if (!VoiceRecorder.isSupported()) {
        setVoiceError(locale === 'vi' ? 'Trình duyệt không hỗ trợ micro' : 'Browser does not support microphone');
        setTimeout(() => setVoiceError(null), 3000);
        return;
      }
      setVoiceError(null);
      const recorder = new VoiceRecorder();
      recorder.onTick = (sec) => setRecordingSeconds(sec);
      recorder.onMaxDurationReached = () => {
        handleVoiceToggle();
      };
      voiceRecorderRef.current = recorder;

      try {
        await recorder.start();
        setIsRecording(true);
      } catch (err: any) {
        setVoiceError(err?.message || 'Lỗi bật micro');
        setTimeout(() => setVoiceError(null), 4000);
      }
    }
  };

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isSending) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: q,
    };

    const replyMsgId = 'reply-' + Date.now();
    const initialBotMsg: ChatMessage = {
      id: replyMsgId,
      role: 'assistant',
      text: '',
      isStreaming: true,
      sources: [],
      products: [],
      chips: [],
    };

    setMessages((prev) => [...prev, userMsg, initialBotMsg]);
    setInputQuestion('');
    setIsSending(true);
    setStatusText(locale === 'vi' ? 'Đang kết nối...' : 'Connecting...');

    try {
      const recentHistory = messages
        .filter((m) => m.id !== 'welcome' && (m.role === 'user' || m.role === 'assistant') && m.text.trim())
        .slice(-6)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          text: m.text.slice(0, 2000),
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json',
        },
        body: JSON.stringify({
          question: q,
          history: recentHistory,
          pendingOrder: pendingOrder || undefined,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.error || ('HTTP ' + res.status));
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream')) {
        let accumulatedText = '';
        await readSSEStream(
          res,
          {
            onStatus: (msg) => {
              setStatusText(msg);
            },
            onDelta: (chunk) => {
              accumulatedText += chunk;
              setStatusText(null);
              setMessages((prev) =>
                prev.map((m) => (m.id === replyMsgId ? { ...m, text: accumulatedText } : m)),
              );
            },
            onProducts: (productsList) => {
              setMessages((prev) =>
                prev.map((m) => (m.id === replyMsgId ? { ...m, products: productsList } : m)),
              );
            },
            onSources: (sourcesList) => {
              const srcStrings = sourcesList.map((item: any) =>
                typeof item === 'string' ? item : item?.title || cb.default_doc_title,
              );
              setMessages((prev) =>
                prev.map((m) => (m.id === replyMsgId ? { ...m, sources: srcStrings } : m)),
              );
            },
            onOrderReady: (data) => {
              setPendingOrder(data.pendingOrder);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === replyMsgId
                    ? {
                        ...m,
                        readyToConfirm: data.readyToConfirm,
                        pendingOrder: data.pendingOrder,
                      }
                    : m,
                ),
              );
            },
            onOrderCreated: (orderData) => {
              setPendingOrder(null);
              if (orderData?.code) {
                try {
                  addRecentOrder(orderData.code);
                } catch {}
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === replyMsgId ? { ...m, createdOrder: orderData } : m,
                ),
              );
            },
            onDone: () => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === replyMsgId
                    ? {
                        ...m,
                        isStreaming: false,
                        text: m.text || cb.fallback_response,
                      }
                    : m,
                ),
              );
              setIsSending(false);
              setStatusText(null);
            },
            onError: (err) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === replyMsgId
                    ? {
                        ...m,
                        isStreaming: false,
                        text: m.text || (err?.message || cb.network_error),
                      }
                    : m,
                ),
              );
              setIsSending(false);
              setStatusText(null);
            },
          },
          abortController.signal,
        );
      } else {
        const data = await res.json();
        if (data?.pendingOrder) setPendingOrder(data.pendingOrder);
        if (data?.createdOrder) {
          setPendingOrder(null);
          if (data.createdOrder.code) {
            try {
              addRecentOrder(data.createdOrder.code);
            } catch {}
          }
        }
        const rawSources = Array.isArray(data?.sources) ? data.sources : [];
        const sources = rawSources.map((item: any) =>
          typeof item === 'string' ? item : item?.title || cb.default_doc_title,
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  text: data?.answer || cb.fallback_response,
                  sources,
                  products: Array.isArray(data?.products) ? data.products : [],
                  readyToConfirm: Boolean(data?.readyToConfirm),
                  createdOrder: data?.createdOrder || undefined,
                  pendingOrder: data?.pendingOrder || undefined,
                  chips: Array.isArray(data?.chips) ? data.chips : undefined,
                }
              : m,
          ),
        );
      }
    } catch (err: any) {
      if (abortController.signal.aborted) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyMsgId
              ? { ...m, isStreaming: false, text: m.text ? m.text + ' (Đã dừng)' : 'Đã dừng phản hồi.' }
              : m,
          ),
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyMsgId
              ? { ...m, isStreaming: false, text: err?.message || cb.network_error }
              : m,
          ),
        );
      }
    } finally {
      setIsSending(false);
      setStatusText(null);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const quickPrompts =
    locale === 'vi'
      ? [
          'Chân tôi bè ngang thì nên chọn giày chạy bộ nào?',
          'Chính sách miễn phí vận chuyển của One Store như thế nào?',
          'Đổi size giày trong bao lâu và có mất phí không?',
        ]
      : [
          'Which running shoes fit wide feet best?',
          'What is One Store free shipping policy?',
          'How does the 7-day return policy work?',
        ];

  return (
    <>
      {/* Nút bấm tròn mở Chat Widget nổi góc phải */}
      <button
        aria-label={isOpen ? 'Đóng cửa sổ tư vấn' : cb.launcher_title}
        className="chat-launcher"
        id="chatLauncher"
        onClick={() => setIsOpen((prev) => !prev)}
        title={cb.launcher_title}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 40,
        }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Cửa sổ hội thoại nổi chuẩn Bred Aesthetic */}
      <section
        aria-label={cb.title}
        aria-live="polite"
        className={`chat-panel ${isOpen ? 'open' : ''}`}
        id="chatPanel"
        style={{
          zIndex: 41,
          borderRadius: '20px',
          boxShadow: '0 24px 48px -12px rgba(10, 10, 10, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Header tối giản màu than chì sang trọng */}
        <div
          className="chat-head"
          style={{
            background: '#0a0a0a',
            padding: '16px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Logo size="sm" variant="icon" inverted />
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: '10px',
                  height: '10px',
                  background: '#22c55e',
                  borderRadius: '50%',
                  border: '2px solid #0a0a0a',
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ color: '#ffffff', fontSize: '15px', letterSpacing: '-0.01em' }}>
                  {cb.title}
                </strong>
                <span
                  style={{
                    background: '#e11d48',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.04em',
                  }}
                >
                  AI RAG
                </span>
              </div>
              <small style={{ color: '#94a3b8', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                {locale === 'vi' ? 'Trực tuyến · Sẵn sàng giải đáp 24/7' : 'Online · Ready to assist 24/7'}
              </small>
            </div>
          </div>
          <button
            aria-label="Đóng"
            className="close"
            id="chatClose"
            onClick={() => setIsOpen(false)}
            style={{
              color: '#94a3b8',
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Khung tin nhắn */}
        <div
          className="chat-messages"
          id="chatMessages"
          style={{
            flex: 1,
            padding: '16px',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto',
          }}
        >
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`chat-message ${isUser ? 'user' : ''}`}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  padding: '12px 15px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isUser ? '#e11d48' : '#ffffff',
                  color: isUser ? '#ffffff' : '#0f172a',
                  border: isUser ? '1px solid #e11d48' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  fontSize: '13.5px',
                  lineHeight: '1.58',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginBottom: '6px',
                      color: '#e11d48',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    <Bot size={13} />
                    <span>{cb.title}</span>
                  </div>
                )}

                <FormattedChatContent content={m.text} isUser={isUser} />

                {/* VIP ORDER CONFIRMATION CARD */}
                {!isUser && m.createdOrder && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                      border: '1.5px solid #86efac',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.08)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #dcfce7',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} color="#16a34a" />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', letterSpacing: '0.04em' }}>
                          ĐÃ LƯU VÀO HỆ THỐNG D1
                        </span>
                      </div>
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                        }}
                      >
                        COD XỎ THỬ
                      </span>
                    </div>

                    {/* Mã đơn hàng nổi bật */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>MÃ ĐƠN HÀNG</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                          {m.createdOrder.code}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(m.createdOrder!.code)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: copiedCode === m.createdOrder.code ? '#dcfce7' : '#f1f5f9',
                          color: copiedCode === m.createdOrder.code ? '#15803d' : '#334155',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {copiedCode === m.createdOrder.code ? (
                          <>
                            <Check size={12} color="#15803d" />
                            <span>Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Chi tiết đặt hàng súc tích */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#334155', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Sản phẩm:</span>
                        <strong style={{ color: '#0f172a', textAlign: 'right' }}>{m.createdOrder.product_name}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Phân loại:</span>
                        <span>Size {m.createdOrder.size} · Màu {m.createdOrder.color}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Số lượng:</span>
                        <span>{m.createdOrder.quantity} đôi</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed #e2e8f0' }}>
                        <span style={{ color: '#0f172a', fontWeight: 700 }}>Tổng tiền COD:</span>
                        <strong style={{ color: '#e11d48', fontSize: '13px' }}>{money(m.createdOrder.total)}</strong>
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleViewOrder(m.createdOrder!.code)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: '#0a0a0a',
                          color: '#ffffff',
                          border: 0,
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span>Tra cứu đơn hàng</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>

                    {/* Nút mua kèm phụ kiện ưu đãi hôm nay (Cross-Selling 1-click) */}
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #bbf7d0' }}>
                      <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 700, marginBottom: '6px' }}>
                        Ưu đãi mua kèm độc quyền hôm nay:
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleSend('Thêm vớ thể thao One Athletic')}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #86efac',
                            borderRadius: '999px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#16a34a',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          }}
                        >
                          + Vớ chạy bộ (+49.000đ)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSend('Thêm bình xịt nano')}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #86efac',
                            borderRadius: '999px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#16a34a',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                          }}
                        >
                          + Bình xịt nano (+89.000đ)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* NÚT BẤM NHANH CHỐT ĐƠN NGAY */}
                {!isUser && m.readyToConfirm && !m.createdOrder && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px dashed #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSend('Chốt đơn')}
                      disabled={isSending}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: '#e11d48',
                        color: '#ffffff',
                        border: 0,
                        padding: '10px 16px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: isSending ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 14px rgba(225, 29, 72, 0.28)',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSending) {
                          e.currentTarget.style.background = '#be123c';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSending) {
                          e.currentTarget.style.background = '#e11d48';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{locale === 'vi' ? 'Chốt đơn ngay' : 'Confirm Order Now'}</span>
                    </button>
                    <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                      {locale === 'vi'
                        ? 'Đồng kiểm, xỏ thử tận nơi trước khi thanh toán'
                        : 'Pay on delivery after trying on'}
                    </span>
                  </div>
                )}

                {/* Khung sản phẩm gợi ý tương tác trực tiếp */}
                {!isUser && m.products && m.products.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#475569',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      <Sparkles size={12} color="#e11d48" />
                      <span>
                        {locale === 'vi' ? 'Gợi ý sản phẩm phù hợp' : 'Recommended Sneakers'} ({m.products.length})
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {m.products.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setSelectedProduct(prod);
                            setActiveModal('detail');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#e11d48';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(225, 29, 72, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                          }}
                          title="Bấm để xem chi tiết sản phẩm"
                        >
                          {/* Ảnh sản phẩm vuông vắn */}
                          <div
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              background: '#f8fafc',
                              flexShrink: 0,
                              border: '1px solid #f1f5f9',
                              position: 'relative',
                            }}
                          >
                            <img
                              src={imageOf(prod)}
                              alt={prod.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>

                          {/* Thông tin sản phẩm */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#0f172a',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {prod.name}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '3px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  color: '#e11d48',
                                }}
                              >
                                {money(prod.price)}
                              </span>
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  fontWeight: 600,
                                  color: '#64748b',
                                  background: '#f1f5f9',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                }}
                              >
                                {prod.category}
                              </span>
                            </div>
                          </div>

                          {/* Nút Xem chi tiết */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '5px 8px',
                              background: '#fff1f2',
                              color: '#e11d48',
                              fontSize: '11px',
                              fontWeight: 700,
                              borderRadius: '6px',
                              flexShrink: 0,
                              gap: '2px',
                            }}
                          >
                            <span>{locale === 'vi' ? 'Xem' : 'View'}</span>
                            <ChevronRight size={12} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Danh sách chip nguồn tham khảo */}
                {m.sources && m.sources.length > 0 && (
                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px dashed #e2e8f0',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: '#64748b',
                        fontWeight: 600,
                        marginBottom: '6px',
                      }}
                    >
                      <FileText size={12} />
                      <span>{cb.sources_label}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {m.sources.map((s, idx) => {
                        const title = typeof s === 'string' ? s : s?.title || cb.default_doc_title;
                        return (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              background: '#f1f5f9',
                              color: '#1e293b',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '2px 7px',
                              fontSize: '10.5px',
                              fontWeight: 600,
                              lineHeight: '1.4',
                            }}
                          >
                            {title}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Các chip câu hỏi gợi ý nhanh (Fast Router Chips) */}
                {!isUser && m.chips && m.chips.length > 0 && !isSending && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                    {m.chips.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => handleSend(chip)}
                        style={{
                          background: '#fff1f2',
                          border: '1px solid #fecdd3',
                          color: '#e11d48',
                          borderRadius: '999px',
                          padding: '3px 9px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ffe4e6';
                          e.currentTarget.style.borderColor = '#e11d48';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff1f2';
                          e.currentTarget.style.borderColor = '#fecdd3';
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Hiệu ứng đang phân tích và suy nghĩ */}
          {isSending && (
            <div
              className="chat-message"
              style={{
                alignSelf: 'flex-start',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px 16px 16px 4px',
                padding: '10px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#64748b',
                fontSize: '12.5px',
                fontStyle: 'italic',
              }}
            >
              <Sparkles size={14} className="animate-spin" style={{ color: '#e11d48' }} />
              <span>{cb.thinking}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Thanh gợi ý câu hỏi nhanh (Quick Prompts) */}
        {messages.length <= 1 && (
          <div
            style={{
              padding: '8px 12px',
              background: '#ffffff',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
            }}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              {locale === 'vi' ? 'Gợi ý câu hỏi nhanh:' : 'Suggested questions:'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={isSending}
                  style={{
                    textAlign: 'left',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '11.5px',
                    color: '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#e11d48';
                    e.currentTarget.style.color = '#e11d48';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#334155';
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Thanh trạng thái xử lý streaming hoặc lỗi giọng nói */}
        {(statusText || voiceError) && (
          <div
            style={{
              padding: '6px 14px',
              background: voiceError ? '#fef2f2' : '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              color: voiceError ? '#b91c1c' : '#e11d48',
              fontWeight: 600,
            }}
          >
            {voiceError ? (
              <span>{voiceError}</span>
            ) : (
              <>
                <Sparkles size={12} className="animate-spin" />
                <span>{statusText}</span>
              </>
            )}
          </div>
        )}

        {/* Thanh thu âm giọng nói trực tiếp (Voice Recording Bar) */}
        {isRecording && (
          <div
            style={{
              padding: '8px 14px',
              background: '#fef2f2',
              borderTop: '1.5px solid #f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.2)',
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c' }}>
                Đang lắng nghe... ({recordingSeconds}s / 15s)
              </span>
            </div>
            <button
              type="button"
              onClick={handleVoiceToggle}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 0,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Hoàn tất
            </button>
          </div>
        )}

        {/* Form nhập câu hỏi & micro */}
        <form
          className="chat-form"
          id="chatForm"
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            padding: '12px 14px',
            gap: '8px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            alignItems: 'center',
          }}
        >
          {/* Nút bật/tắt Micro thu âm Whisper */}
          <button
            type="button"
            onClick={handleVoiceToggle}
            disabled={isSending && !isRecording}
            title={isRecording ? 'Dừng ghi âm' : 'Nói để tìm kiếm (Whisper AI)'}
            aria-label="Microphone"
            style={{
              border: '1px solid ' + (isRecording ? '#ef4444' : '#cbd5e1'),
              background: isRecording ? '#fee2e2' : '#f8fafc',
              color: isRecording ? '#ef4444' : '#64748b',
              borderRadius: '8px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSending && !isRecording ? 'not-allowed' : 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <input
            aria-label={cb.send_label}
            autoComplete="off"
            id="chatQuestion"
            maxLength={600}
            placeholder={isRecording ? 'Đang thu âm qua micro...' : cb.input_placeholder}
            required
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isSending || isRecording}
            style={{
              flex: 1,
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              outline: 'none',
              color: '#0f172a',
            }}
          />

          {/* Nút Dừng phản hồi khi đang stream HOẶC Nút Gửi câu hỏi */}
          {isSending ? (
            <button
              type="button"
              onClick={handleStopGeneration}
              title="Dừng phản hồi"
              aria-label="Dừng phản hồi"
              style={{
                border: 0,
                background: '#475569',
                color: '#ffffff',
                borderRadius: '8px',
                width: '38px',
                height: '38px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <Square size={14} fill="#ffffff" />
            </button>
          ) : (
            <button
              aria-label={cb.send_label}
              title={cb.send_label}
              type="submit"
              disabled={isSending || !inputQuestion.trim() || isRecording}
              style={{
                border: 0,
                background: inputQuestion.trim() && !isSending ? '#e11d48' : '#94a3b8',
                color: '#ffffff',
                borderRadius: '8px',
                width: '38px',
                height: '38px',
                cursor: inputQuestion.trim() && !isSending ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s',
              }}
            >
              <Send size={15} />
            </button>
          )}
        </form>
      </section>
    </>
  );
}

