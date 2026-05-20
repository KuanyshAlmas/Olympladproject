import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Code2,
  Cpu,
  Medal,
  Trophy,
} from 'lucide-react';
import '../styles/PublicLanding.css';

const courses = [
  {
    title: 'Информатика олимпиадасы',
    level: 'Бастапқыдан жоғары деңгейге дейін',
    lessons: 120,
    tone: 'blue',
    badge: 'Ең таңдаулы',
  },
  {
    title: 'Робототехника және Arduino',
    level: 'Жоба арқылы оқу',
    lessons: 80,
    tone: 'amber',
    badge: 'Тәжірибелік бағыт',
  },
  {
    title: 'Алгоритмдік дайындық',
    level: 'Жарыс бағыты',
    lessons: 150,
    tone: 'violet',
    badge: 'Олимпиада негізі',
  },
];

const benefits = [
  {
    title: 'Жеке оқу жолы',
    text: 'Әр оқушыға бастапқы деңгейден олимпиадалық есептерге дейін нақты бағыт беріледі.',
    icon: Trophy,
  },
  {
    title: 'Тәжірибеге негізделген жүйе',
    text: 'Бағдарламалау есептері, робототехника жобалары, қысқа тесттер және апталық жарыстар.',
    icon: Code2,
  },
  {
    title: 'Прогресс панелі',
    text: 'Мұғалім мен оқушы шешілген есептерді, рейтингті және даму қарқынын көре алады.',
    icon: BarChart3,
  },
  {
    title: 'Олимпиадаға дайындық',
    text: 'Мектеп, қала, республикалық және халықаралық жарыстарға жүйелі дайындық.',
    icon: Medal,
  },
];

const showcases = [
  {
    label: '1-деңгей',
    title: 'Негіз',
    description: 'Логика, Scratch, Python негіздері, математикалық ойлау және алғашқы робототехника тапсырмалары.',
    weeks: '4-8 апта',
  },
  {
    label: '2-деңгей',
    title: 'Олимпиадалық ядро',
    description: 'C++, алгоритмдер, деректер құрылымы, Codeforces стиліндегі практика және апталық жарыстар.',
    weeks: '8-16 апта',
  },
  {
    label: '3-деңгей',
    title: 'Робототехника зертханасы',
    description: 'Arduino, датчиктер, LEGO EV3, инженерлік жобалар және командалық жарыс практикасы.',
    weeks: 'жоба бағыты',
  },
];

const stats = [
  { value: '3', label: 'оқу бағыты' },
  { value: '350+', label: 'практикалық сабақ' },
  { value: '24/7', label: 'онлайн қолжетімділік' },
  { value: '12', label: 'апталық тапсырма' },
];

const results = [
  'Жеке оқу траекториясы',
  'Апталық бағдарламалау жарысы',
  'Робототехника жобалары',
  'Мұғалімге прогресс панелі',
  'Олимпиадаға жүйелі дайындық',
  'Python, C++, Arduino, EV3',
];

type DiagnosticDirection = 'informatics' | 'robotics' | 'both';

type DiagnosticOption = {
  label: string;
  score: number;
  direction: DiagnosticDirection;
};

type DiagnosticQuestion = {
  id: string;
  title: string;
  options: DiagnosticOption[];
};

const diagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: 'experience',
    title: 'Бағдарламалау немесе робототехникамен бұрын айналыстың ба?',
    options: [
      { label: 'Жоқ, енді бастаймын', score: 1, direction: 'both' },
      { label: 'Scratch немесе Python көрдім', score: 2, direction: 'informatics' },
      { label: 'Arduino, LEGO немесе датчикпен жұмыс істедім', score: 2, direction: 'robotics' },
    ],
  },
  {
    id: 'interest',
    title: 'Қай тапсырма көбірек қызықтырады?',
    options: [
      { label: 'Логикалық есептер шығару', score: 3, direction: 'informatics' },
      { label: 'Робот құрастырып, қозғалысын басқару', score: 3, direction: 'robotics' },
      { label: 'Екеуін де байқап көру', score: 2, direction: 'both' },
    ],
  },
  {
    id: 'logic',
    title: 'Есеп қиын болса не істейсің?',
    options: [
      { label: 'Мұғалімнің көмегін күтемін', score: 1, direction: 'both' },
      { label: 'Ұқсас мысалды іздеп, қайталап көремін', score: 2, direction: 'informatics' },
      { label: 'Бірнеше әдіс жасап, нәтижесін тексеремін', score: 3, direction: 'both' },
    ],
  },
  {
    id: 'coding',
    title: 'Код жазу деңгейің қандай?',
    options: [
      { label: 'Айнымалы, шарт, циклді әлі үйрену керек', score: 1, direction: 'informatics' },
      { label: 'Қарапайым Python/C++ есептерін шығара аламын', score: 2, direction: 'informatics' },
      { label: 'Функция, массив, алгоритм тақырыптарын білемін', score: 3, direction: 'informatics' },
    ],
  },
  {
    id: 'project',
    title: 'Жоба жасағанда қай рөл саған жақын?',
    options: [
      { label: 'Идея ойлап, схема құру', score: 2, direction: 'robotics' },
      { label: 'Код жазып, қатені табу', score: 3, direction: 'informatics' },
      { label: 'Командамен бірге толық нәтиже шығару', score: 3, direction: 'both' },
    ],
  },
];

const whatsappUrl = 'https://wa.me/77089590836?text=%D0%A1%D3%99%D0%BB%D0%B5%D0%BC%2C%20Olymplad%20%D1%82%D0%B5%D0%B3%D1%96%D0%BD%20%D0%B4%D0%B8%D0%B0%D0%B3%D0%BD%D0%BE%D1%81%D1%82%D0%B8%D0%BA%D0%B0%D2%93%D0%B0%20%D0%B6%D0%B0%D0%B7%D1%8B%D0%BB%D2%93%D1%8B%D0%BC%20%D0%BA%D0%B5%D0%BB%D0%B5%D0%B4%D1%96.';

const PublicLandingPage = () => {
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const landingHashes = new Set(['#top', '#showcase', '#courses', '#about', '#diagnostic']);
    const previousScrollRestoration = window.history.scrollRestoration;

    window.history.scrollRestoration = 'manual';

    if (landingHashes.has(window.location.hash)) {
      window.history.replaceState(null, '', window.location.pathname || '/');
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  const selectedDiagnosticOptions = diagnosticQuestions.flatMap((question) => {
    const answer = diagnosticAnswers[question.id];
    const option = question.options.find((item) => item.label === answer);
    return option ? [option] : [];
  });
  const diagnosticScore = selectedDiagnosticOptions.reduce((sum, option) => sum + option.score, 0);
  const diagnosticComplete = selectedDiagnosticOptions.length === diagnosticQuestions.length;
  const informaticsAnswers = selectedDiagnosticOptions.filter((option) => option.direction === 'informatics').length;
  const roboticsAnswers = selectedDiagnosticOptions.filter((option) => option.direction === 'robotics').length;
  const diagnosticDirection = roboticsAnswers > informaticsAnswers
    ? 'Робототехника бағыты'
    : informaticsAnswers > roboticsAnswers
      ? 'Информатика және алгоритм бағыты'
      : 'Аралас технология бағыты';
  const diagnosticLevel = diagnosticScore <= 7
    ? 'Бастапқы деңгей'
    : diagnosticScore <= 11
      ? 'Орта деңгей'
      : 'Олимпиадалық дайындық деңгейі';
  const diagnosticAdvice = diagnosticScore <= 7
    ? 'Негізгі логика, Python/Scratch және қарапайым робот тапсырмаларынан бастаған дұрыс.'
    : diagnosticScore <= 11
      ? 'Апталық практика, Python/C++ негіздері және шағын жобалар арқылы жылдам өсуге болады.'
      : 'Күрделі алгоритмдер, Codeforces практикасы және жарыс форматына дайындық ұсынуға болады.';

  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <a href="#top" className="landing-brand">
          <span>O</span>
          <strong>Olym<span>plad</span></strong>
        </a>

        <div className="landing-nav-links">
          <a href="#showcase">Бағдарлама</a>
          <a href="#courses">Курстар</a>
          <a href="#about">Жүйе туралы</a>
        </div>

        <Link to="/login" className="landing-nav-cta">Тіркелу</Link>
      </nav>

      <section id="top" className="landing-hero">
        <div className="landing-hero-glow landing-hero-glow-left" />
        <div className="landing-hero-glow landing-hero-glow-right" />

        <div className="landing-hero-copy">
          <div className="landing-pill">
            <span />
            <strong>2026 қабылдау ашық</strong>
            <em>5-11 сынып</em>
          </div>

          <h1>
            Болашақ олимпиада чемпионын
            <span>бүгін дайындаңыз</span>
          </h1>

          <p>
            Информатика, алгоритмдер және робототехника бойынша жүйелі дайындық:
            Python, C++, Arduino, LEGO EV3, жарыс практикасы және жеке прогресс панелі.
          </p>

          <div className="landing-hero-actions">
            <a href="#diagnostic" className="landing-primary-btn">
              Тегін сабаққа жазылу
              <ArrowRight size={18} />
            </a>
            <a href="#showcase" className="landing-secondary-btn">Бағдарламаны көру</a>
          </div>

          <div className="landing-hero-mini-stats">
            <article>
              <strong>5-11</strong>
              <span>сынып оқушылары</span>
            </article>
            <article>
              <strong>C++</strong>
              <span>олимпиадалық трек</span>
            </article>
            <article>
              <strong>Robot</strong>
              <span>жоба арқылы оқу</span>
            </article>
          </div>
        </div>

        <div className="landing-dashboard-wrap">
          <div className="landing-floating-card landing-floating-rating">
            <span>Жарыс рейтингі</span>
            <strong>+320 ұпай</strong>
          </div>
          <div className="landing-floating-card landing-floating-project">
            <span>Робот жобасы</span>
            <strong>Сызық қуалайтын робот дайын</strong>
          </div>

          <div className="landing-dashboard-card">
            <div className="landing-dashboard-head">
              <div>
                <span>Оқушының жанды панелі</span>
                <h3>Апталық нәтиже</h3>
              </div>
              <div className="landing-dashboard-icon"><Bot size={30} /></div>
            </div>

            <div className="landing-dashboard-metrics">
              <article>
                <span>Шешілген есептер</span>
                <strong>48</strong>
              </article>
              <article>
                <span>Робот жобалары</span>
                <strong>6</strong>
              </article>
            </div>

            <div className="landing-track-card">
              <div>
                <strong>Алгоритм бағыты</strong>
                <span>72%</span>
              </div>
              <div className="landing-progress">
                <span style={{ width: '72%' }} />
              </div>
              <div className="landing-track-tags">
                <span>Графтар</span>
                <span>DP</span>
                <span>Жадный әдіс</span>
              </div>
            </div>

            <div className="landing-contest-card">
              <span>Келесі жарыс</span>
              <div>
                <strong>Сенбілік бағдарламалау жарысы</strong>
                <em>09:00</em>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-banner">
        <div>
          <span>Арнайы ұсыныс</span>
          <h2>Бірінші диагностикалық сабақ - тегін</h2>
        </div>
        <a href="#diagnostic">Орын брондау</a>
      </section>

      <section className="landing-stats">
        {stats.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section id="showcase" className="landing-section landing-showcase">
        <div className="landing-section-head">
          <span>Бағдарлама құрылымы</span>
          <h2>Оқушы деңгейіне қарай өсетін дайындық жүйесі</h2>
          <p>
            Бұл бет жай ақпарат емес, нақты оқу маршрутын көрсетеді:
            бастау, олимпиадалық ядро және робототехника зертханасы.
          </p>
        </div>

        <div className="landing-showcase-grid">
          {showcases.map((item) => (
            <article key={item.title}>
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <em>{item.weeks}</em>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="landing-section landing-marketing">
        <div className="landing-marketing-card">
          <span>Жүйенің мақсаты</span>
          <h2>Нәтижені бірінші экраннан көрсететін сайт</h2>
          <p>
            Оқушы мен мұғалім сайтқа кіргенде бірден түсінеді: қандай бағытта дайындық жүріп жатыр,
            қандай форматта тапсырма орындалады және прогресс қалай бақыланады.
          </p>
          <div>
            {results.map((item) => (
              <span key={item}><CheckCircle2 size={16} /> {item}</span>
            ))}
          </div>
        </div>

        <div className="landing-audience-list">
          <article>
            <Trophy size={26} />
            <div>
              <h3>Мұғалімге</h3>
              <p>жанды прогресс, тапсырма бақылауы және оқушы аналитикасы</p>
            </div>
          </article>
          <article>
            <Code2 size={26} />
            <div>
              <h3>Оқушыға</h3>
              <p>ойын түріндегі тапсырмалар, рейтинг, бейдждер және жарыстар</p>
            </div>
          </article>
          <article>
            <Cpu size={26} />
            <div>
              <h3>Академияға</h3>
              <p>заманауи бренд бейнесі және нақты нәтижеге бағытталған бет</p>
            </div>
          </article>
        </div>
      </section>

      <section className="landing-section landing-benefits">
        <div className="landing-benefits-copy">
          <span>Неге оқушылар таңдайды</span>
          <h2>Нақты нәтиже көрсететін оқу жүйесі</h2>
          <p>
            Бұл блок жарнамаға жақсы жұмыс істейді: сайт бірден қандай нәтиже беретінін,
            қалай оқытатынын және неге сенуге болатынын көрсетеді.
          </p>
          <Link to="/login">Оқушыны тіркеу</Link>
        </div>

        <div className="landing-benefits-grid">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon size={28} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="courses" className="landing-section landing-courses">
        <div className="landing-courses-head">
          <div>
            <span>Курстар</span>
            <h2>Жүйелі оқу бағыттары</h2>
            <p>Тәжірибе, жобалар және прогресс бақылауы бар олимпиадалық дайындық бағыттары.</p>
          </div>
          <a href="#showcase">Бағыттарды көру</a>
        </div>

        <div className="landing-course-grid">
          {courses.map((course) => (
            <article className={`landing-course-card ${course.tone}`} key={course.title}>
              <div className="landing-course-line" />
              <div>
                <em>{course.badge}</em>
                <div className="landing-course-meta">
                  <span>{course.level}</span>
                  <small>{course.lessons} сабақ</small>
                </div>
                <h3>{course.title}</h3>
                <p>
                  Жарыстар, қысқа тесттер, бағдарламалау есептері және робототехника
                  симуляциялары бар интерактивті оқу жүйесі.
                </p>
                <Link to="/login">Курсты көру</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="diagnostic" className="landing-section landing-diagnostic">
        <div className="landing-diagnostic-head">
          <div>
            <span>Тегін диагностика</span>
            <h2>Оқушы деңгейін 5 сұрақпен анықтау</h2>
            <p>
              Жауаптарға қарай бастапқы бағыт, оқу деңгейі және алғашқы ұсыныс бірден шығады.
            </p>
          </div>
          <strong>{selectedDiagnosticOptions.length}/{diagnosticQuestions.length}</strong>
        </div>

        <div className="landing-diagnostic-grid">
          <div className="landing-question-list">
            {diagnosticQuestions.map((question, index) => (
              <article key={question.id} className="landing-question-card">
                <div className="landing-question-title">
                  <span>{index + 1}</span>
                  <h3>{question.title}</h3>
                </div>
                <div className="landing-answer-options">
                  {question.options.map((option) => {
                    const selected = diagnosticAnswers[question.id] === option.label;
                    return (
                      <button
                        type="button"
                        className={selected ? 'selected' : ''}
                        key={option.label}
                        onClick={() => setDiagnosticAnswers((current) => ({
                          ...current,
                          [question.id]: option.label,
                        }))}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>

          <aside className="landing-diagnostic-result">
            <span>Нәтиже</span>
            <h3>{diagnosticComplete ? diagnosticLevel : 'Сұрақтарға жауап беріңіз'}</h3>
            <p>{diagnosticComplete ? diagnosticAdvice : 'Барлық жауап белгіленген соң бағыт пен деңгей автоматты түрде көрсетіледі.'}</p>

            <div className="landing-result-metrics">
              <article>
                <strong>{diagnosticScore}</strong>
                <span>ұпай</span>
              </article>
              <article>
                <strong>{diagnosticComplete ? diagnosticDirection : '-'}</strong>
                <span>ұсынылатын бағыт</span>
              </article>
            </div>

            {diagnosticComplete && (
              <div className="landing-selected-answers">
                {diagnosticQuestions.map((question) => (
                  <span key={question.id}>
                    <CheckCircle2 size={15} />
                    {diagnosticAnswers[question.id]}
                  </span>
                ))}
              </div>
            )}

            <div className="landing-result-actions">
              <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp: +7 708 959 0836</a>
              <button type="button" onClick={() => setDiagnosticAnswers({})}>Қайта тапсыру</button>
            </div>
          </aside>
        </div>
      </section>

      <section className="landing-final-cta">
        <div>
          <span>Соңғы әрекет</span>
          <h2>Оқушыңызға технологиялық болашаққа жол ашыңыз</h2>
          <p>
            Алғашқы диагностикалық сабақ арқылы оқушының деңгейін анықтап,
            оған сәйкес олимпиадалық немесе робототехника бағытын ұсынамыз.
          </p>
          <div className="landing-final-actions">
            <a href="#diagnostic">Тегін диагностика</a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp арқылы жазу</a>
          </div>
        </div>

        <div className="landing-final-grid">
          <article><Trophy size={28} /><span>Олимпиадалық ойлау</span></article>
          <article><Bot size={28} /><span>Робототехника жобалары</span></article>
          <article><Code2 size={28} /><span>Бағдарламалау практикасы</span></article>
          <article><BarChart3 size={28} /><span>Прогресс есебі</span></article>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© 2026 Olymplad Academy</span>
      </footer>
    </main>
  );
};

export default PublicLandingPage;
