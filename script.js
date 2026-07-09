
'use strict';

/* ────────────────────────────────────────────────
   CONFIG — Replace with your own API keys.
   OpenWeatherMap: https://openweathermap.org/api  (free tier)
   GNews:          https://gnews.io                (free tier)
──────────────────────────────────────────────── */
const CONFIG = {
  OWM_KEY:   'YOUR_OPENWEATHERMAP_KEY',   // e.g. 'a1b2c3d4e5f6...'
  GNEWS_KEY: 'YOUR_GNEWS_KEY',            // e.g. 'abc123...'
  DEMO_MODE: true,   // Set false when real keys are in place
  UNIT: 'metric',    // 'metric' = °C | 'imperial' = °F
};

/* ────────────────────────────────────────────────
   STATE
──────────────────────────────────────────────── */
const state = {
  unit: 'metric',          // 'metric' | 'imperial'
  theme: 'night',
  category: 'technology',
  weatherData: null,
  particleRAF: null,
  retryCity: null,
};

/* ────────────────────────────────────────────────
   WEATHER CONDITION → THEME MAP
   OpenWeatherMap condition IDs → visual theme
──────────────────────────────────────────────── */
const CONDITION_THEME = {
  // Thunderstorm
  200:'storm',201:'storm',202:'storm',210:'storm',211:'storm',
  212:'storm',221:'storm',230:'storm',231:'storm',232:'storm',
  // Drizzle
  300:'rainy',301:'rainy',302:'rainy',310:'rainy',311:'rainy',
  312:'rainy',313:'rainy',314:'rainy',321:'rainy',
  // Rain
  500:'rainy',501:'rainy',502:'rainy',503:'rainy',504:'rainy',
  511:'snow', 520:'rainy',521:'rainy',522:'rainy',531:'rainy',
  // Snow
  600:'snow',601:'snow',602:'snow',611:'snow',612:'snow',
  613:'snow',615:'snow',616:'snow',620:'snow',621:'snow',622:'snow',
  // Atmosphere (fog, mist, haze, etc.)
  701:'fog',711:'fog',721:'fog',731:'fog',741:'fog',
  751:'fog',761:'fog',762:'fog',771:'fog',781:'storm',
  // Clear
  800:'sunny',
  // Clouds
  801:'partly-cloudy',802:'partly-cloudy',803:'cloudy',804:'cloudy',
};

const THEME_GRADIENT = {
  sunny:           'linear-gradient(160deg,#b34800,#e8780a,#f9c542,#fef3c7)',
  'partly-cloudy': 'linear-gradient(160deg,#132336,#1e3d5c,#336688)',
  cloudy:          'linear-gradient(160deg,#22303c,#3a4d5c,#546170)',
  rainy:           'linear-gradient(160deg,#090f1a,#162233,#243d54)',
  storm:           'linear-gradient(160deg,#030307,#0a0a18,#100e24)',
  snow:            'linear-gradient(160deg,#7a9cb8,#adc4d8,#d2e4ee)',
  fog:             'linear-gradient(160deg,#5e7482,#7e9098,#9eaab4)',
  night:           'linear-gradient(160deg,#010204,#040812,#070e1c)',
};

const THEME_ICON = {
  sunny: '☀️', 'partly-cloudy': '⛅', cloudy: '☁️',
  rainy: '🌧️', storm: '⛈️', snow: '❄️', fog: '🌫️', night: '🌙',
};

/* video sources — host these mp4s on your own CDN or server */
const THEME_VIDEO = {
  sunny:           'videos/sunny.mp4',
  'partly-cloudy': 'videos/cloudy.mp4',
  cloudy:          'videos/cloudy.mp4',
  rainy:           'videos/rainy.mp4',
  storm:           'videos/storm.mp4',
  snow:            'videos/snow.mp4',
  fog:             'videos/fog.mp4',
  night:           'videos/night.mp4',
};

/* ────────────────────────────────────────────────
   DOM REFS
──────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const DOM = {
  sceneBg:       $('scene-bg'),
  sceneVideo:    $('scene-video'),
  particlesCanvas:$('particles-canvas'),
  weatherLoading:$('weather-loading'),
  weatherError:  $('weather-error'),
  errorText:     $('error-text'),
  weatherContent:$('weather-content'),
  cityInput:     $('city-input'),
  cityName:      $('city-name'),
  conditionLabel:$('condition-label'),
  weatherIcon:   $('weather-icon-wrap'),
  tempDisplay:   $('temp-display'),
  tempUnit:      $('temp-unit'),
  humidityVal:   $('humidity-val'),
  windVal:       $('wind-val'),
  feelsVal:      $('feels-val'),
  catPills:      document.querySelectorAll('.cat-pill'),
  newsFeed:      $('news-feed'),
  newsError:     $('news-error'),
  newsErrorText: $('news-error-text'),
  newsClock:     $('news-clock'),
  unitToggle:    $('unit-toggle'),
};

/* ────────────────────────────────────────────────
   THEME ENGINE
──────────────────────────────────────────────── */
function applyTheme(theme) {
  if (state.theme === theme && document.body.dataset.theme === theme) return;
  state.theme = theme;
  document.body.dataset.theme = theme;
  DOM.sceneBg.style.background = THEME_GRADIENT[theme] || THEME_GRADIENT.night;

  /* Video background */
  const src = THEME_VIDEO[theme];
  if (src && DOM.sceneVideo.src !== src) {
    DOM.sceneVideo.classList.remove('visible');
    DOM.sceneVideo.src = src;
    DOM.sceneVideo.load();
    DOM.sceneVideo.addEventListener('canplay', () => {
      DOM.sceneVideo.classList.add('visible');
    }, { once: true });
  }

  /* Particles */
  startParticles(theme);
}

/* ────────────────────────────────────────────────
   PARTICLE ENGINE
──────────────────────────────────────────────── */
function startParticles(theme) {
  const canvas = DOM.particlesCanvas;
  const ctx = canvas.getContext('2d');

  if (state.particleRAF) {
    cancelAnimationFrame(state.particleRAF);
    state.particleRAF = null;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  resizeCanvas(canvas);

  const handlers = {
    rainy:           () => animRain(canvas, ctx, false),
    storm:           () => animRain(canvas, ctx, true),
    snow:            () => animSnow(canvas, ctx),
    night:           () => animStars(canvas, ctx),
    sunny:           () => animDust(canvas, ctx),
    'partly-cloudy': () => animDust(canvas, ctx),
    fog:             () => animFog(canvas, ctx),
  };

  if (handlers[theme]) state.particleRAF = handlers[theme]();
}

function resizeCanvas(canvas) {
  canvas.width  = canvas.parentElement.offsetWidth  || window.innerWidth;
  canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;
}

/* Rain / Storm */
function animRain(canvas, ctx, storm) {
  const count = storm ? 220 : 130;
  const drops = Array.from({ length: count }, () => ({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    len:     storm ? (20 + Math.random() * 28) : (14 + Math.random() * 18),
    speed:   storm ? (14 + Math.random() * 12) : (8 + Math.random() * 7),
    opacity: 0.3 + Math.random() * 0.4,
    angle:   storm ? 0.22 : 0.05,
  }));
  let lightning = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (storm) {
      if (Math.random() < 0.004) lightning = 7 + Math.floor(Math.random() * 5);
      if (lightning > 0) {
        ctx.fillStyle = `rgba(210,210,255,${lightning * 0.035})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        lightning--;
        /* Occasional fork lightning SVG-ish path */
        if (lightning === 6) drawLightningBolt(ctx, canvas);
      }
    }

    drops.forEach(d => {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.angle * d.len, d.y + d.len);
      ctx.strokeStyle = `rgba(160,200,255,${d.opacity})`;
      ctx.lineWidth   = storm ? 1 : 0.75;
      ctx.stroke();
      d.y += d.speed;
      d.x -= storm ? d.speed * 0.18 : 0;
      if (d.y > canvas.height) { d.y = -d.len; d.x = Math.random() * (canvas.width + 100); }
      if (d.x < -20)           { d.x = canvas.width + 20; }
    });
    return state.particleRAF = requestAnimationFrame(draw);
  }
  return draw();
}

function drawLightningBolt(ctx, canvas) {
  const x = canvas.width * (0.2 + Math.random() * 0.6);
  let y = 0;
  ctx.beginPath();
  ctx.moveTo(x, y);
  while (y < canvas.height * 0.7) {
    const nx = x + (Math.random() - 0.5) * 80;
    y += 30 + Math.random() * 40;
    ctx.lineTo(nx, y);
  }
  ctx.strokeStyle = 'rgba(200,220,255,0.9)';
  ctx.lineWidth   = 2;
  ctx.shadowBlur  = 20;
  ctx.shadowColor = 'rgba(180,200,255,0.8)';
  ctx.stroke();
  ctx.shadowBlur  = 0;
}

/* Snow */
function animSnow(canvas, ctx) {
  const flakes = Array.from({ length: 110 }, () => ({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    r:       1.5 + Math.random() * 3.5,
    speed:   0.4 + Math.random() * 1.4,
    opacity: 0.5 + Math.random() * 0.45,
    phase:   Math.random() * Math.PI * 2,
    drift:   (Math.random() - 0.5) * 0.8,
  }));
  let t = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.008;
    flakes.forEach(f => {
      const wobble = Math.sin(t + f.phase) * 1.8;
      ctx.beginPath();
      ctx.arc(f.x + wobble, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
      ctx.fill();
      f.y += f.speed;
      f.x += f.drift * 0.1;
      if (f.y > canvas.height + 10) { f.y = -10; f.x = Math.random() * canvas.width; }
    });
    return state.particleRAF = requestAnimationFrame(draw);
  }
  return draw();
}

/* Stars */
function animStars(canvas, ctx) {
  const stars = Array.from({ length: 200 }, () => ({
    x:      Math.random() * canvas.width,
    y:      Math.random() * canvas.height * 0.75,
    r:      0.4 + Math.random() * 1.8,
    phase:  Math.random() * Math.PI * 2,
    speed:  0.015 + Math.random() * 0.03,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.phase += s.speed;
      const alpha = 0.25 + Math.sin(s.phase) * 0.3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, alpha)})`;
      ctx.fill();
    });
    return state.particleRAF = requestAnimationFrame(draw);
  }
  return draw();
}

/* Dust / sunny */
function animDust(canvas, ctx) {
  const motes = Array.from({ length: 36 }, () => ({
    x:       Math.random() * canvas.width,
    y:       Math.random() * canvas.height,
    r:       0.8 + Math.random() * 2.2,
    vx:      (Math.random() - 0.5) * 0.25,
    vy:      -(0.15 + Math.random() * 0.35),
    opacity: 0.08 + Math.random() * 0.18,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    motes.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,215,80,${m.opacity})`;
      ctx.fill();
      m.x += m.vx;
      m.y += m.vy;
      if (m.y < -10) { m.y = canvas.height + 10; m.x = Math.random() * canvas.width; }
    });
    return state.particleRAF = requestAnimationFrame(draw);
  }
  return draw();
}

/* Fog wisps */
function animFog(canvas, ctx) {
  const wisps = Array.from({ length: 6 }, (_, i) => ({
    x:       (canvas.width / 6) * i,
    y:       canvas.height * (0.3 + Math.random() * 0.4),
    w:       200 + Math.random() * 300,
    h:       60  + Math.random() * 80,
    speed:   0.12 + Math.random() * 0.2,
    opacity: 0.04 + Math.random() * 0.08,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    wisps.forEach(w => {
      const grad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.w / 2);
      grad.addColorStop(0,   `rgba(255,255,255,${w.opacity})`);
      grad.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, w.w / 2, w.h / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      w.x += w.speed;
      if (w.x - w.w / 2 > canvas.width) w.x = -w.w / 2;
    });
    return state.particleRAF = requestAnimationFrame(draw);
  }
  return draw();
}

/* ────────────────────────────────────────────────
   WEATHER API
──────────────────────────────────────────────── */
async function initWeather() {
  showWeatherLoading();
  try {
    const pos = await getGeolocation();
    await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
  } catch (err) {
    /* Location denied or unavailable → fall back to Bengaluru */
    await fetchWeatherByCity('Bengaluru');
  }
}

function getGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('geolocation-unavailable'));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 8000,
      maximumAge: 300000,
    });
  });
}

async function fetchWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.OWM_KEY}&units=${state.unit}`;
  return executeWeatherFetch(url);
}

async function fetchWeatherByCity(city) {
  state.retryCity = city;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${CONFIG.OWM_KEY}&units=${state.unit}`;
  return executeWeatherFetch(url);
}

async function executeWeatherFetch(url) {
  try {
    let data;
    if (CONFIG.DEMO_MODE || CONFIG.OWM_KEY === 'YOUR_OPENWEATHERMAP_KEY') {
      data = buildMockWeather();
    } else {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.status === 404) throw new Error('City not found. Try a different spelling.');
      if (res.status === 401) throw new Error('Invalid API key. Check your OpenWeatherMap key.');
      if (!res.ok)            throw new Error(`Weather service error (${res.status}).`);
      data = await res.json();
    }
    renderWeather(data);
    state.weatherData = data;
  } catch (err) {
    hideWeatherLoading();
    showWeatherError(err.message || 'Unable to load weather. Please try again.');
  }
}

function buildMockWeather() {
  /* Returns realistic mock data varying by hour for demo purposes */
  const h = new Date().getHours();
  const scenarios = [
    { name:'Bengaluru', country:'IN', weather:[{id:800,description:'Clear sky'}],        main:{temp:22,feels_like:21,humidity:68}, wind:{speed:3.2} },
    { name:'Bengaluru', country:'IN', weather:[{id:801,description:'Few clouds'}],        main:{temp:27,feels_like:29,humidity:58}, wind:{speed:4.4} },
    { name:'Bengaluru', country:'IN', weather:[{id:500,description:'Light rain'}],        main:{temp:23,feels_like:22,humidity:84}, wind:{speed:5.8} },
    { name:'Bengaluru', country:'IN', weather:[{id:200,description:'Thunderstorm'}],      main:{temp:21,feels_like:20,humidity:90}, wind:{speed:9.2} },
    { name:'Bengaluru', country:'IN', weather:[{id:600,description:'Light snow'}],        main:{temp: 2,feels_like: 0,humidity:78}, wind:{speed:3.1} },
    { name:'Bengaluru', country:'IN', weather:[{id:741,description:'Fog'}],               main:{temp:18,feels_like:17,humidity:92}, wind:{speed:1.4} },
    { name:'Bengaluru', country:'IN', weather:[{id:803,description:'Broken clouds'}],     main:{temp:25,feels_like:26,humidity:65}, wind:{speed:4.0} },
    { name:'Bengaluru', country:'IN', weather:[{id:800,description:'Clear sky — night'}], main:{temp:20,feels_like:19,humidity:70}, wind:{speed:2.8} },
  ];
  /* Rotate through scenarios across the day */
  return scenarios[Math.floor(h / 3) % scenarios.length];
}

function renderWeather(data) {
  const { name, weather, main, wind } = data;
  const cond = weather[0];
  const condId = cond.id;
  const isNight = !isDaytime();

  /* Resolve theme */
  let theme = CONDITION_THEME[condId] || 'cloudy';
  if (isNight && (theme === 'sunny' || theme === 'partly-cloudy')) theme = 'night';
  applyTheme(theme);

  /* Temperature formatting */
  const tempVal    = Math.round(main.temp);
  const feelsVal   = Math.round(main.feels_like);
  const unitSymbol = state.unit === 'metric' ? '°C' : '°F';
  const windUnit   = state.unit === 'metric' ? 'm/s' : 'mph';

  /* Update DOM */
  DOM.cityName.textContent      = name;
  DOM.conditionLabel.textContent = capitalise(cond.description);
  DOM.tempDisplay.textContent    = tempVal;
  DOM.tempUnit.textContent       = unitSymbol;
  DOM.weatherIcon.textContent    = THEME_ICON[theme] || '🌡️';
  DOM.weatherIcon.setAttribute('aria-label', cond.description);
  DOM.humidityVal.textContent    = main.humidity + '%';
  DOM.windVal.textContent        = wind.speed.toFixed(1) + ' ' + windUnit;
  DOM.feelsVal.textContent       = feelsVal + unitSymbol;

  hideWeatherLoading();
  DOM.weatherContent.classList.add('visible');
}

function isDaytime() {
  const h = new Date().getHours();
  return h >= 6 && h < 20;
}

function capitalise(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

/* Unit toggle */
DOM.unitToggle.addEventListener('click', async () => {
  state.unit = state.unit === 'metric' ? 'imperial' : 'metric';
  DOM.unitToggle.setAttribute('aria-pressed', state.unit === 'imperial');
  DOM.unitToggle.textContent = state.unit === 'metric' ? '°C / °F' : '°F / °C';

  /* Re-fetch with new unit */
  if (!CONFIG.DEMO_MODE && state.weatherData) {
    const { coord } = state.weatherData;
    if (coord) await fetchWeatherByCoords(coord.lat, coord.lon);
  } else {
    /* Demo: just toggle display */
    if (state.weatherData) {
      const tempC = state.weatherData.main.temp;
      const feelsC = state.weatherData.main.feels_like;
      const toF = c => Math.round(c * 9 / 5 + 32);
      if (state.unit === 'imperial') {
        DOM.tempDisplay.textContent = toF(tempC);
        DOM.feelsVal.textContent    = toF(feelsC) + '°F';
        DOM.tempUnit.textContent    = '°F';
        DOM.windVal.textContent     = (state.weatherData.wind.speed * 2.237).toFixed(1) + ' mph';
      } else {
        DOM.tempDisplay.textContent = Math.round(tempC);
        DOM.feelsVal.textContent    = Math.round(feelsC) + '°C';
        DOM.tempUnit.textContent    = '°C';
        DOM.windVal.textContent     = state.weatherData.wind.speed.toFixed(1) + ' m/s';
      }
    }
  }
});

/* Loading / Error helpers */
function showWeatherLoading() {
  DOM.weatherLoading.style.display = 'flex';
  DOM.weatherError.style.display   = 'none';
  DOM.weatherContent.classList.remove('visible');
}
function hideWeatherLoading() {
  DOM.weatherLoading.style.display = 'none';
}
function showWeatherError(msg) {
  DOM.errorText.textContent       = msg;
  DOM.weatherError.style.display  = 'flex';
  DOM.weatherLoading.style.display= 'none';
}

/* ────────────────────────────────────────────────
   NEWS API
──────────────────────────────────────────────── */
const CAT_ICON = {
  technology:'💻', sports:'⚽', business:'📈', health:'🩺', entertainment:'🎬',
};

const BG_PALETTES = [
  'linear-gradient(135deg,#0e1628,#1a2a48)',
  'linear-gradient(135deg,#0f1e2a,#1c3345)',
  'linear-gradient(135deg,#1a0c28,#2e1a4a)',
  'linear-gradient(135deg,#0a1f1c,#163530)',
  'linear-gradient(135deg,#1a1000,#382200)',
];

async function fetchNews(category) {
  state.category = category;
  DOM.newsFeed.setAttribute('aria-busy', 'true');
  showNewsLoading();
  hideNewsError();

  try {
    let articles;
    if (CONFIG.DEMO_MODE || CONFIG.GNEWS_KEY === 'YOUR_GNEWS_KEY') {
      articles = getMockNews(category);
      /* Simulate async latency */
      await new Promise(r => setTimeout(r, 700));
    } else {
      const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&max=10&apikey=${CONFIG.GNEWS_KEY}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`News service error (${res.status}).`);
      const payload = await res.json();
      articles = payload.articles || [];
    }

    if (!articles.length) throw new Error('empty');
    renderNews(articles);
  } catch (err) {
    showNewsError(
      err.message === 'empty'
        ? 'No stories in this category right now. Try another.'
        : 'Couldn\'t load news. Check your GNews API key or connection.'
    );
  } finally {
    DOM.newsFeed.setAttribute('aria-busy', 'false');
  }
}

function getMockNews(category) {
  const pool = {
    technology: [
      { title:'AI Assistants Now Handle 30% of Customer Support Globally', description:'A new industry report shows widespread enterprise adoption of large-language-model tools across banking, retail, and telecoms, with satisfaction scores rivalling human agents.', source:{name:'TechCrunch'}, publishedAt:'2026-06-16T08:30:00Z', image:null, url:'#' },
      { title:'Quantum Computing Breakthrough Promises Faster Drug Discovery', description:'Researchers at MIT demonstrated a 1,024-qubit processor stable at room temperature, opening the door to molecule simulations previously impossible on classical hardware.', source:{name:'Wired'}, publishedAt:'2026-06-16T06:00:00Z', image:null, url:'#' },
      { title:'Europe Passes Landmark AI Liability Directive', description:'The new EU framework requires companies deploying high-risk AI systems to carry mandatory insurance and undergo annual third-party audits starting in 2027.', source:{name:'The Verge'}, publishedAt:'2026-06-15T14:00:00Z', image:null, url:'#' },
      { title:'Foldable Phones Surpass Tablets in Global Shipments for First Time', description:'IDC data shows the foldable segment grew 140% year-on-year, with three major Android OEMs announcing sub-$700 models targeting mass-market consumers.', source:{name:'9to5Google'}, publishedAt:'2026-06-15T10:00:00Z', image:null, url:'#' },
      { title:'Open-Source AI Models Close the Gap With Closed Frontier Systems', description:'Three community-developed models now outperform GPT-4-class benchmarks on reasoning tasks, prompting debate over the commercial viability of proprietary AI.', source:{name:'Ars Technica'}, publishedAt:'2026-06-14T18:00:00Z', image:null, url:'#' },
    ],
    sports: [
      { title:'World Cup Qualifiers: Five Shocks in One Night of Football', description:'Ranked outsiders from Africa and Asia delivered stunning upsets against European sides, reshaping the qualification picture with three rounds still to play.', source:{name:'BBC Sport'}, publishedAt:'2026-06-16T07:00:00Z', image:null, url:'#' },
      { title:'Record $2.4B Transfer Window Sees Top Clubs Reshape Squads', description:'A summer of spending unprecedented in scale has seen 14 players move for fees above €80 million, headlined by two blockbuster cross-league moves.', source:{name:'Sky Sports'}, publishedAt:'2026-06-15T16:00:00Z', image:null, url:'#' },
      { title:'Grand Slam Champion Announces Retirement at 32', description:'The former world number one cited physical demands and a desire for life beyond competition, ending a career with 11 major titles and an Olympic gold.', source:{name:'ESPN'}, publishedAt:'2026-06-15T12:00:00Z', image:null, url:'#' },
      { title:'Cycling\'s Grand Tour Opens With Dramatic Stage One Crash', description:'Several favourites lost significant time after a high-speed incident in the neutralised zone, leaving the general classification wide open on day one.', source:{name:'Cycling Weekly'}, publishedAt:'2026-06-14T20:00:00Z', image:null, url:'#' },
    ],
    business: [
      { title:'Central Banks Signal Coordinated Rate Cuts for Q3', description:'Officials from the Federal Reserve, ECB, and Bank of England indicated alignment on easing cycles after inflation in major economies returned to 2% targets.', source:{name:'Financial Times'}, publishedAt:'2026-06-16T09:00:00Z', image:null, url:'#' },
      { title:'Semiconductor Demand Surges as AI Infrastructure Build-Out Accelerates', description:'TSMC and Samsung reported combined order backlogs exceeding $180 billion, driven by hyperscaler data-centre expansion and automotive electrification.', source:{name:'Reuters'}, publishedAt:'2026-06-16T07:30:00Z', image:null, url:'#' },
      { title:'Green Bonds Hit Record $900B Issuance in First Half of 2026', description:'Sustainable debt markets accelerated sharply as regulatory pressure and investor appetite pushed corporates and sovereigns to fund climate transition projects.', source:{name:'Bloomberg'}, publishedAt:'2026-06-15T12:00:00Z', image:null, url:'#' },
      { title:'Retail Giants Report Diverging Fortunes as Consumers Trade Down', description:'Premium retailers posted declining margins while value-focused chains exceeded analyst expectations, reflecting persistent cost-of-living pressures on households.', source:{name:'WSJ'}, publishedAt:'2026-06-14T18:00:00Z', image:null, url:'#' },
    ],
    health: [
      { title:'New Weekly Injection Reduces LDL Cholesterol by 70% in Trial', description:'Phase III results for a next-generation RNA interference therapy showed superior lipid-lowering versus statins with a manageable side-effect profile.', source:{name:'NEJM'}, publishedAt:'2026-06-16T08:00:00Z', image:null, url:'#' },
      { title:'WHO Declares Mpox Variant No Longer a Global Health Emergency', description:'Vaccination campaigns across 42 countries and improved surveillance contributed to an 89% decline in reported cases over 18 months.', source:{name:'Reuters Health'}, publishedAt:'2026-06-15T10:00:00Z', image:null, url:'#' },
      { title:'Study Links Ultra-Processed Food to Accelerated Brain Ageing', description:'A 20-year longitudinal cohort of 72,000 adults found those in the highest quintile of UPF consumption showed cognitive decline 4.3 years earlier than peers.', source:{name:'The Lancet'}, publishedAt:'2026-06-15T06:00:00Z', image:null, url:'#' },
      { title:'Mental Health Parity Laws Expand Access for 40 Million Americans', description:'New federal rules require insurers to cover inpatient psychiatric care at rates equivalent to medical admissions, ending decades of benefit disparity.', source:{name:'NPR Health'}, publishedAt:'2026-06-14T14:00:00Z', image:null, url:'#' },
    ],
    entertainment: [
      { title:'Streaming Platform Posts First Profitable Quarter After Price Restructure', description:'The move to ad-supported tiers and crackdown on credential sharing produced a swing to profitability, sending shares to a three-year high in after-hours trading.', source:{name:'Variety'}, publishedAt:'2026-06-16T08:00:00Z', image:null, url:'#' },
      { title:'Cannes-Winning Film Breaks Art-House Box-Office Records', description:'The slow-cinema drama earned $44 million worldwide in its opening weekend, the highest-grossing result for a non-English arthouse release in a decade.', source:{name:'Deadline'}, publishedAt:'2026-06-15T16:00:00Z', image:null, url:'#' },
      { title:'Virtual Concert Draws 18 Million Concurrent Viewers Across Platforms', description:'The immersive live experience blended real performers with AI-generated visuals, attracting more viewers than any physical concert in history.', source:{name:'Billboard'}, publishedAt:'2026-06-15T10:00:00Z', image:null, url:'#' },
      { title:'Video Game Adaptation Becomes Most-Watched Series of the Year', description:'Subscribers spent an average of 6.4 hours watching the eight-episode debut season, driving the largest single-week audience for any streaming original.', source:{name:'The Hollywood Reporter'}, publishedAt:'2026-06-14T12:00:00Z', image:null, url:'#' },
    ],
  };
  return pool[category] || pool.technology;
}

function renderNews(articles) {
  DOM.newsFeed.innerHTML = '';

  articles.forEach((article, i) => {
    const card = document.createElement('article');
    card.className = 'news-card' + (i === 0 ? ' featured' : '');
    card.tabIndex  = 0;
    card.setAttribute('role', 'article');
    card.setAttribute('aria-label', article.title);

    const delay = Math.min(i * 80, 400);
    card.style.transitionDelay = delay + 'ms';

    const timeAgo  = formatTimeAgo(article.publishedAt);
    const palette  = BG_PALETTES[i % BG_PALETTES.length];
    const catIcon  = CAT_ICON[state.category] || '📰';
    const safeTitle = esc(article.title);
    const safeSource= esc(article.source?.name || 'Unknown');
    const safeDesc  = article.description ? esc(article.description) : '';
    const safeUrl   = article.url && article.url !== '#' ? esc(article.url) : null;

    card.innerHTML = `
      <div class="news-img-wrap">
        ${article.image
          ? `<img class="news-img" src="${esc(article.image)}" alt="${safeTitle}" loading="lazy"
               onerror="this.parentElement.innerHTML='<div class=\\"news-img-placeholder\\" style=\\"background:${palette}\\" aria-hidden=\\"true\\"><span>${catIcon}</span></div>'">`
          : `<div class="news-img-placeholder" style="background:${palette}" aria-hidden="true"><span>${catIcon}</span></div>`
        }
      </div>
      <div class="news-body">
        <div class="news-meta">
          <span class="news-source">${safeSource}</span>
          <span class="news-date">${timeAgo}</span>
        </div>
        <h3 class="news-card-title">${safeTitle}</h3>
        ${safeDesc ? `<p class="news-desc">${safeDesc}</p>` : ''}
        ${safeUrl
          ? `<a class="news-read-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer"
               aria-label="Read full story: ${safeTitle}">
               Read story
               <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
             </a>`
          : `<span class="news-read-link" style="pointer-events:none">Demo article</span>`
        }
      </div>`;

    /* Keyboard activation */
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.querySelector('a')?.click();
      }
    });

    DOM.newsFeed.appendChild(card);
    cardObserver.observe(card);
  });
}

/* Intersection observer — animate cards in on scroll */
const cardObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

function showNewsLoading() {
  DOM.newsFeed.innerHTML = Array.from({ length: 4 }, () => `
    <div class="skel-card" aria-hidden="true">
      <div class="skel-img skeleton"></div>
      <div class="skel-body">
        <div class="skel-row">
          <div class="skel-line skel-w30 skeleton"></div>
          <div class="skel-line skel-w30 skeleton"></div>
        </div>
        <div class="skel-title skeleton"></div>
        <div class="skel-line skel-w90 skeleton"></div>
        <div class="skel-line skel-w65 skeleton"></div>
        <div class="skel-line skel-w45 skeleton" style="margin-top:4px"></div>
      </div>
    </div>`).join('');
}

function hideNewsError()  { DOM.newsError.style.display = 'none'; }
function showNewsError(msg) {
  DOM.newsFeed.innerHTML       = '';
  DOM.newsErrorText.textContent = msg;
  DOM.newsError.style.display  = 'flex';
}

/* ────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────── */
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'Just now';
  if (m < 60)  return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24)  return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

function updateClock() {
  const now = new Date();
  DOM.newsClock.textContent = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  DOM.newsClock.setAttribute('datetime', now.toISOString());
}

/* ────────────────────────────────────────────────
   EVENT LISTENERS
──────────────────────────────────────────────── */

/* Search — Enter key */
DOM.cityInput.addEventListener('keydown', async e => {
  if (e.key !== 'Enter') return;
  const city = DOM.cityInput.value.trim();
  if (!city) return;
  DOM.weatherContent.classList.remove('visible');
  await fetchWeatherByCity(city);
});

/* Locate button */
$('locate-btn').addEventListener('click', () => {
  DOM.cityInput.value = '';
  initWeather();
});

/* Weather retry */
$('weather-retry').addEventListener('click', () => {
  if (state.retryCity) fetchWeatherByCity(state.retryCity);
  else initWeather();
});

/* News retry */
$('news-retry').addEventListener('click', () => fetchNews(state.category));

/* Category pills */
DOM.catPills.forEach(pill => {
  pill.addEventListener('click', () => {
    DOM.catPills.forEach(p => { p.classList.remove('active'); p.setAttribute('aria-selected','false'); });
    pill.classList.add('active');
    pill.setAttribute('aria-selected','true');
    fetchNews(pill.dataset.cat);
  });
});

/* Resize — refit canvas */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeCanvas(DOM.particlesCanvas);
  }, 200);
});

/* ────────────────────────────────────────────────
   BOOT
──────────────────────────────────────────────── */
updateClock();
setInterval(updateClock, 30000);
initWeather();
fetchNews('technology');
