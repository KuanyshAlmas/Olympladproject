import React, { useState } from 'react';
import axios from 'axios';
import { ArrowRight, Bot, Code2, LockKeyhole, ShieldCheck, Trophy, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/Login.css';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

const LoginPage: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loginWithCredentials = async (nextUsername: string, nextPassword: string) => {
    setError('');
    setSubmitting(true);
    try {
      const response = await axios.post('/api/token/', {
        username: nextUsername,
        password: nextPassword,
      });
      onLoginSuccess(response.data.access);
    } catch {
      setError('Қолданушы аты немесе құпиясөз қате');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCredentials(username, password);
  };

  return (
    <div className="login-container">
      <div className="login-shell">
        <nav className="login-nav">
          <Link to="/" className="login-brand">
            <div className="login-brand-mark">O</div>
            <span>Olymplad</span>
          </Link>
          <Link to="/" className="login-showcase-link">
            Басты бет
            <ArrowRight size={16} />
          </Link>
        </nav>

        <main className="login-main">
          <section className="login-showcase">
            <div className="login-pill">
              <span />
              Қауіпсіз оқу кеңістігі
            </div>
            <h1>
              Оқушы прогресін бір жүйеде басқарыңыз
              <span>Kanban, Codeforces, Pomodoro</span>
            </h1>
            <p>
              Мұғалім, топ жетекшісі және оқушы үшін бөлек рөлдер. Әр бағыттың тапсырмасы,
              рейтингі және оқу жолы жеке сақталады.
            </p>

            <div className="login-feature-grid">
              <article>
                <Code2 size={20} />
                <strong>Codeforces</strong>
                <span>есептер мен код іске қосу</span>
              </article>
              <article>
                <Bot size={20} />
                <strong>Робототехника</strong>
                <span>жоба және датчик бағыты</span>
              </article>
              <article>
                <Trophy size={20} />
                <strong>Олимпиада</strong>
                <span>рейтинг және күндік серия</span>
              </article>
            </div>

            <div className="login-performance-card">
              <div className="login-performance-head">
                <div>
                  <span>Жанды шолу</span>
                  <strong>Апталық нәтиже</strong>
                </div>
                <ShieldCheck size={24} />
              </div>
              <div className="login-progress-row">
                <span>Алгоритм бағыты</span>
                <strong>72%</strong>
              </div>
              <div className="login-progress-track">
                <span />
              </div>
              <div className="login-mini-tags">
                <span>Графтар</span>
                <span>DP</span>
                <span>Arduino</span>
              </div>
            </div>
          </section>

          <section className="login-card">
            <div className="login-card-heading">
              <div>
                <p>Қайта қош келдіңіз</p>
                <h2>Жүйеге кіру</h2>
              </div>
              <ShieldCheck size={24} />
            </div>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Қолданушы аты</label>
                <div className="input-shell">
                  <UserRound size={18} />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="password">Құпиясөз</label>
                <div className="input-shell">
                  <LockKeyhole size={18} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="login-button">
                {submitting ? 'Кіру...' : 'Кіру'}
                <ArrowRight size={18} />
              </button>
            </form>

          </section>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
