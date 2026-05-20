import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Columns2, Zap, Calendar, LogOut, Trophy, UsersRound, ClipboardList, Code2, Map, BookOpenCheck } from 'lucide-react';
import type { User } from '../types';
import '../styles/Layout.css';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const factionLabel = user.faction === 'informatics' ? 'Информатика' : user.faction === 'robotics' ? 'Робототехника' : 'Барлық бағыт';
  const roleLabel = user.role === 'superuser' ? 'Бас мұғалім' : user.role === 'leader' ? 'Топ жетекшісі' : 'Оқушы';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">O</div>
          <div>
            <h1>Olymplad</h1>
            <span>Командалық жүйе</span>
          </div>
        </div>
        <nav className="nav-links">
          <NavLink to="/" className="nav-link">
            <LayoutDashboard size={20} /> Басқару
          </NavLink>
          <NavLink to="/kanban" className="nav-link">
            <Columns2 size={20} /> Тапсырмалар
          </NavLink>
          <NavLink to="/programs" className="nav-link">
            <BookOpenCheck size={20} /> Бағдарлама
          </NavLink>
          <NavLink to="/live" className="nav-link">
            <Zap size={20} /> Жанды арена
          </NavLink>
          <NavLink to="/progress" className="nav-link">
            <Trophy size={20} /> Прогресс
          </NavLink>
          <NavLink to="/students" className="nav-link">
            <UsersRound size={20} /> Оқушылар
          </NavLink>
          <NavLink to="/reports" className="nav-link">
            <ClipboardList size={20} /> Есептер
          </NavLink>
          <NavLink to="/codeforces" className="nav-link">
            <Code2 size={20} /> Codeforces
          </NavLink>
          <NavLink to="/roadmap" className="nav-link">
            <Map size={20} /> Жол картасы
          </NavLink>
          <NavLink to="/events" className="nav-link">
            <Calendar size={20} /> Іс-шаралар
          </NavLink>
        </nav>
        <div className="sidebar-status">
          <span>Бағыт</span>
          <strong>{factionLabel}</strong>
        </div>
      </aside>
      <main className="main-content">
        <header className="header">
          <div className="faction-badge">
            {factionLabel}
          </div>
          <div className="user-info">
            <div className="user-copy">
              <strong>{user.username}</strong>
              <span>{roleLabel}</span>
            </div>
            <button onClick={onLogout} className="logout-btn" aria-label="Шығу">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default Layout;
