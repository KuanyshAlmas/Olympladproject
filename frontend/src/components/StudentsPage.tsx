import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus, Trash2, UsersRound, X } from 'lucide-react';
import client from '../api/client';
import type { Faction, User, UserRole } from '../types';
import '../styles/Students.css';

type StudentsPageProps = {
  user: User;
};

type StudentFormState = {
  username: string;
  password: string;
  role: UserRole;
  faction: Faction;
};

const factionLabels: Record<Faction, string> = {
  informatics: 'Информатика',
  robotics: 'Робототехника',
  none: 'Бағыт жоқ',
};

const roleLabels: Record<UserRole, string> = {
  superuser: 'Бас мұғалім',
  leader: 'Топ жетекшісі',
  student: 'Оқушы',
};

const getDefaultForm = (): StudentFormState => ({
  username: '',
  password: '',
  role: 'student',
  faction: 'informatics',
});

const getDisplayName = (member: User) => {
  const fullName = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim();
  return fullName || member.username;
};

const StudentsPage = ({ user }: StudentsPageProps) => {
  const queryClient = useQueryClient();
  const isAdmin = user.role === 'superuser';
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StudentFormState>(() => getDefaultForm());

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await client.get<User[]>('/users/');
      return res.data;
    },
  });

  const students = useMemo(() => {
    return users
      .filter((member) => member.role !== 'superuser')
      .sort((a, b) => {
        if (a.faction !== b.faction) return a.faction.localeCompare(b.faction);
        if (a.role !== b.role) return a.role.localeCompare(b.role);
        return a.username.localeCompare(b.username);
      });
  }, [users]);

  const totals = useMemo(() => {
    return students.reduce(
      (acc, member) => {
        acc.focus += member.focus_points;
        acc.gpa += member.social_gpa;
        return acc;
      },
      { focus: 0, gpa: 0 },
    );
  }, [students]);

  const saveUserMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        username: form.username,
        role: form.role,
        faction: form.faction,
        ...(form.password ? { password: form.password } : {}),
      };

      if (editingId) {
        const res = await client.patch(`/users/${editingId}/`, payload);
        return res.data;
      }

      const res = await client.post('/users/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingId(null);
      setForm(getDefaultForm());
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await client.delete(`/users/${userId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const startEdit = (member: User) => {
    setEditingId(member.id);
    setForm({
      username: member.username,
      password: '',
      role: member.role,
      faction: member.faction,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(getDefaultForm());
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveUserMutation.mutate();
  };

  const averageGpa = students.length > 0 ? totals.gpa / students.length : 0;

  return (
    <div className="students-page">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">Оқушылар базасы</p>
          <h2>Оқушылар тізімі</h2>
        </div>
        <div className="board-chip">
          <UsersRound size={18} />
          {students.length} адам
        </div>
      </section>

      <section className="students-metrics">
        <article>
          <span>Оқушылар</span>
          <strong>{students.filter((member) => member.role === 'student').length}</strong>
        </article>
        <article>
          <span>Топ жетекшілері</span>
          <strong>{students.filter((member) => member.role === 'leader').length}</strong>
        </article>
        <article>
          <span>Жалпы фокус ұпайлары</span>
          <strong>{totals.focus}</strong>
        </article>
        <article>
          <span>Орташа GPA</span>
          <strong>{averageGpa.toFixed(1)}</strong>
        </article>
      </section>

      {isAdmin && (
        <section className="student-admin-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Әкімші</p>
              <h3>{editingId ? 'Пайдаланушыны өзгерту' : 'Жаңа оқушы қосу'}</h3>
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
          <form className="student-admin-form" onSubmit={handleSubmit}>
            <label>
              Қолданушы аты
              <input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                required
              />
            </label>
            <label>
              Құпиясөз
              <input
                type="password"
                value={form.password}
                placeholder={editingId ? 'Өзгертпеу үшін бос қалдырыңыз' : ''}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required={!editingId}
              />
            </label>
            <label>
              Рөл
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))}
              >
                <option value="student">Оқушы</option>
                <option value="leader">Топ жетекшісі</option>
                <option value="superuser">Бас мұғалім</option>
              </select>
            </label>
            <label>
              Бағыт
              <select
                value={form.faction}
                onChange={(event) => setForm((current) => ({ ...current, faction: event.target.value as Faction }))}
              >
                <option value="informatics">Информатика</option>
                <option value="robotics">Робототехника</option>
                <option value="none">Бағыт жоқ</option>
              </select>
            </label>
            <button type="submit" className="save-student-btn" disabled={saveUserMutation.isPending}>
              <Check size={17} />
              {editingId ? 'Сақтау' : 'Қосу'}
            </button>
          </form>
        </section>
      )}

      <section className="students-table-panel">
        <div className="students-table-scroll">
          <table className="students-table">
            <thead>
              <tr>
                <th>Аты</th>
                <th>Рөл</th>
                <th>Бағыт</th>
                <th>Әлеуметтік GPA</th>
                <th>Фокус ұпайлары</th>
                {isAdmin && <th>Әрекет</th>}
              </tr>
            </thead>
            <tbody>
              {students.map((member) => (
                <tr key={member.id}>
                  <td>
                    <Link className="student-profile-link" to={`/students/${member.id}`}>
                      {getDisplayName(member)}
                    </Link>
                    <span>{member.username}</span>
                  </td>
                  <td>{roleLabels[member.role]}</td>
                  <td>{factionLabels[member.faction]}</td>
                  <td>{member.social_gpa.toFixed(1)}</td>
                  <td>{member.focus_points}</td>
                  {isAdmin && (
                    <td>
                      <div className="student-actions">
                        <button type="button" className="icon-action" onClick={() => startEdit(member)} aria-label="Өзгерту">
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-action danger"
                          onClick={() => deleteUserMutation.mutate(member.id)}
                          aria-label="Жою"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default StudentsPage;
