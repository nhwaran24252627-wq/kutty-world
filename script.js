const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

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

function showLoader(words, duration, showWaitHint = false, mode = "standard") {
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

const zoom = $("#heartZoom");
const zoomHeart = $("svg", zoom);
const zoomText = $(".hz-text", zoom);
const wait = (ms) => new Promise((r) => window.setTimeout(r, ms));
const stageOrder = ["welcome", "stage1", "stage2", "stage3", "stage4", "stage5", "stage6"];

function swapScreen(destination) {
  activeScreen.hidden = true;
  destination.hidden = false;
  activeScreen = destination;
  document.body.dataset.screen = destination.id;
  document.body.style.setProperty("--step", Math.max(0, stageOrder.indexOf(destination.id)));
  window.scrollTo(0, 0);
  if (destination.id === "stage1") startOpeningLines();
}

/* heart pops in with the text, beats, then we zoom inside it and come out on the next page */
async function heartTransition(destination) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const full = Math.max(innerWidth, innerHeight) / 144 * 4.2;
  zoom.classList.add("on");
  zoomHeart.style.transform = "scale(0)";
  zoomText.style.opacity = "0";
  const ease = "cubic-bezier(.2,.8,.2,1)";

  await zoomHeart.animate([{ transform: "scale(0)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }],
    { duration: reduce ? 1 : 650, easing: ease, fill: "forwards" }).finished;
  zoomText.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
    { duration: 450, easing: "ease-out", fill: "forwards" });
  await zoomHeart.animate([{ transform: "scale(1)" }, { transform: "scale(1.14)" }, { transform: "scale(1)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }],
    { duration: reduce ? 1 : 1000, easing: "ease-in-out", fill: "forwards" }).finished;

  zoomText.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: "forwards" });
  await zoomHeart.animate([{ transform: "scale(1)" }, { transform: "scale(" + full + ")" }],
    { duration: reduce ? 1 : 950, easing: "cubic-bezier(.65,0,.9,.4)", fill: "forwards" }).finished;

  swapScreen(destination);
  zoom.style.background = "#c00f26";
  zoomHeart.style.display = "none";
  await zoom.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce ? 1 : 700, easing: "ease-out", fill: "forwards" }).finished;
  zoom.getAnimations().forEach((x) => x.cancel());
  zoomHeart.getAnimations().forEach((x) => x.cancel());
  zoomText.getAnimations().forEach((x) => x.cancel());
  zoomHeart.style.display = "";
  zoom.style.background = "";
  zoom.classList.remove("on");
}

async function goTo(destinationId, isFinalPath = false) {
  if (isTransitioning) return;
  const destination = document.getElementById(destinationId);
  if (!destination || destination === activeScreen) return;
  isTransitioning = true;

  if (isFinalPath) {
    await showLoader(
      ["Nan irukan unnaku for our friendship❄️", "love you as always by your மகன் 🫀", "nan pesunathu hurt panna sorry mannichidu 😓", "Thanks for each and everything yuva❄️"],
      13000, true, "final"
    );
    swapScreen(destination);
    hideLoader();
    destination.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: "ease-out" });
  } else {
    await heartTransition(destination);
  }
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

/* ---------- final page: memories one below another (plain scroll, no captions) ---------- */
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
}

buildSpace();
buildMemoryStack();
createFloatingWorld();
setMusicLabel(false);
tryPlayMusic();
document.addEventListener("pointerdown", tryPlayMusic, { once: true, passive: true });
