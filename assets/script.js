// ------- Data: 30 movies (title + poster) --------
const MOVIES = Array.from({ length: 30 }).map((_, i) => {
  const id = i + 1;
  const title = `Premium Movie ${id}`;
  // Unsplash poster placeholders (cinematic vibe)
  const poster = `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=60&sat=-20&blend=0&${id}`;
  return { id, title, poster };
});

// ------- State -------
let visibleCount = 10; // show 10 -> 20 -> 30 then fake loading
let selectedMovie = null;
let stepsCompleted = 0;

// ------- Elements -------
const moviesGrid = document.getElementById('moviesGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const fakeLoading = document.getElementById('fakeLoading');

const playerSection = document.getElementById('player');
const playerTitle = document.getElementById('playerTitle');
const playerBg = document.getElementById('playerBg');

const stepsSection = document.getElementById('steps');
const step1Btn = document.getElementById('step1');
const step2Btn = document.getElementById('step2');
const step3Btn = document.getElementById('step3');
const finalLinkWrap = document.getElementById('finalLinkWrap');
const finalLink = document.getElementById('finalLink');

const popup = document.getElementById('popup');
const popupTimer = document.getElementById('popupTimer');
const popupClose = document.getElementById('popupClose');

const lastYearEl = document.getElementById('lastYearDownloads');
const liveUsersEl = document.getElementById('liveUsers');
const todayDownloadsEl = document.getElementById('todayDownloads');
const totalDownloadsEl = document.getElementById('totalDownloads');

const watchNowBtn = document.getElementById('watchNowBtn');
const btnPlay = document.getElementById('btnPlay');
const btnVolume = document.getElementById('btnVolume');
const qualityBtns = document.querySelectorAll('.quality-btn');

// ------- Utils -------
const fmt = (n) => n.toLocaleString('en-IN');

// Random integer in range
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Wait helper
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

// ------- Counters: realistic fluctuation every 2-5 sec -------
let lastYear = 100000; // minimum 1 lakh
let liveUsers = randInt(200, 400);
let today = randInt(800, 1600); // can go below/above 1000
let total = 2514320;

function updateCountersOnce() {
  // Slight up/down variations with boundaries
  const lyDelta = randInt(-250, 450);
  const liveDelta = randInt(-20, 30);
  const todayDelta = randInt(-80, 120);
  const totalDelta = randInt(500, 1800);

  lastYear = Math.max(100000, lastYear + lyDelta);
  liveUsers = Math.min(400, Math.max(200, liveUsers + liveDelta));
  today = Math.max(300, today + todayDelta);
  total = Math.max(1000000, total + totalDelta);

  lastYearEl.textContent = fmt(lastYear);
  liveUsersEl.textContent = fmt(liveUsers);
  todayDownloadsEl.textContent = fmt(today);
  totalDownloadsEl.textContent = fmt(total);
}

async function autoFluctuate() {
  while (true) {
    updateCountersOnce();
    const nextIn = randInt(2000, 5000); // 2–5 seconds
    await wait(nextIn);
  }
}
updateCountersOnce();
autoFluctuate();

// ------- Render movies -------
function renderMovies() {
  moviesGrid.innerHTML = '';
  const slice = MOVIES.slice(0, visibleCount);
  slice.forEach((movie) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="poster-wrap">
        <img src="${movie.poster}" alt="${movie.title} poster" loading="lazy">
        <div class="poster-gradient"></div>
      </div>
      <div class="card-body">
        <h4 class="card-title">${movie.title}</h4>
        <div class="card-actions">
          <button class="btn primary" data-id="${movie.id}" data-action="watch">Watch now</button>
          <button class="btn" data-id="${movie.id}" data-action="details">Details</button>
        </div>
      </div>
    `;
    // Click anywhere redirects to header player
    card.addEventListener('click', (e) => {
      // Avoid double handling: if button click, let it handle separately
      const action = e.target?.dataset?.action;
      if (action) return;
      onSelectMovie(movie);
    });

    // Buttons
    card.querySelector('[data-action="watch"]').addEventListener('click', (e) => {
      e.stopPropagation();
      onSelectMovie(movie);
      // Optional: simulate immediate attention to player area
      document.getElementById('top').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    card.querySelector('[data-action="details"]').addEventListener('click', (e) => {
      e.stopPropagation();
      onSelectMovie(movie);
    });

    moviesGrid.appendChild(card);
  });

  // Load more UI
  if (visibleCount < 30) {
    loadMoreBtn.classList.remove('hidden');
    fakeLoading.classList.add('hidden');
  } else {
    loadMoreBtn.classList.remove('hidden'); // still visible for extra click -> fake loading
  }
}

renderMovies();

// ------- Load more logic: 10 -> 20 -> 30 -> fake loading skeleton -------
loadMoreBtn.addEventListener('click', async () => {
  if (visibleCount < 30) {
    visibleCount = Math.min(visibleCount + 10, 30);
    renderMovies();
  } else {
    // Show fake loading skeleton like slow YouTube
    loadMoreBtn.classList.add('hidden');
    fakeLoading.classList.remove('hidden');
    await wait(randInt(1600, 3200));
    fakeLoading.classList.add('hidden');
    loadMoreBtn.classList.remove('hidden');
  }
});

// ------- Selecting a movie: fill header fake player + steps -------
function onSelectMovie(movie) {
  selectedMovie = movie;

  // Update title
  playerTitle.textContent = movie.title;

  // Blurry poster in background
  playerBg.style.background = `
    linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.6)),
    url('${movie.poster}') center/cover no-repeat
  `;
  playerBg.style.filter = 'blur(8px) brightness(0.9)';

  // Reveal player + steps
  playerSection.classList.remove('hidden');
  stepsSection.classList.remove('hidden');

  // Reset steps state
  stepsCompleted = 0;
  setStepsState();

  // Scroll to header (redirect effect)
  document.getElementById('top').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ------- Steps state machine -------
function setStepsState() {
  // Buttons enable/disable by sequence
  step1Btn.classList.toggle('enabled', stepsCompleted === 0);
  step2Btn.classList.toggle('enabled', stepsCompleted === 1);
  step3Btn.classList.toggle('enabled', stepsCompleted === 2);

  step1Btn.classList.toggle('disabled', stepsCompleted !== 0);
  step2Btn.classList.toggle('disabled', stepsCompleted !== 1);
  step3Btn.classList.toggle('disabled', stepsCompleted !== 2);

  // Final link visibility
  finalLinkWrap.classList.toggle('hidden', stepsCompleted < 3);
  if (stepsCompleted >= 3) {
    // Compose a fake final URL unique-ish per movie
    finalLink.href = `https://www.effectivegatecpm.com/vvb3pcread?key=c703d2bb1da414489f22462bffc7b165${selectedMovie?.id || 'x'}?t=${Date.now()}`;
  }
}

// Each step opens a new tab and shows popup with 30s timer
function handleStepClick(stepIndex) {
  // Enforce sequence
  if (stepIndex !== stepsCompleted) return;

  // Open new tab link (fake/sponsored)
  const url = `https://www.effectivegatecpm.com/vvb3pcread?key=c703d2bb1da414489f22462bffc7b165/step${stepIndex + 1}`;
  window.open(url, '_blank', 'noopener');

  // Show popup with 30s timer
  showPopup(30).then(() => {
    stepsCompleted += 1;
    setStepsState();
  });
}

step1Btn.addEventListener('click', () => handleStepClick(0));
step2Btn.addEventListener('click', () => handleStepClick(1));
step3Btn.addEventListener('click', () => handleStepClick(2));

function showPopup(seconds) {
  return new Promise((resolve) => {
    popup.classList.remove('hidden');
    popupClose.classList.remove('enabled');
    popupClose.disabled = true;

    let remaining = seconds;
    popupTimer.textContent = remaining;

    const interval = setInterval(() => {
      remaining -= 1;
      popupTimer.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(interval);
        popupClose.classList.add('enabled');
        popupClose.disabled = false;
      }
    }, 1000);

    const closeHandler = () => {
      if (popupClose.disabled) return; // not yet
      popup.classList.add('hidden');
      popupClose.removeEventListener('click', closeHandler);
      resolve();
    };
    popupClose.addEventListener('click', closeHandler);
  });
}

// ------- Fake player small interactions -------
btnPlay.addEventListener('click', () => {
  // Toggle play icon to pause briefly (visual only)
  btnPlay.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/>
    </svg>
  `;
  setTimeout(() => {
    btnPlay.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M8 5v14l11-7-11-7z" fill="currentColor"/>
      </svg>
    `;
  }, randInt(800, 1800));
});

btnVolume.addEventListener('click', () => {
  btnVolume.classList.toggle('muted');
  btnVolume.style.opacity = btnVolume.classList.contains('muted') ? '0.6' : '1';
});

qualityBtns.forEach((qb) => {
  qb.addEventListener('click', () => {
    qualityBtns.forEach((x) => x.classList.remove('active'));
    qb.classList.add('active');
  });
});

// Watch now button scrolls to steps
watchNowBtn.addEventListener('click', () => {
  document.getElementById('top').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
