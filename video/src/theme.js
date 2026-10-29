import { loadFont } from '@remotion/google-fonts/Inter';

const { fontFamily } = loadFont('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin', 'latin-ext'] });

export const FONT = fontFamily;

export const COLORS = {
  canvas: '#F5F3EE',
  ink: '#141413',
  muted: '#6B6A65',
  faint: '#B9B5AC',
  line: '#DEDAD1',
  card: '#FFFFFF',
  accent: '#25D366'
};

export const FPS = 30;

// 120 BPM: one beat = 15 frames. Every scene starts on the grid.
export const SCENES = {
  hook: { from: 0, duration: 120 },
  problem: { from: 120, duration: 120 },
  logo: { from: 240, duration: 90 },
  product: { from: 330, duration: 690 },
  trust: { from: 1020, duration: 180 },
  end: { from: 1200, duration: 150 }
};

export const TOTAL_FRAMES = 1350;

// Calm springs only: critically damped, no overshoot
export const SPRING = { damping: 200, mass: 1, stiffness: 120 };
