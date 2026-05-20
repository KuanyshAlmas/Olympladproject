import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import './App.css';
import client from './api/client';
import type { User } from './types';
import LoginPage from './components/LoginPage';
import PublicLandingPage from './components/PublicLandingPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import LiveArena from './components/LiveArena';
import EventsPage from './components/EventsPage';
import ProgressPage from './components/ProgressPage';
import StudentsPage from './components/StudentsPage';
import StudentProfilePage from './components/StudentProfilePage';
import ReportsPage from './components/ReportsPage';
import CodeforcesPage from './components/CodeforcesPage';
import RoadmapPage from './components/RoadmapPage';
import ProgramsPage from './components/ProgramsPage';

const queryClient = new QueryClient();

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  const fetchMe = async () => {
    try {
      const res = await client.get<User>('/users/me/');
      setUser(res.data);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    void client.get<User>('/users/me/')
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('token', token);
    fetchMe();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div>Жүктелуде...</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route
            path="/welcome"
            element={<PublicLandingPage />}
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <LoginPage onLoginSuccess={handleLoginSuccess} />} 
          />
          <Route 
            path="/" 
            element={user ? <Layout user={user} onLogout={handleLogout}><Dashboard user={user} /></Layout> : <PublicLandingPage />} 
          />
          <Route 
            path="/kanban" 
            element={user ? <Layout user={user} onLogout={handleLogout}><KanbanBoard user={user} /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/live" 
            element={user ? <Layout user={user} onLogout={handleLogout}><LiveArena user={user} /></Layout> : <Navigate to="/login" />} 
          />
          <Route
            path="/progress"
            element={user ? <Layout user={user} onLogout={handleLogout}><ProgressPage user={user} /></Layout> : <Navigate to="/login" />}
          />
          <Route
            path="/students"
            element={user ? <Layout user={user} onLogout={handleLogout}><StudentsPage user={user} /></Layout> : <Navigate to="/login" />}
          />
          <Route
            path="/students/:studentId"
            element={user ? <Layout user={user} onLogout={handleLogout}><StudentProfilePage /></Layout> : <Navigate to="/login" />}
          />
          <Route
            path="/reports"
            element={user ? <Layout user={user} onLogout={handleLogout}><ReportsPage user={user} /></Layout> : <Navigate to="/login" />}
          />
          <Route
            path="/codeforces"
            element={user ? <Layout user={user} onLogout={handleLogout}><CodeforcesPage user={user} /></Layout> : <Navigate to="/login" />}
          />
          <Route
            path="/programs"
            element={user ? <Layout user={user} onLogout={handleLogout}><ProgramsPage user={user} /></Layout> : <Navigate to="/login" />}
          />
          <Route
            path="/roadmap"
            element={user ? <Layout user={user} onLogout={handleLogout}><RoadmapPage user={user} /></Layout> : <Navigate to="/login" />}
          />
          <Route 
            path="/events" 
            element={user ? <Layout user={user} onLogout={handleLogout}><EventsPage user={user} /></Layout> : <Navigate to="/login" />} 
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
