import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Check, Megaphone, Pencil, Pin, Plus, Trash2, Users, X } from 'lucide-react';
import client from '../api/client';
import type { EventCategory, EventItem, User } from '../types';
import '../styles/Events.css';

const categoryLabels: Record<EventCategory, string> = {
  olympiad: 'Олимпиада',
  internal: 'Ішкі іс-шара',
  school: 'Мектеп',
};

type EventsPageProps = {
  user: User;
};

type EventFormState = {
  title: string;
  description: string;
  category: EventCategory;
  start_time: string;
  end_time: string;
  is_pinned: boolean;
};

const getDefaultEventForm = (): EventFormState => {
  const start = new Date();
  start.setHours(start.getHours() + 24, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 2);

  return {
    title: '',
    description: '',
    category: 'internal',
    start_time: start.toISOString().slice(0, 16),
    end_time: end.toISOString().slice(0, 16),
    is_pinned: false,
  };
};

const toDatetimeLocal = (value: string) => new Date(value).toISOString().slice(0, 16);

const toPayload = (form: EventFormState) => ({
  ...form,
  start_time: new Date(form.start_time).toISOString(),
  end_time: new Date(form.end_time).toISOString(),
});

const EventsPage = ({ user }: EventsPageProps) => {
  const queryClient = useQueryClient();
  const isAdmin = user.role === 'superuser';
  const [form, setForm] = useState<EventFormState>(() => getDefaultEventForm());
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await client.get<EventItem[]>('/events/');
      return res.data;
    },
  });

  const saveEventMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const res = await client.patch(`/events/${editingId}/`, toPayload(form));
        return res.data;
      }

      const res = await client.post('/events/', toPayload(form));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setForm(getDefaultEventForm());
      setEditingId(null);
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await client.delete(`/events/${eventId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const res = await client.post(`/events/${eventId}/rsvp/`, { is_attending: true });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const startEdit = (event: EventItem) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      start_time: toDatetimeLocal(event.start_time),
      end_time: toDatetimeLocal(event.end_time),
      is_pinned: event.is_pinned,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(getDefaultEventForm());
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveEventMutation.mutate();
  };

  return (
    <div className="events-page">
      <section className="events-topbar">
        <div>
          <p className="eyebrow">Хабарландыру тақтасы</p>
          <h2>Командалық күнтізбе</h2>
          <p>Олимпиадалар, ішкі хакатондар және мектептік іс-шаралар.</p>
        </div>
        <div className="event-summary">
          <Megaphone size={22} />
          <strong>{events.length}</strong>
          <span>іс-шара</span>
        </div>
      </section>

      {isAdmin && (
        <section className="admin-event-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Әкімші</p>
              <h3>{editingId ? 'Іс-шараны өзгерту' : 'Жаңа іс-шара қосу'}</h3>
            </div>
            {editingId ? (
              <button type="button" className="ghost-btn" onClick={cancelEdit}>
                <X size={17} />
                Болдырмау
              </button>
            ) : (
              <Plus size={22} />
            )}
          </div>

          <form className="event-admin-form" onSubmit={handleSubmit}>
            <label>
              Атауы
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </label>
            <label>
              Категория
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as EventCategory }))}
              >
                <option value="olympiad">Олимпиада</option>
                <option value="internal">Ішкі іс-шара</option>
                <option value="school">Мектеп</option>
              </select>
            </label>
            <label className="wide-field">
              Сипаттама
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                required
              />
            </label>
            <label>
              Басталу уақыты
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(event) => setForm((current) => ({ ...current, start_time: event.target.value }))}
                required
              />
            </label>
            <label>
              Аяқталу уақыты
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={(event) => setForm((current) => ({ ...current, end_time: event.target.value }))}
                required
              />
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.is_pinned}
                onChange={(event) => setForm((current) => ({ ...current, is_pinned: event.target.checked }))}
              />
              Маңызды ретінде бекіту
            </label>
            <button type="submit" className="save-event-btn" disabled={saveEventMutation.isPending}>
              <Check size={17} />
              {editingId ? 'Сақтау' : 'Қосу'}
            </button>
          </form>
        </section>
      )}

      <section className="events-list">
        {events.length > 0 ? events.map((event) => (
          <article className="event-card" key={event.id}>
            {event.poster ? (
              <img src={event.poster} alt="" className="event-poster" />
            ) : (
              <div className={`event-poster poster-${event.category}`}>
                <CalendarClock size={36} />
              </div>
            )}
            <div className="event-body">
              <div className="event-meta">
                <span className={`category-chip category-${event.category}`}>
                  {categoryLabels[event.category]}
                </span>
                {event.is_pinned && (
                  <span className="pin-chip"><Pin size={14} /> Маңызды</span>
                )}
              </div>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <div className="event-footer">
                <span><CalendarClock size={16} /> {new Date(event.start_time).toLocaleString('kk-KZ')}</span>
                <span><Users size={16} /> {event.attendees_count}</span>
                {isAdmin && (
                  <div className="admin-event-actions">
                    <button type="button" className="icon-action" onClick={() => startEdit(event)} aria-label="Өзгерту">
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-action danger"
                      onClick={() => deleteEventMutation.mutate(event.id)}
                      aria-label="Жою"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="rsvp-btn"
                  onClick={() => rsvpMutation.mutate(event.id)}
                  disabled={rsvpMutation.isPending}
                >
                  <Check size={16} />
                  Қатысамын
                </button>
              </div>
            </div>
          </article>
        )) : (
          <div className="events-empty">
            <CalendarClock size={34} />
            <h3>Іс-шаралар әлі жоқ</h3>
            <p>Әкімші қосқаннан кейін мұнда хабарландырулар лентасы пайда болады.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default EventsPage;
