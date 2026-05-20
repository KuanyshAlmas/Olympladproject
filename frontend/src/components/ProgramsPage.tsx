import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Columns2,
  Cpu,
  ExternalLink,
  FlaskConical,
  Plus,
  Pencil,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import client from '../api/client';
import type { Faction, ProgramItem, ProgramResource, ProgramResponse, ProgramTrack, Task, User } from '../types';
import '../styles/Programs.css';

const kindLabels: Record<ProgramItem['kind'], string> = {
  diagnostic: 'Диагностика',
  lesson: 'Сабақ',
  quiz: 'Қысқа тест',
  contest: 'Апталық жарыс',
  project: 'Жоба',
};

const kindIcons: Record<ProgramItem['kind'], typeof BookOpenCheck> = {
  diagnostic: ClipboardCheck,
  lesson: BookOpenCheck,
  quiz: FlaskConical,
  contest: Trophy,
  project: Cpu,
};

const resourceKindLabels: Record<ProgramResource['kind'], string> = {
  article: 'Мақала',
  video: 'Видео',
  practice: 'Практика',
  docs: 'Құжаттама',
  tool: 'Құрал',
  book: 'Кітап',
};

const trackTone = (track: ProgramTrack) => {
  if (track.faction === 'robotics') return 'robotics';
  if (track.faction === 'informatics') return 'informatics';
  return 'foundation';
};

type TrackFormState = {
  id: string;
  title: string;
  faction: Faction;
  level: string;
  lessons: string;
  description: string;
  outcomes: string;
  order: string;
  is_active: boolean;
};

type ItemFormState = {
  id: string;
  track_id: string;
  kind: ProgramItem['kind'];
  title: string;
  duration_minutes: string;
  description: string;
  topics: string;
  practice: string;
  order: string;
  is_active: boolean;
};

type ResourceFormState = {
  id: string;
  item_id: string;
  kind: ProgramResource['kind'];
  title: string;
  url: string;
  source: string;
  description: string;
  order: string;
  is_active: boolean;
};

type ProgramsPageProps = {
  user: User;
};

const defaultTrackForm = (): TrackFormState => ({
  id: '',
  title: '',
  faction: 'none',
  level: '',
  lessons: '0',
  description: '',
  outcomes: '',
  order: '0',
  is_active: true,
});

const defaultItemForm = (trackId = ''): ItemFormState => ({
  id: '',
  track_id: trackId,
  kind: 'lesson',
  title: '',
  duration_minutes: '45',
  description: '',
  topics: '',
  practice: '',
  order: '0',
  is_active: true,
});

const defaultResourceForm = (itemId = ''): ResourceFormState => ({
  id: '',
  item_id: itemId,
  kind: 'article',
  title: '',
  url: '',
  source: '',
  description: '',
  order: '0',
  is_active: true,
});

const splitList = (value: string) => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const ProgramsPage = ({ user }: ProgramsPageProps) => {
  const queryClient = useQueryClient();
  const [activeTrack, setActiveTrack] = useState('all');
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [trackForm, setTrackForm] = useState<TrackFormState>(() => defaultTrackForm());
  const [itemForm, setItemForm] = useState<ItemFormState>(() => defaultItemForm());
  const [resourceForm, setResourceForm] = useState<ResourceFormState>(() => defaultResourceForm());
  const isAdmin = user.role === 'superuser';

  const { data, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await client.get<ProgramResponse>('/programs/tracks/');
      return res.data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await client.get<Task[]>('/tasks/');
      return res.data;
    },
  });

  const addToKanbanMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await client.post(`/programs/items/${itemId}/to-kanban/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const saveTrackMutation = useMutation({
    mutationFn: async (payload: TrackFormState) => {
      const body = {
        id: payload.id.trim(),
        title: payload.title.trim(),
        faction: payload.faction,
        level: payload.level.trim(),
        lessons: Number(payload.lessons) || 0,
        description: payload.description.trim(),
        outcomes: splitList(payload.outcomes),
        order: Number(payload.order) || 0,
        is_active: payload.is_active,
      };
      if (editingTrackId) {
        const res = await client.put(`/program-tracks/${editingTrackId}/`, body);
        return res.data;
      }
      const res = await client.post('/program-tracks/', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setEditingTrackId(null);
      setTrackForm(defaultTrackForm());
    },
  });

  const saveItemMutation = useMutation({
    mutationFn: async (payload: ItemFormState) => {
      const body = {
        id: payload.id.trim(),
        track_id: payload.track_id,
        kind: payload.kind,
        title: payload.title.trim(),
        duration_minutes: Number(payload.duration_minutes) || 45,
        description: payload.description.trim(),
        topics: splitList(payload.topics),
        practice: splitList(payload.practice),
        order: Number(payload.order) || 0,
        is_active: payload.is_active,
      };
      if (editingItemId) {
        const res = await client.put(`/program-items/${editingItemId}/`, body);
        return res.data;
      }
      const res = await client.post('/program-items/', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setEditingItemId(null);
      setItemForm(defaultItemForm(activeTrack === 'all' ? tracks[0]?.id : activeTrack));
    },
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await client.delete(`/program-tracks/${trackId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setActiveTrack('all');
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await client.delete(`/program-items/${itemId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });

  const saveResourceMutation = useMutation({
    mutationFn: async (payload: ResourceFormState) => {
      const body = {
        id: payload.id.trim(),
        item_id: payload.item_id,
        kind: payload.kind,
        title: payload.title.trim(),
        url: payload.url.trim(),
        source: payload.source.trim(),
        description: payload.description.trim(),
        order: Number(payload.order) || 0,
        is_active: payload.is_active,
      };
      if (editingResourceId) {
        const res = await client.put(`/program-references/${editingResourceId}/`, body);
        return res.data;
      }
      const res = await client.post('/program-references/', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setEditingResourceId(null);
      setResourceForm(defaultResourceForm(resourceForm.item_id));
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      await client.delete(`/program-references/${resourceId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });

  const tracks = data?.tracks ?? [];
  const items = data?.items ?? [];
  const addedProgramIds = useMemo(() => {
    return new Set(
      tasks
        .map((task) => task.description.match(/\[Program:([a-z0-9-]+)\]/)?.[1])
        .filter(Boolean) as string[],
    );
  }, [tasks]);

  const filteredItems = activeTrack === 'all'
    ? items
    : items.filter((item) => item.track_id === activeTrack);
  const totalLessons = tracks.reduce((sum, track) => sum + track.lessons, 0);

  const submitTrack = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveTrackMutation.mutate(trackForm);
  };

  const submitItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveItemMutation.mutate(itemForm);
  };

  const submitResource = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveResourceMutation.mutate(resourceForm);
  };

  const startTrackEdit = (track: ProgramTrack) => {
    setEditingTrackId(track.id);
    setTrackForm({
      id: track.id,
      title: track.title,
      faction: track.faction,
      level: track.level,
      lessons: String(track.lessons),
      description: track.description,
      outcomes: track.outcomes.join(', '),
      order: String(track.order),
      is_active: track.is_active,
    });
  };

  const startItemEdit = (item: ProgramItem) => {
    setEditingItemId(item.id);
    setItemForm({
      id: item.id,
      track_id: item.track_id,
      kind: item.kind,
      title: item.title,
      duration_minutes: String(item.duration_minutes),
      description: item.description,
      topics: item.topics.join(', '),
      practice: item.practice.join(', '),
      order: String(item.order),
      is_active: item.is_active,
    });
  };

  const startResourceCreate = (itemId: string) => {
    setEditingResourceId(null);
    setResourceForm(defaultResourceForm(itemId));
  };

  const startResourceEdit = (resource: ProgramResource) => {
    setEditingResourceId(resource.id);
    setResourceForm({
      id: resource.id,
      item_id: resource.item_id,
      kind: resource.kind,
      title: resource.title,
      url: resource.url,
      source: resource.source,
      description: resource.description,
      order: String(resource.order),
      is_active: resource.is_active,
    });
  };

  const confirmDeleteTrack = (track: ProgramTrack) => {
    if (window.confirm(`"${track.title}" бағытын өшіру керек пе? Ішіндегі элементтер де өшеді.`)) {
      deleteTrackMutation.mutate(track.id);
    }
  };

  const confirmDeleteItem = (item: ProgramItem) => {
    if (window.confirm(`"${item.title}" элементін өшіру керек пе?`)) {
      deleteItemMutation.mutate(item.id);
    }
  };

  const confirmDeleteResource = (resource: ProgramResource) => {
    if (window.confirm(`"${resource.title}" reference өшіру керек пе?`)) {
      deleteResourceMutation.mutate(resource.id);
    }
  };

  return (
    <div className="programs-page">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">Оқу бағдарламасы</p>
          <h2>Курстар, тесттер және жобалар</h2>
        </div>
        <div className="board-chip">
          <BookOpenCheck size={18} />
          {totalLessons}+ сабақ
        </div>
      </section>

      <section className="programs-summary">
        <article>
          <BookOpenCheck size={20} />
          <span>Оқу бағыттары</span>
          <strong>{tracks.length}</strong>
        </article>
        <article>
          <ClipboardCheck size={20} />
          <span>Практикалық элементтер</span>
          <strong>{items.length}</strong>
        </article>
        <article>
          <CheckCircle2 size={20} />
          <span>Kanban-ға қосылды</span>
          <strong>{items.filter((item) => addedProgramIds.has(item.id)).length}</strong>
        </article>
      </section>

      <section className="program-actions">
        <Link to="/roadmap">
          <Code2 size={18} />
          Спорттық бағдарламалау жол картасы
          <ArrowRight size={16} />
        </Link>
        <Link to="/codeforces">
          <Code2 size={18} />
          Codeforces практикасы
          <ArrowRight size={16} />
        </Link>
        <Link to="/events">
          <CalendarDays size={18} />
          Жарыстар мен іс-шаралар
          <ArrowRight size={16} />
        </Link>
      </section>

      {isAdmin && (
        <section className="program-admin-panel">
          <div className="program-admin-card">
            <div className="program-admin-head">
              <div>
                <p className="eyebrow">Әкімші</p>
                <h3>{editingTrackId ? 'Бағытты өзгерту' : 'Жаңа бағыт қосу'}</h3>
              </div>
              {editingTrackId && (
                <button type="button" className="program-admin-icon" onClick={() => {
                  setEditingTrackId(null);
                  setTrackForm(defaultTrackForm());
                }} aria-label="Болдырмау">
                  <X size={17} />
                </button>
              )}
            </div>
            <form className="program-admin-form" onSubmit={submitTrack}>
              <label>
                ID
                <input
                  value={trackForm.id}
                  onChange={(event) => setTrackForm((current) => ({ ...current, id: event.target.value }))}
                  placeholder="informatics-olympiad"
                  disabled={Boolean(editingTrackId)}
                  required
                />
              </label>
              <label>
                Атауы
                <input
                  value={trackForm.title}
                  onChange={(event) => setTrackForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </label>
              <label>
                Бағыт
                <select
                  value={trackForm.faction}
                  onChange={(event) => setTrackForm((current) => ({ ...current, faction: event.target.value as Faction }))}
                >
                  <option value="none">Барлығы</option>
                  <option value="informatics">Информатика</option>
                  <option value="robotics">Робототехника</option>
                </select>
              </label>
              <label>
                Деңгей
                <input
                  value={trackForm.level}
                  onChange={(event) => setTrackForm((current) => ({ ...current, level: event.target.value }))}
                />
              </label>
              <label>
                Сабақ саны
                <input
                  type="number"
                  min="0"
                  value={trackForm.lessons}
                  onChange={(event) => setTrackForm((current) => ({ ...current, lessons: event.target.value }))}
                />
              </label>
              <label>
                Реті
                <input
                  type="number"
                  min="0"
                  value={trackForm.order}
                  onChange={(event) => setTrackForm((current) => ({ ...current, order: event.target.value }))}
                />
              </label>
              <label className="program-admin-wide">
                Сипаттама
                <textarea
                  value={trackForm.description}
                  onChange={(event) => setTrackForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <label className="program-admin-wide">
                Нәтижелер
                <input
                  value={trackForm.outcomes}
                  onChange={(event) => setTrackForm((current) => ({ ...current, outcomes: event.target.value }))}
                  placeholder="C++, графтар, Codeforces"
                />
              </label>
              <label className="program-check">
                <input
                  type="checkbox"
                  checked={trackForm.is_active}
                  onChange={(event) => setTrackForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                Белсенді
              </label>
              <button type="submit" disabled={saveTrackMutation.isPending}>
                {editingTrackId ? 'Сақтау' : 'Қосу'}
              </button>
            </form>
          </div>

          <div className="program-admin-card">
            <div className="program-admin-head">
              <div>
                <p className="eyebrow">Әкімші</p>
                <h3>{editingItemId ? 'Элементті өзгерту' : 'Жаңа сабақ/жоба қосу'}</h3>
              </div>
              {editingItemId && (
                <button type="button" className="program-admin-icon" onClick={() => {
                  setEditingItemId(null);
                  setItemForm(defaultItemForm(activeTrack === 'all' ? tracks[0]?.id : activeTrack));
                }} aria-label="Болдырмау">
                  <X size={17} />
                </button>
              )}
            </div>
            <form className="program-admin-form" onSubmit={submitItem}>
              <label>
                ID
                <input
                  value={itemForm.id}
                  onChange={(event) => setItemForm((current) => ({ ...current, id: event.target.value }))}
                  placeholder="week-13-new-topic"
                  disabled={Boolean(editingItemId)}
                  required
                />
              </label>
              <label>
                Бағыт
                <select
                  value={itemForm.track_id}
                  onChange={(event) => setItemForm((current) => ({ ...current, track_id: event.target.value }))}
                  required
                >
                  <option value="">Таңдаңыз</option>
                  {tracks.map((track) => (
                    <option value={track.id} key={track.id}>{track.title}</option>
                  ))}
                </select>
              </label>
              <label>
                Түрі
                <select
                  value={itemForm.kind}
                  onChange={(event) => setItemForm((current) => ({ ...current, kind: event.target.value as ProgramItem['kind'] }))}
                >
                  <option value="diagnostic">Диагностика</option>
                  <option value="lesson">Сабақ</option>
                  <option value="quiz">Қысқа тест</option>
                  <option value="contest">Жарыс</option>
                  <option value="project">Жоба</option>
                </select>
              </label>
              <label>
                Атауы
                <input
                  value={itemForm.title}
                  onChange={(event) => setItemForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </label>
              <label>
                Ұзақтығы
                <input
                  type="number"
                  min="1"
                  value={itemForm.duration_minutes}
                  onChange={(event) => setItemForm((current) => ({ ...current, duration_minutes: event.target.value }))}
                />
              </label>
              <label>
                Реті
                <input
                  type="number"
                  min="0"
                  value={itemForm.order}
                  onChange={(event) => setItemForm((current) => ({ ...current, order: event.target.value }))}
                />
              </label>
              <label className="program-admin-wide">
                Сипаттама
                <textarea
                  value={itemForm.description}
                  onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <label className="program-admin-wide">
                Тақырыптар
                <input
                  value={itemForm.topics}
                  onChange={(event) => setItemForm((current) => ({ ...current, topics: event.target.value }))}
                  placeholder="DP, графтар, BFS"
                />
              </label>
              <label className="program-admin-wide">
                Тәжірибе
                <input
                  value={itemForm.practice}
                  onChange={(event) => setItemForm((current) => ({ ...current, practice: event.target.value }))}
                  placeholder="3 есеп, талдау, жоба қорғау"
                />
              </label>
              <label className="program-check">
                <input
                  type="checkbox"
                  checked={itemForm.is_active}
                  onChange={(event) => setItemForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                Белсенді
              </label>
              <button type="submit" disabled={saveItemMutation.isPending}>
                {editingItemId ? 'Сақтау' : 'Қосу'}
              </button>
            </form>
          </div>

          <div className="program-admin-card program-admin-card-wide">
            <div className="program-admin-head">
              <div>
                <p className="eyebrow">References</p>
                <h3>{editingResourceId ? 'Оқу материалын өзгерту' : 'Оқу материалы қосу'}</h3>
              </div>
              {editingResourceId && (
                <button type="button" className="program-admin-icon" onClick={() => {
                  setEditingResourceId(null);
                  setResourceForm(defaultResourceForm(resourceForm.item_id));
                }} aria-label="Болдырмау">
                  <X size={17} />
                </button>
              )}
            </div>
            <form className="program-admin-form resource-form" onSubmit={submitResource}>
              <label>
                ID
                <input
                  value={resourceForm.id}
                  onChange={(event) => setResourceForm((current) => ({ ...current, id: event.target.value }))}
                  placeholder="dp-video-intro"
                  disabled={Boolean(editingResourceId)}
                  required
                />
              </label>
              <label>
                Тақырып
                <select
                  value={resourceForm.item_id}
                  onChange={(event) => setResourceForm((current) => ({ ...current, item_id: event.target.value }))}
                  required
                >
                  <option value="">Таңдаңыз</option>
                  {items.map((item) => (
                    <option value={item.id} key={item.id}>{item.title}</option>
                  ))}
                </select>
              </label>
              <label>
                Түрі
                <select
                  value={resourceForm.kind}
                  onChange={(event) => setResourceForm((current) => ({ ...current, kind: event.target.value as ProgramResource['kind'] }))}
                >
                  <option value="article">Мақала</option>
                  <option value="video">Видео</option>
                  <option value="practice">Практика</option>
                  <option value="docs">Құжаттама</option>
                  <option value="tool">Құрал</option>
                  <option value="book">Кітап</option>
                </select>
              </label>
              <label>
                Атауы
                <input
                  value={resourceForm.title}
                  onChange={(event) => setResourceForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </label>
              <label>
                Дереккөз
                <input
                  value={resourceForm.source}
                  onChange={(event) => setResourceForm((current) => ({ ...current, source: event.target.value }))}
                  placeholder="YouTube, cp-algorithms"
                />
              </label>
              <label>
                Реті
                <input
                  type="number"
                  min="0"
                  value={resourceForm.order}
                  onChange={(event) => setResourceForm((current) => ({ ...current, order: event.target.value }))}
                />
              </label>
              <label className="program-admin-wide">
                Сілтеме
                <input
                  type="url"
                  value={resourceForm.url}
                  onChange={(event) => setResourceForm((current) => ({ ...current, url: event.target.value }))}
                  placeholder="https://..."
                  required
                />
              </label>
              <label className="program-admin-wide">
                Неге керек?
                <textarea
                  value={resourceForm.description}
                  onChange={(event) => setResourceForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <label className="program-check">
                <input
                  type="checkbox"
                  checked={resourceForm.is_active}
                  onChange={(event) => setResourceForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                Белсенді
              </label>
              <button type="submit" disabled={saveResourceMutation.isPending}>
                {editingResourceId ? 'Сақтау' : 'Қосу'}
              </button>
            </form>
          </div>
        </section>
      )}

      <section className="program-track-grid">
        {tracks.map((track) => (
          <article className={`program-track-card ${trackTone(track)}`} key={track.id}>
            <div>
              <span>{track.level}{!track.is_active ? ' · белсенді емес' : ''}</span>
              <h3>{track.title}</h3>
              <p>{track.description}</p>
            </div>
            <div className="program-track-meta">
              <strong>{track.lessons} сабақ</strong>
              <div className="program-card-actions">
                <button
                  type="button"
                  className={activeTrack === track.id ? 'active' : ''}
                  onClick={() => setActiveTrack(track.id)}
                >
                  Қарау
                </button>
                {isAdmin && (
                  <>
                    <button type="button" onClick={() => startTrackEdit(track)} aria-label="Бағытты өзгерту">
                      <Pencil size={16} />
                    </button>
                    <button type="button" className="danger" onClick={() => confirmDeleteTrack(track)} aria-label="Бағытты жою">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="program-outcomes">
              {track.outcomes.map((outcome) => (
                <span key={outcome}>{outcome}</span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="program-filter-row">
        <button
          type="button"
          className={activeTrack === 'all' ? 'active' : ''}
          onClick={() => setActiveTrack('all')}
        >
          Барлығы
        </button>
        {tracks.map((track) => (
          <button
            type="button"
            className={activeTrack === track.id ? 'active' : ''}
            onClick={() => setActiveTrack(track.id)}
            key={track.id}
          >
            {track.title}
          </button>
        ))}
      </section>

      <section className="program-item-list">
        {isLoading ? (
          <div className="program-empty">Жүктелуде...</div>
        ) : filteredItems.length === 0 ? (
          <div className="program-empty">Бұл бағытта элемент жоқ.</div>
        ) : (
          filteredItems.map((item) => {
            const Icon = kindIcons[item.kind];
            const track = tracks.find((entry) => entry.id === item.track_id);
            const isAdded = addedProgramIds.has(item.id);

            return (
              <article className={`program-item-card ${item.kind}`} key={item.id}>
                <div className="program-item-icon">
                  <Icon size={22} />
                </div>
                <div className="program-item-content">
                  <div className="program-item-head">
                    <div>
                      <span>{kindLabels[item.kind]} · {track?.title}</span>
                      {!item.is_active && <span>Белсенді емес</span>}
                      <h3>{item.title}</h3>
                    </div>
                    <strong>{item.duration_minutes} мин</strong>
                  </div>
                  <p>{item.description}</p>
                  <div className="program-topic-tags">
                    {item.topics.map((topic) => (
                      <span key={topic}>{topic}</span>
                    ))}
                  </div>
                  <div className="program-practice">
                    {item.practice.map((step) => (
                      <span key={step}><CheckCircle2 size={15} /> {step}</span>
                    ))}
                  </div>
                  <div className="program-resources">
                    <div className="program-resources-head">
                      <strong>Оқу материалдары</strong>
                      {isAdmin && (
                        <button type="button" onClick={() => startResourceCreate(item.id)}>
                          <Plus size={15} />
                          Reference қосу
                        </button>
                      )}
                    </div>
                    {item.resources.length > 0 ? (
                      <div className="program-resource-list">
                        {item.resources.map((resource) => (
                          <article className="program-resource" key={resource.id}>
                            <a href={resource.url} target="_blank" rel="noreferrer">
                              <span>{resourceKindLabels[resource.kind]}{resource.source ? ` · ${resource.source}` : ''}</span>
                              <strong>{resource.title}</strong>
                              {resource.description && <p>{resource.description}</p>}
                              {!resource.is_active && <em>Белсенді емес</em>}
                            </a>
                            <ExternalLink size={16} />
                            {isAdmin && (
                              <div className="program-resource-actions">
                                <button type="button" onClick={() => startResourceEdit(resource)} aria-label="Reference өзгерту">
                                  <Pencil size={15} />
                                </button>
                                <button type="button" onClick={() => confirmDeleteResource(resource)} aria-label="Reference жою">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="program-resource-empty">Бұл тақырыпқа оқу материалы әлі қосылмаған.</div>
                    )}
                  </div>
                  <div className="program-item-actions">
                    {isAdmin && (
                      <>
                        <button type="button" className="ghost" onClick={() => startItemEdit(item)}>
                          <Pencil size={17} />
                          Өзгерту
                        </button>
                        <button type="button" className="danger" onClick={() => confirmDeleteItem(item)}>
                          <Trash2 size={17} />
                          Жою
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => addToKanbanMutation.mutate(item.id)}
                      disabled={isAdded || addToKanbanMutation.isPending}
                    >
                      {isAdded ? <CheckCircle2 size={17} /> : <Plus size={17} />}
                      {isAdded ? 'Kanban-да бар' : 'Kanban-ға қосу'}
                    </button>
                    <Link to="/kanban">
                      <Columns2 size={17} />
                      Kanban ашу
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

export default ProgramsPage;
