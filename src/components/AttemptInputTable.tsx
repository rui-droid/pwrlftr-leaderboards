import { Athlete, Attempt, LiftType } from '@/types/athlete';
import { useMemo } from 'react';

interface Props {
  athlete: Athlete;
  lift: LiftType;
  onUpdate: (index: number, attempt: Attempt) => void;
}

const statusClasses: Record<Attempt['status'], string> = {
  pending: 'bg-steel text-smoke',
  good: 'bg-emerald-700 text-white',
  bad: 'bg-red-700 text-white'
};

const statusCycle: Attempt['status'][] = ['pending', 'good', 'bad'];

export const AttemptInputTable = ({ athlete, lift, onUpdate }: Props) => {
  const headers = useMemo(() => ['Opener', 'Second', 'Third'], []);

  const handleValueChange = (value: string, idx: number) => {
    const parsed = value ? Number(value) : null;
    onUpdate(idx, {
      ...athlete.attempts[lift][idx],
      value: parsed
    });
  };

  const handleStatusToggle = (idx: number) => {
    const current = athlete.attempts[lift][idx].status;
    const next = statusCycle[(statusCycle.indexOf(current) + 1) % statusCycle.length];
    onUpdate(idx, {
      ...athlete.attempts[lift][idx],
      status: next
    });
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate bg-steel/60 p-4 shadow-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-white uppercase tracking-wide">{lift}</h3>
        <span className="text-sm text-slate">
          BW {athlete.bodyweight.toFixed(1)}kg • {athlete.weightClass}
        </span>
      </div>
      <div className="grid gap-3">
        {headers.map((label, idx) => {
          const attempt = athlete.attempts[lift][idx];
          return (
            <div key={label} className="grid grid-cols-[120px_1fr_auto] gap-3">
              <label className="text-sm text-slate">{label}</label>
              <input
                type="number"
                step="2.5"
                value={attempt.value ?? ''}
                placeholder="kg"
                onChange={(event) => handleValueChange(event.target.value, idx)}
                className="rounded-lg bg-charcoal px-3 py-2 text-sm text-smoke placeholder:text-slate focus:outline focus:outline-2 focus:outline-crimson"
              />
              <button
                type="button"
                onClick={() => handleStatusToggle(idx)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold uppercase tracking-wide ${statusClasses[attempt.status]}`}
              >
                {attempt.status}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
