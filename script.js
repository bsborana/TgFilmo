/* ===========
   Premium OTT — JSON-driven grid + header stream + 3-step gate + popup timer
   =========== */

const gridEl = document.getElementById("movieGrid");
const liveStripEl = document.getElementById("liveStrip");
const livePlayerEl = document.getElementById("livePlayer");
const viewersCountEl = document.getElementById("viewersCount");
const bitrateEl = document.getElementById("bitrate");
const finalLinkWrapEl = document.getElementById("finalLinkWrap");
const finalLinkEl = document.getElementById("finalLink");

const themeToggleBtn = document.getElementById("themeToggle");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("searchInput");

const popupBackdrop = document.getElementById("popupBackdrop");
const popupClose = document.getElementById("popupClose");
const timerCountEl = document.getElementById("timerCount");
const timerProgressEl = document.getElementById("timerProgress");

const globalLoader = document.getElementById("globalLoader");

// Step buttons
const stepButtons = document.querySelectorAll(".steps .step");

// State
let MOVIES = [];
let CURRENT_MOVIE = null;
let completedSteps = new Set();
let popupTimer = null;
let popupSeconds = 30;

// Bootstrap: simulate global loading
window.addEventListener("load", () => {
  setTimeout(() => {
    globalLoader.style.display = "none";
  }, 600);
  loadMovies();
});

// Fetch movies.json
async function loadMovies() {
  try {
    const res = await fetch("movies.json", { cache: "no-store" });
    const data = await res.json();
    MOVIES = data;
    renderGrid(MOVIES);
    simulateStats();
  } catch (e) {
    console.error("Failed to load movies.json", e);
    gridEl.innerHTML = `<div class="error">Unable to load posters. Check movies.json and hosting CORS.</div>`;
  }
}

// Render cards
function renderGrid(list) {
  gridEl.innerHTML = "";
  list.forEach((m, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img class="poster" src="${m.poster}" alt="Poster" loading="lazy">
      <div class="overlay">
        <span class="cta">Play now</span>
      </div>
    `;
    // Click to play: redirect to header stream section
    card.addEventListener("click", () => {
      playInHeader(m);
      scrollToHeader();
    });
    gridEl.appendChild(card);
  });
}

// Play selected movie in header
function playInHeader(movie) {
  CURRENT_MOVIE = movie;
  livePlayerEl.src = movie.stream; // uses the stream link from JSON
  liveStripEl.classList.add("show");
  resetGate();
}

// Smooth scroll to header
function scrollToHeader() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Reset gate steps when a new movie is selected
function resetGate() {
  completedSteps.clear();
  stepButtons.forEach(btn => {
    const step = Number(btn.dataset.step);
    btn.disabled = step !== 1; // only step 1 enabled initially
  });
  finalLinkWrapEl.classList.add("hidden");
  // If movie provides a "download" in JSON, set it; else dummy
  finalLinkEl.href = (CURRENT_MOVIE?.download) || "#";
}

// Steps click => popup 30s
stepButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    const step = Number(btn.dataset.step);
    openPopup(() => {
      // After popup auto closes (30s), mark step as complete
      completedSteps.add(step);
      // Enable next step
      const next = step + 1;
      const nextBtn = document.querySelector(`.steps .step[data-step="${next}"]`);
      if (nextBtn) nextBtn.disabled = false;

      // If all steps complete, reveal final link
      if (completedSteps.has(1) && completedSteps.has(2) && completedSteps.has(3)) {
        finalLinkWrapEl.classList.remove("hidden");
      }
    });
  });
});

// Popup logic
function openPopup(onDone) {
  // Reset timer
  clearInterval(popupTimer);
  popupSeconds = 30;
  timerCountEl.textContent = String(popupSeconds);
  // Reset ring stroke
  // stroke-dasharray is 100; we move dashoffset from 0 to 100
  let progress = 0;
  timerProgressEl.style.strokeDashoffset = "0";

  popupBackdrop.classList.remove("hidden");
  popupBackdrop.setAttribute("aria-hidden", "false");

  popupTimer = setInterval(() => {
    popupSeconds--;
    progress += (100 / 30);
    timerCountEl.textContent = String(popupSeconds);
    timerProgressEl.style.strokeDashoffset = String(progress);

    if (popupSeconds <= 0) {
      clearInterval(popupTimer);
      closePopup();
      if (typeof onDone === "function") onDone();
    }
  }, 1000);
}

function closePopup() {
  popupBackdrop.classList.add("hidden");
  popupBackdrop.setAttribute("aria-hidden", "true");
  clearInterval(popupTimer);
}

popupClose.addEventListener("click", () => {
  // Manual close: we still consider step incomplete if closed early
  closePopup();
});

// Theme toggle: swap red/blue primary
themeToggleBtn.addEventListener("click", () => {
  const root = document.documentElement;
  const current = getComputedStyle(root).getPropertyValue("--primary").trim();
  if (current === "#e50914") {
    root.style.setProperty("--primary", "#1414e5"); // Blue
  } else {
    root.style.setProperty("--primary", "#e50914"); // Red
  }
});

// Refresh data
refreshBtn.addEventListener("click", async () => {
  globalLoader.style.display = "grid";
  await loadMovies();
  setTimeout(() => (globalLoader.style.display = "none"), 400);
});

// Grid toggle (2/3/4 columns)
document.querySelectorAll(".btn.toggle").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".btn.toggle").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const cols = Number(btn.dataset.grid);
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  });
});

// Basic search by poster URL fragment (no titles used)
searchInput.addEventListener("input", e => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = MOVIES.filter(m => (m.poster || "").toLowerCase().includes(q));
  renderGrid(filtered);
});

// Simulate fluctuating stats (viewers/bitrate)
function simulateStats() {
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  setInterval(() => {
    viewersCountEl.textContent = (rand(1200, 4800)).toLocaleString();
    bitrateEl.textContent = rand(1100, 3800);
  }, 1800);
}
