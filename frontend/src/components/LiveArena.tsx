import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Coffee, History, Pause, Play, RotateCcw, Settings2, Square, TimerReset, Wifi } from 'lucide-react';
import client from '../api/client';
import type { PomodoroSession, User } from '../types';
import '../styles/LiveArena.css';

interface PresenceUser {
  id: number;
  username: string;
  faction: string;
  pomodoro_status: string;
  pomodoro_end_time: string | null;
}

type LiveArenaProps = {
  user: User;
};

type TimerMode = 'focus' | 'break';

const presets = [
  { label: 'Фокус 25', mode: 'focus' as TimerMode, minutes: 25 },
  { label: 'Терең фокус 45', mode: 'focus' as TimerMode, minutes: 45 },
  { label: 'Үзіліс 5', mode: 'break' as TimerMode, minutes: 5 },
  { label: 'Ұзақ үзіліс 15', mode: 'break' as TimerMode, minutes: 15 },
];

const presenceStatusLabels: Record<string, string> = {
  focus: 'Фокус',
  break: 'Үзіліс',
  idle: 'Бос',
};

const LiveArena: React.FC<LiveArenaProps> = ({ user }) => {
  const queryClient = useQueryClient();
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState('25');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<number | null>(null);
  const finishLockRef = useRef(false);
  const startedAtRef = useRef<string | null>(null);

  const { data: history = [] } = useQuery({
    queryKey: ['pomodoro-sessions'],
    queryFn: async () => {
      const res = await client.get<PomodoroSession[]>('/pomodoro-sessions/');
      return res.data;
    },
  });

  const saveSessionMutation = useMutation({
    mutationFn: async (payload: {
      mode: TimerMode;
      duration_minutes: number;
      completed: boolean;
      started_at: string;
      ended_at: string;
    }) => {
      const res = await client.post('/pomodoro-sessions/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('token');
    const wsUrl = `${protocol}//${window.location.host}/ws/presence/?token=${encodeURIComponent(token ?? '')}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'presence_update') {
        setActiveUsers(data.users);
      }
    };

    return () => {
      socketRef.current?.close();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const todayStats = useMemo(() => {
    const today = new Date().toDateString();
    const todaySessions = history.filter((session) => new Date(session.ended_at).toDateString() === today);
    const focusMinutes = todaySessions
      .filter((session) => session.mode === 'focus' && session.completed)
      .reduce((sum, session) => sum + session.duration_minutes, 0);

    return {
      sessions: todaySessions.length,
      focusMinutes,
    };
  }, [history]);

  const sendPresenceMessage = (payload: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  const clearTicker = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const updatePresence = (nextStatus: 'focus' | 'break' | 'idle', seconds = timeLeft) => {
    sendPresenceMessage({
      action: 'update_pomodoro',
      status: nextStatus,
      end_time: nextStatus === 'idle' ? null : new Date(Date.now() + seconds * 1000).toISOString(),
    });
  };

  const finishSession = (completed: boolean) => {
    if (finishLockRef.current) {
      return;
    }
    finishLockRef.current = true;
    clearTicker();
    const endedAt = new Date().toISOString();
    const startTime = startedAtRef.current ?? startedAt ?? endedAt;

    if (completed) {
      saveSessionMutation.mutate({
        mode,
        duration_minutes: durationMinutes,
        completed,
        started_at: startTime,
        ended_at: endedAt,
      });
    }

    setIsActive(false);
    setIsPaused(false);
    setStartedAt(null);
    startedAtRef.current = null;
    setTimeLeft(durationMinutes * 60);
    updatePresence('idle', 0);
  };

  const startTimer = () => {
    if (timerRef.current) return;

    setIsActive(true);
    setIsPaused(false);
    finishLockRef.current = false;
    const startTime = startedAtRef.current ?? new Date().toISOString();
    startedAtRef.current = startTime;
    setStartedAt(startTime);
    updatePresence(mode, timeLeft);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.setTimeout(() => finishSession(true), 0);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    clearTicker();
    setIsPaused(true);
    updatePresence('idle', 0);
  };

  const resetTimer = () => {
    clearTicker();
    setIsActive(false);
    setIsPaused(false);
    setStartedAt(null);
    startedAtRef.current = null;
    finishLockRef.current = false;
    setTimeLeft(durationMinutes * 60);
    updatePresence('idle', 0);
  };

  const stopTimer = () => {
    finishSession(false);
  };

  const applyPreset = (nextMode: TimerMode, minutes: number) => {
    if (isActive) return;
    setMode(nextMode);
    setDurationMinutes(minutes);
    setCustomMinutes(String(minutes));
    setTimeLeft(minutes * 60);
    finishLockRef.current = false;
    startedAtRef.current = null;
    setStartedAt(null);
  };

  const applyCustomMinutes = () => {
    const minutes = Math.max(1, Math.min(120, Number(customMinutes) || 25));
    applyPreset(mode, minutes);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - timeLeft / (durationMinutes * 60);
  const progressDegrees = Math.max(0, Math.min(360, progress * 360));

  return (
    <div className="live-arena">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">Жанды арена</p>
          <h2>Pomodoro фокус орталығы</h2>
        </div>
        <div className="board-chip">
          <Wifi size={18} />
          онлайн
        </div>
      </section>

      <section className="pomodoro-shell">
        <div className="pomodoro-studio">
          <div className="timer-mode-chip">
            {mode === 'focus' ? <TimerReset size={18} /> : <Coffee size={18} />}
            {mode === 'focus' ? 'Фокус сессиясы' : 'Үзіліс сессиясы'}
          </div>

          <div
            className={`timer-orbit ${mode === 'break' ? 'break' : ''}`}
            style={{ '--progress': `${progressDegrees}deg` } as React.CSSProperties}
          >
            <div className="timer-core">
              <span>{isActive ? (isPaused ? 'Пауза' : 'Жүріп жатыр') : 'Дайын'}</span>
              <strong>{formatTime(timeLeft)}</strong>
              <small>{durationMinutes} минут</small>
            </div>
          </div>

          <div className="timer-actions">
            {!isActive || isPaused ? (
              <button type="button" className="timer-btn start" onClick={startTimer}>
                <Play size={18} />
                {isPaused ? 'Жалғастыру' : 'Бастау'}
              </button>
            ) : (
              <button type="button" className="timer-btn pause" onClick={pauseTimer}>
                <Pause size={18} />
                Пауза
              </button>
            )}
            <button type="button" className="timer-icon-btn" onClick={resetTimer} aria-label="Қайта бастау">
              <RotateCcw size={18} />
            </button>
            <button type="button" className="timer-icon-btn danger" onClick={stopTimer} aria-label="Тоқтату">
              <Square size={18} />
            </button>
          </div>
        </div>

        <div className="timer-side-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Таймер баптауы</p>
              <h3>Режимді өзгерту</h3>
            </div>
            <Settings2 size={20} />
          </div>

          <div className="preset-grid">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`preset-btn ${mode === preset.mode && durationMinutes === preset.minutes ? 'active' : ''}`}
                onClick={() => applyPreset(preset.mode, preset.minutes)}
                disabled={isActive}
              >
                <strong>{preset.label}</strong>
                <span>{preset.minutes} мин</span>
              </button>
            ))}
          </div>

          <div className="custom-timer-row">
            <label>
              Өз минутыңыз
              <input
                type="number"
                min="1"
                max="120"
                value={customMinutes}
                onChange={(event) => setCustomMinutes(event.target.value)}
                disabled={isActive}
              />
            </label>
            <button type="button" onClick={applyCustomMinutes} disabled={isActive}>
              Қолдану
            </button>
          </div>

          <div className="today-stats">
            <div>
              <span>Бүгінгі сессия</span>
              <strong>{todayStats.sessions}</strong>
            </div>
            <div>
              <span>Фокус минут</span>
              <strong>{todayStats.focusMinutes}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="arena-layout">
        <div>
          <div className="section-heading">
            <h3>Қазір кім онлайн</h3>
            <span>{activeUsers.length}</span>
          </div>
          <div className="arena-grid">
            {activeUsers.map((u) => (
              <div key={u.id} className={`user-card-live ${u.pomodoro_status === 'focus' ? 'focusing' : ''}`}>
                <div className="avatar-ring">{u.username.slice(0, 1).toUpperCase()}</div>
                <strong>{u.username}</strong>
                <span>{u.faction}</span>
                <div className={`status-badge status-${u.pomodoro_status}`}>
                  {presenceStatusLabels[u.pomodoro_status] ?? u.pomodoro_status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="history-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Тарих</p>
              <h3>Сақталған сессиялар</h3>
            </div>
            <History size={20} />
          </div>
          <div className="history-list">
            {history.slice(0, 8).map((session) => (
              <div className="history-row" key={session.id}>
                <CheckCircle2 size={18} />
                <div>
                  <strong>{session.mode === 'focus' ? 'Фокус' : 'Үзіліс'} · {session.duration_minutes} мин</strong>
                  <span>{new Date(session.ended_at).toLocaleString('kk-KZ')}</span>
                </div>
                <small>{session.user_details?.username || user.username}</small>
              </div>
            ))}
            {history.length === 0 && (
              <div className="history-empty">
                Сессия аяқталғаннан кейін тарих осы жерде сақталады.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LiveArena;
