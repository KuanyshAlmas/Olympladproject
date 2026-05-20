import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, BarChart3, Brain, Medal, ShieldCheck, Trophy } from 'lucide-react';
import client from '../api/client';
import type { Faction, Skill, User, UserSkill } from '../types';
import '../styles/Progress.css';

type ProgressPageProps = {
  user: User;
};

const factionLabels: Record<Faction, string> = {
  informatics: 'Информатика',
  robotics: 'Робототехника',
  none: 'Барлығы',
};

const levelLabels: Record<UserSkill['level'], string> = {
  0: 'Басталмаған',
  1: 'Үйренуде',
  2: 'Меңгерілген',
};

const getLeague = (points: number) => {
  if (points >= 700) return 'Алтын лига';
  if (points >= 350) return 'Күміс лига';
  return 'Қола лига';
};

const ProgressPage = ({ user }: ProgressPageProps) => {
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await client.get<User[]>('/users/');
      return res.data;
    },
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await client.get<Skill[]>('/skills/');
      return res.data;
    },
  });

  const { data: userSkills = [] } = useQuery({
    queryKey: ['user-skills'],
    queryFn: async () => {
      const res = await client.get<UserSkill[]>('/user-skills/');
      return res.data;
    },
  });

  const factionScores = useMemo(() => {
    const totals: Record<Faction, number> = {
      informatics: 0,
      robotics: 0,
      none: 0,
    };

    users.forEach((member) => {
      totals[member.faction] += member.focus_points;
    });

    return totals;
  }, [users]);

  const visibleSkills = user.role === 'superuser'
    ? skills
    : skills.filter((skill) => skill.faction === user.faction);

  const visibleUsers = user.role === 'superuser'
    ? users.filter((member) => member.role !== 'superuser')
    : users.filter((member) => member.faction === user.faction && member.role !== 'superuser');

  const matrixUsers = user.role === 'student'
    ? visibleUsers.filter((member) => member.id === user.id)
    : visibleUsers;

  const leaderboard = [...visibleUsers].sort((a, b) => b.focus_points - a.focus_points);
  const maxFactionScore = Math.max(factionScores.informatics, factionScores.robotics, 1);

  const getSkillLevel = (memberId: number, skillId: number) => {
    return userSkills.find((item) => item.user === memberId && item.skill === skillId)?.level ?? 0;
  };

  return (
    <div className="progress-page">
      <section className="page-title-row">
        <div>
          <p className="eyebrow">Ойындандыру</p>
          <h2>Прогресс және рейтинг</h2>
        </div>
        <div className="board-chip">
          <Trophy size={18} />
          {getLeague(user.focus_points)}
        </div>
      </section>

      <section className="battle-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Командалық жарыс</p>
            <h3>Информатика мен Робототехника</h3>
          </div>
          <BarChart3 size={22} />
        </div>
        <div className="battle-row">
          <div className="battle-side">
            <strong>{factionLabels.informatics}</strong>
            <span>{factionScores.informatics} фокус ұпайы</span>
          </div>
          <div className="battle-track">
            <div style={{ width: `${(factionScores.informatics / maxFactionScore) * 100}%` }} />
          </div>
        </div>
        <div className="battle-row">
          <div className="battle-side">
            <strong>{factionLabels.robotics}</strong>
            <span>{factionScores.robotics} фокус ұпайы</span>
          </div>
          <div className="battle-track robotics">
            <div style={{ width: `${(factionScores.robotics / maxFactionScore) * 100}%` }} />
          </div>
        </div>
      </section>

      <section className="progress-grid">
        <div className="ranking-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Рейтинг</p>
              <h3>Оқушылар рейтингі</h3>
            </div>
            <Medal size={22} />
          </div>
          <div className="ranking-list">
            {leaderboard.map((member, index) => (
              <div className="ranking-row" key={member.id}>
                <span className="rank-number">{index + 1}</span>
                <div>
                  <strong>{member.username}</strong>
                  <span>{factionLabels[member.faction]} · {getLeague(member.focus_points)}</span>
                </div>
                <strong>{member.focus_points}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="league-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Лигалар</p>
              <h3>Айлық дайындық деңгейі</h3>
            </div>
            <Award size={22} />
          </div>
          <div className="league-steps">
            <div><ShieldCheck size={18} /><span>Қола</span><strong>0 ұпай</strong></div>
            <div><ShieldCheck size={18} /><span>Күміс</span><strong>350 ұпай</strong></div>
            <div><ShieldCheck size={18} /><span>Алтын</span><strong>700 ұпай</strong></div>
          </div>
        </div>
      </section>

      <section className="matrix-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Дағдылар кестесі</p>
            <h3>Дағдылар матрицасы</h3>
          </div>
          <Brain size={22} />
        </div>
        <div className="matrix-scroll">
          <table className="skill-matrix">
            <thead>
              <tr>
                <th>Оқушы</th>
                {visibleSkills.map((skill) => (
                  <th key={skill.id}>{skill.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixUsers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <strong>{member.username}</strong>
                    <span>{factionLabels[member.faction]}</span>
                  </td>
                  {visibleSkills.map((skill) => {
                    const level = getSkillLevel(member.id, skill.id);
                    return (
                      <td key={skill.id}>
                        <span className={`skill-cell level-${level}`}>
                          {levelLabels[level]}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ProgressPage;
