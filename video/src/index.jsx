import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Video } from './Video.jsx';
import { FPS, TOTAL_FRAMES } from './theme.js';

function Root() {
  return <Composition id="ClcAgenda" component={Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />;
}

registerRoot(Root);
