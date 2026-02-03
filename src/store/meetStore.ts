import { create } from 'zustand';
import { Athlete, Attempt, LiftType } from '@/types/athlete';
import { sampleAthletes } from '@/data/sampleData';
import { LeaderboardSortKey } from '@/utils/liftCalculations';

interface MeetState {
  athletes: Athlete[];
  sortKey: LeaderboardSortKey;
  updateAttempt: (params: {
    athleteId: string;
    lift: LiftType;
    attemptIndex: number;
    attempt: Attempt;
  }) => void;
  addAthlete: (athlete: Athlete) => void;
  setSortKey: (key: LeaderboardSortKey) => void;
}

export const useMeetStore = create<MeetState>((set) => ({
  athletes: sampleAthletes,
  sortKey: 'total',
  updateAttempt: ({ athleteId, lift, attemptIndex, attempt }) =>
    set((state) => ({
      athletes: state.athletes.map((athlete) => {
        if (athlete.id !== athleteId) {
          return athlete;
        }
        const updatedAttempts = athlete.attempts[lift].map((current, idx) =>
          idx === attemptIndex ? attempt : current
        ) as typeof athlete.attempts[LiftType];
        return {
          ...athlete,
          attempts: {
            ...athlete.attempts,
            [lift]: updatedAttempts
          }
        };
      })
    })),
  addAthlete: (athlete) =>
    set((state) => ({
      athletes: [...state.athletes, athlete]
    })),
  setSortKey: (key) => set({ sortKey: key })
}));
