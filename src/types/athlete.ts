export type LiftType = 'squat' | 'bench' | 'deadlift';

export interface Attempt {
  value: number | null;
  status: 'good' | 'bad' | 'pending';
}

export type AttemptSet = [Attempt, Attempt, Attempt];

export interface Athlete {
  id: string;
  name: string;
  weightClass: string;
  bodyweight: number;
  attempts: Record<LiftType, AttemptSet>;
}

export interface LeaderboardEntry {
  athleteId: string;
  name: string;
  weightClass: string;
  bodyweight: number;
  bestSquat: number;
  bestBench: number;
  bestDeadlift: number;
  total: number;
}

export interface StrategyInput {
  athleteId: string;
  targetId: string;
  focus: LiftType | 'total';
}
