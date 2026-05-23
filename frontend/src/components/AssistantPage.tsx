import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { AxiosError } from 'axios';
import { BotMessageSquare, Eye, MessageSquarePlus, Send, Sparkles, UserRound } from 'lucide-react';
import client from '../api/client';
import type { AssistantMessage, AssistantThread, User } from '../types';
import '../styles/Assistant.css';

type AssistantPageProps = {
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

const canReviewStudentChats = (user: User) => user.role === 'superuser' || user.role === 'leader';

const getErrorDetail = (err: unknown) => {
  const error = err as AxiosError<AssistantErrorPayload>;
  return error.response?.data?.detail;
};

const getErrorUserMessage = (err: unknown) => {
  const error = err as AxiosError<AssistantErrorPayload>;
  return error.response?.data?.user_message;
};

const formatTime = (value: string) => new Date(value).toLocaleString('kk-KZ', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const AssistantPage = ({ user }: AssistantPageProps) => {
  const [threads, setThreads] = useState<AssistantThread[]>([]);
  const [studentThreads, setStudentThreads] = useState<AssistantThread[]>([]);
  const [activeThread, setActiveThread] = useState<AssistantThread | null>(null);
  const [messages, setMessages] = useState<LocalAssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const ownThreads = useMemo(
    () => threads.filter((thread) => thread.owner === user.id),
    [threads, user.id],
  );
  const activeIsOwn = activeThread?.owner === user.id;
  const activeThreadId = activeThread?.id;

  const loadThreads = useCallback(async (preferredThreadId?: number) => {
    try {
      const [threadRes, studentThreadRes] = await Promise.all([
        client.get<AssistantThread[]>('/assistant/threads/'),
        canReviewStudentChats(user)
          ? client.get<AssistantThread[]>('/assistant/student-threads/')
          : Promise.resolve({ data: [] as AssistantThread[] }),
      ]);
      setThreads(threadRes.data);
      setStudentThreads(studentThreadRes.data);

      const currentStillExists = preferredThreadId
        ? threadRes.data.find((thread) => thread.id === preferredThreadId)
          || studentThreadRes.data.find((thread) => thread.id === preferredThreadId)
        : null;
      setActiveThread(currentStillExists || threadRes.data.find((thread) => thread.owner === user.id) || null);
    } catch {
      setError('Ассистент чаттарын жүктеу мүмкін болмады.');
    } finally {
      setLoadingThreads(false);
    }
  }, [user]);

  const createThread = useCallback(async () => {
    setError('');
    try {
      const res = await client.post<AssistantThread>('/assistant/threads/', {
        title: 'QyranCode көмекшісі',
      });
      setThreads((current) => [res.data, ...current]);
      setActiveThread(res.data);
    } catch {
      setError('Жаңа чат ашу мүмкін болмады.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        void loadThreads();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadThreads]);

  useEffect(() => {
    if (!activeThreadId) return;

    void client.get<AssistantMessage[]>(`/assistant/threads/${activeThreadId}/messages/`)
      .then((res) => {
        setMessages(res.data);
      })
      .catch(() => {
        setError('Хабарламаларды жүктеу мүмкін болмады.');
      })
      .finally(() => {
        setLoadingMessages(false);
      });
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeThread || !activeIsOwn || !input.trim()) return;

    const content = input.trim();
    const now = new Date().toISOString();
    const tempUserMessage: LocalAssistantMessage = {
      id: -Date.now(),
      thread: activeThread.id,
      role: 'user',
      content,
      created_at: now,
      pending: true,
    };
    const tempAssistantMessage: LocalAssistantMessage = {
      id: tempUserMessage.id - 1,
      thread: activeThread.id,
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
      const res = await client.post<AssistantReply>(`/assistant/threads/${activeThread.id}/messages/`, { content });
      setMessages((current) => [
        ...current.filter((message) => message.id !== tempUserMessage.id && message.id !== tempAssistantMessage.id),
        res.data.user_message,
        res.data.assistant_message,
      ]);
      await loadThreads(activeThread.id);
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

  const threadOwnerName = (thread: AssistantThread) => {
    const owner = thread.owner_details;
    if (!owner) return 'Қолданушы';
    return `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.username;
  };

  return (
    <div className="assistant-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Gemini көмекшісі</p>
          <h2>ИИ ассистент</h2>
        </div>
        <button type="button" className="assistant-new-thread" onClick={createThread}>
          <MessageSquarePlus size={18} />
          Жаңа чат
        </button>
      </div>

      <section className="assistant-shell">
        <aside className="assistant-thread-list">
          <div className="assistant-thread-section">
            <div className="assistant-list-heading">
              <strong>Менің чаттарым</strong>
              <span>{ownThreads.length}</span>
            </div>
            {loadingThreads ? (
              <div className="assistant-empty">Жүктелуде...</div>
            ) : ownThreads.length > 0 ? ownThreads.map((thread) => (
              <button
                type="button"
                className={`assistant-thread-item ${activeThread?.id === thread.id ? 'active' : ''}`}
                key={thread.id}
                onClick={() => {
                  setLoadingMessages(true);
                  setActiveThread(thread);
                }}
              >
                <BotMessageSquare size={18} />
                <span>
                  <strong>{thread.title || 'QyranCode көмекшісі'}</strong>
                  <small>{thread.latest_message?.content || 'Жаңа әңгіме'}</small>
                </span>
              </button>
            )) : (
              <button type="button" className="assistant-empty action" onClick={createThread}>
                Бірінші чатты ашу
              </button>
            )}
          </div>

          {canReviewStudentChats(user) && (
            <div className="assistant-thread-section">
              <div className="assistant-list-heading">
                <strong>Оқушы чаттары</strong>
                <span>{studentThreads.length}</span>
              </div>
              {studentThreads.length > 0 ? studentThreads.map((thread) => (
                <button
                  type="button"
                  className={`assistant-thread-item review ${activeThread?.id === thread.id ? 'active' : ''}`}
                  key={thread.id}
                  onClick={() => {
                    setLoadingMessages(true);
                    setActiveThread(thread);
                  }}
                >
                  <Eye size={18} />
                  <span>
                    <strong>{threadOwnerName(thread)}</strong>
                    <small>{thread.latest_message?.content || thread.title}</small>
                  </span>
                </button>
              )) : (
                <div className="assistant-empty">Оқушы чаттары әлі жоқ.</div>
              )}
            </div>
          )}
        </aside>

        <div className="assistant-chat-panel">
          <header className="assistant-chat-header">
            <div>
              <span className="assistant-avatar"><Sparkles size={20} /></span>
              <div>
                <strong>{activeThread ? activeThread.title || 'QyranCode көмекшісі' : 'QyranCode көмекшісі'}</strong>
                <small>
                  {activeThread
                    ? `${threadOwnerName(activeThread)} · ${formatTime(activeThread.updated_at)}`
                    : 'Қазақша оқу көмекшісі'}
                </small>
              </div>
            </div>
            {!activeIsOwn && activeThread && <span className="assistant-readonly">Тек көру</span>}
          </header>

          <div className="assistant-messages">
            {error && <div className="assistant-error">{error}</div>}
            {!activeThread ? (
              <div className="assistant-start-state">
                <BotMessageSquare size={38} />
                <h3>Қазақша ИИ көмекші дайын</h3>
                <p>Тақырып, есеп немесе QyranCode сайтын қолдану туралы сұрақ қойыңыз.</p>
                <button type="button" onClick={createThread}>Чат бастау</button>
              </div>
            ) : loadingMessages ? (
              <div className="assistant-empty">Хабарламалар жүктелуде...</div>
            ) : messages.map((message) => (
              <article className={`assistant-message ${message.role} ${message.pending ? 'pending' : ''}`} key={message.id}>
                <div className="assistant-message-icon">
                  {message.role === 'assistant' ? <BotMessageSquare size={17} /> : <UserRound size={17} />}
                </div>
                <div>
                  <p>{message.content}</p>
                  <span>{formatTime(message.created_at)}</span>
                </div>
              </article>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="assistant-input-row" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={activeIsOwn ? 'Сұрағыңызды қазақша жазыңыз...' : 'Бұл оқушы чаты тек қарауға арналған'}
              disabled={!activeThread || !activeIsOwn || sending}
              rows={2}
            />
            <button type="submit" disabled={!activeThread || !activeIsOwn || !input.trim() || sending}>
              <Send size={18} />
              {sending ? 'Жіберілуде' : 'Жіберу'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default AssistantPage;
