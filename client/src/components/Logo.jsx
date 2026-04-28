import React from 'react';
import logosImg from '@assets/logos.png';

/*
 * logos.png — 1320×864 brand sheet, sprite regions in px [x, y, w, h]:
 *
 *  STACKED    (0,   0,  660, 560)  top-left large logo
 *  HORIZONTAL (680,  0,  640, 265)  top-right icon+text+tagline
 *  ICON       (30, 548, 240, 260)  bottom-left shield only
 */

const SHEET_W = 1320;
const SHEET_H = 864;

const R = {
  icon:       [ 30, 548, 240, 260],
  stacked:    [  0,   0, 660, 560],
  horizontal: [680,   0, 640, 265],
};

/**
 * Internal sprite crop.
 * displayW & displayH in px — the visible output size.
 */
function Sprite({ region, displayW, displayH, style = {}, alt = 'CrisisCore' }) {
  const [rx, ry, rw, rh] = region;
  const scaleX = displayW / rw;
  const scaleY = displayH / rh;
  return (
    <div style={{ width: displayW, height: displayH, overflow: 'hidden', flexShrink: 0, display: 'inline-block', ...style }}>
      <img
        src={logosImg}
        alt={alt}
        draggable={false}
        style={{
          width:  SHEET_W * scaleX,
          height: SHEET_H * scaleY,
          marginLeft: -(rx * scaleX),
          marginTop:  -(ry * scaleY),
          display: 'block',
          maxWidth: 'none',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

/* ── public components ──────────────────────────────────── */

/**
 * LogoIcon — shield mark only.
 * Pass `size` for the WIDTH; height auto-scales to preserve aspect ratio.
 */
export function LogoIcon({ size = 32, style }) {
  const [,, rw, rh] = R.icon;
  return <Sprite region={R.icon} displayW={size} displayH={Math.round(size * rh / rw)} style={style} />;
}

/**
 * LogoFull — horizontal logo (small shield + "CrisisCore" + tagline).
 * Pass `height`; width auto-scales.
 */
export function LogoFull({ height = 38, style }) {
  const [,, rw, rh] = R.horizontal;
  return <Sprite region={R.horizontal} displayW={Math.round(height * rw / rh)} displayH={height} style={style} />;
}

/**
 * LogoStacked — large stacked logo (big shield + large text + tagline).
 * Pass `height`; width auto-scales.
 */
export function LogoStacked({ height = 180, style }) {
  const [,, rw, rh] = R.stacked;
  return <Sprite region={R.stacked} displayW={Math.round(height * rw / rh)} displayH={height} style={style} />;
}

/**
 * LogoWatermark — subtle fixed bottom-right branding.
 */
export function LogoWatermark({ opacity = 0.07 }) {
  return (
    <div style={{ position: 'fixed', bottom: 12, right: 12, opacity, pointerEvents: 'none', zIndex: 1 }}>
      <LogoIcon size={52} />
    </div>
  );
}

export default LogoIcon;
