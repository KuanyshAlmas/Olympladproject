import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, MessageSquareText, Target, TriangleAlert } from 'lucide-react';
import client from '../api/client';
import type { DailyStandup, User } from '../types';
import '../styles/Reports.css';

type ReportsPageProps = {
  user: User;
};

const ReportsPage = ({ user }: ReportsPageProps) => {
  const { data: reports = [] } = useQuery({
    queryKey: ['standups'],
    queryFn: async () => {
      const res = await client.get<DailyStandup[]>('/standups/');
      return res.data;
    },
  });

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports]);

  const roleText = user.role === 'superuser'
    ? 'Барлық оқушының күнделікті есебі көрсетіледі.'
    : user.role === 'leader'
      ? 'Тек өз бағытыңыздағы оқушылардың есептері көрсетіледі.'
      : 'Бұл жерде өзіңіздің жіберген есептеріңіз сақталады.';

  return (
    <div className="reports-page">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">Күнделікті есеп</p>
          <h2>Күнделікті есептер</h2>
        </div>
        <div className="board-chip">
          <ClipboardList size={18} />
          {sortedReports.length} есеп
        </div>
      </section>

      <section className="reports-intro">
        <MessageSquareText size={24} />
        <div>
          <strong>Есеп кімге барады?</strong>
          <p>{roleText}</p>
        </div>
      </section>

      <section className="reports-list">
        {sortedReports.length > 0 ? sortedReports.map((report) => (
          <article className="report-card" key={report.id}>
            <div className="report-header">
              <div>
                <strong>{report.user_details?.username || 'Оқушы'}</strong>
                <span>{new Date(report.date).toLocaleDateString('kk-KZ')}</span>
              </div>
              <span className="report-faction">{report.user_details?.faction || user.faction}</span>
            </div>
            <div className="report-grid">
              <div>
                <MessageSquareText size={18} />
                <span>Бүгін не істедім?</span>
                <p>{report.what_done}</p>
              </div>
              <div>
                <TriangleAlert size={18} />
                <span>Қандай қиындық кездесті?</span>
                <p>{report.difficulties}</p>
              </div>
              <div>
                <Target size={18} />
                <span>Келесі қадам қандай?</span>
                <p>{report.plan_next}</p>
              </div>
            </div>
          </article>
        )) : (
          <div className="reports-empty">
            <ClipboardList size={34} />
            <h3>Есептер әлі жоқ</h3>
            <p>Оқушы күнделікті есеп формасын толтырғаннан кейін есеп осы жерде пайда болады.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ReportsPage;
