'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { ChatMessage } from '@/types';
import Logo from './Logo';
import { useShop } from '@/context/ShopContext';
import { MessageSquare, X, Send } from 'lucide-react';

export default function ChatbotWidget() {
  const { dict } = useShop();
  const cb = dict.modals.chatbot;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: cb.welcome,
      },
    ]);
  }, [cb.welcome]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputQuestion.trim();
    if (!q || isSending) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsSending(true);

    try {
      const res = await api('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      const botMsg: ChatMessage = {
        id: 'reply-' + Date.now(),
        role: 'assistant',
        text: res.answer || cb.fallback_response,
        sources: Array.isArray(res.sources) ? res.sources : [],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          text: err.message || cb.network_error,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        aria-label={cb.launcher_title}
        className="chat-launcher"
        id="chatLauncher"
        onClick={() => setIsOpen((o) => !o)}
        title={cb.launcher_title}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <MessageSquare size={22} />
      </button>

      <section
        aria-label={cb.title}
        aria-live="polite"
        className={`chat-panel ${isOpen ? 'open' : ''}`}
        id="chatPanel"
      >
        <div className="chat-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Logo size="sm" variant="icon" inverted />
            <div>
              <b>{cb.title}</b>
              <small>{cb.subtitle}</small>
            </div>
          </div>
          <button
            aria-label="Close"
            className="close"
            id="chatClose"
            onClick={() => setIsOpen(false)}
            style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="chat-messages" id="chatMessages">
          {messages.map((m) => (
            <div key={m.id} className={`chat-message ${m.role === 'user' ? 'user' : ''}`}>
              {m.text}
              {m.sources && m.sources.length > 0 && (
                <small>
                  {cb.sources_label} {m.sources.map((s) => s.title || cb.default_doc_title).join(', ')}
                </small>
              )}
            </div>
          ))}
          {isSending && (
            <div className="chat-message" style={{ fontStyle: 'italic', opacity: 0.8 }}>
              {cb.thinking}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-form" id="chatForm" onSubmit={handleSubmit}>
          <input
            aria-label={cb.send_label}
            autoComplete="off"
            id="chatQuestion"
            maxLength={600}
            placeholder={cb.input_placeholder}
            required
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
          />
          <button aria-label={cb.send_label} title={cb.send_label} type="submit" disabled={isSending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={16} />
          </button>
        </form>
      </section>
    </>
  );
}
