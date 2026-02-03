import { LeaderboardEntry } from '@/types/athlete';
import { LeaderboardSortKey } from '@/utils/liftCalculations';
import clsx from 'clsx';

interface Props {
  entries: LeaderboardEntry[];
  sortKey: LeaderboardSortKey;
  onSortChange: (key: LeaderboardSortKey) => void;
}

const columns: { label: string; key: LeaderboardSortKey }[] = [
  { label: 'Squat', key: 'bestSquat' },
  { label: 'Bench', key: 'bestBench' },
  { label: 'Deadlift', key: 'bestDeadlift' },
  { label: 'Total', key: 'total' }
];

export const Leaderboard = ({ entries, sortKey, onSortChange }: Props) => {
  return (
    <div className="rounded-2xl border border-slate bg-steel/80 p-4 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase text-white">Leaderboard</h2>
        <div className="flex gap-2">
          {columns.map((column) => (
            <button
              key={column.key}
              onClick={() => onSortChange(column.key)}
              className={clsx(
                'rounded-full px-4 py-1 text-sm font-semibold uppercase tracking-wide',
                sortKey === column.key ? 'bg-crimson text-white' : 'bg-charcoal text-slate'
              )}
            >
              {column.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-separate border-spacing-y-2">
          <thead className="text-left text-xs uppercase text-slate">
            <tr>
              <th className="px-3">#</th>
              <th className="px-3">Athlete</th>
              <th className="px-3">Class</th>
              <th className="px-3">BW</th>
              {columns.map((column) => (
                <th key={column.key} className="px-3">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={entry.athleteId} className="rounded-xl bg-charcoal/60 text-lg text-white">
                <td className="px-3 py-2 font-display text-2xl text-slate">{index + 1}</td>
                <td className="px-3 py-2 text-base">
                  <p className="font-display text-lg text-white">{entry.name}</p>
                  <p className="text-xs text-slate">#{entry.athleteId.slice(0, 4)}</p>
                </td>
                <td className="px-3 py-2 text-sm text-slate">{entry.weightClass}</td>
                <td className="px-3 py-2 text-sm text-slate">{entry.bodyweight.toFixed(1)}</td>
                <td className="px-3 py-2">{entry.bestSquat.toFixed(1)}</td>
                <td className="px-3 py-2">{entry.bestBench.toFixed(1)}</td>
                <td className="px-3 py-2">{entry.bestDeadlift.toFixed(1)}</td>
                <td className="px-3 py-2 font-semibold text-crimson">{entry.total.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
