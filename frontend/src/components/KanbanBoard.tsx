import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Columns2, Pencil, Plus, Trash2, X } from 'lucide-react';
import client from '../api/client';
import type { Faction, ProgramResource, ProgramResponse, RoadmapResource, RoadmapResponse, Task, User } from '../types';
import '../styles/Kanban.css';

const columns = [
  { id: 'todo', title: 'Үйрену қажет' },
  { id: 'in_progress', title: 'Орындалуда' },
  { id: 'review', title: 'Жетекші тексеруінде' },
  { id: 'done', title: 'Дайын' },
];

interface KanbanBoardProps {
  user: User;
}

type TaskStatus = Task['status'];

type TaskFormState = {
  title: string;
  description: string;
  faction: Exclude<Faction, 'none'>;
  status: TaskStatus;
  deadline: string;
  assigned_to: string;
};

type TaskReferenceLink = {
  title: string;
  url: string;
  source: string;
};

const resourceKindLabel = (kind: ProgramResource['kind']) => ({
  article: 'Мақала',
  video: 'Видео',
  practice: 'Практика',
  docs: 'Құжаттама',
  tool: 'Құрал',
  book: 'Кітап',
}[kind]);

const getEditableFaction = (faction: Faction): Exclude<Faction, 'none'> => {
  return faction === 'robotics' ? 'robotics' : 'informatics';
};

const getDefaultTaskForm = (user?: User): TaskFormState => ({
  title: '',
  description: '',
  faction: user ? getEditableFaction(user.faction) : 'informatics',
  status: 'todo',
  deadline: '',
  assigned_to: '',
});

const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const renderTaskDescription = (description: string) => {
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const lines = description.split('\n');

  return lines.map((line, lineIndex) => {
    const parts = line.split(urlRegex);
    return (
      <React.Fragment key={`${line}-${lineIndex}`}>
        {parts.map((part, partIndex) => {
          if (part.match(urlRegex)) {
            return (
              <a href={part} target="_blank" rel="noreferrer" key={`${part}-${partIndex}`}>
                {part}
              </a>
            );
          }
          return <React.Fragment key={`${part}-${partIndex}`}>{part}</React.Fragment>;
        })}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({ user }) => {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const [now] = useState(() => Date.now());
  const [taskForm, setTaskForm] = useState<TaskFormState>(() => getDefaultTaskForm(user));
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const canManageTasks = user.role === 'superuser' || user.role === 'leader';
  const canChooseFaction = user.role === 'superuser';

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await client.get<Task[]>('/tasks/');
      return res.data;
    },
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await client.get<ProgramResponse>('/programs/tracks/');
      return res.data;
    },
  });

  const { data: roadmap } = useQuery({
    queryKey: ['roadmap'],
    queryFn: async () => {
      const res = await client.get<RoadmapResponse>('/roadmap/topics/');
      return res.data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await client.get<User[]>('/users/');
      return res.data;
    },
    enabled: canManageTasks,
  });

  const assignableUsers = users.filter((member) => {
    if (member.role === 'superuser') return false;
    if (user.role === 'leader') return member.faction === user.faction;
    return member.faction === taskForm.faction;
  });

  const notifyTaskUpdated = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ message: 'task_updated' }));
    }
  };

  const statusTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number, status: string }) => {
      const res = await client.patch(`/tasks/${taskId}/`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      notifyTaskUpdated();
    },
  });

  const buildTaskPayload = () => ({
    title: taskForm.title,
    description: taskForm.description,
    faction: taskForm.faction,
    status: taskForm.status,
    deadline: taskForm.deadline ? new Date(taskForm.deadline).toISOString() : null,
    assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : null,
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const res = await client.post('/tasks/', buildTaskPayload());
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTaskForm(getDefaultTaskForm(user));
      notifyTaskUpdated();
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await client.patch(`/tasks/${taskId}/`, buildTaskPayload());
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setTaskForm(getDefaultTaskForm(user));
      setEditingTaskId(null);
      notifyTaskUpdated();
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await client.delete(`/tasks/${taskId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      notifyTaskUpdated();
    },
  });

  useEffect(() => {
    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('token');
    const wsUrl = `${protocol}//${window.location.host}/ws/tasks/${user.faction}/?token=${encodeURIComponent(token ?? '')}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message === 'task_updated') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    };

    return () => {
      socketRef.current?.close();
    };
  }, [user.faction, queryClient]);

  const onDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const onDrop = (e: React.DragEvent, status: string) => {
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    if (!taskId) return;
    statusTaskMutation.mutate({ taskId, status });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const isOverdue = (task: Task) => {
    if (!task.started_at || task.status !== 'in_progress') return false;
    return now - new Date(task.started_at).getTime() > 3 * 24 * 60 * 60 * 1000;
  };

  const canMoveTask = (task: Task) => {
    if (user.role === 'superuser') return true;
    if (user.role === 'leader') return task.faction === user.faction;
    return task.assigned_to === user.id;
  };

  const canManageTask = (task: Task) => {
    if (user.role === 'superuser') return true;
    return user.role === 'leader' && task.faction === user.faction;
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description,
      faction: getEditableFaction(task.faction),
      status: task.status,
      deadline: toDateTimeLocalValue(task.deadline),
      assigned_to: task.assigned_to ? String(task.assigned_to) : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setTaskForm(getDefaultTaskForm(user));
  };

  const handleDeleteTask = (task: Task) => {
    const confirmed = window.confirm(`"${task.title}" тапсырмасын жою керек пе?`);
    if (!confirmed) return;
    if (editingTaskId === task.id) {
      handleCancelEdit();
    }
    deleteTaskMutation.mutate(task.id);
  };

  const handleCreateTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingTaskId) {
      editTaskMutation.mutate(editingTaskId);
      return;
    }
    createTaskMutation.mutate();
  };

  const getTaskReferenceLinks = (task: Task): TaskReferenceLink[] => {
    const programId = task.description.match(/\[Program:([a-z0-9-]+)\]/)?.[1];
    if (programId) {
      const item = programs?.items.find((entry) => entry.id === programId);
      return (item?.resources ?? []).map((resource: ProgramResource) => ({
        title: resource.title,
        url: resource.url,
        source: resource.source || resourceKindLabel(resource.kind),
      }));
    }

    const roadmapId = task.description.match(/\[Roadmap:([a-z0-9-]+)\]/)?.[1];
    if (roadmapId) {
      const topic = roadmap?.topics.find((entry) => entry.id === roadmapId);
      return (topic?.resources ?? []).map((resource: RoadmapResource) => ({
        title: resource.title,
        url: resource.url,
        source: resource.source || resource.kind,
      }));
    }

    return [];
  };

  const isSavingTask = createTaskMutation.isPending || editTaskMutation.isPending;

  return (
    <div className="kanban-page">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">Жұмыс процесі</p>
          <h2>Kanban-тақта</h2>
        </div>
        <div className="board-chip">
          <Columns2 size={18} />
          {user.faction}
        </div>
      </section>

      {canManageTasks && (
        <section className="admin-task-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Әкімші</p>
              <h3>{editingTaskId ? 'Kanban тапсырмасын өзгерту' : 'Жаңа Kanban тапсырмасын қосу'}</h3>
            </div>
            {editingTaskId ? <Pencil size={22} /> : <Plus size={22} />}
          </div>
          <form className="task-admin-form" onSubmit={handleCreateTask}>
            <label>
              Атауы
              <input
                value={taskForm.title}
                onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </label>
            <label>
              Бағыт
              <select
                value={taskForm.faction}
                onChange={(event) => setTaskForm((current) => ({
                  ...current,
                  faction: event.target.value as TaskFormState['faction'],
                  assigned_to: '',
                }))}
                disabled={!canChooseFaction}
              >
                <option value="informatics">Информатика</option>
                <option value="robotics">Робототехника</option>
              </select>
            </label>
            <label>
              Орындаушы
              <select
                value={taskForm.assigned_to}
                onChange={(event) => setTaskForm((current) => ({ ...current, assigned_to: event.target.value }))}
              >
                <option value="">Таңдалмаған</option>
                {assignableUsers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.username}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Күйі
              <select
                value={taskForm.status}
                onChange={(event) => setTaskForm((current) => ({ ...current, status: event.target.value as TaskStatus }))}
              >
                <option value="todo">Үйрену қажет</option>
                <option value="in_progress">Орындалуда</option>
                <option value="review">Жетекші тексеруінде</option>
                <option value="done">Дайын</option>
              </select>
            </label>
            <label>
              Соңғы мерзім
              <input
                type="datetime-local"
                value={taskForm.deadline}
                onChange={(event) => setTaskForm((current) => ({ ...current, deadline: event.target.value }))}
              />
            </label>
            <label className="wide-field">
              Сипаттама
              <textarea
                value={taskForm.description}
                onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
            <div className="task-form-actions">
              <button type="submit" className="save-task-btn" disabled={isSavingTask}>
                <Check size={17} />
                {editingTaskId ? 'Сақтау' : 'Қосу'}
              </button>
              {editingTaskId && (
                <button type="button" className="cancel-task-btn" onClick={handleCancelEdit}>
                  <X size={17} />
                  Болдырмау
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <div className="kanban-board">
        {columns.map((col) => {
          const columnTasks = tasks.filter((task) => task.status === col.id);

          return (
            <div
              key={col.id}
              className="kanban-column"
              onDrop={(e) => onDrop(e, col.id)}
              onDragOver={onDragOver}
            >
              <div className="column-heading">
                <h3>{col.title}</h3>
                <span>{columnTasks.length}</span>
              </div>
              <div className="task-list">
                {columnTasks.map((task) => (
                  (() => {
                    const referenceLinks = getTaskReferenceLinks(task);
                    return (
                      <div
                        key={task.id}
                        className={`task-card ${isOverdue(task) ? 'task-overdue' : ''} ${!canMoveTask(task) ? 'task-locked' : ''}`}
                        draggable={canMoveTask(task)}
                        onDragStart={(e) => canMoveTask(task) && onDragStart(e, task.id)}
                      >
                        <div className="task-card-top">
                          <h4>{task.title}</h4>
                          <div className="task-card-tools">
                            {isOverdue(task) && <AlertTriangle size={18} />}
                            {canManageTasks && canManageTask(task) && (
                              <>
                                <button
                                  type="button"
                                  aria-label="Тапсырманы өзгерту"
                                  onClick={() => handleEditTask(task)}
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Тапсырманы жою"
                                  onClick={() => handleDeleteTask(task)}
                                  disabled={deleteTaskMutation.isPending}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {task.description && (
                          <div className="task-description">
                            {renderTaskDescription(task.description)}
                          </div>
                        )}
                        {referenceLinks.length > 0 && (
                          <div className="task-reference-list">
                            <strong>Сілтемелер</strong>
                            {referenceLinks.map((reference) => (
                              <a href={reference.url} target="_blank" rel="noreferrer" key={reference.url}>
                                <span>{reference.source}</span>
                                {reference.title}
                              </a>
                            ))}
                          </div>
                        )}
                        <div className="task-footer">
                          <span>{task.assigned_to_details?.username || 'Орындаушы жоқ'}</span>
                          {task.deadline && <time>{new Date(task.deadline).toLocaleDateString('kk-KZ')}</time>}
                        </div>
                        {!canMoveTask(task) && <div className="task-lock-note">Бұл карточканы өзгертуге рұқсат жоқ</div>}
                      </div>
                    );
                  })()
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
