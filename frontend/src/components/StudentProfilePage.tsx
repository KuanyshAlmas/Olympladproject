import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Code2,
  Flame,
  Timer,
  Trophy,
} from 'lucide-react';
import client from '../api/client';
import type { EventCategory, StudentProfile, Task } from '../types';
import '../styles/StudentProfile.css';

const factionLabels = {
  informatics: 'Информатика',
  robotics: 'Робототехника',
  none: 'Бағыт жоқ',
};

const roleLabels = {
  superuser: 'Бас мұғалім',
  leader: 'Топ жетекшісі',
  student: 'Оқушы',
};

const taskStatusLabels: Record<Task['status'], string> = {
  todo: 'Үйрену қажет',
  in_progress: 'Орындалуда',
  review: 'Тексеруде',
  done: 'Дайын',
};

const eventCategoryLabels: Record<EventCategory, string> = {
  olympiad: 'Олимпиада',
  internal: 'Ішкі іс-шара',
  school: 'Мектептік іс-шара',
};

const solutionStatusLabels = {
  todo: 'Жоспарда',
  solving: 'Шешіп жатыр',
  solved: 'Шешілді',
};

const formatDate = (value?: string) => {
  if (!value) return 'Күні жоқ';
  return new Date(value).toLocaleString('kk-KZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StudentProfilePage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['student-profile', studentId],
    enabled: Boolean(studentId),
    queryFn: async () => {
      const res = await client.get<StudentProfile>(`/users/${studentId}/profile/`);
      return res.data;
    },
  });

  if (isLoading) {
    return <div className="student-profile-page">Жеке бет жүктелуде...</div>;
  }

  if (isError || !profile) {
    return (
      <div className="student-profile-page">
        <button type="button" className="profile-back-btn" onClick={() => navigate('/students')}>
          <ArrowLeft size={17} />
          Оқушыларға қайту
        </button>
        <section className="profile-empty-state">
          <h2>Жеке бет қолжетімсіз</h2>
          <p>Бұл оқушыға рұқсат жоқ немесе деректер табылмады.</p>
        </section>
      </div>
    );
  }

  const taskProgress = profile.stats.tasks_total
    ? Math.round((profile.stats.tasks_done / profile.stats.tasks_total) * 100)
    : 0;
  const cfProgress = profile.stats.codeforces_total
    ? Math.round((profile.stats.codeforces_solved / profile.stats.codeforces_total) * 100)
    : 0;
  const olympiads = profile.rsvps.filter((rsvp) => rsvp.event.category === 'olympiad');
  const studentName = `${profile.user.first_name ?? ''} ${profile.user.last_name ?? ''}`.trim() || profile.user.username;

  return (
    <div className="student-profile-page">
      <button type="button" className="profile-back-btn" onClick={() => navigate('/students')}>
        <ArrowLeft size={17} />
        Оқушыларға қайту
      </button>

      <section className="profile-hero">
        <div className="profile-avatar">{studentName.slice(0, 2).toUpperCase()}</div>
        <div>
          <p className="eyebrow">Оқушы профилі</p>
          <h2>{studentName}</h2>
          <div className="profile-tags">
            <span>{profile.user.username}</span>
            <span>{roleLabels[profile.user.role]}</span>
            <span>{factionLabels[profile.user.faction]}</span>
          </div>
        </div>
      </section>

      <section className="profile-metrics">
        <article>
          <Timer size={20} />
          <span>Фокус</span>
          <strong>{profile.stats.focus_minutes} мин</strong>
          <small>{profile.stats.focus_sessions} сессия</small>
        </article>
        <article>
          <ClipboardList size={20} />
          <span>Kanban</span>
          <strong>{profile.stats.tasks_done}/{profile.stats.tasks_total}</strong>
          <small>{taskProgress}% дайын</small>
        </article>
        <article>
          <Code2 size={20} />
          <span>Codeforces</span>
          <strong>{profile.stats.codeforces_solved}/{profile.stats.codeforces_total}</strong>
          <small>{cfProgress}% шешілді</small>
        </article>
        <article>
          <Trophy size={20} />
          <span>Олимпиадалар</span>
          <strong>{profile.stats.olympiads_count}</strong>
          <small>{profile.stats.events_attending_count} іс-шара</small>
        </article>
        <article>
          <Flame size={20} />
          <span>Күндік серия</span>
          <strong>{profile.stats.streak_days} күн</strong>
          <small>{profile.stats.active_days} белсенді күн</small>
        </article>
      </section>

      <section className="profile-grid">
        <div className="profile-panel">
          <div className="profile-panel-head">
            <div>
              <p className="eyebrow">Талдау</p>
              <h3>Оқушы бойынша талдау</h3>
            </div>
          </div>
          <div className="profile-analysis-list">
            {profile.analysis.map((item) => (
              <article className={`profile-analysis ${item.level}`} key={`${item.title}-${item.text}`}>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="profile-panel">
          <div className="profile-panel-head">
            <div>
              <p className="eyebrow">Жетістіктер</p>
              <h3>Прогресс және бейдждер</h3>
            </div>
            <Award size={21} />
          </div>
          <div className="achievement-list">
            {profile.achievements.map((achievement) => (
              <article className={`achievement-card ${achievement.unlocked ? 'unlocked' : ''}`} key={achievement.title}>
                <CheckCircle2 size={18} />
                <div>
                  <strong>{achievement.title}</strong>
                  <span>{achievement.description}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-panel">
        <div className="profile-panel-head">
          <div>
            <p className="eyebrow">Codeforces</p>
            <h3>Қандай есеп шешті және қалай шешті</h3>
          </div>
          <span className="profile-counter">{profile.codeforces_solutions.length}</span>
        </div>
        {profile.codeforces_solutions.length === 0 ? (
          <div className="profile-empty-row">Сақталған Codeforces шешімдері әзірге жоқ.</div>
        ) : (
          <div className="profile-solution-list">
            {profile.codeforces_solutions.map((solution) => (
              <article className="profile-solution-card" key={solution.id}>
                <div className="profile-solution-head">
                  <div>
                    <strong>{solution.contest_id}{solution.index}. {solution.name}</strong>
                    <span>{solution.language} · {formatDate(solution.updated_at)}</span>
                  </div>
                  <small className={`profile-status ${solution.status}`}>{solutionStatusLabels[solution.status]}</small>
                </div>
                {solution.notes && <p className="solution-notes">{solution.notes}</p>}
                <pre>{solution.solution_code || 'Код әзірге қосылмаған.'}</pre>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="profile-grid">
        <div className="profile-panel">
          <div className="profile-panel-head">
            <div>
              <p className="eyebrow">Kanban</p>
              <h3>Оқу тапсырмалары</h3>
            </div>
            <span className="profile-counter">{profile.tasks.length}</span>
          </div>
          <div className="profile-task-list">
            {profile.tasks.length === 0 && <div className="profile-empty-row">Тапсырмалар әзірге жоқ.</div>}
            {profile.tasks.map((task) => (
              <article className="profile-task-card" key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.description || 'Сипаттама жоқ'}</span>
                </div>
                <small className={`profile-task-status ${task.status}`}>{taskStatusLabels[task.status]}</small>
              </article>
            ))}
          </div>
        </div>

        <div className="profile-panel">
          <div className="profile-panel-head">
            <div>
              <p className="eyebrow">Олимпиадалар</p>
              <h3>Іс-шараларға қатысу</h3>
            </div>
            <CalendarDays size={21} />
          </div>
          <div className="profile-event-list">
            {profile.rsvps.length === 0 && <div className="profile-empty-row">Қатысу әзірге белгіленбеген.</div>}
            {olympiads.map((rsvp) => (
              <article className="profile-event-card olympiad" key={rsvp.id}>
                <strong>{rsvp.event.title}</strong>
                <span>{formatDate(rsvp.event.start_time)}</span>
                <small>{rsvp.is_attending ? 'Қатысады' : 'Қатыспайды'}</small>
              </article>
            ))}
            {profile.rsvps.filter((rsvp) => rsvp.event.category !== 'olympiad').map((rsvp) => (
              <article className="profile-event-card" key={rsvp.id}>
                <strong>{rsvp.event.title}</strong>
                <span>{eventCategoryLabels[rsvp.event.category]} · {formatDate(rsvp.event.start_time)}</span>
                <small>{rsvp.is_attending ? 'Қатысады' : 'Қатыспайды'}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="profile-grid">
        <div className="profile-panel">
          <div className="profile-panel-head">
            <div>
              <p className="eyebrow">Күнделікті есеп</p>
              <h3>Соңғы есептер</h3>
            </div>
            <span className="profile-counter">{profile.standups.length}</span>
          </div>
          <div className="profile-standup-list">
            {profile.standups.length === 0 && <div className="profile-empty-row">Есептер әзірге жоқ.</div>}
            {profile.standups.slice(0, 6).map((standup) => (
              <article className="profile-standup-card" key={standup.id}>
                <strong>{new Date(standup.date).toLocaleDateString('kk-KZ')}</strong>
                <span><b>Істегені:</b> {standup.what_done}</span>
                <span><b>Қиындық:</b> {standup.difficulties || 'Көрсетілмеген'}</span>
                <span><b>Келесі қадам:</b> {standup.plan_next}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="profile-panel">
          <div className="profile-panel-head">
            <div>
              <p className="eyebrow">Pomodoro</p>
              <h3>Фокус тарихы</h3>
            </div>
            <Timer size={21} />
          </div>
          <div className="profile-focus-list">
            {profile.pomodoro_sessions.length === 0 && <div className="profile-empty-row">Фокус сессиялары әзірге жоқ.</div>}
            {profile.pomodoro_sessions.slice(0, 10).map((session) => (
              <article className="profile-focus-card" key={session.id}>
                <strong>{session.duration_minutes} мин</strong>
                <span>{session.mode === 'focus' ? 'Фокус' : 'Үзіліс'} · {formatDate(session.ended_at)}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Link className="profile-codeforces-link" to="/codeforces">
        <Code2 size={17} />
        Codeforces бөлімін ашу
      </Link>
    </div>
  );
};

export default StudentProfilePage;
