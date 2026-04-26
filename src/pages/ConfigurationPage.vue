<template>
  <div class="configuration">
    <canvas ref="starsCanvas" class="stars-canvas"></canvas>
    <div class="grain"></div>

    <h1>Sélection de la musique</h1>

    <div class="carousel-wrapper">
      <button class="carousel-btn" @click="prev">‹</button>
      <div class="carousel-card" v-if="musiques.length">
        <p class="carousel-titre">{{ musiques[index].titre }}</p>
        <p class="carousel-artiste">{{ musiques[index].artiste }}</p>
        <p class="carousel-compteur">{{ index + 1 }} / {{ musiques.length }}</p>
      </div>
      <div class="carousel-card" v-else>
        <p class="carousel-titre">Chargement...</p>
      </div>
      <button class="carousel-btn" @click="next">›</button>
    </div>

    <h1>Choix de la difficulté</h1>

    <div class="difficulte">
      <div
        class="carte carte-diff"
        :class="{ selectionnee: difficulte === 'classique' }"
        @click="difficulte = 'classique'"
      >
        <div class="diff-header">
          <span class="diff-nom">Classique</span>
          <span class="diff-badge badge-classique">NORMAL</span>
        </div>
        <p class="diff-desc">
          Rythme standard avec un nombre de cibles raisonnable. Idéal pour débuter !
        </p>
        <span class="carte-check" v-if="difficulte === 'classique'">✓</span>
      </div>
      <div
        class="carte carte-diff"
        :class="{ selectionnee: difficulte === 'extreme' }"
        @click="difficulte = 'extreme'"
      >
        <div class="diff-header">
          <span class="diff-nom">Extrême</span>
          <span class="diff-badge badge-extreme">HARD</span>
        </div>
        <p class="diff-desc">
          Beaucoup plus de cibles, temps de réaction réduit. Réservé aux joueurs aguerris !
        </p>
        <span class="carte-check" v-if="difficulte === 'extreme'">✓</span>
      </div>
    </div>

    <div class="actions">
      <RouterLink to="/" class="btn-secondary">Retour</RouterLink>
      <RouterLink
        v-if="musiques.length && difficulte"
        :to="{ path: '/jeu', query: { musique: musiques[index].id, difficulte: difficulte } }"
        class="btn-primary"
        >Jouer</RouterLink
      >
      <span v-else class="btn-primary desactive">
        {{ !musiques.length ? "Chargement..." : "Choisis une difficulté" }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const index = ref(0);
const difficulte = ref(null);
const musiques = ref([]);

function prev() {
  index.value = index.value === 0 ? musiques.value.length - 1 : index.value - 1;
}
function next() {
  index.value = index.value === musiques.value.length - 1 ? 0 : index.value + 1;
}

onMounted(async () => {
  const metaRes = await fetch("/audio/musiques.json");
  const meta = await metaRes.json();

  musiques.value = meta.map((m) => ({
    id: m.fichier,
    titre: m.titre,
    artiste: m.artiste,
    fichier: m.fichier,
  }));

  initStars();
  starsCtx = starsCanvas.value.getContext("2d");
  loopStars();
  orbesEl = document.querySelector(".configuration");
  loopOrbes();
  window.addEventListener("resize", resizeStars);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(starsAnimId);
  cancelAnimationFrame(orbesAnimId);
  window.removeEventListener("resize", resizeStars);
});

// ── Étoiles en fond ──
const starsCanvas = ref(null);
let starsCtx = null;
let starsAnimId = null;
let stars = [];

function initStars() {
  const c = starsCanvas.value;
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * c.width,
    y: Math.random() * c.height,
    r: Math.random() * 1.8 + 0.4,
    scintilleSpeed: Math.random() * 0.04 + 0.015,
    phase: Math.random() * Math.PI * 2,
    vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.12,
  }));
}

function loopStars() {
  const c = starsCanvas.value;
  if (!c) return;
  starsCtx.clearRect(0, 0, c.width, c.height);
  const t = performance.now() / 1000;
  for (const s of stars) {
    s.x += s.vx;
    s.y += s.vy;
    if (s.x < 0) s.x = c.width;
    if (s.x > c.width) s.x = 0;
    if (s.y < 0) s.y = c.height;
    if (s.y > c.height) s.y = 0;
    const a = 0.15 + 0.85 * Math.pow(Math.abs(Math.sin(t * s.scintilleSpeed * 60 + s.phase)), 2);
    if (a > 0.75 && s.r > 1.2) {
      const glow = starsCtx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
      glow.addColorStop(0, `rgba(220, 160, 255, ${a * 0.4})`);
      glow.addColorStop(1, `rgba(220, 160, 255, 0)`);
      starsCtx.beginPath();
      starsCtx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
      starsCtx.fillStyle = glow;
      starsCtx.fill();
    }
    starsCtx.beginPath();
    starsCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    starsCtx.fillStyle = `rgba(255, 255, 255, ${a})`;
    starsCtx.fill();
  }
  starsAnimId = requestAnimationFrame(loopStars);
}

function resizeStars() {
  const c = starsCanvas.value;
  if (!c) return;
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  initStars();
}

// ── Orbes en fond ──
let orbesAnimId = null;
let orbesEl = null;
let orbesT = 0;

function loopOrbes() {
  orbesT += 0.003;
  const x1 = 20 + 15 * Math.sin(orbesT * 0.7);
  const y1 = 30 + 12 * Math.cos(orbesT * 0.5);
  const x2 = 80 + 12 * Math.cos(orbesT * 0.4);
  const y2 = 70 + 15 * Math.sin(orbesT * 0.6);
  if (orbesEl) {
    orbesEl.style.background = `
      radial-gradient(ellipse at ${x1}% ${y1}%, rgba(180, 50, 220, 0.6) 0%, transparent 60%),
      radial-gradient(ellipse at ${x2}% ${y2}%, rgba(255, 80, 180, 0.5) 0%, transparent 60%),
      #1a0033
    `;
  }
  orbesAnimId = requestAnimationFrame(loopOrbes);
}
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;800&display=swap");

.configuration {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(180, 50, 220, 0.6) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 70%, rgba(255, 80, 180, 0.5) 0%, transparent 60%), #1a0033;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 2rem;
  padding: 6rem 6rem;
  font-family: "Exo 2", sans-serif;
  position: relative;
  overflow: hidden;
}

.stars-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.045;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 180px 180px;
}

h1 {
  position: relative;
  z-index: 2;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  text-align: center;
  background: linear-gradient(90deg, #e87fff, #ff80c8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.03em;
}

.carousel-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  width: 100%;
  max-width: 700px;
}

.carousel-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 1.1rem 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(200, 100, 255, 0.25);
  border-radius: 14px;
  box-shadow: 0 0 20px rgba(180, 50, 220, 0.08);
  min-height: 80px;
  justify-content: center;
}

.carousel-titre {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-align: center;
}

.carousel-artiste {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: center;
}

.carousel-compteur {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.25);
  margin: 0.3rem 0 0;
  letter-spacing: 0.08em;
}

.carousel-btn {
  background: rgba(140, 40, 180, 0.2);
  border: 1px solid rgba(180, 80, 220, 0.35);
  color: white;
  border-radius: 10px;
  width: 44px;
  height: 44px;
  font-size: 1.6rem;
  cursor: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.2s,
    border-color 0.2s,
    transform 0.15s;
  flex-shrink: 0;
  line-height: 1;
  padding-bottom: 2px;
}

.carousel-btn:hover {
  background: rgba(160, 50, 210, 0.35);
  border-color: rgba(200, 100, 255, 0.55);
  transform: scale(1.08);
}

.difficulte {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: 100%;
  max-width: 700px;
}

.carte-diff {
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.diff-header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.diff-nom {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
}

.diff-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border-radius: 20px;
}

.badge-classique {
  background: rgba(128, 207, 255, 0.2);
  color: #80cfff;
  border: 1px solid rgba(128, 207, 255, 0.4);
}

.badge-extreme {
  background: rgba(255, 68, 68, 0.2);
  color: #ff6666;
  border: 1px solid rgba(255, 68, 68, 0.4);
}

.diff-desc {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.55);
  margin: 0;
  line-height: 1.5;
}

.carte {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.8rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  cursor: none;
  border: 1px solid rgba(255, 255, 255, 0.07);
  transition:
    background 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
  position: relative;
  z-index: 2;
}

.carte:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(200, 100, 255, 0.25);
}

.carte.selectionnee {
  border-color: rgba(200, 100, 255, 0.5);
  background: rgba(180, 50, 220, 0.12);
  box-shadow: 0 0 20px rgba(180, 50, 220, 0.15);
}

.carte-check {
  color: #e87fff;
  font-size: 1.1rem;
  font-weight: 700;
  position: absolute;
  top: 1rem;
  right: 1.2rem;
}

.actions {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: center;
}

.btn-secondary {
  padding: 0.75rem 1.8rem;
  background: rgba(140, 40, 180, 0.15);
  color: rgba(255, 255, 255, 0.85);
  border-radius: 10px;
  border: 1px solid rgba(180, 80, 220, 0.3);
  text-decoration: none;
  text-align: center;
  font-size: 0.95rem;
  font-family: "Exo 2", sans-serif;
  transition:
    background 0.2s,
    color 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
}

.btn-secondary:hover {
  background: rgba(160, 50, 210, 0.28);
  color: white;
  border-color: rgba(200, 100, 255, 0.55);
  box-shadow: 0 0 16px rgba(180, 50, 220, 0.2);
}

.btn-primary {
  padding: 0.75rem 2.2rem;
  background: linear-gradient(135deg, #b432dc, #ff50b4);
  color: white;
  border-radius: 10px;
  border: none;
  text-decoration: none;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  font-family: "Exo 2", sans-serif;
  letter-spacing: 0.04em;
  box-shadow: 0 4px 24px rgba(180, 50, 220, 0.4);
  transition:
    opacity 0.2s,
    transform 0.15s;
}

.btn-primary:hover:not(.desactive) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.btn-primary:active:not(.desactive) {
  transform: translateY(0);
}

.desactive {
  opacity: 0.35;
  cursor: none;
  pointer-events: none;
}
</style>
