import { Athlete, Attempt, AttemptSet, LeaderboardEntry, LiftType, StrategyInput } from '@/types/athlete';

export const bestLift = (attempts: AttemptSet): number => {
  return attempts.reduce((best, attempt) => {
    if (attempt.status === 'good' && typeof attempt.value === 'number') {
      return Math.max(best, attempt.value);
    }
    return best;
  }, 0);
};

export const totalForAthlete = (athlete: Athlete): number => {
  return (['squat', 'bench', 'deadlift'] as LiftType[]).reduce((sum, lift) => {
    return sum + bestLift(athlete.attempts[lift]);
  }, 0);
};

const buildLeaderboardEntry = (athlete: Athlete): LeaderboardEntry => ({
  athleteId: athlete.id,
  name: athlete.name,
  weightClass: athlete.weightClass,
  bodyweight: athlete.bodyweight,
  bestSquat: bestLift(athlete.attempts.squat),
  bestBench: bestLift(athlete.attempts.bench),
  bestDeadlift: bestLift(athlete.attempts.deadlift),
  total: totalForAthlete(athlete)
});

export const buildLeaderboard = (athletes: Athlete[]): LeaderboardEntry[] =>
  athletes.map(buildLeaderboardEntry);

export type LeaderboardSortKey = 'bestSquat' | 'bestBench' | 'bestDeadlift' | 'total';

export const sortEntries = (
  entries: LeaderboardEntry[],
  key: LeaderboardSortKey
): LeaderboardEntry[] => {
  return [...entries].sort((a, b) => {
    if (b[key] !== a[key]) {
      return b[key] - a[key];
    }
    return a.bodyweight - b.bodyweight;
  });
};

const projectedTotal = (athlete: Athlete, lift: LiftType, projectedValue: number): number => {
  return (['squat', 'bench', 'deadlift'] as LiftType[]).reduce((sum, key) => {
    if (key === lift) {
      return sum + projectedValue;
    }
    return sum + bestLift(athlete.attempts[key]);
  }, 0);
};

const nextAttemptIndex = (attempts: AttemptSet): number | null => {
  const idx = attempts.findIndex((attempt) => attempt.status === 'pending');
  return idx === -1 ? null : idx;
};

const maxEnteredAttempt = (attempts: AttemptSet): number => {
  return attempts.reduce((max, attempt) => {
    if (typeof attempt.value === 'number') {
      return Math.max(max, attempt.value);
    }
    return max;
  }, 0);
};

interface RequiredAttemptResult {
  requiredWeight: number | null;
  note: string;
}

export const requiredAttemptToWin = (
  athletes: Athlete[],
  strategy: StrategyInput
): RequiredAttemptResult => {
  const athlete = athletes.find((a) => a.id === strategy.athleteId);
  const target = athletes.find((a) => a.id === strategy.targetId);

  if (!athlete || !target) {
    return { requiredWeight: null, note: 'Select both athlete and competitor' };
  }

  if (strategy.focus === 'total') {
    const athleteTotal = totalForAthlete(athlete);
    const targetTotal = totalForAthlete(target);
    if (athleteTotal > targetTotal) {
      return { requiredWeight: null, note: 'Already ahead on Total' };
    }
    const deficit = targetTotal - athleteTotal;
    return {
      requiredWeight: Math.max(deficit + 2.5, 0),
      note: 'Increase any lift by this amount to pull ahead'
    };
  }

  const attempts = athlete.attempts[strategy.focus];
  const idx = nextAttemptIndex(attempts);
  if (idx === null) {
    return { requiredWeight: null, note: 'No attempts remaining' };
  }

  const targetBest = bestLift(target.attempts[strategy.focus]);
  const currentBest = bestLift(attempts);

  if (currentBest > targetBest) {
    return { requiredWeight: null, note: 'Already leading this lift' };
  }

  const projectedNeeded = targetBest + 2.5;
  const interAttemptJump = Math.max(projectedNeeded, maxEnteredAttempt(attempts) + 2.5);
  const projectedTotalValue = projectedTotal(athlete, strategy.focus, interAttemptJump);
  const targetTotal = totalForAthlete(target);

  let note = `Need ${strategy.focus} ≥ ${projectedNeeded.toFixed(1)}kg`;
  if (projectedTotalValue === targetTotal) {
    note += athlete.bodyweight < target.bodyweight ? ' (wins on bodyweight tie-break)' : '';
  }

  return {
    requiredWeight: interAttemptJump,
    note
  };
};
