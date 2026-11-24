const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
/* weaker phones get fewer stars and a lower canvas resolution */
const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
const DPR = Math.min(window.devicePixelRatio || 1, lowEnd ? 1 : 1.5);
const TAU = Math.PI * 2;
const view = { w: innerWidth, h: innerHeight };

const audio = $("#bgMusic");
const soundButton = $("#soundButton");
const loader = $("#loader");
const loaderWords = $("#loaderWords");
const loaderHint = $("#loaderHint");
const volumeSlider = $("#volumeSlider");
const volumeValue = $("#volumeValue");
let activeScreen = $("#welcome");
let isTransitioning = false;

function setVolume(value) {
  const level = Math.max(0, Math.min(100, Number(value)));
  audio.volume = level / 100;
  volumeSlider.value = String(level);
  volumeValue.textContent = level + "%";
}

setVolume(30);

function setMusicLabel(playing) {
  $(".sound-label").textContent = playing ? "Music is playing" : "Play our song";
  soundButton.setAttribute("aria-label", playing ? "Pause background music" : "Play background music");
}

async function tryPlayMusic() {
  try {
    await audio.play();
    setMusicLabel(true);
  } catch {
    setMusicLabel(false);
  }
}

function showLoader(words, duration, showWaitHint = false) {
  loaderWords.replaceChildren();
  loaderHint.hidden = !showWaitHint;
  words.forEach((word, index) => {
    const line = document.createElement("span");
    line.textContent = word;
    line.style.animationDelay = (index * .9) + "s";
    loaderWords.appendChild(line);
  });
  loader.classList.add("active");
  loader.setAttribute("aria-hidden", "false");
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function hideLoader() {
  loader.classList.remove("active");
  loader.setAttribute("aria-hidden", "true");
}

function startOpeningLines() {
  const lines = $$(".opening-lines p");
  lines.forEach((line) => line.classList.remove("visible"));
  lines.forEach((line, index) => {
    window.setTimeout(() => line.classList.add("visible"), index * 1000);
  });
}

const heartPortal = $("#heartPortal");
const wait = (ms) => new Promise((r) => window.setTimeout(r, ms));
/* page change: the old page fades away and is removed, a 4 second blue heart plays over the stars only,
   then the new page eases in. Timings match #experience / .hp in styles.css */
const HEART_MS = 3000;
const FADE_OUT_MS = 500;
const ENTER_MS = 900;

/* start fetching the next page's photos while the fade + heart animation plays, so nothing pops in.
   (the long final gallery stays lazy and loads while scrolling) */
function warmImages(destination) {
  if (destination.id === "stage6") return;
  $$('img[loading="lazy"]', destination).forEach((img) => { img.loading = "eager"; });
}

function swapScreen(destination) {
  activeScreen.hidden = true;
  destination.hidden = false;
  activeScreen = destination;
  document.body.dataset.screen = destination.id;
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  if (destination.id === "stage1") startOpeningLines();
  if (destination.id === "stage2" && renderWishes() !== "normal") fx.fireworks();
}

function playHeartZoom() {
  heartPortal.classList.remove("go");
  void heartPortal.offsetWidth;
  heartPortal.classList.add("go");
}

async function goTo(destinationId, isFinalPath = false) {
  if (isTransitioning) return;
  const destination = document.getElementById(destinationId);
  if (!destination || destination === activeScreen) return;
  isTransitioning = true;
  warmImages(destination);

  if (isFinalPath) {
    await showLoader(
      ["Nan irukan❄️", "i just love you ,care and adore you as always by your friend , brother and also as your's மகன் 🫀", "nan pesunathu hurt panna sorry mannichidu 😓", "Thanks for each and everything yuva mahh❄️"],
      13000, true
    );
  }
  /* the 13 second page turns pure black (words hidden) and stays black until the next page is ready */
  if (isFinalPath) loader.classList.add("blackout");
  else hideLoader();

  /* 1. current page fades out and is removed completely, so nothing sits behind the heart */
  document.body.classList.add("transitioning");
  await wait(FADE_OUT_MS);
  activeScreen.hidden = true;
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });

  /* 2. heart plays for the full 4 seconds over the starfield only */
  playHeartZoom();
  await wait(HEART_MS);

  /* 3. next page is mounted while still invisible, then eases in */
  heartPortal.classList.remove("go");
  swapScreen(destination);
  void document.body.offsetWidth;
  document.body.classList.remove("transitioning");
  if (isFinalPath) {
    hideLoader();
    loader.classList.remove("blackout");
  }
  await wait(ENTER_MS);
  isTransitioning = false;
}

$$("[data-next]").forEach((button) => {
  button.addEventListener("click", () => {
    if (activeScreen.id === "welcome") tryPlayMusic();
    goTo(button.dataset.next, button.dataset.final === "true");
  });
});

volumeSlider.addEventListener("input", () => setVolume(volumeSlider.value));
audio.addEventListener("volumechange", () => {
  const level = Math.round(audio.volume * 100);
  volumeSlider.value = String(level);
  volumeValue.textContent = level + "%";
});

soundButton.addEventListener("click", async () => {
  if (audio.paused) {
    await tryPlayMusic();
  } else {
    audio.pause();
    setMusicLabel(false);
  }
});

audio.addEventListener("playing", () => setMusicLabel(true));
audio.addEventListener("pause", () => setMusicLabel(false));

$$("img[data-media]").forEach((image) => {
  const frame = image.closest(".photo-frame");
  const showImage = () => {
    frame.style.setProperty("--photo-ratio", image.naturalWidth + " / " + image.naturalHeight);
    frame.classList.add("has-media");
  };
  image.addEventListener("load", showImage);
  if (image.complete && image.naturalWidth > 0) showImage();
});

$$(".video-frame video").forEach((video) => {
  const frame = video.closest(".video-frame");
  video.addEventListener("canplay", () => {
    frame.hidden = false;
    frame.classList.add("has-media");
  }, { once: true });
});

$("#secretButton").addEventListener("click", () => {
  const secret = $("#secretMemory");
  const button = $("#secretButton");
  const isOpening = secret.hidden;
  secret.hidden = !isOpening;
  button.setAttribute("aria-expanded", String(isOpening));
  if (isOpening) {
    window.setTimeout(() => secret.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
  }
});

$$(".envelope").forEach((envelope) => {
  envelope.addEventListener("click", () => {
    envelope.classList.toggle("open");
  });
});

const postcard = $("#postcard");
const letterGate = $("#letterGate");
const letterPassword = $("#letterPassword");
const letterGateMessage = $("#letterGateMessage");
const letter = $("#letter");
let letterUnlocked = false;

function unwrapLetter() {
  letterUnlocked = true;
  letterGate.hidden = true;
  letter.hidden = false;
  postcard.setAttribute("aria-expanded", "true");
  postcard.querySelector(".postcard-prompt").textContent = "A letter from மகன், with all my heart.";
  window.setTimeout(() => letter.scrollIntoView({ behavior: "smooth", block: "start" }), 260);
}

postcard.addEventListener("click", () => {
  if (letterUnlocked) {
    letter.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  letterGate.hidden = false;
  postcard.setAttribute("aria-expanded", "true");
  postcard.querySelector(".postcard-prompt").textContent = "One small password before your letter ♥";
  window.setTimeout(() => letterPassword.focus(), 120);
});

letterGate.addEventListener("submit", (event) => {
  event.preventDefault();
  if (letterPassword.value.trim().toLowerCase() === "my son") {
    unwrapLetter();
    return;
  }
  letterGateMessage.textContent = "That password is not right. Try again ♥";
  letterPassword.select();
});


/* ---------- planets: plain DOM nodes, drawn by CSS gradients (no SVG filters) ---------- */
function buildSpace() {
  const amb = $(".ambient");
  const frag = document.createDocumentFragment();
  [
    ["sp-mw", ""],
    ["sp-mars", ""],
    ["sp-moon", ""],
    ["sp-giant", '<i class="rb"></i><i class="pl"></i><i class="rf"></i>']
  ].forEach(([cls, inner]) => {
    const el = document.createElement("div");
    el.className = "sp " + cls;
    el.innerHTML = inner;
    frag.appendChild(el);
  });
  amb.appendChild(frag);
}

/* ---------- background starfield (canvas, batched draws, adaptive quality) ---------- */
const warp = (() => {
  const cv = document.createElement("canvas");
  cv.id = "warp";
  $(".ambient").after(cv);
  const ctx = cv.getContext("2d");
  const FILL = ["rgb(255,255,255)", "rgb(235,242,255)", "rgb(200,220,255)", "rgb(255,244,225)"];
  let stars = [];
  let quality = 1;

  function seed(s) {
    const depth = Math.random();                       /* far stars: small + slow, near stars: bigger + faster */
    s.x = Math.random() * view.w;
    s.y = Math.random() * view.h;
    s.r = .5 + depth * 1.5;
    const v = reduceMotion ? 0 : (.014 + depth * .024); /* px per ms */
    s.vx = -v * .9;
    s.vy = v * .45;
    s.t = (Math.random() * FILL.length) | 0;
    s.g = Math.random() < .25;                         /* glitter sparkle */
    s.p = Math.random() * TAU;
    s.a = .45 + depth * .55;
    return s;
  }

  function build() {
    const cap = lowEnd ? 100 : 190;
    const n = Math.round(Math.min(cap, view.w * view.h / (lowEnd ? 10000 : 6500)) * quality);
    stars = Array.from({ length: n }, () => seed({}));
    stars.sort((a, b) => a.t - b.t);                   /* same tint together = fewer fillStyle changes */
  }

  function resize() {
    cv.width = Math.round(view.w * DPR);
    cv.height = Math.round(view.h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function setQuality(q) { quality = q; build(); }

  function draw(now, dt) {
    const W = view.w, H = view.h;
    ctx.clearRect(0, 0, W, H);
    let tint = -1;
    let glitter = false;
    for (let i = 0; i < stars.length; i += 1) {
      const s = stars[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < -10) s.x = W + 10;
      if (s.y > H + 10) s.y = -10;
      if (s.x > W + 10) s.x = -10;
      if (s.y < -10) s.y = H + 10;
      s.tw = .55 + .45 * Math.sin(now / 700 + s.p);
      if (s.t !== tint) { tint = s.t; ctx.fillStyle = FILL[tint]; }
      ctx.globalAlpha = s.a * (.6 + .4 * s.tw);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
      if (s.g) glitter = true;
    }
    if (glitter) {                                     /* all four-point sparkles in a single stroke */
      ctx.globalAlpha = .55;
      ctx.strokeStyle = "rgb(240,246,255)";
      ctx.lineWidth = .8;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i];
        if (!s.g) continue;
        const L = s.r * (2.5 + 5 * s.tw);
        ctx.moveTo(s.x - L, s.y); ctx.lineTo(s.x + L, s.y);
        ctx.moveTo(s.x, s.y - L); ctx.lineTo(s.x, s.y + L);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  return { resize, draw, setQuality };
})();

/* ---------- foreground: heart/sparkle bursts on touch (pre-rendered sprites, idle = zero work) ---------- */
const fx = (() => {
  const cv = document.createElement("canvas");
  cv.id = "fx";
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  const MAX_BITS = 170;
  const K = 96 / 46;                                    /* sprite px per font px */

  function makeSprite(rgb) {
    const c = document.createElement("canvas");
    c.width = c.height = 96;
    const g = c.getContext("2d");
    g.shadowColor = "rgba(" + rgb + ",.9)";
    g.shadowBlur = 14;
    g.fillStyle = "rgb(" + rgb + ")";
    g.font = "46px serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("♥", 48, 50);
    return c;
  }
  const SPR = { pink: makeSprite("255,80,100"), pale: makeSprite("255,235,228"), rose: makeSprite("255,95,120") };

  let bits = [], rings = [];
  const holds = new Map();
  let lastEmit = 0, lastTrail = 0, dirty = false;

  function resize() {
    cv.width = Math.round(view.w * DPR);
    cv.height = Math.round(view.h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    dirty = true;
  }

  function burst(x, y, n = 11) {
    for (let i = 0; i < n; i += 1) {
      const ang = Math.random() * TAU, v = .06 + Math.random() * .22, heart = i % 2 === 0;
      bits.push({ x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - .08, life: 1, dec: .0006 + Math.random() * .0007,
        size: heart ? 9 + Math.random() * 13 : 2 + Math.random() * 2.5, heart, spr: SPR.pink });
    }
    if (bits.length > MAX_BITS) bits.splice(0, bits.length - MAX_BITS);
  }

  /* ---- fireworks: skyshots + crackers bursting at both sides of the screen ---- */
  let rockets = [], sparks = [];
  const FW = ["255,80,100", "255,210,120", "120,190,255", "255,255,255", "255,140,200", "160,255,190"];
  const MAX_SPARKS = 450;

  function explode(x, y, n) {
    const c = FW[(Math.random() * FW.length) | 0];
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * TAU + Math.random() * .3, v = .08 + Math.random() * .2;
      sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, dec: .0011 + Math.random() * .0008, size: 1.4 + Math.random() * 1.4, c, g: .00016 });
    }
    if (sparks.length > MAX_SPARKS) sparks.splice(0, sparks.length - MAX_SPARKS);
  }

  function launch(side) {
    const x0 = side < 0 ? view.w * (.04 + Math.random() * .12) : view.w * (.84 + Math.random() * .12);
    rockets.push({ x0, x1: x0 + (side < 0 ? 1 : -1) * view.w * (.02 + Math.random() * .05),
      y0: view.h + 8, y1: view.h * (.16 + Math.random() * .3), age: 0, life: 480 + Math.random() * 140 });
  }

  /* 2 seconds of skyshots (rockets that burst high) and crackers (quick low pops) on the left and right edges */
  function fireworks() {
    if (reduceMotion) return;
    const shots = lowEnd ? 5 : 8, pops = 12;
    for (let i = 0; i < shots; i += 1) window.setTimeout(() => launch(i % 2 ? 1 : -1), i * (1800 / shots));
    for (let i = 0; i < pops; i += 1) {
      window.setTimeout(() => {
        const left = i % 2 === 0;
        const x = view.w * (left ? .03 + Math.random() * .11 : .86 + Math.random() * .11);
        explode(x, view.h * (.35 + Math.random() * .45), lowEnd ? 7 : 10);
      }, i * 165);
    }
  }

  function drawFireworks(dt) {
    let w = 0;
    for (let i = 0; i < rockets.length; i += 1) {
      const r = rockets[i];
      r.age += dt;
      const k = r.age / r.life;
      if (k >= 1) { explode(r.x1, r.y1, lowEnd ? 22 : 34); continue; }
      const e = 1 - (1 - k) * (1 - k);
      const x = r.x0 + (r.x1 - r.x0) * k, y = r.y0 + (r.y1 - r.y0) * e;
      rockets[w++] = r;
      sparks.push({ x, y, vx: (Math.random() - .5) * .02, vy: .02 + Math.random() * .03, life: .8, dec: .004, size: 1.2, c: "255,200,140", g: 0 });
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgb(255,240,220)";
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
    }
    rockets.length = w;
    w = 0;
    for (let i = 0; i < sparks.length; i += 1) {
      const p = sparks[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= p.dec * dt;
      if (p.life <= 0) continue;
      sparks[w++] = p;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = "rgb(" + p.c + ")";
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (.5 + .5 * p.life), 0, TAU); ctx.fill();
    }
    sparks.length = w;
    ctx.globalAlpha = 1;
  }

  function emitHold(h) {
    for (let k = 0; k < 2; k += 1) {
      bits.push({ x: h.x + (Math.random() - .5) * 46, y: h.y + 26 + Math.random() * 26, vx: (Math.random() - .5) * .03, vy: .02 + Math.random() * .06,
        life: 1, dec: .0007 + Math.random() * .0006, size: 8 + Math.random() * 12, heart: true, glit: true, ph: Math.random() * TAU,
        spr: Math.random() < .3 ? SPR.pale : SPR.rose });
    }
    if (bits.length > MAX_BITS) bits.splice(0, bits.length - MAX_BITS);
  }

  function draw(now, dt) {
    if (!bits.length && !rings.length && !holds.size && !rockets.length && !sparks.length) {  /* idle: clear once, then do nothing */
      if (dirty) { ctx.clearRect(0, 0, view.w, view.h); dirty = false; }
      return;
    }
    dirty = true;
    ctx.clearRect(0, 0, view.w, view.h);
    if (rockets.length || sparks.length) drawFireworks(dt);

    /* finger / mouse held down: glittering hearts under the thumb */
    if (!reduceMotion && holds.size) {
      const emit = now - lastEmit > 50;
      if (emit) lastEmit = now;
      holds.forEach((h) => {
        if (emit) emitHold(h);
        const pulse = 1 + .12 * Math.sin(now / 130), hy = h.y + 46, w = 30 * K * pulse;
        ctx.globalAlpha = .95;
        ctx.drawImage(SPR.rose, h.x - w / 2, hy - w / 2, w, w);
        const tw = .5 + .5 * Math.sin(now / 90), L = 9 + 12 * tw;
        ctx.globalAlpha = .5 + .5 * tw;
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(h.x - 14 - L, hy - 6); ctx.lineTo(h.x - 14 + L, hy - 6);
        ctx.moveTo(h.x - 14, hy - 6 - L); ctx.lineTo(h.x - 14, hy - 6 + L);
        ctx.stroke();
      });
    }

    let w = 0;
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
    for (let i = 0; i < rings.length; i += 1) {
      const r = rings[i];
      r.life -= .0022 * dt;
      if (r.life <= 0) continue;
      rings[w++] = r;
      ctx.globalAlpha = r.life * .55;
      ctx.beginPath(); ctx.arc(r.x, r.y, 10 + (1 - r.life) * 90, 0, TAU); ctx.stroke();
    }
    rings.length = w;

    w = 0;
    ctx.fillStyle = "rgb(255,235,228)";
    for (let i = 0; i < bits.length; i += 1) {
      const p = bits[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .00012 * dt; p.life -= p.dec * dt;
      if (p.life <= 0) continue;
      bits[w++] = p;
      if (p.heart) {
        const s = p.size * K;
        ctx.globalAlpha = p.glit ? p.life * (.55 + .45 * Math.sin(now / 85 + p.ph)) : p.life;
        ctx.drawImage(p.spr, p.x - s / 2, p.y - s / 2, s, s);
        if (p.glit) ctx.fillRect(p.x - 1, p.y - p.size * .9, 2, 2);
      } else {
        ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life + .4, 0, TAU); ctx.fill();
      }
    }
    bits.length = w;
    ctx.globalAlpha = 1;
  }

  addEventListener("pointerdown", (e) => {
    if (reduceMotion) return;
    burst(e.clientX, e.clientY);
    rings.push({ x: e.clientX, y: e.clientY, life: 1 });
    if (e.pointerType === "mouse") holds.set("m", { x: e.clientX, y: e.clientY });
  }, { passive: true });
  addEventListener("pointerup", () => holds.delete("m"), { passive: true });
  addEventListener("pointercancel", () => holds.delete("m"), { passive: true });
  addEventListener("pointermove", (e) => {
    if (holds.has("m")) holds.set("m", { x: e.clientX, y: e.clientY });
    if (reduceMotion || e.pointerType !== "mouse" || e.timeStamp - lastTrail < 45) return;
    lastTrail = e.timeStamp; burst(e.clientX, e.clientY, 1);
  }, { passive: true });
  const syncTouches = (e) => {
    holds.forEach((_, k) => { if (k !== "m") holds.delete(k); });
    [...e.touches].forEach((t) => holds.set(t.identifier, { x: t.clientX, y: t.clientY }));
  };
  ["touchstart", "touchmove", "touchend", "touchcancel"].forEach((n) => addEventListener(n, syncTouches, { passive: true }));
  addEventListener("blur", () => holds.clear());

  return { resize, draw, fireworks };
})();

/* ---------- one shared animation loop; quality drops automatically if frames get slow ---------- */
(() => {
  let last = performance.now(), frames = 0, acc = 0, downgrades = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(50, now - last);
    last = now;
    frames += 1; acc += dt;
    if (frames === 120) {
      if (acc / frames > 24 && downgrades < 2 && now > 5000) { downgrades += 1; warp.setQuality(downgrades === 1 ? .65 : .4); }
      frames = 0; acc = 0;
    }
    warp.draw(now, dt);
    fx.draw(now, dt);
  }
  requestAnimationFrame(loop);
})();

/* resize: ignore the mobile address-bar show/hide (small height changes) so scrolling never reallocates canvases */
let resizeTimer = 0;
function onResize() {
  const w = innerWidth, h = innerHeight;
  if (w === view.w && Math.abs(h - view.h) < 160) return;
  view.w = w; view.h = h;
  warp.resize(); fx.resize();
}
addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(onResize, 150); });
warp.resize();
fx.resize();

/* ---------- soft hearts rising behind the glass (compositor-only animation) ---------- */
function buildHearts() {
  const layer = document.createElement("div");
  layer.className = "hearts-layer";
  const colors = ["#ff3b5c", "#ff6b7d", "#d1122d", "#ffd1c9"];
  const count = lowEnd ? 7 : 12;
  for (let i = 0; i < count; i += 1) {
    const h = document.createElement("span"), far = i % 3 === 0;
    h.textContent = "♥";
    h.style.setProperty("--x", (Math.random() * 100) + "%");
    h.style.setProperty("--s", (far ? .7 + Math.random() * .6 : 1.2 + Math.random() * 2.2) + "rem");
    h.style.setProperty("--c", colors[i % colors.length]);
    h.style.setProperty("--o", (far ? .11 : .2 + Math.random() * .15).toFixed(2));
    h.style.setProperty("--t", (16 + Math.random() * 16) + "s");
    h.style.setProperty("--d", (-Math.random() * 30) + "s");
    h.style.setProperty("--sx", (-60 + Math.random() * 120) + "px");
    layer.appendChild(h);
  }
  $("#warp").after(layer);
}

/* ---------- scroll reveal + progress bar ---------- */
const revealIO = "IntersectionObserver" in window ? new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add("seen"); revealIO.unobserve(e.target); }
}), { threshold: .1, rootMargin: "0px 0px -5% 0px" }) : null;

function addReveal(elements) {
  if (!revealIO) {
    elements.forEach((el) => el.classList.add("seen"));
    return;
  }
  elements.forEach((el) => { el.classList.add("reveal"); revealIO.observe(el); });
}

function buildScrollFx() {
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
  };
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  update();
}

/* ---------- final page: photos one below another, no names, plain scroll ---------- */
function buildMemoryStack() {
  const holder = $(".final-media");
  if (!holder) return;
  [...holder.children].forEach((item) => {
    const step = document.createElement("div");
    step.className = "memory-step";
    holder.insertBefore(step, item);
    step.appendChild(item);
    if (item.matches(".video-frame")) {
      step.hidden = item.hidden;
      new MutationObserver(() => { step.hidden = item.hidden; }).observe(item, { attributes: true, attributeFilter: ["hidden"] });
    }
  });
  const hint = document.createElement("span");
  hint.className = "scroll-hint";
  hint.textContent = "scroll pannu ↓";
  holder.before(hint);
  addReveal($$(".memory-step", holder));
}

/* final page button: opens the other site on touch; the address is never shown on the page */
const SON_URL = "https://nhwaran24252627-wq.github.io/happyness/";
$("#sonLink").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = SON_URL;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
});

/* ---------- wishes page: birthday on Aug 15, festival wishes on festival days, countdown otherwise ---------- */
/* festival: [name, tamil greeting, base(wall|pot), light(candle|diya|cane|<emoji>), wall colour, lead line, [3 candle wishes], decoration] */
const FEST = {
  newyear: ["New Year", "இனிய புத்தாண்டு நல்வாழ்த்துக்கள்", "wall", "🎆", "#1f2a52", "Puthu varusham, puthu santhosam 🎆", ["ella kanavum nijam aagum ✨", "neraya sirippu kidaikkum 🫀", "naan irukan always ❄️"], "🎆 ✦ 🎇"],
  bhogi: ["Bhogi", "போகி நல்வாழ்த்துக்கள்", "wall", "🔥", "#5a2a14", "Pazhasa ellam pogatum, puthusa santhosam varatum 🔥", ["kavalai ellam erinjidum 🔥", "puthu thodakkam 🌾", "happy aa iru 🫀"], "🔥 ✦ 🔥"],
  pongal: ["Pongal", "பொங்கலோ பொங்கல்!", "pot", "cane", "", "Santhosam pongi vazhiyatum, pongalo pongal! 🌾", ["pongal pola life pongum 🍚", "karumbu pola inippa irukum 🎋", "suriyan pola jolikanum ☀️"], "🌾 ✦ 🌾"],
  mattu: ["Mattu Pongal", "மாட்டுப் பொங்கல் நல்வாழ்த்துக்கள்", "pot", "cane", "", "Mattu pongal valthukkal! 🐂", ["nandri solla oru naal 🐂", "ellam nalla nadakkum 🌾", "pongalo pongal 🍚"], "🐂 ✦ 🐂"],
  kaanum: ["Kaanum Pongal", "காணும் பொங்கல் நல்வாழ்த்துக்கள்", "pot", "cane", "", "Kaanum pongal — uravugala paaka vendiya naal 🫀", ["ennaiyum nyabagam vachuko 🫀", "sandhosama suthi vaa 🌾", "pongalo pongal 🍚"], "🌾 ✦ 🌾"],
  republic: ["Republic Day", "குடியரசு தின வாழ்த்துக்கள்", "wall", "🇮🇳", "#7a3a14", "Jai Hind! 🇮🇳", ["sathandhiramaa iru 🇮🇳", "dreams ku poradu ✨", "proud aa iru 🫀"], "🇮🇳 ✦ 🇮🇳"],
  shivratri: ["Maha Shivratri", "மகா சிவராத்திரி வாழ்த்துக்கள்", "wall", "🔱", "#2b2f4a", "Om Namah Shivaya 🔱", ["amaithi un manasula irukatum 🔱", "bayam illa dhairiyama iru 🫀", "nalla vishayam nadakum ✨"], "🔱 ✦ 🔱"],
  holi: ["Holi", "ஹோலி வாழ்த்துக்கள்", "wall", "🎨", "#8a2d6a", "Un life colourful aa irukatum 🎨", ["sirippu colour 🎨", "happy colour 🫀", "love colour ❄️"], "🎨 ✦ 🎨"],
  ugadi: ["Ugadi", "உகாதி நல்வாழ்த்துக்கள்", "wall", "🌿", "#3f5a1f", "Ugadi shubhakankshalu! 🌿", ["inippum kasappum ellam kadandhu pogum 🌿", "puthu thodakkam ✨", "happy aa iru 🫀"], "🌿 ✦ 🌿"],
  puthandu: ["Tamil New Year", "இனிய தமிழ் புத்தாண்டு நல்வாழ்த்துக்கள்", "wall", "🥭", "#6b4a12", "Iniya Puthandu nalvazhthukkal! 🥭", ["maanga pachadi pola ella suvaiyum 🥭", "puthu varusham puthu vazhi 🌼", "nee nenaikirathu nadakum 🫀"], "🥭 🌼 🥭"],
  onam: ["Onam", "ഓണാശംസകൾ", "wall", "🌼", "#8a5a12", "Happy Onam! Pookalam pola un life azhaga irukatum 🌼", ["poo pola sirichite iru 🌼", "sadhya saapidu 🍃", "happy aa iru 🫀"], "🌼 ✦ 🌼"],
  krishna: ["Krishna Jayanthi", "கிருஷ்ண ஜெயந்தி வாழ்த்துக்கள்", "wall", "🪈", "#1f4a6b", "Kutty Krishna pola kutty kutty sandhosam 🪈", ["venna pola manasu 🧈", "flute pola inimai 🪈", "ellam nalla nadakum ✨"], "🪈 ✦ 🧈"],
  vinayagar: ["Vinayagar Chaturthi", "விநாயகர் சதுர்த்தி வாழ்த்துக்கள்", "wall", "🐘", "#8a3a12", "Pillaiyar arul unakku eppovum irukatum 🐘", ["ella thadaiyum vilagum 🐘", "kozhukattai saapidu 😋", "nalla nadakum ✨"], "🐘 🌺 🐘"],
  navaratri: ["Navaratri", "நவராத்திரி வாழ்த்துக்கள்", "wall", "diya", "#7a1f3a", "Golu vachachu! 9 naal santhosam 🪔", ["shakthi un kooda irukum 🪔", "dhairiyama iru 🫀", "ellam jeyam ✨"], "🪔 🎎 🪔"],
  ayudha: ["Ayudha Pooja", "ஆயுத பூஜை வாழ்த்துக்கள்", "wall", "📚", "#6b4212", "Ayudha pooja & Saraswathi pooja valthukkal 📚", ["padippu valarum 📚", "velai la jeyam 🛠️", "nalla nadakum ✨"], "📚 🪔 🛠️"],
  vijaya: ["Vijayadashami", "விஜயதசமி வாழ்த்துக்கள்", "wall", "🏹", "#7a2a12", "Vijayadashami — ellathulaiyum vetri 🏹", ["vetri unnaku than 🏹", "puthu thodakkam ✨", "happy aa iru 🫀"], "🏹 🪔 🏹"],
  diwali: ["Diwali", "தீபாவளி நல்வாழ்த்துக்கள்", "wall", "diya", "#7a2d10", "Deepavali vanthachu! Irul ellam vilagi velicham nirayatum 🪔", ["lamp aa thodu, velicham varum 🪔", "sweets saapidu, pathirama vedi 🎇", "santhosam un veetula nirayatum ✨"], "🪔 ✦ 🪔"],
  karthigai: ["Karthigai Deepam", "கார்த்திகை தீப வாழ்த்துக்கள்", "wall", "diya", "#6b2410", "Agal vilakku erinjidum, un life velichama irukatum 🪔", ["vilakku pola velichama iru 🪔", "irul ellam vilagum ✨", "naan irukan always ❄️"], "🪔 🌕 🪔"],
  gandhi: ["Gandhi Jayanthi", "காந்தி ஜெயந்தி", "wall", "🕊️", "#4a4a3a", "Amaithiyum anbum eppovum irukatum 🕊️", ["amaithi 🕊️", "anbu 🫀", "nambikkai ✨"], "🕊️ ✦ 🕊️"],
  xmas: ["Christmas", "Merry Christmas", "wall", "⭐", "#14502a", "Merry Christmas! 🎄", ["santhosam star pola jolikatum ⭐", "gift pola surprise vaazhkai 🎁", "happy aa iru ❄️"], "🎄 ⭐ 🎄"],
  nye: ["New Year's Eve", "Happy New Year Eve", "wall", "🎇", "#1f2a52", "Ithu varusham santhosama mudiyatum, adutha varusham athai vida nalla irukatum 🎇", ["ella nalla nyabagamum ❄️", "adutha varusham un varusham ✨", "naan irukan 🫀"], "🎇 ✦ 🎇"]
};
/* repeats every year (month-day) */
const FIXED = { "01-01": "newyear", "01-13": "bhogi", "01-14": "pongal", "01-15": "mattu", "01-16": "kaanum", "01-26": "republic", "04-14": "puthandu", "10-02": "gandhi", "12-25": "xmas", "12-31": "nye" };
/* moon/calendar based days: add more years here (yyyy-mm-dd) */
const LUNAR = {
  "2026-02-15": "shivratri", "2026-03-04": "holi", "2026-03-19": "ugadi", "2026-08-26": "onam", "2026-09-04": "krishna", "2026-09-14": "vinayagar",
  "2026-10-11": "navaratri", "2026-10-19": "ayudha", "2026-10-20": "vijaya", "2026-11-08": "diwali", "2026-11-24": "karthigai",
  "2027-03-06": "shivratri", "2027-03-22": "holi", "2027-04-07": "ugadi", "2027-08-25": "krishna", "2027-09-04": "vinayagar", "2027-10-29": "diwali"
};
const NORMAL_WISHES = ["ninachathu ellam nadakum 💕", "sirichitey iru 🫀", "enna nadanthalum pathukallam ❄️"];
const BDAY_WISHES = NORMAL_WISHES;

function todayDate() {
  const q = new URLSearchParams(location.search).get("date");   /* ?date=2026-11-08 to preview any day */
  const m = q && q.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const n = new Date();
  return m ? new Date(+m[1], +m[2] - 1, +m[3], n.getHours(), n.getMinutes(), n.getSeconds()) : n;
}
const p2 = (n) => String(n).padStart(2, "0");
function dayMode(d) {
  const md = p2(d.getMonth() + 1) + "-" + p2(d.getDate());
  if (md === "08-15") return "birthday";
  return LUNAR[d.getFullYear() + "-" + md] || FIXED[md] || "normal";
}

function lightHTML(kind, wishes) {
  return wishes.map((w, i) => {
    const a = 'data-wish="' + w + '" aria-label="Touch light ' + (i + 1) + '"';
    if (kind === "candle") return '<button class="candle light" type="button" ' + a + '><span class="flame"></span><span class="wick"></span></button>';
    if (kind === "diya") return '<button class="diya light" type="button" ' + a + '><span class="flame"></span><i class="bowl"></i></button>';
    if (kind === "cane") return '<button class="cane light" type="button" ' + a + '><i class="leaf"></i></button>';
    return '<button class="emo light" type="button" ' + a + '>' + kind + '</button>';
  }).join("");
}

function sceneHTML(mode, key) {
  const msg = '<div id="wishMessage" class="wish-message" hidden></div>';
  if (mode === "birthday") {
    return '<div class="confetti">✦ · ♡ · ✦ · ♡ · ✦</div><p class="candle-instruction">candle flame a thodu.</p><div class="candles">' + lightHTML("candle", BDAY_WISHES) + '</div>' +
      '<div class="cake-top"><span>👣</span><span>♡</span><span>👣</span></div><div class="cake-bottom"><span>👣</span><span>✦</span><span>👣</span><span>✦</span><span>👣</span></div>' + msg;
  }
  if (mode === "normal") {
    return '<p class="candle-instruction">candle flame a thodu.</p><div class="candles on-wall">' + lightHTML("candle", NORMAL_WISHES) + '</div>' +
      '<div class="wall"><span class="wall-text">(see this in special days)</span></div>' + msg;
  }
  const f = FEST[key];
  if (f[2] === "pot") {
    return '<p class="candle-instruction">karumbu a thodu.</p><div class="candles canes">' + lightHTML("cane", f[6]) + '</div>' +
      '<div class="pot"><i class="foam"></i><i class="foam f2"></i><div class="pot-body"><span class="pot-band"></span><span class="pot-deco">' + f[7] + '</span></div></div>' + msg;
  }
  return '<p class="candle-instruction">' + (f[3] === "diya" ? "vilakku a thodu." : "thodu.") + '</p><div class="candles on-wall">' + lightHTML(f[3], f[6]) + '</div>' +
    '<div class="wall" style="--wall:' + f[4] + '"><span class="wall-text">Happy ' + f[0] + '</span><span class="wall-deco">' + f[7] + '</span></div>' + msg;
}

let wishMode = "normal";
function renderWishes() {
  const d = todayDate(), key = dayMode(d);
  const mode = key === "birthday" || key === "normal" ? key : "festival";
  wishMode = mode;
  document.body.classList.toggle("bday", mode === "birthday");
  document.body.dataset.day = mode === "festival" ? key : mode;
  const f = FEST[key];
  const title = mode === "birthday" ? "Happy <em>Birthday</em>" : mode === "festival" ? "Happy <em>" + f[0] + "</em>" : "Wishes <em>for you</em>";
  $("#wishTitle").innerHTML = title;
  $("#wishEyebrow").textContent = mode === "festival" ? f[1] : mode === "birthday" ? "vanga" : "wishes";
  $("#wishLead").textContent = mode === "birthday" ? "happy birthday to you🫀 (and Happy Independence Day 🇮🇳)" : mode === "festival" ? f[5] : "Innikku special day illa, aana wishes eppovum irukku 🫀";
  $("#wishLine").textContent = mode === "festival" ? f[1] : "wishes ellam kandipa nadakum";
  $("#wishScene").className = "cake-scene scene-" + (mode === "festival" ? f[2] : mode === "birthday" ? "cake" : "wall");
  $("#wishScene").innerHTML = sceneHTML(mode, key);
  document.title = mode === "birthday" ? "Happy Birthday — for mothereyyy" : mode === "festival" ? "Happy " + f[0] + " — for mothereyyy" : "For mothereyyy";
  tickDay();
  return mode;
}

function tickDay() {
  const d = todayDate();
  const label = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const cd = $("#countdown");
  let text = "", line = label;
  if (dayMode(d) !== "birthday") {
    let target = new Date(d.getFullYear(), 7, 15);
    if (d >= new Date(d.getFullYear(), 7, 16)) target = new Date(d.getFullYear() + 1, 7, 15);
    const ms = target - d, days = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    text = days + " days " + p2(h) + ":" + p2(m) + ":" + p2(s) + " to August 15";
    line += "  ·  " + days + " days to Aug 15";
  }
  $("#wishDate").textContent = label;
  cd.hidden = !text; cd.textContent = text;
  $("#homeStrip").textContent = line;
}
setInterval(tickDay, 1000);

$("#wishScene").addEventListener("click", (event) => {
  const light = event.target.closest(".light");
  if (!light || light.classList.contains("out")) return;
  light.classList.add("out");
  const scene = $("#wishScene"), message = $("#wishMessage");
  const sb = scene.getBoundingClientRect(), lb = light.getBoundingClientRect();
  const x = (lb.left - sb.left + lb.width / 2) / (sb.width / scene.offsetWidth);
  scene.classList.add("wish-made");
  message.hidden = false;
  message.style.left = x + "px";
  message.textContent = light.dataset.wish;
  message.animate([{ opacity: 0, transform: "translate(-50%, 12px)" }, { opacity: 1, transform: "translate(-50%, 0)" }], { duration: 500, easing: "ease-out" });
});
renderWishes();

buildSpace();
buildHearts();
buildMemoryStack();
buildScrollFx();
addReveal($$(".memory, .envelope, .secret-wrap, .final-note, .postcard, .letter-body p, .stage-lead, .wish-line, .restart-button"));
setMusicLabel(false);
tryPlayMusic();
document.addEventListener("pointerdown", tryPlayMusic, { once: true, passive: true });
