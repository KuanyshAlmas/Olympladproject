import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Code2, ExternalLink, Filter, Play, Save, Search, Send, Terminal, Trophy, Users } from 'lucide-react';
import client from '../api/client';
import type {
  CodeRunResult,
  CodeforcesProblem,
  CodeforcesProblemResponse,
  CodeforcesSolution,
  CodeforcesStatementResponse,
  User,
} from '../types';
import '../styles/Codeforces.css';

type SolutionForm = {
  status: CodeforcesSolution['status'];
  language: string;
  solution_code: string;
  notes: string;
};

const statusLabels: Record<CodeforcesSolution['status'], string> = {
  todo: 'Жоспарда',
  solving: 'Шешіп жатыр',
  solved: 'Шешілді',
};

const languages = ['GNU C++17', 'GNU C++20', 'Python 3', 'PyPy 3', 'Java 17'];
const statementSourceLabels: Record<CodeforcesStatementResponse['source'], string> = {
  codeforces: 'Codeforces',
  local: 'Жергілікті',
  demo: 'Демо',
  unavailable: 'Қолжетімсіз',
};

type CodeforcesPageProps = {
  user: User;
};

const CodeforcesPage = ({ user }: CodeforcesPageProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tags, setTags] = useState('');
  const [minRating, setMinRating] = useState('800');
  const [maxRating, setMaxRating] = useState('1600');
  const [selectedProblem, setSelectedProblem] = useState<CodeforcesProblem | null>(null);
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  const [statementText, setStatementText] = useState('');
  const [runnerInput, setRunnerInput] = useState('');
  const [runnerResult, setRunnerResult] = useState<CodeRunResult | null>(null);
  const [form, setForm] = useState<SolutionForm>({
    status: 'solving',
    language: 'GNU C++17',
    solution_code: '',
    notes: '',
  });

  const { data, isFetching } = useQuery({
    queryKey: ['codeforces-problems', search, tags, minRating, maxRating],
    queryFn: async () => {
      const res = await client.get<CodeforcesProblemResponse>('/codeforces/problems/', {
        params: {
          search,
          tags,
          min_rating: minRating || undefined,
          max_rating: maxRating || undefined,
          limit: 80,
        },
      });
      return res.data;
    },
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['codeforces-solutions'],
    queryFn: async () => {
      const res = await client.get<CodeforcesSolution[]>('/codeforces-solutions/');
      return res.data;
    },
  });

  const { data: statement, isFetching: isStatementFetching } = useQuery({
    queryKey: ['codeforces-statement', selectedProblem?.contestId, selectedProblem?.index],
    enabled: Boolean(selectedProblem),
    queryFn: async () => {
      if (!selectedProblem) {
        throw new Error('Есеп таңдалмаған');
      }
      const problemIndex = encodeURIComponent(selectedProblem.index);
      const res = await client.get<CodeforcesStatementResponse>(
        `/codeforces/problems/${selectedProblem.contestId}/${problemIndex}/statement/`,
      );
      return res.data;
    },
  });

  const ownSolution = useMemo(() => {
    if (!selectedProblem) return null;
    return solutions.find((solution) => (
      solution.contest_id === selectedProblem.contestId
      && solution.index === selectedProblem.index
      && solution.user === user.id
    )) ?? null;
  }, [selectedProblem, solutions, user.id]);

  const selectedProblemSolutions = useMemo(() => {
    if (!selectedProblem) return [];
    return solutions.filter((solution) => (
      solution.contest_id === selectedProblem.contestId
      && solution.index === selectedProblem.index
    ));
  }, [selectedProblem, solutions]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProblem) return null;
      const payload = {
        contest_id: selectedProblem.contestId,
        index: selectedProblem.index,
        name: selectedProblem.name,
        rating: selectedProblem.rating ?? null,
        tags: selectedProblem.tags,
        status: form.status,
        language: form.language,
        solution_code: form.solution_code,
        notes: form.notes,
      };
      const res = await client.post('/codeforces-solutions/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['codeforces-solutions'] });
    },
  });

  const saveStatementMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProblem) return null;
      const problemIndex = encodeURIComponent(selectedProblem.index);
      const res = await client.put<CodeforcesStatementResponse>(
        `/codeforces/problems/${selectedProblem.contestId}/${problemIndex}/statement/`,
        {
          name: selectedProblem.name,
          statement_text: statementText,
        },
      );
      return res.data;
    },
    onSuccess: () => {
      if (!selectedProblem) return;
      queryClient.invalidateQueries({
        queryKey: ['codeforces-statement', selectedProblem.contestId, selectedProblem.index],
      });
      setIsEditingStatement(false);
    },
  });

  const runCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await client.post<CodeRunResult>('/codeforces/run/', {
        language: form.language,
        code: form.solution_code,
        stdin: runnerInput,
      });
      return res.data;
    },
    onSuccess: (result) => {
      setRunnerResult(result);
    },
  });

  const pickProblem = (problem: CodeforcesProblem) => {
    const saved = solutions.find((solution) => (
      solution.contest_id === problem.contestId
      && solution.index === problem.index
      && solution.user === user.id
    ));
    setSelectedProblem(problem);
    setIsEditingStatement(false);
    setStatementText('');
    setRunnerInput('');
    setRunnerResult(null);
    setForm({
      status: saved?.status ?? 'solving',
      language: saved?.language ?? 'GNU C++17',
      solution_code: saved?.solution_code ?? '',
      notes: saved?.notes ?? '',
    });
  };

  const toggleStatementEditor = () => {
    if (isEditingStatement) {
      setIsEditingStatement(false);
      return;
    }
    setStatementText(statement?.statementText ?? '');
    setIsEditingStatement(true);
  };

  const problems = data?.problems ?? [];
  const solvedCount = solutions.filter((solution) => solution.status === 'solved').length;
  const isAdmin = user.role === 'superuser';
  const canReviewSolutions = user.role === 'superuser' || user.role === 'leader';

  return (
    <div className="codeforces-page">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">Codeforces</p>
          <h2>Есептерді сайт ішінде шешу</h2>
        </div>
        <div className="board-chip">
          <Trophy size={18} />
          {solvedCount} шешілді
        </div>
      </section>

      <section className="cf-toolbar">
        <label>
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Атауы немесе 4A"
          />
        </label>
        <label>
          <Filter size={17} />
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="dp, математика, графтар"
          />
        </label>
        <input
          type="number"
          value={minRating}
          onChange={(event) => setMinRating(event.target.value)}
          placeholder="ең аз"
        />
        <input
          type="number"
          value={maxRating}
          onChange={(event) => setMaxRating(event.target.value)}
          placeholder="ең көп"
        />
        <span className={`cf-source ${data?.source === 'fallback' ? 'fallback' : ''}`}>
          {data?.source === 'fallback' ? 'демо' : 'Codeforces API'}
        </span>
      </section>

      <section className="cf-workspace">
        <div className="cf-problem-list">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Есептер жиыны</p>
              <h3>{isFetching ? 'Жүктелуде...' : `${problems.length} есеп`}</h3>
            </div>
            <Code2 size={20} />
          </div>
          <div className="cf-problems">
            {problems.map((problem) => {
              const problemSolutions = solutions.filter((solution) => (
                solution.contest_id === problem.contestId && solution.index === problem.index
              ));
              const saved = problemSolutions.find((solution) => solution.user === user.id);
              const solvedStudents = problemSolutions.filter((solution) => solution.status === 'solved').length;
              return (
                <button
                  type="button"
                  className={`cf-problem-card ${selectedProblem?.contestId === problem.contestId && selectedProblem.index === problem.index ? 'active' : ''}`}
                  key={`${problem.contestId}${problem.index}`}
                  onClick={() => pickProblem(problem)}
                >
                  <div>
                    <strong>{problem.contestId}{problem.index}. {problem.name}</strong>
                    <span>{problem.tags.slice(0, 4).join(', ') || 'тег жоқ'}</span>
                  </div>
                  <div className="cf-problem-meta">
                    <span>{problem.rating ?? 'Рейтинг жоқ'}</span>
                    {saved && <small className={`cf-status ${saved.status}`}>{statusLabels[saved.status]}</small>}
                    {canReviewSolutions && problemSolutions.length > 0 && (
                      <small className="cf-review-count">{solvedStudents}/{problemSolutions.length}</small>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="cf-solver">
          {selectedProblem ? (
            <>
              <div className="cf-solver-head">
                <div>
                  <p className="eyebrow">Шешім</p>
                  <h3>{selectedProblem.contestId}{selectedProblem.index}. {selectedProblem.name}</h3>
                  <span>{selectedProblem.rating ?? 'Рейтинг жоқ'} · {selectedProblem.solvedCount} рет шешілген</span>
                </div>
                <div className="cf-links">
                  <a href={selectedProblem.problemUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} />
                    Есеп шарты
                  </a>
                  <a href={selectedProblem.submitUrl} target="_blank" rel="noreferrer">
                    <Send size={16} />
                    Жіберу
                  </a>
                </div>
              </div>

              <div className="cf-tags">
                {selectedProblem.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>

              <section className={`cf-statement-panel ${statement?.source === 'unavailable' ? 'unavailable' : ''}`}>
                <div className="cf-statement-heading">
                  <div>
                    <p className="eyebrow">Есеп шарты</p>
                    <h4>Есептің шарты</h4>
                  </div>
                  <span>
                    {isStatementFetching ? 'жүктелуде' : statement ? statementSourceLabels[statement.source] : 'жүктелуде'}
                  </span>
                </div>
                {isStatementFetching ? (
                  <div className="cf-statement-loading">Есеп шарты жүктелуде...</div>
                ) : (
                  <div
                    className="cf-statement"
                    dangerouslySetInnerHTML={{ __html: statement?.statementHtml ?? '' }}
                  />
                )}
                {isAdmin && (
                  <div className="cf-admin-statement">
                    <button
                      type="button"
                      onClick={toggleStatementEditor}
                    >
                      {isEditingStatement ? 'Жабу' : 'Есеп шартын қосу / өзгерту'}
                    </button>
                    {isEditingStatement && (
                      <div className="cf-admin-editor">
                        <textarea
                          value={statementText}
                          onChange={(event) => setStatementText(event.target.value)}
                          placeholder="Есеп шарты, кіріс деректері, шығыс деректері, мысалдар..."
                        />
                        <button
                          type="button"
                          onClick={() => saveStatementMutation.mutate()}
                          disabled={saveStatementMutation.isPending || !statementText.trim()}
                        >
                          <Save size={16} />
                          Сақтау
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <div className="cf-form-grid">
                <label>
                  Күйі
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SolutionForm['status'] }))}
                  >
                    <option value="todo">Жоспарда</option>
                    <option value="solving">Шешіп жатыр</option>
                    <option value="solved">Шешілді</option>
                  </select>
                </label>
                <label>
                  Тіл
                  <select
                    value={form.language}
                    onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
                  >
                    {languages.map((language) => <option key={language}>{language}</option>)}
                  </select>
                </label>
              </div>

              <label className="cf-editor-label">
                Код
                <textarea
                  className="cf-code-editor"
                  value={form.solution_code}
                  onChange={(event) => setForm((current) => ({ ...current, solution_code: event.target.value }))}
                  spellCheck={false}
                  placeholder="#include <bits/stdc++.h>..."
                />
              </label>

              <section className="cf-runner-panel">
                <div className="cf-runner-heading">
                  <div>
                    <p className="eyebrow">Код іске қосу</p>
                    <h4>Кодты тексеру</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => runCodeMutation.mutate()}
                    disabled={runCodeMutation.isPending || !form.solution_code.trim()}
                  >
                    <Play size={16} />
                    {runCodeMutation.isPending ? 'Іске қосылуда...' : 'Іске қосу'}
                  </button>
                </div>

                <div className="cf-runner-grid">
                  <label>
                    Кіріс деректері
                    <textarea
                      value={runnerInput}
                      onChange={(event) => setRunnerInput(event.target.value)}
                      placeholder="Мысалы: 8"
                      spellCheck={false}
                    />
                  </label>

                  <div className="cf-runner-output">
                    <div className="cf-runner-output-head">
                      <span>
                        <Terminal size={15} />
                        Нәтиже
                      </span>
                      {runnerResult && (
                        <small className={runnerResult.ok ? 'success' : 'error'}>
                          {runnerResult.timed_out
                            ? 'уақыт шегі'
                            : `${runnerResult.phase === 'compile' ? 'компиляция' : 'іске қосу'} · шығу коды ${runnerResult.exit_code ?? '-'}`}
                          {' · '}
                          {runnerResult.duration_ms} мс
                        </small>
                      )}
                    </div>
                    <pre>
                      {runnerResult
                        ? [
                          runnerResult.compile_output && `Компиляция:\n${runnerResult.compile_output}`,
                          runnerResult.stdout && `Шығыс:\n${runnerResult.stdout}`,
                          runnerResult.stderr && `Қате:\n${runnerResult.stderr}`,
                          !runnerResult.compile_output && !runnerResult.stdout && !runnerResult.stderr && 'Нәтиже жоқ.',
                        ].filter(Boolean).join('\n\n')
                        : 'Кодты өз кіріс деректеріңізбен тексеру үшін "Іске қосу" батырмасын басыңыз.'}
                    </pre>
                  </div>
                </div>
              </section>

              <label className="cf-editor-label">
                Ескертпе / идея
                <textarea
                  className="cf-notes"
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Идея, қиын жерлер, шеткі жағдайлар..."
                />
              </label>

              <div className="cf-save-row">
                <button type="button" className="cf-save-btn" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  <Save size={17} />
                  {ownSolution ? 'Өзгерістерді сақтау' : 'Шешімді сақтау'}
                </button>
                {ownSolution && <span>Соңғы өзгеріс: {new Date(ownSolution.updated_at).toLocaleString('kk-KZ')}</span>}
              </div>

              {canReviewSolutions && (
                <section className="cf-review-panel">
                  <div className="cf-review-heading">
                    <div>
                      <p className="eyebrow">Бақылау</p>
                      <h4>Оқушылардың шешімдері</h4>
                    </div>
                    <span>
                      <Users size={16} />
                      {selectedProblemSolutions.length}
                    </span>
                  </div>

                  {selectedProblemSolutions.length === 0 ? (
                    <div className="cf-review-empty">Бұл есеп бойынша әзірге ешкім шешім сақтамаған.</div>
                  ) : (
                    <div className="cf-review-list">
                      {selectedProblemSolutions.map((solution) => (
                        <article className="cf-review-card" key={solution.id}>
                          <div className="cf-review-card-head">
                            <div>
                              <strong>{solution.user_details?.username ?? `қолданушы #${solution.user}`}</strong>
                              <span>
                                {solution.user_details?.faction === 'informatics' ? 'Информатика' : ''}
                                {solution.user_details?.faction === 'robotics' ? 'Робототехника' : ''}
                                {solution.user_details?.faction === 'none' ? 'Бағыт жоқ' : ''}
                                {' · '}
                                {solution.language}
                              </span>
                            </div>
                            <small className={`cf-status ${solution.status}`}>{statusLabels[solution.status]}</small>
                          </div>

                          {solution.notes && (
                            <div className="cf-review-notes">
                              <b>Идея:</b> {solution.notes}
                            </div>
                          )}

                          <pre className="cf-review-code">
                            {solution.solution_code || 'Код әзірге қосылмаған.'}
                          </pre>

                          <div className="cf-review-time">
                            Жаңартылды: {new Date(solution.updated_at).toLocaleString('kk-KZ')}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          ) : (
            <div className="cf-empty-solver">
              <Code2 size={36} />
              <h3>Есеп таңдаңыз</h3>
              <p>Сол жақтан Codeforces есебін таңдаңыз, код жазыңыз және статус пен ескертпені сақтаңыз.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CodeforcesPage;
