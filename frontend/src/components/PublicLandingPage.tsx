import { useEffect } from 'react';
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

const leaderboard = [
  { name: 'Аружан', score: 2450, medal: 'Алтын' },
  { name: 'Диас', score: 2320, medal: 'Күміс' },
  { name: 'Нұрсұлтан', score: 2190, medal: 'Қола' },
];

const PublicLandingPage = () => {
  useEffect(() => {
    const landingHashes = new Set(['#top', '#showcase', '#courses', '#leaderboard', '#about']);
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
          <a href="#leaderboard">Рейтинг</a>
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
            <a href="#courses" className="landing-primary-btn">
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
        <a href="#courses">Орын брондау</a>
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

      <section id="leaderboard" className="landing-section landing-leaderboard-section">
        <div className="landing-section-head">
          <span>Олимпиадалық рейтинг</span>
          <h2>Жарыс нәтижесі бойынша үздік оқушылар</h2>
        </div>

        <div className="landing-leaderboard">
          <div className="landing-leaderboard-row landing-leaderboard-head">
            <span>Оқушы</span>
            <span>Ұпай</span>
            <span>Медаль</span>
          </div>
          {leaderboard.map((student) => (
            <div className="landing-leaderboard-row" key={student.name}>
              <strong>{student.name}</strong>
              <span>{student.score}</span>
              <em>{student.medal}</em>
            </div>
          ))}
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
            <a href="#courses">Тегін диагностика</a>
            <a href="#courses">WhatsApp арқылы жазу</a>
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
        <div>
          <a href="#top">Telegram</a>
          <a href="#top">YouTube</a>
          <a href="#top">Instagram</a>
        </div>
      </footer>
    </main>
  );
};

export default PublicLandingPage;
