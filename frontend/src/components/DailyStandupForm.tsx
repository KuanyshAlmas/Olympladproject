import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import client from '../api/client';
import '../styles/Standup.css';

type StandupPayload = {
  what_done: string;
  difficulties: string;
  plan_next: string;
};

const DailyStandupForm: React.FC = () => {
  const [whatDone, setWhatDone] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [planNext, setPlanNext] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: StandupPayload) => {
      const res = await client.post('/standups/', data);
      return res.data;
    },
    onSuccess: () => {
      setSubmitted(true);
      setWhatDone('');
      setDifficulties('');
      setPlanNext('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      what_done: whatDone,
      difficulties: difficulties,
      plan_next: planNext,
    });
  };

  if (submitted) {
    return (
      <div className="standup-form">
        <h2>Есеп қабылданды</h2>
        <button onClick={() => setSubmitted(false)} className="submit-btn">Тағы бір есеп жазу</button>
      </div>
    );
  }

  return (
    <div className="standup-form">
      <h2>Күнделікті есеп</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Бүгін не істедім?</label>
          <textarea 
            value={whatDone} 
            onChange={(e) => setWhatDone(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Қандай қиындық кездесті?</label>
          <textarea 
            value={difficulties} 
            onChange={(e) => setDifficulties(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Келесі қадам қандай?</label>
          <textarea 
            value={planNext} 
            onChange={(e) => setPlanNext(e.target.value)} 
            required 
          />
        </div>
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Жіберілуде...' : 'Есеп жіберу'}
        </button>
      </form>
    </div>
  );
};

export default DailyStandupForm;
