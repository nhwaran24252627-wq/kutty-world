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
const PORTAL_TRANSITION_MS = 3000;

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
  loader.classList.toggle("portal-active", mode === "portal");
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
  loader.classList.remove("active", "portal-active");
  loader.setAttribute("aria-hidden", "true");
}

function startOpeningLines() {
  const lines = $$(".opening-lines p");
  lines.forEach((line) => line.classList.remove("visible"));
  lines.forEach((line, index) => {
    window.setTimeout(() => line.classList.add("visible"), index * 1000);
  });
}

function revealScreen(destination) {
  activeScreen.hidden = true;
  destination.hidden = false;
  activeScreen = destination;
  document.body.dataset.screen = destination.id;
  window.scrollTo(0, 0);
  if (destination.id === "stage1") startOpeningLines();
  destination.animate(
    [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "translateY(0)" }],
    { duration: 560, easing: "ease-out" }
  );
}

async function goTo(destinationId, isFinalPath = false) {
  if (isTransitioning) return;
  const destination = document.getElementById(destinationId);
  if (!destination || destination === activeScreen) return;

  isTransitioning = true;
  if (destinationId !== "welcome" && activeScreen.id !== "welcome") {
    const words = isFinalPath
      ? ["Nan irukan unnaku for our friendship❄️", "love you as always by your மகன் 🫀", "nan pesunathu hurt panna sorry mannichidu 😓", "Thanks for each and everything yuva❄️"]
      : ["vanga mothereyyy"];
    await showLoader(
      words,
      isFinalPath ? 13000 : PORTAL_TRANSITION_MS,
      isFinalPath,
      isFinalPath ? "final" : "portal"
    );
  }
  revealScreen(destination);
  hideLoader();
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

createFloatingWorld();
setMusicLabel(false);
tryPlayMusic();
document.addEventListener("pointerdown", tryPlayMusic, { once: true, passive: true });
