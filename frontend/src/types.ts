export type UserRole = 'superuser' | 'leader' | 'student';
export type Faction = 'informatics' | 'robotics' | 'none';

export type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  faction: Faction;
  social_gpa: number;
  focus_points: number;
};

export type Task = {
  id: number;
  title: string;
  description: string;
  faction: Faction;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  assigned_to: number | null;
  assigned_to_details?: User;
  deadline?: string;
  started_at?: string;
};

export type RoadmapLevel = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
};

export type RoadmapTopic = {
  id: string;
  level: string;
  order: number;
  title: string;
  difficulty: string;
  estimated_hours: number;
  description: string;
  topics: string[];
  practice: string[];
  resources: RoadmapResource[];
};

export type RoadmapResource = {
  kind: string;
  title: string;
  url: string;
  source: string;
};

export type RoadmapResponse = {
  levels: RoadmapLevel[];
  topics: RoadmapTopic[];
};

export type ProgramTrack = {
  id: string;
  title: string;
  faction: Faction;
  level: string;
  lessons: number;
  description: string;
  outcomes: string[];
  order: number;
  is_active: boolean;
};

export type ProgramItem = {
  id: string;
  track_id: string;
  kind: 'diagnostic' | 'lesson' | 'quiz' | 'contest' | 'project';
  title: string;
  duration_minutes: number;
  description: string;
  topics: string[];
  practice: string[];
  track?: ProgramTrack;
  order: number;
  is_active: boolean;
  resources: ProgramResource[];
};

export type ProgramResource = {
  id: string;
  item_id: string;
  kind: 'article' | 'video' | 'practice' | 'docs' | 'tool' | 'book';
  title: string;
  url: string;
  source: string;
  description: string;
  order: number;
  is_active: boolean;
};

export type ProgramResponse = {
  tracks: ProgramTrack[];
  items: ProgramItem[];
};

export type DailyStandup = {
  id: number;
  user: number;
  user_details?: User;
  date: string;
  what_done: string;
  difficulties: string;
  plan_next: string;
};

export type EventCategory = 'olympiad' | 'internal' | 'school';

export type EventItem = {
  id: number;
  title: string;
  description: string;
  category: EventCategory;
  start_time: string;
  end_time: string;
  poster: string | null;
  created_at: string;
  is_pinned: boolean;
  attendees_count: number;
};

export type StudentProfileRSVP = {
  id: number;
  is_attending: boolean;
  created_at: string;
  event: Pick<EventItem, 'id' | 'title' | 'description' | 'category' | 'start_time' | 'end_time' | 'is_pinned'>;
};

export type Skill = {
  id: number;
  name: string;
  description: string;
  faction: Faction;
};

export type UserSkill = {
  id: number;
  user: number;
  skill: number;
  skill_details?: Skill;
  level: 0 | 1 | 2;
  updated_at: string;
};

export type PomodoroSession = {
  id: number;
  user: number;
  user_details?: User;
  mode: 'focus' | 'break';
  duration_minutes: number;
  completed: boolean;
  started_at: string;
  ended_at: string;
  created_at: string;
};

export type CodeforcesProblem = {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
  solvedCount: number;
  problemUrl: string;
  submitUrl: string;
};

export type CodeforcesProblemResponse = {
  source: 'codeforces' | 'fallback';
  count: number;
  problems: CodeforcesProblem[];
};

export type CodeforcesStatementResponse = {
  source: 'codeforces' | 'local' | 'demo' | 'unavailable';
  contestId: number;
  index: string;
  name: string;
  problemUrl: string;
  statementText: string;
  statementHtml: string;
};

export type CodeRunResult = {
  ok: boolean;
  phase: 'compile' | 'run' | 'system';
  exit_code: number | null;
  stdout: string;
  stderr: string;
  compile_output: string;
  timed_out: boolean;
  duration_ms: number;
};

export type CodeforcesSolution = {
  id: number;
  user: number;
  user_details?: User;
  contest_id: number;
  index: string;
  name: string;
  rating: number | null;
  tags: string[];
  status: 'todo' | 'solving' | 'solved';
  language: string;
  solution_code: string;
  notes: string;
  problem_url: string;
  submit_url: string;
  created_at: string;
  updated_at: string;
};

export type AssistantMessage = {
  id: number;
  thread: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type AssistantThread = {
  id: number;
  owner: number;
  owner_details?: User;
  title: string;
  latest_message: AssistantMessage | null;
  messages_count: number;
  created_at: string;
  updated_at: string;
};

export type StudentProfileStats = {
  tasks_total: number;
  tasks_done: number;
  tasks_in_progress: number;
  tasks_review: number;
  stuck_tasks: number;
  overdue_tasks: number;
  codeforces_total: number;
  codeforces_solved: number;
  codeforces_solving: number;
  focus_minutes: number;
  focus_sessions: number;
  active_days: number;
  streak_days: number;
  standups_count: number;
  olympiads_count: number;
  events_attending_count: number;
};

export type StudentProfileAnalysis = {
  level: 'good' | 'info' | 'warning';
  title: string;
  text: string;
};

export type StudentProfileAchievement = {
  title: string;
  description: string;
  unlocked: boolean;
};

export type StudentProfile = {
  user: User;
  stats: StudentProfileStats;
  analysis: StudentProfileAnalysis[];
  achievements: StudentProfileAchievement[];
  tasks: Task[];
  codeforces_solutions: CodeforcesSolution[];
  pomodoro_sessions: PomodoroSession[];
  standups: DailyStandup[];
  rsvps: StudentProfileRSVP[];
};
