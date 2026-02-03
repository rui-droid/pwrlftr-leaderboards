import { FormEvent, useState } from 'react';
import { Athlete, Attempt } from '@/types/athlete';
import { v4 as uuid } from 'uuid';

const blankAttempt = (): Attempt => ({ value: null, status: 'pending' });

const createAttemptSet = () => [blankAttempt(), blankAttempt(), blankAttempt()] as const;

interface Props {
  onAdd: (athlete: Athlete) => void;
}

export const AthleteForm = ({ onAdd }: Props) => {
  const [name, setName] = useState('');
  const [weightClass, setWeightClass] = useState('');
  const [bodyweight, setBodyweight] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name || !weightClass || !bodyweight) return;
    const athlete: Athlete = {
      id: uuid(),
      name,
      weightClass,
      bodyweight: Number(bodyweight),
      attempts: {
        squat: createAttemptSet(),
        bench: createAttemptSet(),
        deadlift: createAttemptSet()
      }
    };
    onAdd(athlete);
    setName('');
    setWeightClass('');
    setBodyweight('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-xl border border-slate bg-steel/60 p-4 shadow-panel"
    >
      <div className="grid gap-2">
        <label className="text-xs uppercase tracking-wide text-smoke">Add Athlete</label>
        <div className="grid grid-cols-3 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-lg bg-charcoal px-3 py-2 text-sm text-smoke placeholder:text-slate focus:outline focus:outline-2 focus:outline-crimson"
          />
          <input
            value={weightClass}
            onChange={(e) => setWeightClass(e.target.value)}
            placeholder="Weight Class"
            className="rounded-lg bg-charcoal px-3 py-2 text-sm text-smoke placeholder:text-slate focus:outline focus:outline-2 focus:outline-crimson"
          />
          <input
            value={bodyweight}
            onChange={(e) => setBodyweight(e.target.value)}
            placeholder="Bodyweight"
            type="number"
            step="0.1"
            className="rounded-lg bg-charcoal px-3 py-2 text-sm text-smoke placeholder:text-slate focus:outline focus:outline-2 focus:outline-crimson"
          />
        </div>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-crimson py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-red-600"
      >
        Add Athlete
      </button>
    </form>
  );
};
