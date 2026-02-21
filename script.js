/* =========================
   MERKWAARDIGE LIJNEN
   ========================= */

// 1) LEVELS: afbeelding + juiste lijn
const LEVELS = [
  { img: "afbeeldingen/1.jpg",  line: "bissectrice" },
  { img: "afbeeldingen/2.jpg",  line: "hoogtelijn" },
  { img: "afbeeldingen/3.jpg",  line: "middelloodlijn" },
  { img: "afbeeldingen/4.jpg",  line: "zwaartelijn" },
  { img: "afbeeldingen/5.jpg",  line: "hoogtelijn" },
  { img: "afbeeldingen/6.jpg",  line: "bissectrice" },
  { img: "afbeeldingen/7.jpg",  line: "zwaartelijn" },
  { img: "afbeeldingen/8.jpg",  line: "zwaartelijn" },
  { img: "afbeeldingen/9.jpg",  line: "middelloodlijn" },
  { img: "afbeeldingen/10.jpg", line: "middelloodlijn" },
];

// 2) AUDIO-bestanden per lijn
const AUDIO_BY_LINE = {
  hoogtelijn: "audio/1.mp3",
  bissectrice: "audio/2.mp3",
  zwaartelijn: "audio/3.mp3",
  middelloodlijn: "audio/4.mp3",
};

// feedback geluiden (enkel bij lijn-antwoorden)
const sfxCorrect = new Audio("audio/genius.mp3"); // "you're a genius"
const sfxWrong = new Audio("audio/pwa.mp3");      // "pwa pwa"

function playSfx(audioEl) {
  if (!audioEl) return;
  audioEl.pause();
  try { audioEl.currentTime = 0; } catch {}
  audioEl.play().catch(() => {});
}

// 3) “Wat hoor je?” opties
const LISTEN_OPTIONS = [
  { id: "heavy", label: "heavy, zwaar" },
  { id: "twohalves", label: "the other half of me" },
  { id: "highmarch", label: "mars: strak, ordelijk, hoge tonen" },
  { id: "lowmarch", label: "mars:strak, ordelijk, krachtig, symmetrisch" },
];

// 4) Juiste luisteroptie per lijn
const CORRECT_LISTEN_BY_LINE = {
  hoogtelijn: "highmarch",
  middelloodlijn: "lowmarch",
  bissectrice: "twohalves",
  zwaartelijn: "heavy",
};

// 5) Antwoorden voor “Welke merkwaardige lijn?”
const LINE_OPTIONS = [
  { id: "hoogtelijn", label: "hoogtelijn" },
  { id: "bissectrice", label: "bissectrice" },
  { id: "zwaartelijn", label: "zwaartelijn" },
  { id: "middelloodlijn", label: "middelloodlijn" },
];

// -------------------------
// Helpers
// -------------------------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function $(sel) { return document.querySelector(sel); }

function setScreen(id) {
  for (const el of document.querySelectorAll(".screen")) {
    el.classList.remove("screen--active");
  }
  $(id).classList.add("screen--active");
}

function disableLineQuestion(disabled) {
  $("#lineAnswers").querySelectorAll("button").forEach(b => {
    b.disabled = disabled;
  });
}

function resetAnswerButtons(containerEl) {
  containerEl.querySelectorAll("button").forEach(b => {
    b.classList.remove("correct", "wrong");
  });
}

// audio veilig stoppen
function stopAudio() {
  audioPlayer.pause();
  try { audioPlayer.currentTime = 0; } catch {}
}

// -------------------------
// State
// -------------------------
let deck = [];
let idx = 0;
let score = 0;

let lineUnlocked = false;

// “first try” per level, per step
let listenFirstTryStillPossible = true;
let lineFirstTryStillPossible = true;

let currentLevel = null;

// -------------------------
// Elements
// -------------------------
const hudProgress = $("#hudProgress");
const hudScore = $("#hudScore");

const screenStart = "#screenStart";
const screenGame = "#screenGame";
const screenEnd = "#screenEnd";

const btnStart = $("#btnStart");
const btnRestart = $("#btnRestart");

const levelIndexEl = $("#levelIndex");
const levelImage = $("#levelImage");

const btnPlayAudio = $("#btnPlayAudio");
const btnOpenListen = $("#btnOpenListen");

const lineAnswers = $("#lineAnswers");
const btnNext = $("#btnNext");

const listenModal = $("#listenModal");
const listenAnswers = $("#listenAnswers");
const listenStatus = $("#listenStatus");
const btnCloseModal = $("#btnCloseModal");
const btnListenAgain = $("#btnListenAgain");

const audioPlayer = $("#audioPlayer");
const endText = $("#endText");

// -------------------------
// Build UI
// -------------------------
function buildAnswerButtons() {
  // Listen buttons
  listenAnswers.innerHTML = "";
  for (const opt of LISTEN_OPTIONS) {
    const b = document.createElement("button");
    b.className = "answerBtn";
    b.type = "button";
    b.dataset.listenId = opt.id;
    b.textContent = opt.label;
    b.addEventListener("click", () => onListenAnswer(opt.id, b));
    listenAnswers.appendChild(b);
  }

  // Line buttons
  lineAnswers.innerHTML = "";
  for (const opt of LINE_OPTIONS) {
    const b = document.createElement("button");
    b.className = "answerBtn";
    b.type = "button";
    b.dataset.lineId = opt.id;
    b.textContent = opt.label;
    b.addEventListener("click", () => onLineAnswer(opt.id, b));
    lineAnswers.appendChild(b);
  }
}

function updateHud() {
  hudProgress.textContent = `${Math.min(idx + 1, deck.length)}/${deck.length}`;
  hudScore.textContent = `Score: ${score}`;
}

function openListenModal() {
  listenModal.hidden = false;
  listenStatus.textContent = "";
  resetAnswerButtons(listenAnswers);
}

function closeListenModal() {
  listenModal.hidden = true;
}

// -------------------------
// Audio
// -------------------------
function playCurrentAudio() {
  if (!currentLevel) return;
  const src = AUDIO_BY_LINE[currentLevel.line];
  if (!src) return;

  audioPlayer.src = src;
  audioPlayer.currentTime = 0;
  audioPlayer.play().catch(() => {});
}

// -------------------------
// Game flow
// -------------------------
function startGame() {
  deck = shuffle(LEVELS);
  idx = 0;
  score = 0;

  setScreen(screenGame);
  loadLevel();
}

function loadLevel() {
  currentLevel = deck[idx];

  lineUnlocked = false;
  listenFirstTryStillPossible = true;
  lineFirstTryStillPossible = true;

  btnNext.disabled = true;
  disableLineQuestion(true);

  levelIndexEl.textContent = String(idx + 1);
  levelImage.src = currentLevel.img;

  resetAnswerButtons(listenAnswers);
  resetAnswerButtons(lineAnswers);

  listenStatus.textContent = "";
  updateHud();
}

function finishGame() {
  stopAudio();
  setScreen(screenEnd);
  endText.textContent = `Je score is ${score} op ${deck.length}.`;
}

// -------------------------
// Handlers
// -------------------------
function onListenAnswer(answerId, btnEl) {
  if (!currentLevel) return;

  const correct = CORRECT_LISTEN_BY_LINE[currentLevel.line];
  resetAnswerButtons(listenAnswers);

  if (answerId === correct) {
    btnEl.classList.add("correct");
    listenStatus.textContent = "Juist! Nu mag je de lijn kiezen.";

    // ✅ GEEN genius/pwa bij 'Wat hoor je?'
    lineUnlocked = true;
    disableLineQuestion(false);

    setTimeout(() => {
      closeListenModal();
    }, 450);
  } else {
    btnEl.classList.add("wrong");
    listenStatus.textContent = "Fout. Probeer opnieuw.";

    // ✅ GEEN genius/pwa bij 'Wat hoor je?'
    listenFirstTryStillPossible = false;
  }
}

function onLineAnswer(lineId, btnEl) {
  if (!currentLevel) return;
  if (!lineUnlocked) return;

  resetAnswerButtons(lineAnswers);

  if (lineId === currentLevel.line) {
    btnEl.classList.add("correct");

    // ✅ muziek stopt bij juist lijnantwoord
    stopAudio();

    // ✅ enkel hier juist/fout geluid
    playSfx(sfxCorrect);

    const levelPoint = (listenFirstTryStillPossible && lineFirstTryStillPossible) ? 1 : 0;
    score += levelPoint;

    btnNext.disabled = false;
    disableLineQuestion(true);
    updateHud();
  } else {
    btnEl.classList.add("wrong");

    // ✅ enkel hier juist/fout geluid
    playSfx(sfxWrong);

    lineFirstTryStillPossible = false;
  }
}

function nextLevel() {
  stopAudio();

  if (idx < deck.length - 1) {
    idx += 1;
    loadLevel();
  } else {
    finishGame();
  }
}

// -------------------------
// Events wiring
// -------------------------
btnStart.addEventListener("click", startGame);

btnRestart.addEventListener("click", () => {
  stopAudio();
  setScreen(screenStart);
  hudProgress.textContent = "0/10";
  hudScore.textContent = "Score: 0";
});

btnPlayAudio.addEventListener("click", () => {
  playCurrentAudio();
  openListenModal();
});

btnOpenListen.addEventListener("click", openListenModal);
btnListenAgain.addEventListener("click", playCurrentAudio);

btnCloseModal.addEventListener("click", () => {
  stopAudio();
  closeListenModal();
});

listenModal.addEventListener("click", (e) => {
  const t = e.target;
  if (t && t.dataset && t.dataset.close === "1") {
    stopAudio();
    closeListenModal();
  }
});

btnNext.addEventListener("click", nextLevel);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !listenModal.hidden) {
    stopAudio();
    closeListenModal();
  }
});

// Init
buildAnswerButtons();
setScreen(screenStart);
