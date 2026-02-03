import { Athlete, Attempt } from '@/types/athlete';

const pendingAttempt = (): Attempt => ({ value: null, status: 'pending' });

const attemptSet = () => [pendingAttempt(), pendingAttempt(), pendingAttempt()] as const;

export const sampleAthletes: Athlete[] = [
  {
    id: 'athlete-1',
    name: 'Ava Chen',
    weightClass: '63kg',
    bodyweight: 62.4,
    attempts: {
      squat: [
        { value: 170, status: 'good' },
        { value: 177.5, status: 'good' },
        { value: 182.5, status: 'bad' }
      ],
      bench: [
        { value: 100, status: 'good' },
        { value: 105, status: 'good' },
        { value: 107.5, status: 'pending' }
      ],
      deadlift: [
        { value: 190, status: 'good' },
        { value: 197.5, status: 'good' },
        { value: 205, status: 'pending' }
      ]
    }
  },
  {
    id: 'athlete-2',
    name: 'Nina Solano',
    weightClass: '63kg',
    bodyweight: 62.8,
    attempts: {
      squat: [
        { value: 172.5, status: 'good' },
        { value: 180, status: 'bad' },
        { value: 180, status: 'pending' }
      ],
      bench: [
        { value: 97.5, status: 'good' },
        { value: 102.5, status: 'bad' },
        { value: 102.5, status: 'pending' }
      ],
      deadlift: [
        { value: 192.5, status: 'good' },
        { value: 200, status: 'pending' },
        { value: null, status: 'pending' }
      ]
    }
  },
  {
    id: 'athlete-3',
    name: 'Kara Dorsey',
    weightClass: '72kg',
    bodyweight: 71.2,
    attempts: {
      squat: attemptSet(),
      bench: attemptSet(),
      deadlift: attemptSet()
    }
  }
];
