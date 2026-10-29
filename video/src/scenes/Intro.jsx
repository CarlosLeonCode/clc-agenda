import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONT, SCENES } from '../theme.js';
import { headline, Line, LogoMark, SceneFade, useReveal, Words } from '../components.jsx';

const center = { justifyContent: 'center', alignItems: 'center', textAlign: 'center' };

/** Scene 1: the problem in one sentence. */
export function Hook() {
  const frame = useCurrentFrame();
  // The first line steps back once the answer arrives
  const dim = interpolate(frame, [56, 72], [1, 0.32], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <SceneFade duration={SCENES.hook.duration} fadeIn={1}>
      <AbsoluteFill style={center}>
        <div style={{ ...headline, fontSize: 100 }}>
          <div style={{ opacity: dim }}>
            <Words text="Tus contactos viven en WhatsApp." delay={8} stagger={5} />
          </div>
          <div style={{ marginTop: 18 }}>
            <Words text="Tu agenda, no." delay={60} stagger={6} />
          </div>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
}

// Obviously fake numbers: mostly zeros, never a real-looking line
const CHIPS = [
  '+57 300 000 0000', '+52 55 0000 0000', '+34 600 000 000', '+54 9 11 0000 0000',
  '+1 305 000 0000', '+57 310 000 0000', '+52 33 0000 0000', '+56 9 0000 0000',
  '+51 900 000 000', '+57 320 000 0000', '+593 99 000 0000', '+58 412 000 0000',
  '+506 8000 0000', '+34 700 000 000', '+57 301 000 0000', '+52 81 0000 0000'
];

/** Scene 2: unsaved numbers pile up. */
export function Problem() {
  return (
    <SceneFade duration={SCENES.problem.duration}>
      <AbsoluteFill style={{ padding: '150px 0 0 150px' }}>
        <div style={{ ...headline, fontSize: 96 }}>
          <Line delay={4}>Grupos.</Line>
          <Line delay={12}>Chats.</Line>
          <Line delay={20}>Etiquetas.</Line>
        </div>
        <div style={{ ...headline, fontSize: 56, fontWeight: 500, color: COLORS.muted, marginTop: 44, letterSpacing: '-0.025em' }}>
          <Words text="Cientos de números sin guardar." delay={46} stagger={4} />
        </div>
      </AbsoluteFill>
      <ChipPile />
    </SceneFade>
  );
}

function ChipPile() {
  // Five staggered rows of three; each chip settles in from above, one after another
  return (
    <div style={{ position: 'absolute', left: 1000, top: 190, width: 860 }}>
      {CHIPS.slice(0, 15).map((label, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = col * 280 + (row % 2) * 44;
        const y = row * 96;
        return <Chip key={label} label={label} x={x} y={y} delay={6 + i * 3} />;
      })}
    </div>
  );
}

function Chip({ label, x, y, delay }) {
  const p = useReveal(delay);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - (1 - p) * 70,
        opacity: p,
        padding: '12px 20px',
        background: COLORS.card,
        border: `1.5px solid ${COLORS.line}`,
        borderRadius: 999,
        fontFamily: FONT,
        fontSize: 22,
        fontWeight: 500,
        fontVariantNumeric: 'tabular-nums',
        color: COLORS.ink,
        whiteSpace: 'nowrap',
        boxShadow: '0 6px 18px rgba(20, 20, 19, 0.06)'
      }}
    >
      {label}
    </div>
  );
}

/** Scene 3: the mark draws in, the name rises. */
export function LogoReveal() {
  const draw = useReveal(4, 40);
  return (
    <SceneFade duration={SCENES.logo.duration} fadeIn={1}>
      <AbsoluteFill style={{ ...center, flexDirection: 'column' }}>
        <div style={{ transform: `scale(${0.94 + draw * 0.06})` }}>
          <LogoMark size={148} progress={draw} />
        </div>
        <Line delay={18} style={{ ...headline, fontSize: 132, marginTop: 40 }}>CLC Agenda</Line>
        <Line delay={30} style={{ ...headline, fontSize: 44, fontWeight: 500, color: COLORS.muted, marginTop: 18, letterSpacing: '-0.02em' }}>
          Tu agenda, sin depender de WhatsApp.
        </Line>
      </AbsoluteFill>
    </SceneFade>
  );
}
