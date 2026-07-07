export interface LandingSample {
  id: string;
  genre: string;
  label: string;
  petName: string;
  arc: 'funny' | 'heartfelt';
  title: string;
  src: string;
  durationSec: number;
}

/** 10-second landing page demos — regenerate via scripts/generate-landing-samples.ts */
export const LANDING_SAMPLES: LandingSample[] = [
  {
    id: 'pop',
    genre: 'pop',
    label: 'POP',
    petName: 'Cricket',
    arc: 'funny',
    title: 'Chud the Gremlin',
    src: '/samples/pop.mp3',
    durationSec: 10,
  },
  {
    id: 'jazz',
    genre: 'jazz',
    label: 'Jazz',
    petName: 'Cricket',
    arc: 'heartfelt',
    title: 'Crickety-Coo',
    src: '/samples/jazz.mp3',
    durationSec: 10,
  },
  {
    id: '80s_rock',
    genre: '80s_rock',
    label: "80's rock",
    petName: 'Cricket',
    arc: 'funny',
    title: 'Little Gremlin',
    src: '/samples/80s_rock.mp3',
    durationSec: 10,
  },
];
