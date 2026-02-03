import { useMemo, useState } from 'react';
import { Athlete, LiftType, StrategyInput } from '@/types/athlete';
import { requiredAttemptToWin } from '@/utils/liftCalculations';

interface Props {
  athletes: Athlete[];
}

const focusOptions: (LiftType | 'total')[] = ['squat', 'bench', 'deadlift', 'total'];

export const AttemptStrategyPanel = ({ athletes }: Props) => {
  const [strategy, setStrategy] = useState<StrategyInput>({
    athleteId: athletes[0]?.id ?? '',
    targetId: athletes[1]?.id ?? '',
    focus: 'total'
  });

  const result = useMemo(() => requiredAttemptToWin(athletes, strategy), [athletes, strategy]);

  const handleChange = (updates: Partial<StrategyInput>) => {
    setStrategy((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="rounded-2xl border border-slate bg-steel/90 p-4 shadow-panel">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate">Attempt Strategy</p>
          <h3 className="font-display text-2xl text-white">What do we need?</h3>
        </div>
      </header>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase text-slate">Athlete</label>
            <select
              value={strategy.athleteId}
              onChange={(e) => handleChange({ athleteId: e.target.value })}
              className="mt-1 w-full rounded-lg bg-charcoal px-3 py-2 text-sm text-smoke focus:outline focus:outline-2 focus:outline-crimson"
            >
              <option value="">Select</option>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-slate">Chasing</label>
            <select
              value={strategy.targetId}
              onChange={(e) => handleChange({ targetId: e.target.value })}
              className="mt-1 w-full rounded-lg bg-charcoal px-3 py-2 text-sm text-smoke focus:outline focus:outline-2 focus:outline-crimson"
            >
              <option value="">Select</option>
              {athletes
                .filter((athlete) => athlete.id !== strategy.athleteId)
                .map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase text-slate">Focus</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {focusOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleChange({ focus: option })}
                className={`rounded-full px-4 py-1 text-sm font-semibold uppercase tracking-wide ${
                  strategy.focus === option ? 'bg-crimson text-white' : 'bg-charcoal text-slate'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-charcoal/70 p-4">
          <p className="text-xs uppercase text-slate">Result</p>
          <p className="mt-2 font-display text-4xl text-white">
            {result.requiredWeight ? `${result.requiredWeight.toFixed(1)} kg` : '--'}
          </p>
          <p className="mt-1 text-sm text-slate">{result.note}</p>
        </div>
      </div>
    </div>
  );
};
