import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Flame, ListChecks, ShieldAlert, Trophy, Users } from 'lucide-react';
import client from '../api/client';
import type { EventItem, Task, User } from '../types';
import DailyStandupForm from './DailyStandupForm';
import '../styles/Dashboard.css';

type DashboardProps = {
  user: User;
};

const statusLabels: Record<Task['status'], string> = {
  todo: 'Үйрену қажет',
  in_progress: 'Орындалуда',
  review: 'Тексеруде',
  done: 'Дайын',
};

const factionLabels: Record<User['faction'], string> = {
  informatics: 'Информатика',
  robotics: 'Робототехника',
  none: 'Барлық бағыт',
};

const roleLabels: Record<User['role'], string> = {
  superuser: 'Бас мұғалім',
  leader: 'Топ жетекшісі',
  student: 'Оқушы',
};

const Dashboard = ({ user }: DashboardProps) => {
  const [now] = useState(() => Date.now());

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await client.get<Task[]>('/tasks/');
      return res.data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await client.get<EventItem[]>('/events/');
      return res.data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await client.get<User[]>('/users/');
      return res.data;
    },
  });

  const stats = useMemo(() => {
    const active = tasks.filter((task) => task.status === 'in_progress').length;
    const done = tasks.filter((task) => task.status === 'done').length;
    const review = tasks.filter((task) => task.status === 'review').length;
    const overdue = tasks.filter((task) => {
      if (!task.started_at || task.status !== 'in_progress') return false;
      const startedAt = new Date(task.started_at).getTime();
      return now - startedAt > 3 * 24 * 60 * 60 * 1000;
    }).length;

    return { active, done, review, overdue };
  }, [now, tasks]);

  const factionScores = useMemo(() => {
    return users.reduce(
      (acc, member) => {
        if (member.faction === 'informatics') acc.informatics += member.focus_points;
        if (member.faction === 'robotics') acc.robotics += member.focus_points;
        return acc;
      },
      { informatics: 0, robotics: 0 },
    );
  }, [users]);

  const redFlags = tasks.filter((task) => {
    if (!task.started_at || task.status !== 'in_progress') return false;
    return now - new Date(task.started_at).getTime() > 3 * 24 * 60 * 60 * 1000;
  });

  const nextEvent = [...events]
    .filter((event) => new Date(event.start_time).getTime() >= now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

  const countdown = nextEvent
    ? Math.max(new Date(nextEvent.start_time).getTime() - now, 0)
    : 0;
  const countdownDays = Math.floor(countdown / (24 * 60 * 60 * 1000));
  const countdownHours = Math.floor((countdown / (60 * 60 * 1000)) % 24);
  const maxFactionScore = Math.max(factionScores.informatics, factionScores.robotics, 1);
  const recentTasks = tasks.slice(0, 5);

  return (
    <div className="dashboard-page">
      <section className="workspace-hero">
        <div>
          <p className="eyebrow">Жанды басқару панелі</p>
          <h2>{user.faction === 'none' ? 'QyranCode CRM' : factionLabels[user.faction]}</h2>
          <p className="hero-copy">
            Рөлдік модель, Kanban, Pomodoro, дағдылар матрицасы және хабарландырулар бір басқару орталығында.
          </p>
        </div>
        <div className="hero-score">
          <span>Әлеуметтік GPA</span>
          <strong>{user.social_gpa.toFixed(1)}</strong>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <Clock3 size={20} />
          <span>Орындалуда</span>
          <strong>{stats.active}</strong>
        </article>
        <article className="metric-card">
          <CheckCircle2 size={20} />
          <span>Дайын</span>
          <strong>{stats.done}</strong>
        </article>
        <article className="metric-card">
          <ListChecks size={20} />
          <span>Тексеруде</span>
          <strong>{stats.review}</strong>
        </article>
        <article className={`metric-card ${stats.overdue > 0 ? 'warning' : ''}`}>
          <AlertTriangle size={20} />
          <span>Қызыл жалаулар</span>
          <strong>{stats.overdue}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="work-panel task-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Kanban</p>
              <h3>Команданың ағымдағы тапсырмалары</h3>
            </div>
            <Trophy size={22} />
          </div>
          <div className="task-rows">
            {recentTasks.length > 0 ? recentTasks.map((task) => (
              <div className="task-row" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.assigned_to_details?.username || 'Орындаушы жоқ'}</span>
                </div>
                <span className={`status-pill status-${task.status}`}>{statusLabels[task.status]}</span>
              </div>
            )) : (
              <div className="empty-state">Kanban-ға тапсырма қосылған соң осы жерде көрінеді.</div>
            )}
          </div>
        </div>

        <div className="work-panel event-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Кері санақ</p>
              <h3>Келесі маңызды оқиға</h3>
            </div>
            <CalendarDays size={22} />
          </div>
          {nextEvent ? (
            <div className="next-event">
              <span className={`event-dot event-${nextEvent.category}`} />
              <strong>{nextEvent.title}</strong>
              <p>{new Date(nextEvent.start_time).toLocaleString('kk-KZ')}</p>
              <div className="countdown-box">
                <strong>{countdownDays}</strong>
                <span>күн</span>
                <strong>{countdownHours}</strong>
                <span>сағат</span>
              </div>
              <span>{nextEvent.attendees_count} қатысушы</span>
            </div>
          ) : (
            <div className="empty-state">Белсенді іс-шаралар әлі жоқ.</div>
          )}
        </div>

        <div className="work-panel focus-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Pomodoro</p>
              <h3>Фокус ұпайлары</h3>
            </div>
            <Flame size={22} />
          </div>
          <div className="focus-value">{user.focus_points}</div>
          <p>Фокус ұпайлары</p>
          <div className="faction-strip">
            <Users size={18} />
            <span>{roleLabels[user.role]}</span>
          </div>
        </div>

        <div className="work-panel battle-mini">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Командалық жарыс</p>
              <h3>Информатика мен Робототехника</h3>
            </div>
            <Users size={22} />
          </div>
          <div className="mini-battle-row">
            <span>Информатика</span>
            <strong>{factionScores.informatics} ұпай</strong>
          </div>
          <div className="mini-track">
            <div style={{ width: `${(factionScores.informatics / maxFactionScore) * 100}%` }} />
          </div>
          <div className="mini-battle-row">
            <span>Робототехника</span>
            <strong>{factionScores.robotics} ұпай</strong>
          </div>
          <div className="mini-track robotics">
            <div style={{ width: `${(factionScores.robotics / maxFactionScore) * 100}%` }} />
          </div>
        </div>

        <div className="work-panel red-flags-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Автоматты бақылау</p>
              <h3>Қызыл жалаулар</h3>
            </div>
            <ShieldAlert size={22} />
          </div>
          <div className="flag-list">
            {redFlags.length > 0 ? redFlags.map((task) => (
              <div className="flag-row" key={task.id}>
                <AlertTriangle size={17} />
                <div>
                  <strong>{task.assigned_to_details?.username || 'Оқушы'} тапсырмада 3 күннен артық тұр</strong>
                  <span>{task.title}</span>
                </div>
              </div>
            )) : (
              <div className="empty-state">Қазіргі уақытта проблемалық аймақ жоқ.</div>
            )}
          </div>
        </div>

        <DailyStandupForm />
      </section>
    </div>
  );
};

export default Dashboard;
