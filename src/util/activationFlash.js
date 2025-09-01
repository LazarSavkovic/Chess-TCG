// ui/activationFlash.js
const FX_CLASS = 'mm-activation--play';

export function playActivationFx(pos, card, apiHost) {
  console.log('triggered')
  if (!pos || !Array.isArray(pos)) return;
  const [x, y] = pos;

  const board = document.getElementById('board');
  if (!board) return;

  const side = detectSide(board);
  const cardId = card?.id ? `card-${card.id}` : `card-${slug(card?.name || 'card')}-${x}-${y}`;


    const el = createBoardCardElement({ card, apiHost, id: cardId });


    const cell = document.getElementById(`cell-${x}-${y}`)
    console.log(cell)
        cell.appendChild(el);
    console.log(el, 'el')
    

  // Ensure a persistent FX layer exists
  const fx = getOrCreateActivationLayer(el, card?.role);

  // Re-tint if role changed
  if (card?.role) fx.dataset.role = String(card.role).toLowerCase();

  // Re-trigger animation without removing element
  fx.classList.remove(FX_CLASS);
  // force reflow so the next add restarts the keyframes
  void fx.offsetWidth; 
  fx.classList.add(FX_CLASS);
}

// ---------- helpers ----------
function detectSide(board) {
  const cells = board.querySelectorAll('.cell');
  if (cells.length) {
    const s = Math.round(Math.sqrt(cells.length));
    if (s * s === cells.length) return s;
  }
  const gtc = board.style.gridTemplateColumns || getComputedStyle(board).gridTemplateColumns || '';
  const m = gtc.match(/repeat\((\d+),/i);
  return m ? parseInt(m[1], 10) : 6;
}



function createBoardCardElement({ card = {}, apiHost, id }) {
  const {
    name = 'Unknown',
    role = 'white',
    image,
    type = 'monster',
    user = '1',
    stats,
    movements = [],
  } = card;

  const el = document.createElement('div');
  el.id = id;
  el.className = `${type === 'monster' ? 'monster' : 'card-frame'} user-${user} `;
  el.title = name;

  const badge = document.createElement('div');
  badge.className = `role-badge ${role}-badge`;
  badge.setAttribute('aria-label', String(role));
  badge.textContent = roleEmoji(role);
  el.appendChild(badge);

  const img = document.createElement('div');
  img.className = 'card-image';
  const url = resolveImageUrl(image, apiHost);
  if (url) img.style.backgroundImage = `url("${url}")`;
  if (String(user) === '2') img.style.transform = 'scaleY(-1)';
  el.appendChild(img);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  el.appendChild(overlay);

  const nm = document.createElement('div');
  nm.className = 'card-name';
  nm.textContent = name;
  el.appendChild(nm);

  const st = document.createElement('div');
  st.className = 'stats';
  if (stats && (stats.atk != null || stats.hp != null)) {
    st.innerHTML = `<span>${stats.atk ?? ''}</span> / <span>${stats.hp ?? ''}</span>`;
  }
  el.appendChild(st);

  movements.forEach((mv) => {
    const m = document.createElement('div');
    m.className = `movement movement-${mv}`;
    m.style.borderColor = role;
    el.appendChild(m);
  });

  return el;
}

function getOrCreateActivationLayer(cardEl, role) {
  let fx = cardEl.querySelector('.mm-activation');
  if (!fx) {
    fx = document.createElement('div');
    fx.className = 'mm-activation';      // persistent node
    if (role) fx.dataset.role = String(role).toLowerCase();

    const bloom = document.createElement('div');
    bloom.className = 'mm-energy-bloom';

    const ring1 = document.createElement('div');
    ring1.className = 'mm-pulse mm-pulse-1';

    const ring2 = document.createElement('div');
    ring2.className = 'mm-pulse mm-pulse-2';

    const sparks = document.createElement('div');
    sparks.className = 'mm-sparks';
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('span');
      s.className = 'mm-spark';
      // store static random target so the same element can re-animate consistently
      if (!s.style.getPropertyValue('--tx')) {
        const theta = Math.random() * Math.PI * 2;
        const dist = 26 + Math.random() * 32;
        s.style.setProperty('--tx', `${Math.cos(theta) * dist}px`);
        s.style.setProperty('--ty', `${Math.sin(theta) * dist}px`);
      }
      sparks.appendChild(s);
    }

    fx.append(bloom, ring1, ring2, sparks);
    cardEl.appendChild(fx);
  }
  return fx;
}

function resolveImageUrl(path, apiHost) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const origin = `${window.location.protocol}//${apiHost}`;
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}
function roleEmoji(role) {
  const map = { red: '🔴', blue: '🔵', white: '⚪', black: '⚫' };
  return map[String(role).toLowerCase()] || '✨';
}
function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
