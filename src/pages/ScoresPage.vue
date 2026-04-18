<template>
  <div class="scores">
    <canvas ref="starsCanvas" class="stars-canvas"></canvas>
    <div class="grain"></div>

    <div class="header">
      <h1>Classement</h1>

      <div class="selector">
        <button class="carousel-btn" @click="prev">‹</button>

        <div class="selector-card">
          <p class="selector-titre">{{ current.titre }}</p>
          <p class="selector-artiste">{{ current.artiste }}</p>
          <span class="selector-diff" :class="current.difficulte">
            {{ current.difficulte === "extreme" ? "HARD" : "NORMAL" }}
          </span>
        </div>

        <button class="carousel-btn" @click="next">›</button>
      </div>
    </div>

    <div class="tableau-wrapper">
      <table v-if="scoresFiltres.length">
        <thead>
          <tr>
            <th></th>
            <th>Pseudo</th>
            <th>Score</th>
            <th>Cibles touchées</th>
            <th>Perfect</th>
            <th>Combo max</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, i) in scoresFiltres" :key="s.id" :class="{ podium: i < 3 }">
            <td class="rang">
              <span v-if="i === 0">🥇</span>
              <span v-else-if="i === 1">🥈</span>
              <span v-else-if="i === 2">🥉</span>
              <span v-else class="rang-num">{{ i + 1 }}</span>
            </td>
            <td class="pseudo">{{ s.pseudo }}</td>
            <td class="score-val" :class="{ top: i === 0, negatif: s.score < 0 }">{{ s.score }}</td>
            <td class="touches">
              {{ s.perfect + s.great + s.good + (s.early ?? 0) + s.late }} / {{ s.total_cercles }}
            </td>
            <td class="perfect-val">{{ s.perfect }}</td>
            <td class="combo-val">{{ s.combo_max }}</td>
            <td class="date">{{ new Date(s.created_at).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="vide">Aucun score pour cette sélection.</p>
    </div>

    <div class="actions">
      <RouterLink to="/configuration" class="btn-primary">Jouer</RouterLink>
      <RouterLink to="/" class="btn-secondary">Accueil</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const scores = ref([]);
const meta = ref([]);
const index = ref(0);

// Toutes les combinaisons musique+difficulté qui ont des scores
const combinaisons = computed(() => {
  const map = new Map();
  for (const s of scores.value) {
    const key = `${s.musique}__${s.difficulte}`;
    if (!map.has(key)) {
      const info = meta.value.find((m) => m.fichier === s.musique);
      map.set(key, {
        musique: s.musique,
        difficulte: s.difficulte,
        titre: info?.titre ?? s.musique?.replace(/\.[^.]+$/, "") ?? "Inconnu",
        artiste: info?.artiste ?? "Artiste inconnu",
      });
    }
  }
  return [...map.values()];
});

const current = computed(
  () => combinaisons.value[index.value] ?? { titre: "—", artiste: "—", difficulte: "classique" },
);

const scoresFiltres = computed(() =>
  scores.value.filter(
    (s) => s.musique === current.value.musique && s.difficulte === current.value.difficulte,
  ),
);

function prev() {
  index.value = index.value === 0 ? combinaisons.value.length - 1 : index.value - 1;
}
function next() {
  index.value = index.value === combinaisons.value.length - 1 ? 0 : index.value + 1;
}

onMounted(async () => {
  const [resScores, resMeta] = await Promise.all([
    fetch("http://localhost:3000/scores"),
    fetch("/audio/musiques.json"),
  ]);
  scores.value = await resScores.json();
  meta.value = await resMeta.json();

  starsCtx = starsCanvas.value.getContext("2d");
  initStars();
  loopStars();
  orbesEl = document.querySelector(".scores");
  loopOrbes();
  window.addEventListener("resize", resizeStars);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(starsAnimId);
  cancelAnimationFrame(orbesAnimId);
  window.removeEventListener("resize", resizeStars);
});

// ── Étoiles ──
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

// ── Orbes ──
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

.scores {
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
  padding: 3rem 6rem;
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

/* ── Header ── */
.header {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-align: center;
  background: linear-gradient(90deg, #e87fff, #ff80c8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.03em;
}

/* ── Selector musique ── */
.selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 600px;
}

.selector-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.9rem 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(200, 100, 255, 0.25);
  border-radius: 14px;
  box-shadow: 0 0 20px rgba(180, 50, 220, 0.08);
}

.selector-titre {
  font-size: 1rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-align: center;
}

.selector-artiste {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: center;
}

.selector-diff {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border-radius: 20px;
  margin-top: 0.2rem;
}

.selector-diff.classique {
  background: rgba(128, 207, 255, 0.2);
  color: #80cfff;
  border: 1px solid rgba(128, 207, 255, 0.4);
}

.selector-diff.extreme {
  background: rgba(255, 68, 68, 0.2);
  color: #ff6666;
  border: 1px solid rgba(255, 68, 68, 0.4);
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

/* ── Tableau ── */
.tableau-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 960px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead tr {
  background: rgba(200, 100, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

th {
  padding: 1rem 1.2rem;
  text-align: left;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  font-family: "Exo 2", sans-serif;
}

tbody tr {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.15s;
}

tbody tr.podium {
  background: rgba(255, 215, 0, 0.04);
}

td {
  padding: 0.95rem 1.2rem;
  font-size: 1rem;
}

.rang {
  font-size: 1.3rem;
}
.rang-num {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.35);
}
.pseudo {
  font-weight: 700;
  color: white;
}
.score-val {
  color: #b0ff80;
  font-weight: 700;
}
.score-val.top {
  color: #ffd700;
  font-size: 1.1rem;
}
.score-val.negatif {
  color: #ff4444;
}
.touches {
  color: rgba(255, 255, 255, 0.7);
}
.perfect-val {
  color: #ffd700;
  font-weight: 600;
}
.combo-val {
  color: #80cfff;
}
.date {
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.88rem;
}

.vide {
  padding: 3rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.95rem;
}

/* ── Actions ── */
.actions {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: row;
  gap: 0.8rem;
  align-items: center;
}

.btn-primary {
  padding: 0.75rem 2.2rem;
  background: linear-gradient(135deg, #b432dc, #ff50b4);
  color: white;
  border-radius: 10px;
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

.btn-primary:hover {
  opacity: 0.88;
  transform: translateY(-1px);
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
</style>
