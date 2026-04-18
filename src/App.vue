<template>
  <RouterView />
  <canvas ref="cursorCanvas" class="cursor-canvas"></canvas>
  <canvas ref="cursorStar" class="cursor-star"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const cursorCanvas = ref(null);
const cursorStar = ref(null);
let ctx = null;
let starCtx = null;
let particules = [];
let animId = null;
let mouse = { x: -100, y: -100 };
let starRotation = 0;

function creerParticule(x, y) {
  const couleurs = [
    "#FFD700",
    "#FFC200",
    "#FFE44D",
    "#FFEC80",
    "#9B59B6",
    "#8E44AD",
    "#A855F7",
    "#C084FC",
    "#ffffff",
  ];
  particules.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2 - Math.random() * 1.5,
    rayon: Math.random() * 5 + 1.5,
    couleur: couleurs[Math.floor(Math.random() * couleurs.length)],
    alpha: 1,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.25,
    type: Math.floor(Math.random() * 3),
    scintille: Math.random() > 0.5,
    scintillePhase: Math.random() * Math.PI * 2,
  });
}

function dessinerEtoile(c, cx, cy, branches, r, rotation) {
  const pas = Math.PI / branches;
  c.beginPath();
  for (let i = 0; i < branches * 2; i++) {
    const radius = i % 2 === 0 ? r : r * 0.4;
    c.lineTo(
      cx + Math.cos(i * pas + rotation) * radius,
      cy + Math.sin(i * pas + rotation) * radius,
    );
  }
  c.closePath();
}

let frame = 0;

function loop() {
  const c = cursorCanvas.value;
  const s = cursorStar.value;
  if (!c || !s) return;
  frame++;

  // --- Traînée ---
  ctx.clearRect(0, 0, c.width, c.height);

  for (const p of particules) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.vx *= 0.98;
    p.alpha -= 0.02;
    p.rotation += p.rotationSpeed;
    if (p.alpha <= 0) continue;

    let a = p.alpha;
    if (p.scintille) a *= 0.7 + 0.3 * Math.sin(frame * 0.3 + p.scintillePhase);

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.shadowColor = p.couleur;
    ctx.shadowBlur = 8;

    if (p.type === 0) {
      dessinerEtoile(ctx, 0, 0, 4, p.rayon, 0);
      ctx.fillStyle = p.couleur;
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      dessinerEtoile(ctx, 0, 0, 4, p.rayon * 0.35, 0);
      ctx.fill();
    } else if (p.type === 1) {
      ctx.beginPath();
      ctx.moveTo(0, -p.rayon * 1.4);
      ctx.lineTo(p.rayon * 0.45, 0);
      ctx.lineTo(0, p.rayon * 1.4);
      ctx.lineTo(-p.rayon * 0.45, 0);
      ctx.closePath();
      ctx.fillStyle = p.couleur;
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.moveTo(0, -p.rayon * 0.5);
      ctx.lineTo(p.rayon * 0.18, 0);
      ctx.lineTo(0, p.rayon * 0.18);
      ctx.lineTo(-p.rayon * 0.18, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.rayon, 0, Math.PI * 2);
      ctx.fillStyle = p.couleur;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-p.rayon * 0.25, -p.rayon * 0.25, p.rayon * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fill();
    }
    ctx.restore();
  }

  particules = particules.filter((p) => p.alpha > 0);

  // --- Curseur étoile ---
  starRotation += 0.04;
  const sw = s.width,
    sh = s.height;
  starCtx.clearRect(0, 0, sw, sh);

  const r = 14;
  starCtx.save();
  starCtx.translate(mouse.x, mouse.y);
  starCtx.rotate(starRotation);

  // Halo
  const glow = starCtx.createRadialGradient(0, 0, 0, 0, 0, r * 2.5);
  glow.addColorStop(0, "rgba(255,215,0,0.5)");
  glow.addColorStop(0.5, "rgba(155,89,182,0.25)");
  glow.addColorStop(1, "rgba(155,89,182,0)");
  starCtx.beginPath();
  starCtx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
  starCtx.fillStyle = glow;
  starCtx.fill();

  // Corps étoile (dégradé jaune → violet)
  const grad = starCtx.createLinearGradient(-r, -r, r, r);
  grad.addColorStop(0, "#FFD700");
  grad.addColorStop(0.5, "#C084FC");
  grad.addColorStop(1, "#7C3AED");
  dessinerEtoile(starCtx, 0, 0, 5, r, 0);
  starCtx.fillStyle = grad;
  starCtx.shadowColor = "#FFD700";
  starCtx.shadowBlur = 12;
  starCtx.fill();

  // Reflet blanc
  dessinerEtoile(starCtx, 0, 0, 5, r * 0.3, 0);
  starCtx.fillStyle = "rgba(255,255,255,0.8)";
  starCtx.shadowBlur = 0;
  starCtx.fill();

  starCtx.restore();

  animId = requestAnimationFrame(loop);
}

function onMouseMove(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  const nb = Math.floor(Math.random() * 2) + 2;
  for (let i = 0; i < nb; i++) creerParticule(mouse.x, mouse.y);
}

function resizeCanvas() {
  [cursorCanvas.value, cursorStar.value].forEach((c) => {
    if (!c) return;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
  });
}

onMounted(() => {
  ctx = cursorCanvas.value.getContext("2d");
  starCtx = cursorStar.value.getContext("2d");
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("mousemove", onMouseMove);
  loop();
});

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId);
  window.removeEventListener("resize", resizeCanvas);
  window.removeEventListener("mousemove", onMouseMove);
});
</script>

<style>
* {
  cursor: none;
}

.cursor-canvas,
.cursor-star {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.cursor-canvas {
  z-index: 9999;
}
.cursor-star {
  z-index: 10000;
}
</style>
