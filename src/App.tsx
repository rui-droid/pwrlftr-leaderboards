import { useMemo } from 'react';
import { AthleteForm } from '@/components/AthleteForm';
import { AttemptInputTable } from '@/components/AttemptInputTable';
import { AttemptStrategyPanel } from '@/components/AttemptStrategyPanel';
import { Leaderboard } from '@/components/Leaderboard';
import { useMeetStore } from '@/store/meetStore';
import { buildLeaderboard, sortEntries } from '@/utils/liftCalculations';
import { LegacyLeaderboard } from '@/components/LegacyLeaderboard';

const lifts = ['squat', 'bench', 'deadlift'] as const;

function App() {
  const { athletes, sortKey, addAthlete, setSortKey, updateAttempt } = useMeetStore();

  const leaderboard = useMemo(() => {
    const entries = buildLeaderboard(athletes);
    return sortEntries(entries, sortKey);
  }, [athletes, sortKey]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-charcoal via-steel to-charcoal p-6 text-smoke">
      <div className="mx-auto grid max-w-7xl gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate">PWRLFT Leaderboards</p>
            <h1 className="font-display text-4xl uppercase text-white">Meet Control</h1>
          </div>
          <AthleteForm onAdd={addAthlete} />
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <LegacyLeaderboard />
            <Leaderboard entries={leaderboard} sortKey={sortKey} onSortChange={setSortKey} />
          </div>
          <AttemptStrategyPanel athletes={athletes} />
        </section>

        <section className="space-y-6">
          {athletes.map((athlete) => (
            <div key={athlete.id} className="rounded-2xl border border-slate bg-steel/60 p-5 shadow-panel">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate">Athlete Card</p>
                  <h3 className="font-display text-3xl text-white">{athlete.name}</h3>
                </div>
                <div className="text-right text-sm text-slate">
                  <p>{athlete.weightClass}</p>
                  <p>{athlete.bodyweight.toFixed(1)} kg</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {lifts.map((lift) => (
                  <AttemptInputTable
                    key={lift}
                    athlete={athlete}
                    lift={lift}
                    onUpdate={(index, attempt) =>
                      updateAttempt({ athleteId: athlete.id, lift, attemptIndex: index, attempt })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

export default App;
