/* ═══════════════════════════════════════
   BURGER MENU
═══════════════════════════════════════ */
const burger = document.getElementById("burger");
const nav    = document.getElementById("nav");

burger.addEventListener("click", () => {
    nav.classList.toggle("active");
    burger.setAttribute("aria-expanded", nav.classList.contains("active"));
});

nav.querySelectorAll(".nav-link").forEach(link =>
    link.addEventListener("click", () => nav.classList.remove("active"))
);

/* ═══════════════════════════════════════
   NAV ACTIVE AU SCROLL
═══════════════════════════════════════ */
const sections = document.querySelectorAll("section[id]");
const navLinks  = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(s => {
        if (scrollY >= s.offsetTop - 110) current = s.id;
    });
    navLinks.forEach(l => {
        l.classList.remove("active");
        if (l.getAttribute("href") === "#" + current) l.classList.add("active");
    });
});

/* ═══════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════ */
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity  = 1;
            entry.target.style.transform = "translateY(0)";
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll(".profile-card, .project-card, .skill-item").forEach(el => {
    el.style.opacity   = 0;
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    observer.observe(el);
});

/* ═══════════════════════════════════════
   THEME TOGGLE
═══════════════════════════════════════ */
const toggle = document.getElementById("themeToggle");

toggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const isLight = document.body.classList.contains("light");
    toggle.textContent = isLight ? "🌞" : "🌙";
    localStorage.setItem("theme", isLight ? "light" : "dark");
});

window.addEventListener("load", () => {
    if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("light");
        toggle.textContent = "🌞";
    }
});

/* ═══════════════════════════════════════
   JEU — RGO FIGHTER
═══════════════════════════════════════ */
const C   = document.getElementById("gameCanvas");
const ctx = C.getContext("2d");
const W   = C.width;
const H   = C.height;

let state = "idle", score = 0, lives = 3, lvl = 1;
let animId = null, lastShot = 0;
const keys = {};

const P = { x: W / 2 - 18, y: H - 70, w: 36, h: 44, spd: 5.5, inv: false, invT: 0 };
let bullets = [], enemies = [], eBullets = [], particles = [], stars = [];

function mkStars() {
    stars = [];
    for (let i = 0; i < 90; i++) stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.3,
        spd: Math.random() * 1.3 + 0.4,
        op: Math.random() * 0.7 + 0.2
    });
}

function spawnEnemy() {
    const types = [
        { t: "basic", w: 32, h: 24, hp: 1, spd: 1.2 + lvl * 0.18, col: "#ef4444", pts: 10, si: 90 },
        { t: "fast",  w: 24, h: 20, hp: 1, spd: 2.0 + lvl * 0.25, col: "#f97316", pts: 20, si: 70 },
        { t: "tank",  w: 42, h: 32, hp: 3, spd: 0.7 + lvl * 0.08, col: "#8b5cf6", pts: 50, si: 120 }
    ];
    const cfg = types[Math.floor(Math.random() * types.length)];
    enemies.push({ ...cfg, x: Math.random() * (W - cfg.w), y: -cfg.h, ang: 0, st: 0, maxHp: cfg.hp });
}

function explode(x, y, col) {
    for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3.5 + 1;
        particles.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: Math.random() * 4 + 1.5, life: 1, col });
    }
}

function drawPlayer() {
    if (P.inv && Math.floor(Date.now() / 90) % 2 === 0) return;
    ctx.save();
    ctx.translate(P.x + P.w / 2, P.y + P.h / 2);
    const fl = Math.sin(Date.now() / 75) * 5 + 8;
    ctx.fillStyle = "rgba(251,146,60,0.9)";
    ctx.beginPath(); ctx.moveTo(-6, P.h / 2); ctx.lineTo(6, P.h / 2); ctx.lineTo(0, P.h / 2 + fl); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1d4ed8";
    ctx.beginPath(); ctx.moveTo(0, -P.h / 2); ctx.lineTo(-P.w / 2, P.h / 2); ctx.lineTo(0, P.h / 4); ctx.lineTo(P.w / 2, P.h / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath(); ctx.ellipse(0, -4, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = "#38bdf8"; ctx.shadowBlur = 20;
    ctx.restore();
}

function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    e.ang += 0.025;
    ctx.rotate(Math.sin(e.ang) * 0.1);
    ctx.shadowColor = e.col; ctx.shadowBlur = 10;
    ctx.fillStyle = e.col;
    if (e.t === "basic") {
        ctx.beginPath(); ctx.moveTo(0, e.h / 2); ctx.lineTo(-e.w / 2, -e.h / 2); ctx.lineTo(e.w / 2, -e.h / 2); ctx.closePath(); ctx.fill();
    } else if (e.t === "fast") {
        ctx.beginPath(); ctx.moveTo(0, e.h / 2); ctx.lineTo(-e.w / 2, -e.h / 4); ctx.lineTo(0, -e.h / 2); ctx.lineTo(e.w / 2, -e.h / 4); ctx.closePath(); ctx.fill();
    } else {
        ctx.fillRect(-e.w / 2, -e.h / 2, e.w, e.h);
        ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(-e.w / 2, e.h / 2 + 4, e.w, 4);
        ctx.fillStyle = "#ef4444"; ctx.fillRect(-e.w / 2, e.h / 2 + 4, e.w * (e.hp / e.maxHp), 4);
    }
    ctx.restore();
}

function drawHUD() {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, W, 44);
    ctx.font = "bold 12px 'DM Sans',sans-serif";
    ctx.fillStyle = "#38bdf8"; ctx.fillText("SCORE : " + score, 14, 27);
    ctx.fillStyle = "#f97316"; ctx.fillText("LEVEL : " + lvl, W / 2 - 36, 27);
    for (let i = 0; i < lives; i++) {
        ctx.fillStyle = "#38bdf8"; ctx.fillText("♥", W - 26 - (i * 22), 27);
    }
}

function drawIdle() {
    ctx.fillStyle = "#05080f"; ctx.fillRect(0, 0, W, H);
    mkStars();
    stars.forEach(s => {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.op * 0.4})`; ctx.fill();
    });
    ctx.textAlign = "center";
    ctx.font = "bold 26px 'DM Sans',sans-serif"; ctx.fillStyle = "#38bdf8";
    ctx.fillText("RGO FIGHTER", W / 2, H / 2 - 36);
    ctx.font = "14px 'DM Sans',sans-serif"; ctx.fillStyle = "#7dd3fc";
    ctx.fillText("Appuie sur ▶ Démarrer", W / 2, H / 2 + 6);
    ctx.font = "11px 'DM Sans',sans-serif"; ctx.fillStyle = "#475569";
    ctx.fillText("← → ↑ ↓ pour bouger  |  ESPACE pour tirer", W / 2, H / 2 + 36);
    ctx.textAlign = "left";
}

function doGameOver() {
    state = "gameover"; cancelAnimationFrame(animId);
    ctx.fillStyle = "rgba(5,8,15,0.85)"; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.font = "bold 34px 'DM Sans',sans-serif"; ctx.fillStyle = "#ef4444";
    ctx.fillText("GAME OVER", W / 2, H / 2 - 34);
    ctx.font = "15px 'DM Sans',sans-serif"; ctx.fillStyle = "#38bdf8";
    ctx.fillText("Score final : " + score, W / 2, H / 2 + 8);
    ctx.font = "11px 'DM Sans',sans-serif"; ctx.fillStyle = "#475569";
    ctx.fillText("Appuie sur ↺ Rejouer", W / 2, H / 2 + 44);
    ctx.textAlign = "left";
}

function resetGame() {
    score = 0; lives = 3; lvl = 1;
    bullets = []; enemies = []; eBullets = []; particles = [];
    P.x = W / 2 - 18; P.y = H - 70; P.inv = false;
    mkStars(); state = "playing";
    cancelAnimationFrame(animId);
    loop();
}

function shoot() {
    bullets.push({ x: P.x + P.w / 2, y: P.y, spd: 11 });
}

function loop() {
    if (state !== "playing") return;
    animId = requestAnimationFrame(loop);

    ctx.fillStyle = "#05080f"; ctx.fillRect(0, 0, W, H);

    stars.forEach(s => {
        s.y += s.spd;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.op})`; ctx.fill();
    });

    if (Math.random() < 0.013 + lvl * 0.003) spawnEnemy();

    if ((keys.ArrowLeft  || keys.a) && P.x > 0)       P.x -= P.spd;
    if ((keys.ArrowRight || keys.d) && P.x < W - P.w) P.x += P.spd;
    if ((keys.ArrowUp    || keys.w) && P.y > H / 2)   P.y -= P.spd;
    if ((keys.ArrowDown  || keys.s) && P.y < H - P.h) P.y += P.spd;
    if (keys[" "] && Date.now() - lastShot > 190) { shoot(); lastShot = Date.now(); }

    if (P.inv) { P.invT--; if (P.invT <= 0) P.inv = false; }

    bullets = bullets.filter(b => b.y > 0);
    bullets.forEach(b => {
        b.y -= b.spd;
        ctx.save(); ctx.shadowColor = "#38bdf8"; ctx.shadowBlur = 10;
        ctx.fillStyle = "#38bdf8"; ctx.fillRect(b.x - 2, b.y - 12, 4, 14); ctx.restore();
    });

    enemies = enemies.filter(e => e.y < H + 50);
    enemies.forEach(e => {
        e.y += e.spd;
        e.st++;
        if (e.st > e.si) { e.st = 0; eBullets.push({ x: e.x + e.w / 2, y: e.y + e.h, spd: 2.8, col: e.col }); }
        drawEnemy(e);
        bullets.forEach((b, bi) => {
            if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
                e.hp--; bullets.splice(bi, 1); explode(b.x, b.y, e.col);
                if (e.hp <= 0) { score += e.pts; explode(e.x + e.w / 2, e.y + e.h / 2, e.col); enemies.splice(enemies.indexOf(e), 1); }
            }
        });
        if (!P.inv && P.x < e.x + e.w && P.x + P.w > e.x && P.y < e.y + e.h && P.y + P.h > e.y) {
            lives--; P.inv = true; P.invT = 110;
            explode(P.x + P.w / 2, P.y + P.h / 2, "#38bdf8");
            enemies.splice(enemies.indexOf(e), 1);
            if (lives <= 0) { doGameOver(); return; }
        }
    });

    eBullets = eBullets.filter(b => b.y < H);
    eBullets.forEach((b, bi) => {
        b.y += b.spd;
        ctx.save(); ctx.shadowColor = b.col; ctx.shadowBlur = 7;
        ctx.fillStyle = b.col; ctx.fillRect(b.x - 2, b.y, 4, 10); ctx.restore();
        if (!P.inv && b.x > P.x && b.x < P.x + P.w && b.y > P.y && b.y < P.y + P.h) {
            lives--; P.inv = true; P.invT = 110;
            explode(b.x, b.y, "#ef4444"); eBullets.splice(bi, 1);
            if (lives <= 0) { doGameOver(); return; }
        }
    });

    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.04;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.col + "bb"; ctx.fill();
    });

    drawPlayer();
    if (score > lvl * 160) lvl++;
    drawHUD();
}

drawIdle();

document.addEventListener("keydown", e => { keys[e.key] = true;  if (e.key === " ") e.preventDefault(); });
document.addEventListener("keyup",   e => { keys[e.key] = false; });

document.getElementById("btnStart").addEventListener("click", () => {
    if (state === "idle" || state === "gameover") resetGame();
    else if (state === "paused") { state = "playing"; loop(); }
});

document.getElementById("btnPause").addEventListener("click", () => {
    if (state === "playing") {
        state = "paused"; cancelAnimationFrame(animId);
        ctx.fillStyle = "rgba(5,8,15,0.72)"; ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        ctx.font = "bold 22px 'DM Sans',sans-serif"; ctx.fillStyle = "#38bdf8";
        ctx.fillText("PAUSE", W / 2, H / 2); ctx.textAlign = "left";
    } else if (state === "paused") { state = "playing"; loop(); }
});

document.getElementById("btnReset").addEventListener("click", resetGame);

const mL = document.getElementById("mLeft");
const mR = document.getElementById("mRight");
const mS = document.getElementById("mShoot");

mL.addEventListener("touchstart", () => keys.ArrowLeft  = true,  { passive: true });
mL.addEventListener("touchend",   () => keys.ArrowLeft  = false);
mR.addEventListener("touchstart", () => keys.ArrowRight = true,  { passive: true });
mR.addEventListener("touchend",   () => keys.ArrowRight = false);
mS.addEventListener("touchstart", () => {
    if (state === "playing" && Date.now() - lastShot > 190) { shoot(); lastShot = Date.now(); }
}, { passive: true });