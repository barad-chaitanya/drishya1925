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
  { src: 'photos/drishya9.jpeg',  caption: 'moonlight 🌙' },
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


/* ── 5. FUN SECTION ── */
window.openFun = function() {
  document.getElementById('funHeartBtn').style.display = 'none';
  document.getElementById('funContent').style.display  = 'block';
};
window.closeFun = function() {
  document.getElementById('funContent').style.display  = 'none';
  document.getElementById('funHeartBtn').style.display = 'inline-block';
};


/* ── 6. MUSIC PLAYERS ── */

// YouTube IFrame API — works on HTTP (Render), not on file://
// If you're testing locally open via a local server (e.g. VS Code Live Server)

let ytApiReady = false;
let player1 = null, player2 = null;
let song1Playing = false, song2Playing = false;

const isLocalFile = location.protocol === 'file:';

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

window.onYouTubeIframeAPIReady = function() {
  ytApiReady = true;

  player1 = new YT.Player('ytPlayer1', {
    height: '1', width: '1',
    videoId: '2Vv-BfVoq4g',
    playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1 },
    events: {
      onReady: () => updateBtn('playBtn1', false),
      onStateChange: (e) => {
        song1Playing = e.data === YT.PlayerState.PLAYING;
        updateBtn('playBtn1', song1Playing);
      }
    }
  });

  player2 = new YT.Player('ytPlayer2', {
    height: '1', width: '1',
    videoId: 'izGwDsrQ1eQ',
    playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1 },
    events: {
      onReady: () => updateBtn('playBtn2', false),
      onStateChange: (e) => {
        song2Playing = e.data === YT.PlayerState.PLAYING;
        updateBtn('playBtn2', song2Playing);
      }
    }
  });
};

function updateBtn(id, playing) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.textContent = playing ? '⏸' : '▶';
  btn.classList.toggle('playing', playing);
}

window.toggleSong1 = function() {
  if (!ytApiReady || !player1) return;
  if (song1Playing) { player1.pauseVideo(); }
  else { if (song2Playing && player2) player2.pauseVideo(); player1.playVideo(); }
};

window.toggleSong2 = function() {
  if (!ytApiReady || !player2) return;
  if (song2Playing) { player2.pauseVideo(); }
  else { if (song1Playing && player1) player1.pauseVideo(); player2.playVideo(); }
};


/* ── 7. LETTER ── */
const LETTER_MESSAGE = `Hey Drishuu,

First of all — happiest birthday my baby. 🌸 May your whole year be as joyful as you deserve.

We've been together for over 7 years now, and after 3 years I finally asked you — that was honestly the scariest and the happiest day of my life. And you said yes. That one yes changed everything.

We've been through so many ups and downs, and the fact that we're still here, still us — that's no small thing. I'm really, truly glad to have someone as understanding as you by my side. I know I fumble sometimes, I overthink everything (yes, like that big fight), and I know it made you cry... it made me cry too. I'm really sorry for that. My mind was in such a fog back then, stress had taken over completely. But I'm so glad that even our hardest fights never touched our long-term goals. Never touched what we are at the core.

I hope we're together till the very end — just like I asked, just like we promised.

And whenever your days feel off or heavy, please remember — you have me. At any time, any hour. I'll always be there to pamper my sweet girl, on the good days and the bad ones both.

You've contributed so much to who I'm becoming, whether you believe it or not. And I'm grateful for every bit of it.

Oh, and baby — I have gifts for you 🎁 I'll give them when we finally meet. And yes, we're absolutely cutting a cake because we are DEFINITELY meeting for the first time soon.

Also — nerd moment, bear with me:
There is no true universal unit of measurement. The only real one is time. So that means... at one point in time I was your pumpkin to your honey, your star to your moon. And that tells me my unit of time is something really sweet and really romantic. I hope that unit stays exactly the same — for this lifetime, and every lifetime after. 🌙

Happy birthday, my kuchupuchu baby. 🌸

yours always,
your pretty/sweet boy — Chaitanya 🤍`;

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
