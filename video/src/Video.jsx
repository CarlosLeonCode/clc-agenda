import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { COLORS, FONT, SCENES } from './theme.js';
import { Hook, LogoReveal, Problem } from './scenes/Intro.jsx';
import { Product } from './scenes/Product.jsx';
import { EndCard, Trust } from './scenes/Outro.jsx';

const ORDER = [
  ['hook', Hook],
  ['problem', Problem],
  ['logo', LogoReveal],
  ['product', Product],
  ['trust', Trust],
  ['end', EndCard]
];

export function Video() {
  return (
    <AbsoluteFill style={{ background: COLORS.canvas, fontFamily: FONT }}>
      {ORDER.map(([key, Scene]) => (
        <Sequence key={key} name={key} from={SCENES[key].from} durationInFrames={SCENES[key].duration}>
          <Scene />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
