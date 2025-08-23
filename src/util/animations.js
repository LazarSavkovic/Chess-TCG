// util/animations.js
export function moveElementOver(
  sourceId,
  targetId,
  duration = 300,
  opts = {
    hideSource: true,
    fadeSource: false,
    positionMode: 'fixed',   // 'fixed' | 'absolute'
    debug: false,
    removeSource: 'keepHidden', // 'restore' | 'keepHidden' | 'remove' | 'placeholder'
  }
) {
  return new Promise((resolve) => {
    const src = document.getElementById(sourceId);
    const tgt = document.getElementById(targetId);
    if (!src || !tgt) return resolve();

    const srcRect = src.getBoundingClientRect();
    const tgtRect = tgt.getBoundingClientRect();
    if (srcRect.width === 0 || srcRect.height === 0) return resolve();

    // Optional placeholder (if we plan to remove the source but keep space)
    let placeholder = null;
    if (opts.removeSource === 'placeholder') {
      const cs = getComputedStyle(src);
      placeholder = document.createElement('div');
      placeholder.style.width = `${srcRect.width}px`;
      placeholder.style.height = `${srcRect.height}px`;
      placeholder.style.display = cs.display === 'inline' ? 'inline-block' : cs.display;
      placeholder.style.visibility = 'hidden';
      src.parentNode?.insertBefore(placeholder, src);
    }

    // 1) Clone FIRST so it doesn't inherit any hidden styles from src
    const ghost = src.cloneNode(true);
    ghost.setAttribute('aria-hidden', 'true');

    const useAbsolute = opts?.positionMode === 'absolute';
    const startLeft = useAbsolute ? srcRect.left + window.scrollX : srcRect.left;
    const startTop  = useAbsolute ? srcRect.top  + window.scrollY : srcRect.top;

    // helper so our properties win against framework CSS
    const setPx = (prop, px) => ghost.style.setProperty(prop, `${px}px`, 'important');

    Object.assign(ghost.style, {
      position: useAbsolute ? 'absolute' : 'fixed',
      margin: '0',
      zIndex: '9999',
      pointerEvents: 'none',
      boxSizing: 'border-box',
      visibility: 'visible',
      opacity: '1',
      willChange: 'transform',
      transform: 'translate3d(0,0,0)',
    });
    setPx('left', startLeft);
    setPx('top', startTop);
    setPx('width', srcRect.width);
    setPx('height', srcRect.height);

    if (opts?.debug) {
      ghost.style.outline = '2px dashed magenta';
      ghost.style.boxShadow = '0 0 8px rgba(255,0,255,.6)';
      console.log('[moveElementOver] start', { startLeft, startTop });
    }

    document.body.appendChild(ghost);

    // 2) Optionally hide/fade ORIGINAL (but keep its layout)
    const prev = {
      transition: src.style.transition,
      opacity: src.style.opacity,
      visibility: src.style.visibility,
    };
    if (opts?.fadeSource) {
      src.style.transition = `opacity ${duration}ms ease`;
      src.style.opacity = '0';
    }
    if (opts?.hideSource || opts.removeSource !== 'restore') {
      src.style.visibility = 'hidden';
    }

    // 3) Compute end position (center → center)
    const targetCenterX = tgtRect.left + tgtRect.width / 2;
    const targetCenterY = tgtRect.top  + tgtRect.height / 2;
    const finalLeft = (useAbsolute ? targetCenterX + window.scrollX : targetCenterX) - srcRect.width / 2;
    const finalTop  = (useAbsolute ? targetCenterY + window.scrollY : targetCenterY) - srcRect.height / 2;
    const dx = finalLeft - startLeft;
    const dy = finalTop  - startTop;

    if (opts?.debug) console.log('[moveElementOver] delta', { dx, dy, duration });

    // 4) Animate via CSS transition on transform (with forced reflow)
    //    This avoids the rAF loop entirely.
    ghost.style.setProperty('transition', `transform ${duration}ms ease`, 'important');
    // Force reflow so the starting transform is committed
    // eslint-disable-next-line no-unused-expressions
    ghost.offsetWidth;

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;

      ghost.remove();

      switch (opts.removeSource) {
        case 'remove':
          src.remove();
          break;
        case 'keepHidden':
          // leave visibility:hidden
          break;
        case 'placeholder':
          src.remove(); // placeholder already inserted
          break;
        case 'restore':
        default:
          if (src && src.isConnected) {
            src.style.transition = prev.transition;
            src.style.opacity = prev.opacity;
            src.style.visibility = prev.visibility;
          }
      }
      resolve();
    };

    // Fallback in case transitionend doesn't fire
    const fallback = setTimeout(cleanup, duration + 120);

    const onEnd = (e) => {
      if (e.propertyName !== 'transform') return;
      clearTimeout(fallback);
      ghost.removeEventListener('transitionend', onEnd);
      cleanup();
    };
    ghost.addEventListener('transitionend', onEnd);

    // Kick the transition on the next frame to ensure styles applied
    requestAnimationFrame(() => {
      ghost.style.setProperty('transform', `translate3d(${dx}px, ${dy}px, 0)`, 'important');
    });
  });
}
