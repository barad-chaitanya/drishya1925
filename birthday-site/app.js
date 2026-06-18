/* ════════════════════════════════════════════
   BIRTHDAY SITE — app.js
   ════════════════════════════════════════════ */

/* ── 1. FALLING PETALS ── */
(function initPetals() {
  const canvas = document.getElementById('petalCanvas');
  const ctx    = canvas.getContext('2d');
  const COLORS = [
    'rgba(249,180,200,0.72)', 'rgba(255,240,245,0.65)',
    'rgba(200,216,240,0.62)', 'rgba(242,168,192,0.55)', 'rgba(220,235,255,0.58)',
  ];
  let W, H, petals = [];
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();
  function Petal() { this.reset(true); }
  Petal.prototype.reset = function(init) {
    this.x = Math.random() * W; this.y = init ? Math.random() * H : -20;
    this.r = 4 + Math.random() * 7; this.vy = 0.6 + Math.random() * 1;
    this.vx = (Math.random() - 0.5) * 0.8; this.rot = Math.random() * Math.PI * 2;
    this.dRot = (Math.random() - 0.5) * 0.04;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.wobble = Math.random() * Math.PI * 2; this.wobbleSpeed = 0.02 + Math.random() * 0.02;
  };
  for (let i = 0; i < 55; i++) petals.push(new Petal());
  function tick() {
    ctx.clearRect(0, 0, W, H);
    petals.forEach(p => {
      p.wobble += p.wobbleSpeed; p.x += p.vx + Math.sin(p.wobble) * 0.5;
      p.y += p.vy; p.rot += p.dRot;
      if (p.y > H + 20) p.reset(false);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.fill(); ctx.restore();
    });
    requestAnimationFrame(tick);
  }
  tick();
})();


/* ── 2. DAYS TOGETHER COUNTER ── */
(function initCounter() {
  const start = new Date(2020, 3, 14); // 14 April 2020
  function update() {
    const s   = Math.floor((Date.now() - start) / 1000);
    const pad = n => String(n).padStart(2, '0');
    const el  = document.getElementById('togetherClock');
    if (el) el.innerHTML =
      `<span class="dnum">${Math.floor(s/86400)}</span> days &nbsp;`+
      `<span class="dnum">${pad(Math.floor(s%86400/3600))}</span> hrs &nbsp;`+
      `<span class="dnum">${pad(Math.floor(s%3600/60))}</span> min &nbsp;`+
      `<span class="dnum">${pad(s%60)}</span> sec`;
  }
  update(); setInterval(update, 1000);
})();


/* ── 3. FLOWER HEART (Garden engine — inspired by ritvikbhatia/LoveProject) ── */
(function initFlowerHeart() {
  function Vector(x, y) { this.x = x; this.y = y; }
  Vector.prototype = {
    rotate(t) {
      const x=this.x,y=this.y;
      this.x=Math.cos(t)*x-Math.sin(t)*y; this.y=Math.sin(t)*x+Math.cos(t)*y; return this;
    },
    mult(f) { this.x*=f; this.y*=f; return this; },
    clone() { return new Vector(this.x, this.y); },
  };

  const rnd    = (a,b) => Math.random()*(b-a)+a;
  const rndInt = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
  const d2r    = a => Math.PI*2/360*a;

  const OPT = { petalCount:{min:6,max:14}, petalStretch:{min:0.1,max:2.8},
                growFactor:{min:0.3,max:1.2}, bloomRadius:{min:10,max:15}, growSpeed:1000/60 };

  function Petal(sA,sB,sa,a,g,bloom) {
    this.sA=sA; this.sB=sB; this.sa=sa; this.a=a; this.g=g; this.bloom=bloom; this.r=1; this.done=false;
  }
  Petal.prototype = {
    draw() {
      const ctx=this.bloom.garden.ctx;
      const v1=new Vector(0,this.r).rotate(d2r(this.sa));
      const v2=v1.clone().rotate(d2r(this.a));
      const v3=v1.clone().mult(this.sA); const v4=v2.clone().mult(this.sB);
      ctx.strokeStyle=this.bloom.color; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.moveTo(v1.x,v1.y);
      ctx.bezierCurveTo(v3.x,v3.y,v4.x,v4.y,v2.x,v2.y); ctx.stroke();
    },
    render() { if(this.r<=this.bloom.r){this.r+=this.g;this.draw();}else{this.done=true;} }
  };

  function Bloom(x,y,r,color,pc,garden) {
    this.x=x; this.y=y; this.r=r; this.color=color; this.garden=garden; this.petals=[];
    const ang=360/pc, start=rndInt(0,90);
    for(let i=0;i<pc;i++) this.petals.push(new Petal(
      rnd(OPT.petalStretch.min,OPT.petalStretch.max),
      rnd(OPT.petalStretch.min,OPT.petalStretch.max),
      start+i*ang, ang, rnd(OPT.growFactor.min,OPT.growFactor.max), this
    ));
    garden.blooms.push(this);
  }
  Bloom.prototype.draw = function() {
    let done=true;
    this.garden.ctx.save(); this.garden.ctx.translate(this.x,this.y);
    for(const p of this.petals){p.render(); if(!p.done)done=false;}
    this.garden.ctx.restore();
    if(done){const i=this.garden.blooms.indexOf(this);if(i>-1)this.garden.blooms.splice(i,1);}
  };

  function Garden(ctx) { this.ctx=ctx; this.blooms=[]; }
  Garden.prototype.render = function() { for(let i=this.blooms.length-1;i>=0;i--)this.blooms[i].draw(); };
  Garden.prototype.createBloom = function(x,y) {
    const r=rndInt(OPT.bloomRadius.min,OPT.bloomRadius.max);
    const pc=rndInt(OPT.petalCount.min,OPT.petalCount.max);
    const pal=[
      `rgba(${rndInt(230,255)},${rndInt(150,195)},${rndInt(175,215)},0.85)`,
      `rgba(${rndInt(215,245)},${rndInt(210,240)},${rndInt(225,255)},0.75)`,
      `rgba(${rndInt(200,230)},${rndInt(175,215)},${rndInt(230,255)},0.78)`,
      `rgba(255,${rndInt(195,225)},${rndInt(215,240)},0.82)`,
      `rgba(${rndInt(210,240)},${rndInt(225,250)},${rndInt(240,255)},0.72)`,
    ];
    new Bloom(x,y,r,pal[rndInt(0,pal.length-1)],pc,this);
  };

  const canvas=document.getElementById('gardenCanvas');
  if(!canvas) return;
  const W=680,H=600; canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d'); ctx.globalCompositeOperation='lighter';
  const garden=new Garden(ctx);
  setInterval(()=>garden.render(), OPT.growSpeed);

  const cx=W/2, cy=H/2-20;
  function heartPt(angle) {
    const t=angle/Math.PI;
    const x=19.5*(16*Math.pow(Math.sin(t),3));
    const y=-20*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));
    return [cx+x, cy+y];
  }

  let started=false;
  const scene=document.getElementById('heartScene');
  if(!scene) return;
  const obs=new IntersectionObserver(entries=>{
    if(started||!entries[0].isIntersecting) return;
    started=true; obs.disconnect();
    let angle=10; const placed=[];
    const timer=setInterval(()=>{
      const pt=heartPt(angle); let ok=true;
      for(const p of placed) if(Math.hypot(p[0]-pt[0],p[1]-pt[1])<OPT.bloomRadius.max*1.5){ok=false;break;}
      if(ok){placed.push(pt);garden.createBloom(pt[0],pt[1]);}
      if(angle>=30){
        clearInterval(timer);
        setTimeout(()=>{ const t=document.getElementById('heartTimer'); if(t)t.style.opacity='1'; },800);
      } else { angle+=0.18; }
    },50);
  },{threshold:0.2});
  obs.observe(scene);
})();


/* ── 4. PHOTO GALLERY ── */
// ➡️ Rename your photos drishya1.jpg … drishya12.jpg and put them in /photos/
const PHOTOS = [
  { src: 'photos/drishya1.jpeg',  caption: 'my favourite 🌸' },
  { src: 'photos/drishya2.jpeg',  caption: 'always her 💗' },
  { src: 'photos/drishya3.jpeg',  caption: 'so pretty 🤍' },
  { src: 'photos/drishya4.jpeg',  caption: 'my girl 🌷' },
  { src: 'photos/drishya5.jpeg',  caption: 'sunshine ☀️' },
  { src: 'photos/drishya6.jpeg',  caption: 'our world 🎮' },
  { src: 'photos/drishya7.jpeg',  caption: 'forever 🌸' },
  { src: 'photos/drishya8.jpeg',  caption: 'babyyy 💌' },
  { src: 'photos/drishya9.jpeg',  caption: 'moony 🌙' },
  { src: 'photos/drishya10.jpeg', caption: 'kuchupuchu 🌸' },
  { src: 'photos/drishya11.jpeg', caption: 'mine ✨' },
  { src: 'photos/drishya12.jpeg', caption: 'always you 💗' },
  { src: 'photos/drishya13.jpeg', caption: 'my moony 🌙' },
  { src: 'photos/drishya14.jpeg', caption: 'pretty girl 🌷' },
  { src: 'photos/drishya15.jpeg', caption: 'my everything 🤍' },
];

let galleryOpen = false;
window.toggleGallery = function() {
  const btn   = document.getElementById('galleryScroll');
  const paper = document.getElementById('photoStripPaper');
  const strip = document.getElementById('photoStrip');
  if (!galleryOpen) {
    galleryOpen = true;
    btn.style.display   = 'none';
    paper.style.display = 'block';
    // build photos only once
    if (strip.children.length === 0) {
      const lightbox    = document.getElementById('lightbox');
      const lightboxImg = document.getElementById('lightboxImg');

      // IntersectionObserver — each card flies in as it enters viewport
      const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const card = entry.target;
            const delay = card.dataset.delay || 0;
            setTimeout(() => card.classList.add('card-visible'), parseInt(delay));
            cardObserver.unobserve(card);
          }
        });
      }, { threshold: 0.12 });

      PHOTOS.forEach((photo, i) => {
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.dataset.delay = i * 55; // stagger per card

        const img = document.createElement('img');
        img.src = photo.src; img.alt = photo.caption; img.loading = 'lazy';

        const cap = document.createElement('div');
        cap.className = 'photo-caption';
        cap.textContent = photo.caption;

        card.appendChild(img);
        card.appendChild(cap);
        card.addEventListener('click', () => {
          lightboxImg.src = photo.src; lightboxImg.alt = photo.caption;
          lightbox.classList.add('open'); document.body.style.overflow = 'hidden';
        });
        strip.appendChild(card);
        cardObserver.observe(card);
      });
    }
  } else {
    galleryOpen = false;
    paper.style.display = 'none';
    btn.style.display   = 'flex';
  }
};

window.closeLightbox = function() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
};


/* ── 4b. VIDEO GALLERY ── */
const VIDEOS = [
  'photos/d1.mp4',  'photos/d2.mp4',  'photos/d3.mp4',
  'photos/d4.mp4',  'photos/d5.mp4',  'photos/d6.mp4',
  'photos/d7.mp4',  'photos/d8.mp4',  'photos/d9.mp4',
  'photos/d10.mp4',
];

let videosBuilt = false;
let videosOpen  = false;

window.toggleVideos = function() {
  const btn   = document.getElementById('videoScroll');
  const paper = document.getElementById('videoPaper');
  const grid  = document.getElementById('videoGrid');

  if (!videosOpen) {
    videosOpen = true;
    btn.style.display   = 'none';
    paper.style.display = 'block';

    // build only once
    if (!videosBuilt) {
      videosBuilt = true;

      const cardObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const card  = entry.target;
            const delay = parseInt(card.dataset.delay) || 0;
            setTimeout(() => card.classList.add('card-visible'), delay);
            cardObs.unobserve(card);
          }
        });
      }, { threshold: 0.1 });

      VIDEOS.forEach((src, i) => {
        const card = document.createElement('div');
        card.className  = 'video-card';
        card.dataset.delay = i * 80;

        const vid = document.createElement('video');
        vid.src        = src;
        vid.preload    = 'metadata';
        vid.controls   = true;
        vid.playsInline = true;
        vid.muted      = true;   // required for autoplay
        vid.loop       = true;
        vid.style.width = '100%';

        // autoplay on scroll into view, pause on scroll out
        const autoObs = new IntersectionObserver((entries) => {
          entries.forEach(e => {
            if (e.isIntersecting) { vid.play().catch(()=>{}); }
            else { vid.pause(); }
          });
        }, { threshold: 0.4 });
        autoObs.observe(vid);

        // pause all others when one starts playing
        vid.addEventListener('play', () => {
          document.querySelectorAll('.video-card video').forEach(v => {
            if (v !== vid && !v.paused) v.pause();
          });
          card.classList.add('playing');
        });
        vid.addEventListener('pause', () => card.classList.remove('playing'));
        vid.addEventListener('ended', () => card.classList.remove('playing'));

        // play overlay
        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';
        const icon = document.createElement('div');
        icon.className = 'video-play-icon';
        icon.textContent = '▶';
        overlay.appendChild(icon);

        // clicking overlay starts video
        overlay.style.pointerEvents = 'all';
        overlay.addEventListener('click', () => { vid.play(); });

        card.appendChild(vid);
        card.appendChild(overlay);
        grid.appendChild(card);
        cardObs.observe(card);
      });
    }

  } else {
    videosOpen = false;
    // pause all videos before hiding
    document.querySelectorAll('.video-card video').forEach(v => v.pause());
    paper.style.display = 'none';
    btn.style.display   = 'flex';
  }
};


/* ── 4c. LOVE CHART ── */
let loveChartAnim = null;
let loveChartValue = 0;

function resizeLoveCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  return dpr;
}

function startLoveChartAnim() {
  const canvas  = document.getElementById('loveLineCanvas');
  const counter = document.getElementById('loveCounter');
  if (!canvas || !counter) return;

  stopLoveChartAnim();
  loveChartValue = 12;
  const points = [{ x: 0, y: 0.88 }];
  const othersY = 0.93;
  let frame = 0;

  const ctx = canvas.getContext('2d');
  const dpr = resizeLoveCanvas(canvas);

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const pad = { l: 8 * dpr, r: 8 * dpr, t: 10 * dpr, b: 8 * dpr };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    frame++;
    if (frame % 2 === 0) {
      loveChartValue += 0.55 + Math.random() * 0.35;
      const y = Math.max(-0.15, 1 - loveChartValue / 70);
      const step = 2.5 * dpr;
      const lastX = points.length ? points[points.length - 1].x : 0;
      points.push({ x: lastX + step, y });

      const maxPts = Math.floor(plotW / step) + 1;
      if (points.length > maxPts) points.shift();
      points.forEach((p, i) => { p.x = i * step; });
    }

    counter.textContent = loveChartValue >= 500 ? '∞%' : Math.floor(loveChartValue) + '%';

    ctx.clearRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = 'rgba(200,180,160,0.35)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const gy = pad.t + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.l, gy);
      ctx.lineTo(pad.l + plotW, gy);
      ctx.stroke();
    }

    const toX = x => pad.l + x;
    const toY = y => pad.t + y * plotH;

    // everyone else — flat line
    ctx.strokeStyle = 'rgba(180,170,160,0.7)';
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.beginPath();
    ctx.moveTo(pad.l, toY(othersY));
    ctx.lineTo(pad.l + plotW, toY(othersY + Math.sin(frame * 0.05) * 0.003));
    ctx.stroke();
    ctx.setLineDash([]);

    // Drishya — rising line + glow
    if (points.length > 1) {
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + plotH);
      grad.addColorStop(0, '#f9a8c0');
      grad.addColorStop(1, '#e880a8');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5 * dpr;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      points.forEach((p, i) => {
        const px = toX(p.x);
        const py = toY(p.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      const end = points[points.length - 1];
      ctx.fillStyle = '#e880a8';
      ctx.beginPath();
      ctx.arc(toX(end.x), toY(end.y), 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(249,168,192,0.35)';
      ctx.beginPath();
      ctx.arc(toX(end.x), toY(end.y), 8 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    loveChartAnim = requestAnimationFrame(draw);
  }

  draw();
}

function stopLoveChartAnim() {
  if (loveChartAnim) {
    cancelAnimationFrame(loveChartAnim);
    loveChartAnim = null;
  }
}

window.openLoveChart = function() {
  const btn   = document.getElementById('loveChartBtn');
  const paper = document.getElementById('loveChartPaper');
  btn.style.display   = 'none';
  paper.style.display = 'block';
  startLoveChartAnim();
};

window.closeLoveChart = function() {
  stopLoveChartAnim();
  const btn   = document.getElementById('loveChartBtn');
  const paper = document.getElementById('loveChartPaper');
  paper.style.display = 'none';
  btn.style.display   = 'block';
  const counter = document.getElementById('loveCounter');
  if (counter) counter.textContent = '0%';
};


/* ── 5. GUESS MY UPRISE + FUN SECTION ── */
let funUnlocked = false;

window.guessUprise = function(color) {
  const msg  = document.getElementById('upriseMsg');
  const card = document.getElementById('upriseCard');
  if (!msg || funUnlocked) return;

  msg.classList.remove('uprise-wrong', 'uprise-success');

  if (color === 'pink') {
    funUnlocked = true;
    const funBtn = document.getElementById('funHeartBtn');
    const tap    = document.getElementById('funTapText');
    if (funBtn) funBtn.classList.remove('fun-locked');
    if (tap) tap.textContent = 'tap to enter';
    if (card) card.classList.add('uprise-done');
    msg.textContent = 'you know me so well 🌸 unlocked!';
    msg.classList.add('uprise-success');
  } else {
    msg.textContent = color === 'white'
      ? 'nope, not white 🤍 try again'
      : 'brown?? really? try again 🌸';
    msg.classList.add('uprise-wrong');
    void msg.offsetWidth;
  }
};

window.openFun = function() {
  if (!funUnlocked) return;
  document.getElementById('funHeartBtn').style.display = 'none';
  document.getElementById('funContent').style.display  = 'block';
};
window.closeFun = function() {
  document.getElementById('funContent').style.display  = 'none';
  document.getElementById('funHeartBtn').style.display = 'inline-block';
  if (player2 && song2Playing) {
    player2.pauseVideo();
    pendingSong2 = false;
  }
  if (player1 && !song1Playing) {
    playSong(player1, player1Ready, v => { pendingSong1 = v; });
  }
};


/* ── 6. MUSIC PLAYERS ── */

// YouTube IFrame API — works on HTTP (Render), not on file://
// If you're testing locally open via a local server (e.g. VS Code Live Server)

let ytApiReady = false;
let player1 = null, player2 = null;
let player1Ready = false, player2Ready = false;
let song1Playing = false, song2Playing = false;
let pendingSong1 = false, pendingSong2 = false;

const isLocalFile = location.protocol === 'file:';
const ytOrigin = location.origin;

function initYouTubePlayers() {
  ytApiReady = true;

  if (document.getElementById('ytPlayer1')) {
    player1 = new YT.Player('ytPlayer1', {
      height: '1', width: '1',
      videoId: '2Vv-BfVoq4g',
      playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1, origin: ytOrigin },
      events: {
        onReady: () => {
          player1Ready = true;
          updateBtn('playBtn1', false);
          if (pendingSong1) { pendingSong1 = false; player1.playVideo(); }
        },
        onStateChange: (e) => {
          song1Playing = e.data === YT.PlayerState.PLAYING;
          updateBtn('playBtn1', song1Playing);
        }
      }
    });
  }

  if (document.getElementById('ytPlayer2')) {
    player2 = new YT.Player('ytPlayer2', {
      height: '1', width: '1',
      videoId: '4UVf7T1lmgo',
      playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1, origin: ytOrigin },
      events: {
        onReady: () => {
          player2Ready = true;
          updateBtn('playBtn2', false);
          if (pendingSong2) { pendingSong2 = false; player2.playVideo(); }
        },
        onStateChange: (e) => {
          song2Playing = e.data === YT.PlayerState.PLAYING;
          updateBtn('playBtn2', song2Playing);
        }
      }
    });
  }
}

window.onYouTubeIframeAPIReady = initYouTubePlayers;

if (isLocalFile) {
  // show a hint on the music bar instead of breaking
  ['playBtn1','playBtn2'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.title = 'Music works after deploying to Render (or use Live Server locally)'; }
  });
  document.querySelectorAll('.music-sub').forEach(el => {
    if (el.textContent.includes('our song')) el.textContent = '▶ works on Render / Live Server';
  });
} else {
  // Load YouTube IFrame API only when served over HTTP
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

function updateBtn(id, playing) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.textContent = playing ? '⏸' : '▶';
  btn.classList.toggle('playing', playing);
}

function playSong(player, ready, setPending) {
  if (!player) return;
  if (!ready) { setPending(true); return; }
  player.playVideo();
}

window.toggleSong1 = function() {
  if (!ytApiReady || !player1) return;
  if (song1Playing) { player1.pauseVideo(); pendingSong1 = false; }
  else {
    if (song2Playing && player2) player2.pauseVideo();
    playSong(player1, player1Ready, v => { pendingSong1 = v; });
  }
};

window.toggleSong2 = function() {
  if (!ytApiReady || !player2) return;
  if (song2Playing) { player2.pauseVideo(); pendingSong2 = false; }
  else {
    if (song1Playing && player1) player1.pauseVideo();
    playSong(player2, player2Ready, v => { pendingSong2 = v; });
  }
};


/* ── 7. LETTER ── */
const LETTER_MESSAGE = `Hey Drishuu,

First of all — happiest birthday my baby. 🌸 May your whole year be as joyful as you deserve.

We've been together for over 7 years now, and after 3 years I finally asked you — that was honestly the scariest and the happiest day of my life. And you said yes. That one yes changed everything.

We've been through so many ups and downs, and the fact that we're still here, still us — that's no small thing. I'm really, truly glad to have someone as understanding as you by my side. I know I fumble sometimes, I overthink everything (yes, like that big fight), and I know it made you cry... it made me cry too. I'm really sorry for that. My mind was in such a fog back then, stress had taken over completely. But I'm so glad that even our hardest fights never touched our long-term goals. Never touched what we are at the core.

I hope we're together till the very end — just like I asked, just like we promised.

And whenever your days feel off or heavy, please remember — you have me. At any time, any hour. I'll always be there to pamper my sweet girl, on the good days and the bad ones both.

You've contributed so much to who I'm becoming, whether you believe it or not. And I'm grateful for every bit of it.

Oh, and baby — I have gifts for you I'll give them when we finally meet. And yes, we're absolutely cutting a cake because we are DEFINITELY meeting for the first time soon.

Also — nerd moment, bear with me:
There is no true universal unit of measurement. The only real one is time. So that means... at one point in time I was your pumpkin to your honey, your star to your moon. And that tells me my unit of time is something really sweet and really romantic. I hope that unit stays exactly the same — for this lifetime, and every lifetime after. 🌙

Happy birthday, my kuchupuchu baby. 🌸

yours always,
pretty/sweet boy — Chaitanya 🤍`;

let letterOpen = false, typingTimer = null;

window.openLetter = function() {
  if (letterOpen) return; letterOpen = true;
  document.getElementById('paperScroll').style.display = 'none';
  document.getElementById('letterPaper').style.display = 'block';
  const el = document.getElementById('letterBody');
  el.innerHTML = ''; let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'cursor'; el.appendChild(cursor);
  function type() {
    if (i < LETTER_MESSAGE.length) {
      el.insertBefore(document.createTextNode(LETTER_MESSAGE[i]), cursor); i++;
      const c = LETTER_MESSAGE[i-1];
      typingTimer = setTimeout(type, c==='\n'?120:(c===','||c==='.')?90:28+Math.random()*18);
    } else { cursor.remove(); }
  }
  type();
};

window.closeLetter = function() {
  if (!letterOpen) return; letterOpen = false;
  clearTimeout(typingTimer);
  document.getElementById('letterPaper').style.display = 'none';
  document.getElementById('paperScroll').style.display = 'flex';
  document.getElementById('letterBody').innerHTML = '';
};


/* ── SPARKLE CURSOR ── */
(function initSparkle() {
  const COLORS = [
    '#f9a8c8','#fbbdd6','#c8d8f4','#dce8f8',
    '#fff0f8','#f9c8d9','#e0c8f4','#fce4ef'
  ];
  let last = 0;

  function spawn(x, y) {
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'sparkle';
      const size = 4 + Math.random() * 7;
      const angle = Math.random() * 360;
      const dist  = 8 + Math.random() * 22;
      const dx = Math.cos(angle * Math.PI / 180) * dist;
      const dy = Math.sin(angle * Math.PI / 180) * dist;
      s.style.cssText = `
        left:${x + dx}px; top:${y + dy}px;
        width:${size}px; height:${size}px;
        background:${COLORS[Math.floor(Math.random() * COLORS.length)]};
        animation-duration:${0.5 + Math.random() * 0.4}s;
      `;
      document.body.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    }
  }

  // throttle to every 40ms so it's not too heavy
  document.addEventListener('mousemove', e => {
    const now = Date.now();
    if (now - last < 40) return;
    last = now;
    spawn(e.clientX, e.clientY);
  });

  // touch support
  document.addEventListener('touchmove', e => {
    const now = Date.now();
    if (now - last < 60) return;
    last = now;
    const t = e.touches[0];
    spawn(t.clientX, t.clientY);
  }, { passive: true });
})();


/* ── FEED CHAITANYA GAME ── */
(function initFeedGame() {

  const FOODS = ['🍓','🍰','🧁','🍩','🍫','🍬','🍭','🍪','🍑','🫐','🍒','🍡'];
  const WIN_SCORE   = 20;
  const MAX_MISSES  = 5;
  const MESSAGES = {
    win:  ["best girlfriend chef ever 🍓"],
    lose: ["baby i'm hungry 🥺", "come back and feed me 😭", "you dont like to feed me huh💔"]
  };

  let score = 0, misses = 0, running = false;
  let spawnTimer = null, tickTimer = null;
  let foods = [];   // { el, x, y, speed }
  let charX = 50;   // % of arena width

  const arena     = document.getElementById('gameArena');
  const charEl    = document.getElementById('gameChar');
  const scoreEl   = document.getElementById('gameScore');
  const livesEl   = document.getElementById('gameLives');
  const startBox  = document.getElementById('gameStart');
  const overBox   = document.getElementById('gameOver');
  const overTitle = document.getElementById('gameOverTitle');
  const overMsg   = document.getElementById('gameOverMsg');
  const mouth     = document.getElementById('charMouth');

  function setChar(x) {
    charX = Math.max(10, Math.min(90, x));
    charEl.style.left = charX + '%';
  }

  function spawnFood() {
    if (!running) return;
    const food = document.createElement('div');
    food.className  = 'food-item';
    food.textContent = FOODS[Math.floor(Math.random() * FOODS.length)];
    const x = 5 + Math.random() * 90; // % horizontal
    food.style.left = x + '%';
    food.style.top  = '-40px';
    arena.appendChild(food);

    const speed = 1.4 + Math.random() * 1.8 + score * 0.04;
    const obj   = { el: food, x, y: -40, speed };
    foods.push(obj);

    food.addEventListener('click', () => catchFood(obj));
    food.addEventListener('touchstart', (e) => {
      e.preventDefault(); catchFood(obj);
    }, { passive: false });
  }

  function catchFood(obj) {
    if (!running || !obj.el.parentNode) return;
    obj.el.remove();
    foods = foods.filter(f => f !== obj);

    score++;
    scoreEl.textContent = score;

    // happy mouth flash
    mouth.textContent = '◡';
    mouth.classList.add('happy');
    setTimeout(() => { mouth.textContent = '‿'; mouth.classList.remove('happy'); }, 400);

    // score pop
    const pop = document.createElement('div');
    pop.className = 'score-pop';
    pop.textContent = '+1 💕';
    pop.style.left  = obj.x + '%';
    pop.style.top   = Math.max(10, obj.y) + 'px';
    arena.appendChild(pop);
    pop.addEventListener('animationend', () => pop.remove());

    if (score >= WIN_SCORE) endGame(true);
  }

  function tick() {
    if (!running) return;
    const arenaH = arena.offsetHeight;

    foods = foods.filter(obj => {
      obj.y += obj.speed;
      obj.el.style.top = obj.y + 'px';

      // check catch zone: bottom 80px + within char X range
      const charPx = (charX / 100) * arena.offsetWidth;
      const foodPx = (obj.x / 100) * arena.offsetWidth;

      if (obj.y >= arenaH - 80 && Math.abs(foodPx - charPx) < 55) {
        // auto-catch when close enough (character "eats" it)
        catchFood(obj);
        return false;
      }

      if (obj.y > arenaH + 10) {
        // missed
        obj.el.remove();
        misses++;
        updateLives();
        if (misses >= MAX_MISSES) { endGame(false); return false; }
        return false;
      }
      return true;
    });
  }

  function updateLives() {
    const hearts = MAX_MISSES - misses;
    livesEl.textContent = '🤍'.repeat(Math.max(0, hearts)) + '🖤'.repeat(misses);
  }

  function endGame(won) {
    running = false;
    clearInterval(spawnTimer);
    clearInterval(tickTimer);
    foods.forEach(f => f.el.remove());
    foods = [];

    const msgs = won ? MESSAGES.win : MESSAGES.lose;
    overTitle.textContent = won ? 'yay!! 🎉' : 'oh no 🥺';
    overMsg.textContent   = msgs[Math.floor(Math.random() * msgs.length)];
    overBox.style.display = 'flex';
  }

  window.startFeedGame = function() {
    score = 0; misses = 0; running = true; foods = [];
    scoreEl.textContent = '0';
    updateLives();
    startBox.style.display = 'none';
    overBox.style.display  = 'none';
    mouth.textContent = '‿';

    // spawn every 1.2s
    spawnTimer = setInterval(spawnFood, 1200);
    // tick every 16ms (~60fps)
    tickTimer  = setInterval(tick, 16);
  };

  // Move character with mouse/touch inside arena
  arena.addEventListener('mousemove', e => {
    if (!running) return;
    const rect = arena.getBoundingClientRect();
    setChar(((e.clientX - rect.left) / rect.width) * 100);
  });
  arena.addEventListener('touchmove', e => {
    if (!running) return;
    const rect = arena.getBoundingClientRect();
    setChar(((e.touches[0].clientX - rect.left) / rect.width) * 100);
  }, { passive: true });

})();
