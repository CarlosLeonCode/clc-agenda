import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONT, SPRING } from './theme.js';
import { markSVG } from '../../src/ui/brand.js';

/** 0 -> 1 spring that starts at `delay` frames. */
export function useReveal(delay = 0, durationInFrames) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: SPRING, durationInFrames });
}

/** Fades a whole scene in and out on its own edges. */
export function SceneFade({ duration, fadeIn = 12, fadeOut = 12, children }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, fadeIn, duration - fadeOut, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  return <div style={{ position: 'absolute', inset: 0, opacity }}>{children}</div>;
}

/** Masked reveal: each word rises out of its own clipping box. */
export function Words({ text, delay = 0, stagger = 4, style }) {
  const words = text.split(' ');
  return (
    <span style={{ display: 'inline-block', ...style }}>
      {words.map((word, i) => (
        <Word key={i} word={word} delay={delay + i * stagger} last={i === words.length - 1} />
      ))}
    </span>
  );
}

function Word({ word, delay, last }) {
  const p = useReveal(delay);
  return (
    <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', marginRight: last ? 0 : '0.24em' }}>
      <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)` }}>{word}</span>
    </span>
  );
}

/** Masked reveal for a whole line (used where words should move together). */
export function Line({ children, delay = 0, style }) {
  const p = useReveal(delay);
  return (
    <div style={{ overflow: 'hidden', paddingBottom: '0.08em', ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * 105}%)` }}>{children}</div>
    </div>
  );
}

export const headline = {
  fontFamily: FONT,
  fontWeight: 600,
  color: COLORS.ink,
  letterSpacing: '-0.035em',
  lineHeight: 1.04
};

/** CLC Agenda "Fuga" mark, shared with the extension and the landing (src/ui/brand.js). */
export function LogoMark({ size = 120, progress = 1 }) {
  const svg = markSVG({ tile: true }).replace('<svg', `<svg width="${size}" height="${size}"`);
  return (
    <div
      style={{ width: size, height: size, opacity: Math.min(1, progress * 1.4), transform: `scale(${0.9 + 0.1 * progress})` }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Mouse pointer with a calm press animation. */
export function Cursor({ x, y, pressed = 0, opacity = 1 }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity, transform: `scale(${1 - pressed * 0.12})`, transformOrigin: '2px 2px', pointerEvents: 'none' }}>
      <svg width="34" height="44" viewBox="0 0 17 22">
        <path d="M1.5 1.5v16.2l4.1-3.9 2.6 6.3 2.9-1.2-2.6-6.2h5.7z" fill={COLORS.ink} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** A thin ring that expands once where a click lands. */
export function ClickRing({ x, y, t }) {
  if (t <= 0 || t >= 1) return null;
  const size = 20 + t * 46;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${COLORS.ink}`,
        opacity: (1 - t) * 0.5
      }}
    />
  );
}

/** Simple line icons drawn for the film. */
export function Icon({ name, size = 56, color = COLORS.ink, strokeWidth = 1.6 }) {
  const common = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    contacts: (
      <>
        <rect x="5" y="3" width="15" height="18" rx="2.5" {...common} />
        <circle cx="12.5" cy="10" r="2.8" {...common} />
        <path d="M8.5 17c.7-2.2 2.2-3.3 4-3.3s3.3 1.1 4 3.3" {...common} />
        <path d="M3 7h2M3 12h2M3 17h2" {...common} />
      </>
    ),
    phone: (
      <>
        <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" {...common} />
        <path d="M10.5 18.5h3" {...common} />
      </>
    ),
    browser: (
      <>
        <rect x="2.5" y="4" width="19" height="16" rx="2.5" {...common} />
        <path d="M2.5 8.5h19" {...common} />
        <circle cx="5.5" cy="6.3" r=".4" {...common} />
        <circle cx="7.5" cy="6.3" r=".4" {...common} />
      </>
    ),
    serverOff: (
      <>
        <rect x="3.5" y="4" width="17" height="6.5" rx="1.8" {...common} />
        <rect x="3.5" y="13.5" width="17" height="6.5" rx="1.8" {...common} />
        <path d="M7 7.2h.01M7 16.7h.01M3 3l18 18" {...common} />
      </>
    ),
    shield: (
      <>
        <path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.3-7.5 9.5-4.4-1.2-7.5-4.9-7.5-9.5V6z" {...common} />
        <path d="M8.8 12.2l2.2 2.2 4.3-4.6" {...common} />
      </>
    ),
    check: <path d="M5 12.5l4.2 4.2L19 7" {...common} />,
    file: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" {...common} />
        <path d="M14 3v5h5" {...common} />
      </>
    )
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}
