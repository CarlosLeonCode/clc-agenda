import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Video } from './Video.jsx';
import { FPS, TOTAL_FRAMES } from './theme.js';

function Root() {
  const common = { component: Video, durationInFrames: TOTAL_FRAMES, fps: FPS, width: 1920, height: 1080 };
  return (
    <>
      <Composition id="ClcAgenda" {...common} defaultProps={{ lang: 'es' }} />
      <Composition id="ClcAgendaEn" {...common} defaultProps={{ lang: 'en' }} />
    </>
  );
}

registerRoot(Root);
