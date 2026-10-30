import React from 'react';
import { AbsoluteFill } from 'remotion';
import { COLORS, SCENES } from '../theme.js';
import { headline, Icon, Line, LogoMark, SceneFade, useReveal } from '../components.jsx';
import { COPY } from '../copy.js';

const ICONS = ['browser', 'serverOff', 'shield'];

/** Scene 7: three trust statements on the beat. */
export function Trust({ lang = 'es' }) {
  return (
    <SceneFade duration={SCENES.trust.duration}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div>
          {COPY[lang].trust.map((text, i) => (
            <TrustRow key={text} icon={ICONS[i]} text={text} delay={6 + i * 30} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
}

function TrustRow({ icon, text, delay }) {
  const p = useReveal(delay);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 44, margin: '22px 0' }}>
      <div style={{ opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
        <Icon name={icon} size={84} strokeWidth={1.3} />
      </div>
      <Line delay={delay + 3} style={{ ...headline, fontSize: 96 }}>{text}</Line>
    </div>
  );
}

/** Scene 8: end card. */
export function EndCard({ lang = 'es' }) {
  const p = useReveal(4, 36);
  return (
    <SceneFade duration={SCENES.end.duration} fadeOut={20}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center' }}>
        <LogoMark size={120} progress={p} />
        <Line delay={14} style={{ ...headline, fontSize: 120, marginTop: 36 }}>CLC Agenda</Line>
        <Line delay={26} style={{ ...headline, fontSize: 40, fontWeight: 500, color: COLORS.muted, marginTop: 22, letterSpacing: '-0.015em' }}>
          {COPY[lang].browsers}
        </Line>
      </AbsoluteFill>
    </SceneFade>
  );
}
