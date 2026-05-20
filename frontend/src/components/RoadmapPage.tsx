import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Columns2, ExternalLink, Map, Plus, Route, Search } from 'lucide-react';
import client from '../api/client';
import type { RoadmapResponse, RoadmapTopic, Task, User } from '../types';
import '../styles/Roadmap.css';

type RoadmapPageProps = {
  user: User;
};

const difficultyClass = (difficulty: string) => {
  if (difficulty.includes('Өте') || difficulty.includes('Очень')) return 'very-hard';
  if (difficulty.includes('Қиын') || difficulty.includes('Сложно')) return 'hard';
  if (difficulty.includes('Орташа') || difficulty.includes('Средне')) return 'medium';
  return 'easy';
};

const RoadmapPage = ({ user }: RoadmapPageProps) => {
  const queryClient = useQueryClient();
  const [activeLevel, setActiveLevel] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'mindmap' | 'list'>('mindmap');

  const { data: roadmap, isFetching } = useQuery({
    queryKey: ['roadmap'],
    queryFn: async () => {
      const res = await client.get<RoadmapResponse>('/roadmap/topics/');
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
    mutationFn: async (topic: RoadmapTopic) => {
      const res = await client.post(`/roadmap/topics/${topic.id}/to-kanban/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const topics = useMemo(() => roadmap?.topics ?? [], [roadmap]);
  const levels = useMemo(() => roadmap?.levels ?? [], [roadmap]);

  const userRoadmapTaskIds = useMemo(() => {
    return new Set(
      tasks
        .filter((task) => task.assigned_to === user.id)
        .map((task) => {
          const match = task.description.match(/\[Roadmap:([a-z0-9-]+)\]/);
          return match?.[1];
        })
        .filter(Boolean),
    );
  }, [tasks, user.id]);

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    return topics.filter((topic) => {
      const levelMatches = activeLevel === 'all' || topic.level === activeLevel;
      const searchMatches = !query
        || topic.title.toLowerCase().includes(query)
        || topic.description.toLowerCase().includes(query)
        || topic.topics.some((item) => item.toLowerCase().includes(query));
      return levelMatches && searchMatches;
    });
  }, [activeLevel, search, topics]);

  const filteredTopicsByLevel = useMemo(() => {
    return levels.map((level) => ({
      ...level,
      topics: filteredTopics.filter((topic) => topic.level === level.id),
    }));
  }, [filteredTopics, levels]);

  const totalHours = topics.reduce((sum, topic) => sum + topic.estimated_hours, 0);
  const addedCount = topics.filter((topic) => userRoadmapTaskIds.has(topic.id)).length;
  const progress = topics.length ? Math.round((addedCount / topics.length) * 100) : 0;

  return (
    <div className="roadmap-page">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">Спорттық бағдарламалау</p>
          <h2>Спорттық бағдарламалау жол картасы</h2>
        </div>
        <div className="board-chip">
          <Route size={18} />
          {progress}% Kanban-да
        </div>
      </section>

      <section className="roadmap-summary">
        <article>
          <Map size={20} />
          <span>Тақырыптар</span>
          <strong>{topics.length}</strong>
        </article>
        <article>
          <Columns2 size={20} />
          <span>Kanban-да</span>
          <strong>{addedCount}</strong>
        </article>
        <article>
          <CheckCircle2 size={20} />
          <span>Уақыт бағасы</span>
          <strong>{totalHours} сағ</strong>
        </article>
      </section>

      <section className="roadmap-controls">
        <label>
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Іздеу: dp, графтар, сұрыптау..."
          />
        </label>
        <div className="roadmap-level-tabs">
          <button
            type="button"
            className={activeLevel === 'all' ? 'active' : ''}
            onClick={() => setActiveLevel('all')}
          >
            Барлығы
          </button>
          {levels.map((level) => (
            <button
              type="button"
              className={activeLevel === level.id ? 'active' : ''}
              onClick={() => setActiveLevel(level.id)}
              key={level.id}
            >
              {level.title}
            </button>
          ))}
        </div>
        <div className="roadmap-view-toggle">
          <button
            type="button"
            className={viewMode === 'mindmap' ? 'active' : ''}
            onClick={() => setViewMode('mindmap')}
          >
            Mindmap
          </button>
          <button
            type="button"
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            Тізім
          </button>
        </div>
      </section>

      <section className="roadmap-level-overview">
        {levels.map((level) => (
          <article className={activeLevel === level.id ? 'active' : ''} key={level.id}>
            <strong>{level.title}</strong>
            <span>{level.subtitle}</span>
            <p>{level.description}</p>
          </article>
        ))}
      </section>

      {viewMode === 'mindmap' && (
        <section className="roadmap-mindmap">
          {isFetching && <div className="roadmap-empty">Жол картасы жүктелуде...</div>}
          {!isFetching && filteredTopics.length === 0 && (
            <div className="roadmap-empty">Тақырыптар табылмады.</div>
          )}
          {!isFetching && filteredTopics.length > 0 && (
            <div className="mindmap-canvas">
              <div className="mindmap-root">
                <strong>Спорттық кодинг</strong>
                <span>0 → жоғары деңгей</span>
              </div>
              <div className="mindmap-branches">
                {filteredTopicsByLevel.map((level) => (
                  <div className={`mindmap-branch ${level.topics.length === 0 ? 'muted' : ''}`} key={level.id}>
                    <button
                      type="button"
                      className="mindmap-level-node"
                      onClick={() => setActiveLevel(level.id)}
                    >
                      <strong>{level.title}</strong>
                      <span>{level.subtitle}</span>
                    </button>
                    <div className="mindmap-topic-chain">
                      {level.topics.map((topic) => {
                        const isAdded = userRoadmapTaskIds.has(topic.id);
                        return (
                          <article className={`mindmap-topic-node ${isAdded ? 'added' : ''}`} key={topic.id}>
                            <div>
                              <small>{topic.order}. {topic.difficulty} · {topic.estimated_hours} сағ</small>
                              <strong>{topic.title}</strong>
                              <span>{topic.topics.slice(0, 3).join(', ')}</span>
                              <div className="mindmap-topic-links">
                                {topic.resources.slice(0, 2).map((resource) => (
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    key={`${topic.id}-${resource.url}`}
                                    aria-label={resource.title}
                                  >
                                    <ExternalLink size={13} />
                                    {resource.kind}
                                  </a>
                                ))}
                              </div>
                            </div>
                            <button
                              type="button"
                              aria-label={isAdded ? 'Kanban-да бар' : 'Kanban-ға көшіру'}
                              onClick={() => addToKanbanMutation.mutate(topic)}
                              disabled={isAdded || addToKanbanMutation.isPending}
                            >
                              {isAdded ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {viewMode === 'list' && (
        <section className="roadmap-topic-list">
          {isFetching && <div className="roadmap-empty">Жол картасы жүктелуде...</div>}
          {!isFetching && filteredTopics.length === 0 && (
            <div className="roadmap-empty">Тақырыптар табылмады.</div>
          )}

          {filteredTopics.map((topic) => {
            const isAdded = userRoadmapTaskIds.has(topic.id);
            return (
              <article className="roadmap-topic-card" key={topic.id}>
                <div className="roadmap-topic-order">{topic.order}</div>
                <div className="roadmap-topic-content">
                  <div className="roadmap-topic-head">
                    <div>
                      <h3>{topic.title}</h3>
                      <p>{topic.description}</p>
                    </div>
                    <span className={`roadmap-difficulty ${difficultyClass(topic.difficulty)}`}>
                      {topic.difficulty}
                    </span>
                  </div>

                  <div className="roadmap-topic-meta">
                    <span>{topic.estimated_hours} сағ</span>
                    <span>{levels.find((level) => level.id === topic.level)?.title}</span>
                  </div>

                  <div className="roadmap-topic-columns">
                    <div>
                      <strong>Нені оқу керек</strong>
                      <div className="roadmap-tags">
                        {topic.topics.map((item) => <span key={item}>{item}</span>)}
                      </div>
                    </div>
                    <div>
                      <strong>Тәжірибе</strong>
                      <ul>
                        {topic.practice.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="roadmap-resources">
                    <strong>Сілтемелер</strong>
                    <div className="roadmap-resource-list">
                      {topic.resources.map((resource) => (
                        <a href={resource.url} target="_blank" rel="noreferrer" key={`${topic.id}-${resource.url}`}>
                          <span>{resource.kind}{resource.source ? ` · ${resource.source}` : ''}</span>
                          <b>{resource.title}</b>
                          <ExternalLink size={15} />
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="roadmap-topic-actions">
                    <button
                      type="button"
                      className={isAdded ? 'added' : ''}
                      onClick={() => addToKanbanMutation.mutate(topic)}
                      disabled={isAdded || addToKanbanMutation.isPending}
                    >
                      {isAdded ? <CheckCircle2 size={17} /> : <Plus size={17} />}
                      {isAdded ? 'Kanban-да бар' : 'Kanban-ға көшіру'}
                    </button>
                    {isAdded && (
                      <Link to="/kanban">
                        <Columns2 size={16} />
                        Kanban ашу
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default RoadmapPage;
