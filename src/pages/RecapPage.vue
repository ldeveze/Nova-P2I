<template>
  <div class="recap">
    <canvas ref="starsCanvas" class="stars-canvas"></canvas>
    <div class="grain"></div>

    <h1>Résultats</h1>

    <div class="contenu">
      <div class="colonne-gauche">
        <div class="card">
          <div class="chanson">
            <p class="titre-chanson">{{ titreChanson }}</p>
            <p class="artiste">{{ artisteChanson }}</p>
          </div>
          <div class="separateur"></div>
          <div class="ligne total">
            <span>Cibles touchées</span>
            <span>{{ touchees }} / {{ totalCercles }}</span>
          </div>
          <div class="separateur"></div>
          <div class="ligne miss">
            <span>Miss</span><span>{{ miss }}</span>
          </div>
          <div class="ligne early">
            <span>Early</span><span>{{ early }}</span>
          </div>
          <div class="ligne late">
            <span>Late</span><span>{{ late }}</span>
          </div>
          <div class="ligne good">
            <span>Good</span><span>{{ good }}</span>
          </div>
          <div class="ligne great">
            <span>Great</span><span>{{ great }}</span>
          </div>
          <div class="ligne perfect">
            <span>Perfect</span><span>{{ perfect }}</span>
          </div>
          <div class="ligne combo">
            <span>🌟 Combo max</span><span>{{ comboMax }}</span>
          </div>
        </div>
      </div>

      <div class="colonne-droite">
        <div class="score-final">
          <span class="label-score">Score final</span>
          <span class="valeur-score">{{ score }}</span>
        </div>
        <div class="sauvegarde">
          <input v-model="pseudo" placeholder="Ton pseudo" maxlength="20" />
          <button @click="sauvegarder" :disabled="!pseudo || sauvegarde" class="btn-primary">
            {{ sauvegarde ? "Sauvegardé ✓" : "Sauvegarder mon score" }}
          </button>
          <p v-if="erreur" class="erreur">{{ erreur }}</p>
        </div>
      </div>
    </div>

    <div class="actions">
      <RouterLink
        :to="{ path: '/jeu', query: { musique: musiqueQuery, difficulte: difficulteQuery } }"
        class="btn-primary-link"
        >Rejouer</RouterLink
      >
      <RouterLink to="/scores" class="btn-secondary">Voir les scores</RouterLink>
      <RouterLink to="/" class="btn-secondary">Accueil</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const score = ref(Number(route.query.score) || 0);
const perfect = ref(Number(route.query.perfect) || 0);
const great = ref(Number(route.query.great) || 0);
const good = ref(Number(route.query.good) || 0);
const late = ref(Number(route.query.late) || 0);
const early = ref(Number(route.query.early) || 0);
const miss = ref(Number(route.query.miss) || 0);
const comboMax = ref(Number(route.query.comboMax) || 0);
const totalCercles = ref(Number(route.query.totalCercles) || 0);
const musiqueQuery = route.query.musique || "aroundTheWorld.mp3";
const difficulteQuery = route.query.difficulte || "classique";
const touchees = computed(
  () => perfect.value + great.value + good.value + early.value + late.value,
);

const titreChanson = ref("");
const artisteChanson = ref("");
const pseudo = ref("");
const sauvegarde = ref(false);
const erreur = ref("");

onMounted(async () => {
  const metaRes = await fetch("/audio/musiques.json");
  const meta = await metaRes.json();
  const info = meta.find((m) => m.fichier === musiqueQuery);
  titreChanson.value = info?.titre ?? musiqueQuery.replace(/\.[^.]+$/, "");
  artisteChanson.value = info?.artiste ?? "Artiste inconnu";

  starsCtx = starsCanvas.value.getContext("2d");
  initStars();
  loopStars();
  orbesEl = document.querySelector(".recap");
  loopOrbes();
  window.addEventListener("resize", resizeStars);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(starsAnimId);
  cancelAnimationFrame(orbesAnimId);
  window.removeEventListener("resize", resizeStars);
});

async function sauvegarder() {
  erreur.value = "";
  try {
    const response = await fetch("http://localhost:3000/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudo: pseudo.value,
        score: score.value,
        perfect: perfect.value,
        great: great.value,
        good: good.value,
        late: late.value,
        early: early.value,
        miss: miss.value,
        combo_max: comboMax.value,
        total_cercles: totalCercles.value,
        musique: musiqueQuery,
        difficulte: difficulteQuery,
      }),
    });
    if (!response.ok) throw new Error();
    sauvegarde.value = true;
  } catch {
    erreur.value = "Erreur lors de la sauvegarde, réessaie.";
  }
}

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

.recap {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(180, 50, 220, 0.6) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 70%, rgba(255, 80, 180, 0.5) 0%, transparent 60%), #1a0033;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 3rem;
  padding: 2rem 6rem;
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
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-align: center;
  background: linear-gradient(90deg, #e87fff, #ff80c8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.03em;
  padding: 0.5rem;
}

.contenu {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: center;
  gap: 6rem;
  width: 100%;
}

.colonne-gauche {
  display: flex;
  flex-direction: column;
  flex: 1;
  max-width: 500px;
}

.colonne-droite {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 2.5rem;
  flex: 1;
  max-width: 500px;
  padding-top: 7rem;
}

.card {
  background:
    radial-gradient(ellipse at 10% 15%, rgba(180, 50, 220, 0.12) 0%, transparent 55%),
    radial-gradient(ellipse at 90% 85%, rgba(255, 80, 180, 0.08) 0%, transparent 55%),
    rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(200, 100, 255, 0.2);
  border-radius: 20px;
  padding: 2rem 2.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  box-shadow: 0 0 30px rgba(180, 50, 220, 0.08);
  width: 100%;
}

.chanson {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-bottom: 0.4rem;
}

.titre-chanson {
  font-size: 1.35rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.artiste {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.separateur {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0.2rem 0;
}

.ligne {
  display: flex;
  justify-content: space-between;
  font-size: 1.05rem;
}

.total {
  color: white;
  font-size: 1.15rem;
  font-weight: 700;
}
.miss {
  color: #ff4444;
}
.late {
  color: #aaaaaa;
}

.early {
  color: #aaaaaa;
}

.good {
  color: #80cfff;
}
.great {
  color: #b0ff80;
}
.perfect {
  color: #ffd700;
}
.combo {
  color: #ffd700;
  font-weight: 700;
}

.score-final {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
}

.label-score {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.valeur-score {
  font-size: 5rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1;
}

.sauvegarde {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  width: 75%;
}

input {
  padding: 0.7rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(200, 100, 255, 0.25);
  font-size: 1rem;
  font-family: "Exo 2", sans-serif;
  background: rgba(255, 255, 255, 0.06);
  color: white;
  text-align: center;
  width: 100%;
  outline: none;
  transition:
    border-color 0.2s,
    background 0.2s;
}

input:focus {
  border-color: rgba(200, 100, 255, 0.55);
  background: rgba(255, 255, 255, 0.09);
}

input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.actions {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: row;
  gap: 0.8rem;
  align-items: center;
}

.btn-primary {
  display: block;
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #b432dc, #ff50b4);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: none;
  font-size: 1rem;
  font-weight: 700;
  font-family: "Exo 2", sans-serif;
  letter-spacing: 0.04em;
  box-shadow: 0 4px 24px rgba(180, 50, 220, 0.35);
  transition:
    opacity 0.2s,
    transform 0.15s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: none;
  box-shadow: none;
}

.btn-primary-link {
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

.btn-primary-link:hover {
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

.erreur {
  color: #ff6666;
  font-size: 0.9rem;
  margin: 0;
}
</style>
