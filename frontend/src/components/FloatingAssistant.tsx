import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { AxiosError } from 'axios';
import { BotMessageSquare, Send, X } from 'lucide-react';
import client from '../api/client';
import type { AssistantMessage, AssistantThread, User } from '../types';
import '../styles/Assistant.css';

type FloatingAssistantProps = {
  user: User;
};

type AssistantReply = {
  user_message: AssistantMessage;
  assistant_message: AssistantMessage;
};

type AssistantErrorPayload = {
  detail?: string;
  user_message?: AssistantMessage;
};

type LocalAssistantMessage = AssistantMessage & {
  pending?: boolean;
};

const getErrorDetail = (err: unknown) => {
  const error = err as AxiosError<AssistantErrorPayload>;
  return error.response?.data?.detail;
};

const getErrorUserMessage = (err: unknown) => {
  const error = err as AxiosError<AssistantErrorPayload>;
  return error.response?.data?.user_message;
};

const FloatingAssistant = ({ user }: FloatingAssistantProps) => {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<AssistantThread | null>(null);
  const [messages, setMessages] = useState<LocalAssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const ensureThread = useCallback(async () => {
    try {
      const threadsRes = await client.get<AssistantThread[]>('/assistant/threads/');
      const ownThread = threadsRes.data.find((item) => item.owner === user.id);
      const nextThread = ownThread || (await client.post<AssistantThread>('/assistant/threads/', {
        title: 'QyranCode көмекшісі',
      })).data;
      setThread(nextThread);
      const messagesRes = await client.get<AssistantMessage[]>(`/assistant/threads/${nextThread.id}/messages/`);
      setMessages(messagesRes.data);
    } catch {
      setError('ИИ ассистентті ашу мүмкін болмады.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (!open || thread) return;

    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        void ensureThread();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ensureThread, open, thread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!thread || !input.trim()) return;

    const content = input.trim();
    const now = new Date().toISOString();
    const tempUserMessage: LocalAssistantMessage = {
      id: -Date.now(),
      thread: thread.id,
      role: 'user',
      content,
      created_at: now,
      pending: true,
    };
    const tempAssistantMessage: LocalAssistantMessage = {
      id: tempUserMessage.id - 1,
      thread: thread.id,
      role: 'assistant',
      content: 'Gemini ойланып жатыр...',
      created_at: now,
      pending: true,
    };

    setInput('');
    setSending(true);
    setError('');
    setMessages((current) => [...current, tempUserMessage, tempAssistantMessage]);
    try {
      const res = await client.post<AssistantReply>(`/assistant/threads/${thread.id}/messages/`, { content });
      setMessages((current) => [
        ...current.filter((message) => message.id !== tempUserMessage.id && message.id !== tempAssistantMessage.id),
        res.data.user_message,
        res.data.assistant_message,
      ]);
    } catch (err: unknown) {
      const savedUserMessage = getErrorUserMessage(err);
      setMessages((current) => [
        ...current.filter((message) => message.id !== tempUserMessage.id && message.id !== tempAssistantMessage.id),
        savedUserMessage || tempUserMessage,
      ]);
      setError(getErrorDetail(err) || 'Gemini жауап бере алмады.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="floating-assistant">
      {open && (
        <section className="floating-assistant-panel">
          <header>
            <div>
              <BotMessageSquare size={20} />
              <span>QyranCode ИИ</span>
            </div>
            <button type="button" aria-label="Жабу" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </header>
          <div className="floating-assistant-messages">
            {error && <div className="assistant-error compact">{error}</div>}
            {loading ? (
              <div className="assistant-empty">Жүктелуде...</div>
            ) : messages.map((message) => (
              <article className={`floating-message ${message.role} ${message.pending ? 'pending' : ''}`} key={message.id}>
                {message.content}
              </article>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className="floating-assistant-form">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Сұрақ жазыңыз..."
              disabled={!thread || sending}
            />
            <button type="submit" disabled={!thread || !input.trim() || sending} aria-label="Жіберу">
              <Send size={17} />
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        className="floating-assistant-button"
        aria-label="ИИ ассистент"
        onClick={() => {
          if (!open && !thread) {
            setLoading(true);
          }
          setOpen((current) => !current);
        }}
      >
        <BotMessageSquare size={24} />
      </button>
    </div>
  );
};

export default FloatingAssistant;
