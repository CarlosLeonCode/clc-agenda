import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { COLORS, FONT, SCENES } from '../theme.js';
import { ClickRing, Cursor, headline, Icon, Line, SceneFade, useReveal } from '../components.jsx';
import { COPY } from '../copy.js';
import targetsEs from '../../public/ui/targets.json';
import targetsEn from '../../public/ui/en/targets.json';

// Window geometry (frame px). The browser viewport shows a 1100x760 CSS crop
// of the 1440x900 capture page, scaled by S; the overlay sits at (170, 40) CSS.
const S = 1.1;
const WIN = { x: 600, y: 97, width: 1100 * S, bar: 50 };
const VIEW = { width: 1100 * S, height: 760 * S };
const MODAL = { x: 170 * S, y: 40 * S, width: targetsEs.modal.width * S, height: targetsEs.modal.height * S };

// Click points in viewport px, derived from each language's real capture
const aim = (t, fx = 0.5) => ({ x: MODAL.x + (t.x + t.width * fx) * S, y: MODAL.y + (t.y + t.height / 2) * S });
const points = (targets) => ({ ROW: aim(targets.groupRow, 0.3), CHIP: aim(targets.unsavedChip, 0.86), GOOGLE: aim(targets.googleButton) });
const POINTS = { es: points(targetsEs), en: points(targetsEn) };
// Captures live in public/ui (Spanish) and public/ui/en
const UI_DIR = { es: 'ui', en: 'ui/en' };
const START = { x: VIEW.width - 120, y: VIEW.height - 60 };

// Local timeline (frames inside this scene)
const T = {
  open: 18,
  moveToRow: [44, 82], clickRow: 86,
  results: 150,
  step2: 240, zoomIn: [246, 450],
  moveToChip: [270, 306], clickChip: 310,
  step3: 480, zoomOut: [462, 506],
  moveToGoogle: [506, 542], hoverGoogle: 538, clickGoogle: 556,
  fly: [562, 612], done: 622
};

const ease = Easing.bezier(0.45, 0, 0.2, 1);
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const lerp = (frame, range, a, b) => interpolate(frame, range, [a, b], { ...clamp, easing: ease });

function cursorAt(frame, { ROW, CHIP, GOOGLE }) {
  const legs = [
    [T.moveToRow, START, ROW],
    [T.moveToChip, ROW, CHIP],
    [T.moveToGoogle, CHIP, GOOGLE]
  ];
  let pos = START;
  for (const [range, from, to] of legs) {
    if (frame >= range[0]) pos = { x: lerp(frame, range, from.x, to.x), y: lerp(frame, range, from.y, to.y) };
  }
  return pos;
}

const press = (frame, at) => interpolate(frame, [at, at + 4, at + 9], [0, 1, 0], clamp);
const ring = (frame, at) => interpolate(frame, [at + 2, at + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'extend' });

export function Product({ lang = 'es' }) {
  const frame = useCurrentFrame();
  const copy = COPY[lang];
  const at = POINTS[lang];
  return (
    <SceneFade duration={SCENES.product.duration} fadeOut={20}>
      <StepLabels frame={frame} labels={copy.steps} />
      <SaveTargets frame={frame} labels={copy.targets} />
      <BrowserWindow frame={frame} at={at} dir={UI_DIR[lang]} />
      <FileCard frame={frame} at={at} name={copy.file} />
    </SceneFade>
  );
}

function StepLabels({ frame, labels }) {
  const steps = [
    { n: '1', text: labels[0], from: 0, to: T.step2 },
    { n: '2', text: labels[1], from: T.step2, to: T.step3 },
    { n: '3', text: labels[2], from: T.step3, to: SCENES.product.duration + 1 }
  ];
  return (
    <div style={{ position: 'absolute', left: 120, top: 300, width: 460 }}>
      {steps.map(step => {
        if (frame < step.from - 1 || frame > step.to + 14) return null;
        const out = interpolate(frame, [step.to - 2, step.to + 10], [1, 0], clamp);
        return (
          <div key={step.n} style={{ position: 'absolute', top: 0, left: 0, width: 460, opacity: out, transform: `translateY(${(1 - out) * -24}px)` }}>
            <Line delay={step.from + 8} style={{ ...headline, fontSize: 64 }}>
              <span style={{ color: COLORS.faint }}>{step.n} · </span>{step.text.split('\n').map((part, i) => <React.Fragment key={i}>{i > 0 && <br />}{part}</React.Fragment>)}
            </Line>
          </div>
        );
      })}
    </div>
  );
}

function BrowserWindow({ frame, at, dir }) {
  const { CHIP } = at;
  const enter = useReveal(0, 30);
  const zoom = frame < T.zoomOut[0]
    ? lerp(frame, [0, T.step2], 1, 1.02) + (frame >= T.zoomIn[0] ? lerp(frame, T.zoomIn, 0, 0.04) : 0)
    : lerp(frame, T.zoomOut, 1.06, 1);
  // Push in toward the count chips during step 2, back to the full window for step 3
  const focus = frame < T.zoomOut[0] && frame >= T.zoomIn[0] ? CHIP : { x: VIEW.width / 2, y: VIEW.height / 2 };
  const originX = frame >= T.zoomOut[0] ? lerp(frame, T.zoomOut, CHIP.x, VIEW.width / 2) : focus.x;
  const originY = frame >= T.zoomOut[0] ? lerp(frame, T.zoomOut, CHIP.y, VIEW.height / 2) : focus.y;

  return (
    <div
      style={{
        position: 'absolute',
        left: WIN.x,
        top: WIN.y,
        width: WIN.width,
        borderRadius: 18,
        overflow: 'hidden',
        background: '#FBFAF7',
        boxShadow: '0 40px 90px rgba(20, 20, 19, 0.16), 0 8px 24px rgba(20, 20, 19, 0.08)',
        border: `1px solid ${COLORS.line}`,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 60}px) scale(${0.985 + enter * 0.015})`
      }}
    >
      <BrowserBar />
      <div style={{ position: 'relative', width: VIEW.width, height: VIEW.height, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `${originX}px ${originY}px` }}>
          <ChatSkeleton />
          <Overlay frame={frame} dir={dir} />
          <PointerLayer frame={frame} at={at} />
        </div>
      </div>
    </div>
  );
}

function BrowserBar() {
  return (
    <div style={{ height: WIN.bar, display: 'flex', alignItems: 'center', padding: '0 20px', background: '#EEEBE4', borderBottom: `1px solid ${COLORS.line}` }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: '#D3CEC4', marginRight: 9 }} />
      ))}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 420, height: 30, borderRadius: 8, background: '#F8F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 16, color: COLORS.muted }}>
          web.whatsapp.com
        </div>
      </div>
      <span style={{ width: 61 }} />
    </div>
  );
}

/** Neutral, abstract chat list: gray bars only, no third-party look. */
function ChatSkeleton() {
  const rows = Array.from({ length: 9 });
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      <div style={{ width: 330, height: '100%', background: '#F4F1EB', borderRight: `1px solid ${COLORS.line}`, padding: '20px 18px' }}>
        <div style={{ height: 34, borderRadius: 8, background: '#E7E3DB', marginBottom: 22 }} />
        {rows.map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, height: 76 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#E3DFD6' }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: `${55 + ((i * 17) % 35)}%`, height: 12, borderRadius: 6, background: '#E0DBD2', marginBottom: 10 }} />
              <div style={{ width: `${70 + ((i * 11) % 25)}%`, height: 10, borderRadius: 5, background: '#EAE6DF' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, background: '#EFEBE4' }} />
    </div>
  );
}

function Overlay({ frame, dir }) {
  const open = interpolate(frame, [T.open, T.open + 16], [0, 1], { ...clamp, easing: ease });
  // Real captures, swapped at the moment each click lands
  const layers = [
    { src: `${dir}/source.png`, in: -1 },
    { src: `${dir}/source-loading.png`, in: T.clickRow + 4 },
    { src: `${dir}/results.png`, in: T.results },
    { src: `${dir}/results-unsaved.png`, in: T.clickChip + 4 },
    { src: `${dir}/export-hover.png`, in: T.hoverGoogle }
  ];
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20, 20, 19, 0.42)', opacity: open }} />
      <div
        style={{
          position: 'absolute',
          left: MODAL.x,
          top: MODAL.y,
          width: MODAL.width,
          height: MODAL.height,
          opacity: open,
          transform: `scale(${0.97 + open * 0.03})`,
          filter: 'drop-shadow(0 24px 40px rgba(0, 0, 0, 0.35))'
        }}
      >
        {layers.map(layer => {
          const o = layer.in < 0 ? 1 : interpolate(frame, [layer.in, layer.in + 6], [0, 1], clamp);
          return o > 0 ? <Img key={layer.src} src={staticFile(layer.src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: o }} /> : null;
        })}
      </div>
    </>
  );
}

function PointerLayer({ frame, at }) {
  const { ROW, CHIP, GOOGLE } = at;
  const pos = cursorAt(frame, at);
  const visible = interpolate(frame, [T.moveToRow[0] - 8, T.moveToRow[0], T.fly[0], T.fly[0] + 10], [0, 1, 1, 0], clamp);
  const pressed = press(frame, T.clickRow) + press(frame, T.clickChip) + press(frame, T.clickGoogle);
  return (
    <>
      <ClickRing x={ROW.x} y={ROW.y} t={ring(frame, T.clickRow)} />
      <ClickRing x={CHIP.x} y={CHIP.y} t={ring(frame, T.clickChip)} />
      <ClickRing x={GOOGLE.x} y={GOOGLE.y} t={ring(frame, T.clickGoogle)} />
      <Cursor x={pos.x - 3} y={pos.y - 3} pressed={pressed} opacity={visible} />
    </>
  );
}

// The export lands in the left column, next to its two destinations
const LAND = { x: 120, y: 520 };
const CARD = { width: 456, height: 84 };

function FileCard({ frame, at, name }) {
  const { GOOGLE } = at;
  if (frame < T.fly[0]) return null;
  const from = { x: WIN.x + GOOGLE.x - CARD.width / 2, y: WIN.y + WIN.bar + GOOGLE.y - CARD.height / 2 };
  const t = interpolate(frame, T.fly, [0, 1], { ...clamp, easing: ease });
  const x = from.x + (LAND.x - from.x) * t;
  const y = from.y + (LAND.y - from.y) * t - Math.sin(t * Math.PI) * 140;
  const scale = 0.35 + 0.65 * t;
  const opacity = interpolate(frame, [T.fly[0], T.fly[0] + 6], [0, 1], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: CARD.width,
        height: CARD.height,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 20px',
        background: COLORS.card,
        border: `1.5px solid ${COLORS.line}`,
        borderRadius: 16,
        boxShadow: `0 ${18 - 12 * t}px ${40 - 20 * t}px rgba(20, 20, 19, ${0.16 - 0.08 * t})`,
        fontFamily: FONT
      }}
    >
      <div style={{ flexShrink: 0, display: "flex" }}><Icon name="file" size={36} /></div>
      <span style={{ fontSize: 17.5, fontWeight: 500, color: COLORS.ink, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
        {name}
      </span>
    </div>
  );
}

function SaveTargets({ frame, labels }) {
  const items = [
    { icon: 'contacts', label: labels[0], delay: T.step3 + 20 },
    { icon: 'phone', label: labels[1], delay: T.step3 + 26 }
  ];
  return (
    <div style={{ position: 'absolute', left: 120, top: 640, display: 'flex', gap: 24 }}>
      {items.map(item => (
        <SaveTarget key={item.icon} {...item} frame={frame} />
      ))}
    </div>
  );
}

function SaveTarget({ icon, label, delay, frame }) {
  const p = useReveal(delay);
  const done = interpolate(frame, [T.done, T.done + 10], [0, 1], { ...clamp, easing: ease });
  if (frame < delay) return null;
  return (
    <div
      style={{
        position: 'relative',
        width: 208,
        height: 150,
        borderRadius: 18,
        background: COLORS.card,
        border: `1.5px solid ${COLORS.line}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px)`,
        fontFamily: FONT
      }}
    >
      <Icon name={icon} size={52} strokeWidth={1.4} />
      <span style={{ fontSize: 20, fontWeight: 500, color: COLORS.ink }}>{label}</span>
      <div
        style={{
          position: 'absolute',
          top: -12,
          right: -12,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: COLORS.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: done,
          transform: `scale(${0.8 + 0.2 * done})`
        }}
      >
        <Icon name="check" size={22} color="#FFFFFF" strokeWidth={2.6} />
      </div>
    </div>
  );
}

export const _debug = { POINTS, MODAL, T };
