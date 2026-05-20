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
  return (
    <main className="ad-page">
      <nav className="ad-nav">
        <a href="#top" className="ad-brand">
          <span>O</span>
          <strong>Olym<span>plad</span></strong>
        </a>

        <div className="ad-nav-links">
          <a href="#showcase">Бағдарлама</a>
          <a href="#courses">Курстар</a>
          <a href="#leaderboard">Рейтинг</a>
          <a href="#about">Жүйе туралы</a>
        </div>

        <Link to="/login" className="ad-nav-cta">Тіркелу</Link>
      </nav>

      <section id="top" className="ad-hero">
        <div className="ad-hero-glow ad-hero-glow-left" />
        <div className="ad-hero-glow ad-hero-glow-right" />

        <div className="ad-hero-copy">
          <div className="ad-pill">
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

          <div className="ad-hero-actions">
            <a href="#courses" className="ad-primary-btn">
              Тегін сабаққа жазылу
              <ArrowRight size={18} />
            </a>
            <a href="#showcase" className="ad-secondary-btn">Бағдарламаны көру</a>
          </div>

          <div className="ad-hero-mini-stats">
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

        <div className="ad-dashboard-wrap">
          <div className="ad-floating-card ad-floating-rating">
            <span>Жарыс рейтингі</span>
            <strong>+320 ұпай</strong>
          </div>
          <div className="ad-floating-card ad-floating-project">
            <span>Робот жобасы</span>
            <strong>Сызық қуалайтын робот дайын</strong>
          </div>

          <div className="ad-dashboard-card">
            <div className="ad-dashboard-head">
              <div>
                <span>Оқушының жанды панелі</span>
                <h3>Апталық нәтиже</h3>
              </div>
              <div className="ad-dashboard-icon"><Bot size={30} /></div>
            </div>

            <div className="ad-dashboard-metrics">
              <article>
                <span>Шешілген есептер</span>
                <strong>48</strong>
              </article>
              <article>
                <span>Робот жобалары</span>
                <strong>6</strong>
              </article>
            </div>

            <div className="ad-track-card">
              <div>
                <strong>Алгоритм бағыты</strong>
                <span>72%</span>
              </div>
              <div className="ad-progress">
                <span style={{ width: '72%' }} />
              </div>
              <div className="ad-track-tags">
                <span>Графтар</span>
                <span>DP</span>
                <span>Жадный әдіс</span>
              </div>
            </div>

            <div className="ad-contest-card">
              <span>Келесі жарыс</span>
              <div>
                <strong>Сенбілік бағдарламалау жарысы</strong>
                <em>09:00</em>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ad-banner">
        <div>
          <span>Арнайы ұсыныс</span>
          <h2>Бірінші диагностикалық сабақ - тегін</h2>
        </div>
        <a href="#courses">Орын брондау</a>
      </section>

      <section className="ad-stats">
        {stats.map((item) => (
          <article key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section id="showcase" className="ad-section ad-showcase">
        <div className="ad-section-head">
          <span>Бағдарлама құрылымы</span>
          <h2>Оқушы деңгейіне қарай өсетін дайындық жүйесі</h2>
          <p>
            Бұл бет жай ақпарат емес, нақты оқу маршрутын көрсетеді:
            бастау, олимпиадалық ядро және робототехника зертханасы.
          </p>
        </div>

        <div className="ad-showcase-grid">
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

      <section id="about" className="ad-section ad-marketing">
        <div className="ad-marketing-card">
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

        <div className="ad-audience-list">
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

      <section className="ad-section ad-benefits">
        <div className="ad-benefits-copy">
          <span>Неге оқушылар таңдайды</span>
          <h2>Нақты нәтиже көрсететін оқу жүйесі</h2>
          <p>
            Бұл блок жарнамаға жақсы жұмыс істейді: сайт бірден қандай нәтиже беретінін,
            қалай оқытатынын және неге сенуге болатынын көрсетеді.
          </p>
          <Link to="/login">Оқушыны тіркеу</Link>
        </div>

        <div className="ad-benefits-grid">
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

      <section id="courses" className="ad-section ad-courses">
        <div className="ad-courses-head">
          <div>
            <span>Курстар</span>
            <h2>Жүйелі оқу бағыттары</h2>
            <p>Тәжірибе, жобалар және прогресс бақылауы бар олимпиадалық дайындық бағыттары.</p>
          </div>
          <a href="#showcase">Бағыттарды көру</a>
        </div>

        <div className="ad-course-grid">
          {courses.map((course) => (
            <article className={`ad-course-card ${course.tone}`} key={course.title}>
              <div className="ad-course-line" />
              <div>
                <em>{course.badge}</em>
                <div className="ad-course-meta">
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

      <section id="leaderboard" className="ad-section ad-leaderboard-section">
        <div className="ad-section-head">
          <span>Олимпиадалық рейтинг</span>
          <h2>Жарыс нәтижесі бойынша үздік оқушылар</h2>
        </div>

        <div className="ad-leaderboard">
          <div className="ad-leaderboard-row ad-leaderboard-head">
            <span>Оқушы</span>
            <span>Ұпай</span>
            <span>Медаль</span>
          </div>
          {leaderboard.map((student) => (
            <div className="ad-leaderboard-row" key={student.name}>
              <strong>{student.name}</strong>
              <span>{student.score}</span>
              <em>{student.medal}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="ad-final-cta">
        <div>
          <span>Соңғы әрекет</span>
          <h2>Оқушыңызға технологиялық болашаққа жол ашыңыз</h2>
          <p>
            Алғашқы диагностикалық сабақ арқылы оқушының деңгейін анықтап,
            оған сәйкес олимпиадалық немесе робототехника бағытын ұсынамыз.
          </p>
          <div className="ad-final-actions">
            <a href="#courses">Тегін диагностика</a>
            <a href="#courses">WhatsApp арқылы жазу</a>
          </div>
        </div>

        <div className="ad-final-grid">
          <article><Trophy size={28} /><span>Олимпиадалық ойлау</span></article>
          <article><Bot size={28} /><span>Робототехника жобалары</span></article>
          <article><Code2 size={28} /><span>Бағдарламалау практикасы</span></article>
          <article><BarChart3 size={28} /><span>Прогресс есебі</span></article>
        </div>
      </section>

      <footer className="ad-footer">
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
