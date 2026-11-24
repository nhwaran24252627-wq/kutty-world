const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const audio = $("#bgMusic");
const soundButton = $("#soundButton");
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

function createFloatingWorld() {
  const symbols = ["·", "·", "✦", "·", "⋆", "·", "✧"];
  const colors = ["#fff8f4", "#ffe1d7", "#ffb6a5", "#ff6a56", "#d1122d", "#ffffff"];
  const holder = $("#floaties");
  holder.replaceChildren();

  for (let i = 0; i < 86; i += 1) {
    const star = document.createElement("span");
    const isBright = i % 11 === 0;
    star.className = isBright ? "star star-bright" : "star";
    star.textContent = symbols[i % symbols.length];
    star.style.left = (Math.random() * 100) + "%";
    star.style.top = (Math.random() * 100) + "%";
    star.style.setProperty("--duration", (10 + Math.random() * 24) + "s");
    star.style.setProperty("--twinkle-duration", (2.8 + Math.random() * 6.2) + "s");
    star.style.setProperty("--shift", (-32 + Math.random() * 64) + "px");
    star.style.setProperty("--size", (.28 + Math.random() * (isBright ? 1.05 : .54)) + "rem");
    star.style.setProperty("--color", colors[i % colors.length]);
    star.style.setProperty("--opacity", (.35 + Math.random() * .65).toFixed(2));
    star.style.setProperty("--delay", (Math.random() * -12) + "s");
    star.style.animationDelay = star.style.getPropertyValue("--delay");
    holder.appendChild(star);
  }
}

document.addEventListener("pointermove", (event) => {
  document.documentElement.style.setProperty("--pointer-x", (event.clientX / window.innerWidth * 100) + "%");
  document.documentElement.style.setProperty("--pointer-y", (event.clientY / window.innerHeight * 100) + "%");
}, { passive: true });

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

function startOpeningLines() {
  const lines = $$(".opening-lines p");
  lines.forEach((line) => line.classList.remove("visible"));
  lines.forEach((line, index) => {
    window.setTimeout(() => line.classList.add("visible"), index * 1000);
  });
}

const heartPortal = $("#heartPortal");
const wait = (ms) => new Promise((r) => window.setTimeout(r, ms));
const stageOrder = ["welcome", "stage1", "stage2", "stage3", "stage4", "stage5", "stage6"];
const HEART_SWAP_MS = 1050;
const HEART_TOTAL_MS = 1500;

function swapScreen(destination) {
  activeScreen.hidden = true;
  destination.hidden = false;
  activeScreen = destination;
  document.body.dataset.screen = destination.id;
  document.body.style.setProperty("--step", Math.max(0, stageOrder.indexOf(destination.id)));
  window.scrollTo(0, 0);
  if (destination.id === "stage1") startOpeningLines();
}

/* only a transparent blue-bordered heart: pops in, beats, then the camera zooms inside its centre */
function playHeartZoom() {
  heartPortal.classList.remove("go");
  void heartPortal.offsetWidth;
  heartPortal.classList.add("go");
}

async function goTo(destinationId) {
  if (isTransitioning) return;
  const destination = document.getElementById(destinationId);
  if (!destination || destination === activeScreen) return;
  isTransitioning = true;

  playHeartZoom();
  warp.boost(1);
  await wait(HEART_SWAP_MS - 350);
  activeScreen.classList.add("fade-out");
  await wait(350);
  activeScreen.classList.remove("fade-out");
  swapScreen(destination);
  destination.classList.add("fade-in");
  warp.boost(0);
  await wait(HEART_TOTAL_MS - HEART_SWAP_MS);
  isTransitioning = false;
  heartPortal.classList.remove("go");
  await wait(300);
  destination.classList.remove("fade-in");
}

$$("[data-next]").forEach((button) => {
  button.addEventListener("click", () => {
    if (activeScreen.id === "welcome") tryPlayMusic();
    goTo(button.dataset.next);
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

$$(".candle").forEach((candle) => {
  candle.addEventListener("click", () => {
    if (candle.classList.contains("out")) return;
    candle.classList.add("out");
    const message = $("#wishMessage");
    const scene = candle.closest(".cake-scene");
    const sceneBounds = scene.getBoundingClientRect();
    const candleBounds = candle.getBoundingClientRect();
    const sceneScale = sceneBounds.width / scene.offsetWidth;
    const messageX = (candleBounds.left - sceneBounds.left + candleBounds.width / 2) / sceneScale;
    scene.classList.add("wish-made");
    message.hidden = false;
    message.style.left = messageX + "px";
    message.textContent = candle.dataset.wish;
    message.animate(
      [{ opacity: 0, transform: "translate(-50%, 12px)" }, { opacity: 1, transform: "translate(-50%, 0)" }],
      { duration: 500, easing: "ease-out" }
    );
  });
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
  if (letterPassword.value.trim() === "மகன்") {
    unwrapLetter();
    return;
  }
  letterGateMessage.textContent = "That password is not right. Try again ♥";
  letterPassword.select();
});


/* ---------- realistic planets (SVG textures: noise + lighting) ---------- */
function buildSpace() {
  const amb = $(".ambient");
  const tex = (id, freq, oct, seed, r, g, b) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}"/><feColorMatrix values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 0 1"/><feComponentTransfer><feFuncR type="table" tableValues="${r}"/><feFuncG type="table" tableValues="${g}"/><feFuncB type="table" tableValues="${b}"/></feComponentTransfer><feComposite in2="SourceAlpha" operator="in"/></filter>`;
  const shade = (id, cx, cy, dark) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r=".85"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".45" stop-color="#000" stop-opacity=".25"/><stop offset=".8" stop-color="#000" stop-opacity="${dark}"/><stop offset="1" stop-color="#000" stop-opacity=".98"/></radialGradient>`;

  const mars = `<svg viewBox="0 0 400 400"><defs>${tex("tm", ".012 .018", 6, 11, "0.03 .3 .72 .95", "0 .04 .16 .3", "0 .03 .1 .18")}${shade("sm", ".32", ".3", ".9")}<radialGradient id="am" cx=".5" cy=".5" r=".5"><stop offset=".92" stop-color="#ff3b2e" stop-opacity="0"/><stop offset=".985" stop-color="#ff3b2e" stop-opacity=".55"/><stop offset="1" stop-color="#ff3b2e" stop-opacity="0"/></radialGradient></defs><circle cx="200" cy="200" r="206" fill="url(#am)"/><circle cx="200" cy="200" r="190" fill="#400" filter="url(#tm)"/><circle cx="200" cy="200" r="190" fill="url(#sm)"/></svg>`;

  const moon = `<svg viewBox="0 0 200 200"><defs>${tex("tl", ".03", 5, 4, "0.03 .22 .5 .78", "0.03 .2 .46 .72", "0.04 .22 .48 .74")}${shade("sl", ".7", ".28", ".85")}<radialGradient id="cr"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".8" stop-color="#000" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></radialGradient></defs><circle cx="100" cy="100" r="92" fill="#333" filter="url(#tl)"/><g fill="url(#cr)"><circle cx="70" cy="62" r="15"/><circle cx="118" cy="95" r="22"/><circle cx="82" cy="128" r="11"/><circle cx="132" cy="52" r="9"/><circle cx="55" cy="105" r="8"/></g><circle cx="100" cy="100" r="92" fill="url(#sl)"/></svg>`;

  const giant = `<svg viewBox="0 0 400 400"><defs>${tex("tg", ".004 .075", 4, 21, "0.02 .25 .6 .9", "0 .06 .2 .42", "0 .03 .1 .2")}${shade("sg", ".3", ".3", ".92")}<linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#ff7a68" stop-opacity="0"/><stop offset=".25" stop-color="#ffb3a4" stop-opacity=".55"/><stop offset=".5" stop-color="#7a0a14" stop-opacity=".3"/><stop offset=".75" stop-color="#ffb3a4" stop-opacity=".5"/><stop offset="1" stop-color="#ff7a68" stop-opacity="0"/></linearGradient></defs><g transform="rotate(-18 200 200)"><ellipse cx="200" cy="200" rx="195" ry="42" fill="none" stroke="url(#rg)" stroke-width="16"/><ellipse cx="200" cy="200" rx="160" ry="34" fill="none" stroke="url(#rg)" stroke-width="6"/><circle cx="200" cy="200" r="98" fill="#400" filter="url(#tg)"/><circle cx="200" cy="200" r="98" fill="url(#sg)"/><path d="M5 200A195 42 0 0 0 395 200" fill="none" stroke="url(#rg)" stroke-width="16"/><path d="M40 200A160 34 0 0 0 360 200" fill="none" stroke="url(#rg)" stroke-width="6"/></g></svg>`;

  [["sp-mw", ""], ["sp-mars", mars], ["sp-moon", moon], ["sp-giant", giant]].forEach(([cls, svg]) => {
    const el = document.createElement("div");
    el.className = "sp " + cls; el.innerHTML = svg; amb.insertBefore(el, $("#floaties"));
  });
}

/* ---------- background: depth starfield that stretches into streaks during page travel ---------- */
const warp = (() => {
  const cv = document.createElement("canvas");
  cv.id = "warp";
  $(".ambient").after(cv);
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tints = ["255,255,255", "255,236,228", "255,190,175", "255,90,80", "200,220,255"];
  const IDLE = 0.00058;
  let W = 0, H = 0, speed = IDLE, target = IDLE, stars = [], dust = [], last = performance.now();
  const seed = (s, fresh) => {
    s.x = (Math.random() - .5) * 2.4; s.y = (Math.random() - .5) * 2.4;
    s.z = fresh ? Math.random() : 1; s.t = tints[(Math.random() * tints.length) | 0]; s.r = .6 + Math.random() * 1.5; s.g = Math.random() < .42; s.p = Math.random() * 6.283; return s;
  };
  function resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    stars = Array.from({ length: Math.round(Math.min(380, W * H / 3400)) }, () => seed({}, true));
    dust = Array.from({ length: 12 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 60 + Math.random() * 140, vx: (Math.random() - .5) * .08, vy: (Math.random() - .5) * .05, a: .02 + Math.random() * .05 }));
  }
  const project = (s, z) => [W / 2 + s.x / z * W * .22, H / 2 + s.y / z * W * .22];
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    speed += (target - speed) * .07;
    ctx.clearRect(0, 0, W, H);
    dust.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -200) p.x = W + 200; if (p.x > W + 200) p.x = -200;
      if (p.y < -200) p.y = H + 200; if (p.y > H + 200) p.y = -200;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(190,14,32,${p.a})`); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    });
    const fast = speed > .004;
    stars.forEach((s) => {
      const pz = s.z; s.z -= speed * dt;
      if (s.z <= .03) { seed(s, false); return; }
      const [x, y] = project(s, s.z);
      if (fast && (x < -50 || x > W + 50 || y < -50 || y > H + 50)) seed(s, false);
      const a = Math.min(1, (1 - s.z) * 1.6 + .25);
      ctx.strokeStyle = `rgba(${s.t},${a})`; ctx.fillStyle = ctx.strokeStyle;
      if (fast) {
        const [px, py] = project(s, Math.min(1.2, pz + speed * dt * 2.6));
        ctx.lineWidth = s.r * (1.1 - s.z * .5); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      } else {
        const r = s.r * (1.05 - s.z * .6) * 1.15;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
        if (s.g) {
          const tw = .5 + .5 * Math.sin(now / 240 + s.p), L = r * (3 + 7 * (1 - s.z)) * tw;
          ctx.globalAlpha = tw * a; ctx.lineWidth = .9; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    });
    requestAnimationFrame(frame);
  }
  addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
  return { boost: (v) => { target = reduce ? IDLE : IDLE + v * .03; }, kick: (v) => { if (!reduce) speed = Math.min(.012, speed + v); } };
})();

/* ---------- foreground: shooting stars over the UI + heart/sparkle bursts ---------- */
const fx = (() => {
  const cv = document.createElement("canvas");
  cv.id = "fx";
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, shooters = [], bits = [], rings = [], holds = new Map(), lastEmit = 0, next = 500, last = performance.now(), lastTrail = 0;
  function resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function shoot() {
    const rightward = Math.random() < .4, a = .38 + Math.random() * .42, sp = 1 + Math.random() * 1.1;
    shooters.push({
      x: rightward ? Math.random() * W * .6 : W * (.3 + Math.random() * .8), y: -30 - Math.random() * 60,
      vx: (rightward ? 1 : -1) * Math.cos(a) * sp, vy: Math.sin(a) * sp,
      len: 170 + Math.random() * 190, w: 1.4 + Math.random() * 1.6, hue: Math.random() < .55 ? "255,70,80" : "255,225,215"
    });
  }
  function burst(x, y, n = 11) {
    for (let i = 0; i < n; i += 1) {
      const ang = Math.random() * 6.283, v = .06 + Math.random() * .22, heart = i % 2 === 0;
      bits.push({ x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - .08, life: 1, dec: .0006 + Math.random() * .0007, size: heart ? 9 + Math.random() * 13 : 2 + Math.random() * 2.5, heart, hue: heart ? "255,80,100" : "255,235,228" });
    }
  }
  function frame(now) {
    const dt = Math.min(50, now - last); last = now;
    ctx.clearRect(0, 0, W, H);
    next -= dt;
    if (next < 0 && !reduce) { shoot(); if (Math.random() < .3) shoot(); next = 700 + Math.random() * 1900; }
    shooters = shooters.filter((s) => s.x > -400 && s.x < W + 400 && s.y < H + 300);
    shooters.forEach((s) => {
      s.x += s.vx * dt; s.y += s.vy * dt;
      const m = Math.hypot(s.vx, s.vy), tx = s.x - (s.vx / m) * s.len, ty = s.y - (s.vy / m) * s.len;
      const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.2, `rgba(${s.hue},.6)`); g.addColorStop(1, "rgba(160,0,20,0)");
      ctx.strokeStyle = g; ctx.lineWidth = s.w; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 12);
      glow.addColorStop(0, "rgba(255,255,255,.95)"); glow.addColorStop(.35, `rgba(${s.hue},.45)`); glow.addColorStop(1, "rgba(255,40,60,0)");
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(s.x, s.y, 12, 0, 6.283); ctx.fill();
      if (Math.random() < .35) bits.push({ x: s.x, y: s.y, vx: (Math.random() - .5) * .03, vy: Math.random() * .03, life: .8, dec: .0016, size: 1.5, heart: false, hue: s.hue });
    });
    /* finger / mouse held down: glittering hearts under the thumb */
    if (!reduce) holds.forEach((h) => {
      if (now - lastEmit > 38) {
        lastEmit = now;
        for (let k = 0; k < 2; k += 1) bits.push({ x: h.x + (Math.random() - .5) * 46, y: h.y + 26 + Math.random() * 26, vx: (Math.random() - .5) * .03, vy: .02 + Math.random() * .06,
          life: 1, dec: .0007 + Math.random() * .0006, size: 8 + Math.random() * 12, heart: true, glit: true, ph: Math.random() * 6.283, hue: Math.random() < .3 ? "255,235,228" : "255,95,120" });
      }
      const pulse = 1 + .12 * Math.sin(now / 130), hy = h.y + 46;
      ctx.save(); ctx.translate(h.x, hy); ctx.scale(pulse, pulse);
      ctx.shadowColor = "rgba(255,60,90,.95)"; ctx.shadowBlur = 22; ctx.fillStyle = "rgba(255,100,125,.92)";
      ctx.font = "30px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("♥", 0, 0);
      ctx.restore();
      const tw = .5 + .5 * Math.sin(now / 90), L = 9 + 12 * tw;
      ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${.5 + .5 * tw})`; ctx.lineWidth = 1.2; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(h.x - 14 - L, hy - 6); ctx.lineTo(h.x - 14 + L, hy - 6); ctx.moveTo(h.x - 14, hy - 6 - L); ctx.lineTo(h.x - 14, hy - 6 + L); ctx.stroke(); ctx.restore();
    });
    rings = rings.filter((r) => r.life > 0);
    rings.forEach((r) => {
      r.life -= .0022 * dt; const k = 1 - r.life;
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, r.life) * .55})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(r.x, r.y, 10 + k * 90, 0, 6.283); ctx.stroke();
    });
    bits = bits.filter((p) => p.life > 0);
    bits.forEach((p) => {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .00012 * dt; p.life -= p.dec * dt;
      if (p.glit) {
        const tw = .55 + .45 * Math.sin(now / 85 + p.ph);
        ctx.globalAlpha = Math.max(0, p.life) * tw; ctx.fillStyle = `rgb(${p.hue})`;
        ctx.shadowColor = `rgba(${p.hue},.95)`; ctx.shadowBlur = 14;
        ctx.font = p.size + "px serif"; ctx.textAlign = "center"; ctx.fillText("♥", p.x, p.y);
        ctx.shadowBlur = 0; ctx.fillRect(p.x - 1, p.y - p.size * .9, 2, 2);
        return;
      }
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = `rgb(${p.hue})`;
      if (p.heart) { ctx.font = p.size + "px serif"; ctx.textAlign = "center"; ctx.fillText("♥", p.x, p.y); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life + .4, 0, 6.283); ctx.fill(); }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  addEventListener("resize", resize);
  addEventListener("pointerdown", (e) => {
    if (reduce) return;
    burst(e.clientX, e.clientY); rings.push({ x: e.clientX, y: e.clientY, life: 1 });
    if (e.pointerType === "mouse") holds.set("m", { x: e.clientX, y: e.clientY });
  }, { passive: true });
  addEventListener("pointerup", () => holds.delete("m"), { passive: true });
  addEventListener("pointercancel", () => holds.delete("m"), { passive: true });
  addEventListener("pointermove", (e) => { if (holds.has("m")) holds.set("m", { x: e.clientX, y: e.clientY }); }, { passive: true });
  const syncTouches = (e) => {
    holds.forEach((_, k) => { if (k !== "m") holds.delete(k); });
    [...e.touches].forEach((t) => holds.set(t.identifier, { x: t.clientX, y: t.clientY }));
  };
  ["touchstart", "touchmove"].forEach((n) => addEventListener(n, syncTouches, { passive: true }));
  ["touchend", "touchcancel"].forEach((n) => addEventListener(n, syncTouches, { passive: true }));
  addEventListener("blur", () => holds.clear());
  addEventListener("pointermove", (e) => {
    if (reduce || e.pointerType !== "mouse" || e.timeStamp - lastTrail < 45) return;
    lastTrail = e.timeStamp; burst(e.clientX, e.clientY, 1);
  }, { passive: true });
  resize();
  requestAnimationFrame(frame);
})();

/* ---------- soft hearts rising behind the glass ---------- */
function buildHearts() {
  const layer = document.createElement("div");
  layer.className = "hearts-layer";
  const colors = ["#ff3b5c", "#ff6b7d", "#d1122d", "#ffd1c9"];
  for (let i = 0; i < 20; i += 1) {
    const h = document.createElement("span"), far = i % 3 === 0;
    h.textContent = "♥";
    h.style.setProperty("--x", (Math.random() * 100) + "%");
    h.style.setProperty("--s", (far ? .7 + Math.random() * .6 : 1.2 + Math.random() * 2.2) + "rem");
    h.style.setProperty("--c", colors[i % colors.length]);
    h.style.setProperty("--o", (far ? .25 : .45 + Math.random() * .3).toFixed(2));
    h.style.setProperty("--b", far ? "1.5px" : "0px");
    h.style.setProperty("--t", (16 + Math.random() * 16) + "s");
    h.style.setProperty("--d", (-Math.random() * 30) + "s");
    h.style.setProperty("--sx", (-60 + Math.random() * 120) + "px");
    layer.appendChild(h);
  }
  $("#warp").after(layer);
}

/* ---------- scroll reveal, progress bar, glass highlight ---------- */
const revealIO = "IntersectionObserver" in window ? new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add("seen"); revealIO.unobserve(e.target); }
}), { threshold: .1, rootMargin: "0px 0px -5% 0px" }) : null;

function addReveal(elements) {
  if (!revealIO) return;
  elements.forEach((el) => { el.classList.add("reveal"); revealIO.observe(el); });
}

function buildScrollFx() {
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.appendChild(bar);
  let lastY = scrollY;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
    const d = Math.abs(scrollY - lastY); lastY = scrollY;
    if (d) warp.kick(Math.min(.006, d * .00005));
    document.documentElement.style.setProperty("--sy", scrollY);
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
  let ticking = false;
  document.addEventListener("pointermove", (e) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const card = activeScreen.querySelector(".stage-inner");
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)) + "%");
        card.style.setProperty("--my", Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)) + "%");
      }
      ticking = false;
    });
  }, { passive: true });
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

buildSpace();
buildHearts();
buildMemoryStack();
buildScrollFx();
addReveal($$(".memory, .envelope, .secret-wrap, .final-note, .postcard, .letter-body p, .stage-lead, .wish-line, .restart-button"));
createFloatingWorld();
setMusicLabel(false);
tryPlayMusic();
document.addEventListener("pointerdown", tryPlayMusic, { once: true, passive: true });
