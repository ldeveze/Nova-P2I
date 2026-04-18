<template>
  <div class="accueil">
    <canvas ref="starsCanvas" class="stars-canvas"></canvas>

    <div class="zonelogo">
      <img src="/nova-logo.png" alt="Nova" class="logo" />
    </div>

    <div class="menu">
      <RouterLink to="/configuration" class="btn-primary">Jouer</RouterLink>
      <RouterLink to="/scores" class="btn-secondary">Meilleurs scores</RouterLink>
      <a href="#" class="btn-secondary" @click.prevent="showTuto = true">Comment jouer ?</a>
    </div>

    <!-- Pop-up Tutoriel -->
    <Transition name="modal">
      <div v-if="showTuto" class="modal-backdrop" @click.self="showTuto = false">
        <div class="modal">
          <button class="modal-close" @click="showTuto = false" aria-label="Fermer">✕</button>

          <h2 class="modal-title">Comment jouer ?</h2>

          <div class="steps">
            <div class="step">
              <div class="step-visual">
                <div class="demo-circle">
                  <div class="demo-ring"></div>
                </div>
              </div>
              <div class="step-text">
                <h3>Clique sur les cibles</h3>
                <p>
                  Des cercles apparaissent sur l'écran en rythme avec la musique. Un anneau se
                  rétrécit autour de chaque cible : clique au moment précis où l'anneau les touche.
                </p>
              </div>
            </div>

            <div class="step">
              <div class="step-visual timings">
                <span class="badge perfect">PERFECT</span>
                <span class="badge great">GREAT</span>
                <span class="badge good">GOOD</span>
                <span class="badge miss">MISS</span>
              </div>
              <div class="step-text">
                <h3>Reste dans le timing</h3>
                <p>
                  Plus tu cliques au bon moment, plus tu gagnes de points. Un clic parfaitement
                  synchronisé rapporte <strong>500 pts</strong>. Rater une cible te coûte
                  <strong>-50 pts</strong>.
                </p>
              </div>
            </div>

            <div class="step">
              <div class="step-visual combo-visual">
                <div class="combo-stars">
                  <span class="star s1">🌟</span>
                  <span class="star s2">🌟</span>
                  <span class="star s3">🌟</span>
                </div>
                <div class="combo-label">Combo x3 <span class="bonus">(+25 bonus)</span></div>
              </div>
              <div class="step-text">
                <h3>Enchaîne les PERFECT</h3>
                <p>
                  Après <strong>3 PERFECT consécutifs</strong>, tu entres en mode Combo et chaque
                  frappe parfaite rapporte un bonus croissant. La série s'arrête dès qu'un coup
                  n'est pas parfait !
                </p>
              </div>
            </div>
          </div>

          <button class="modal-btn" @click="showTuto = false">C'est parti !</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const showTuto = ref(false);

// ── Étoiles flottantes création ──
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
    alpha: Math.random(),
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
    // Déplacement
    s.x += s.vx;
    s.y += s.vy;

    // Rebond sur les bords
    if (s.x < 0) s.x = c.width;
    if (s.x > c.width) s.x = 0;
    if (s.y < 0) s.y = c.height;
    if (s.y > c.height) s.y = 0;

    // Scintillement
    const a = 0.15 + 0.85 * Math.pow(Math.abs(Math.sin(t * s.scintilleSpeed * 60 + s.phase)), 2);

    // Halo sur les étoiles les plus brillantes
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

// ── Orbes animés en fond ──
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

onMounted(() => {
  starsCtx = starsCanvas.value.getContext("2d");
  initStars();
  loopStars();
  window.addEventListener("resize", resizeStars);

  orbesEl = document.querySelector(".accueil");
  loopOrbes();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(starsAnimId);
  cancelAnimationFrame(orbesAnimId);
  window.removeEventListener("resize", resizeStars);
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Exo+2:wght@400;600;700;800&display=swap");

.accueil {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(180, 50, 220, 0.6) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 70%, rgba(255, 80, 180, 0.5) 0%, transparent 60%), #1a0033;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rem;
  font-family: "Exo 2", sans-serif;
  position: relative;
  overflow: hidden;
}

/* ── Étoiles ── */
.stars-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.zonelogo {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

/* ── Logo pulse ── */
.logo {
  width: 600px;
  animation: logo-pulse 2.8s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%,
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 20px rgba(180, 50, 220, 0.5))
      drop-shadow(0 0 40px rgba(180, 50, 220, 0.25));
  }
  50% {
    transform: scale(1.035);
    filter: drop-shadow(0 0 35px rgba(255, 80, 180, 0.85))
      drop-shadow(0 0 70px rgba(255, 80, 180, 0.4)) drop-shadow(0 0 100px rgba(180, 50, 220, 0.3));
  }
}

.menu {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  max-width: 300px;
}

/* ── Bouton principal ── */
.btn-primary {
  width: 100%;
  padding: 0.95rem 2rem;
  background: linear-gradient(135deg, #b432dc, #ff50b4);
  color: white;
  border-radius: 10px;
  text-decoration: none;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  font-family: "Exo 2", sans-serif;
  letter-spacing: 0.04em;
  box-shadow: 0 4px 28px rgba(180, 50, 220, 0.45);
  transition:
    opacity 0.2s,
    transform 0.15s;
}

.btn-primary:hover {
  opacity: 0.88;
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

/* ── Boutons secondaires ── */
.btn-secondary {
  width: 100%;
  padding: 0.85rem 2rem;
  background: rgba(140, 40, 180, 0.5);
  color: rgba(255, 255, 255, 0.85);
  border-radius: 10px;
  border: 1px solid rgba(180, 80, 220, 0.3);
  text-decoration: none;
  text-align: center;
  font-size: 1rem;
  font-family: "Exo 2", sans-serif;
  cursor: none;
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

/* ── Backdrop ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 0, 25, 0.8);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

/* ── Modal ── */
.modal {
  position: relative;
  background:
    radial-gradient(ellipse at 10% 20%, rgba(180, 50, 220, 0.35) 0%, transparent 55%),
    radial-gradient(ellipse at 90% 80%, rgba(255, 80, 180, 0.25) 0%, transparent 55%),
    rgba(26, 0, 51, 0.95);
  border: 1px solid rgba(200, 100, 255, 0.3);
  border-radius: 20px;
  padding: 2.5rem 2.5rem 2rem;
  max-width: 700px;
  width: 100%;
  box-shadow:
    0 0 60px rgba(180, 50, 220, 0.3),
    0 0 120px rgba(255, 80, 180, 0.1);
  font-family: "Exo 2", sans-serif;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1.2rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 1.3rem;
  cursor: none;
  transition: color 0.2s;
  line-height: 1;
}
.modal-close:hover {
  color: white;
}

.modal-title {
  text-align: center;
  font-size: 1.7rem;
  font-weight: 700;
  margin: 0 0 2rem;
  background: linear-gradient(90deg, #e87fff, #ff80c8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.03em;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}

.step {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1.4rem;
  align-items: center;
  padding: 1.1rem 1.2rem;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.step-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo-circle {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: lightblue;
  box-shadow: 0 0 12px rgba(173, 216, 230, 0.6);
  flex-shrink: 0;
}

.demo-ring {
  position: absolute;
  inset: -22px;
  border-radius: 50%;
  border: 3px solid white;
  animation: shrink 1.6s ease-in infinite;
}

@keyframes shrink {
  0% {
    inset: -30px;
    opacity: 0.9;
  }
  85% {
    inset: -2px;
    opacity: 1;
  }
  100% {
    inset: -2px;
    opacity: 0;
  }
}

.timings {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
}

.badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 3px 10px;
  border-radius: 20px;
  display: block;
  text-align: center;
}
.badge.perfect {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.4);
}
.badge.great {
  background: rgba(176, 255, 128, 0.2);
  color: #b0ff80;
  border: 1px solid rgba(176, 255, 128, 0.4);
}
.badge.good {
  background: rgba(128, 207, 255, 0.2);
  color: #80cfff;
  border: 1px solid rgba(128, 207, 255, 0.4);
}
.badge.miss {
  background: rgba(255, 68, 68, 0.2);
  color: #ff6666;
  border: 1px solid rgba(255, 68, 68, 0.4);
}

.combo-visual {
  flex-direction: column;
  gap: 6px;
}

.combo-stars {
  display: flex;
  gap: 2px;
  font-size: 1.4rem;
}

.star {
  display: inline-block;
  animation: pop 1.2s ease-in-out infinite;
}
.s1 {
  animation-delay: 0s;
}
.s2 {
  animation-delay: 0.18s;
}
.s3 {
  animation-delay: 0.36s;
}

@keyframes pop {
  0%,
  100% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.3);
  }
}

.combo-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #ffd700;
  text-align: center;
  white-space: nowrap;
}
.combo-label .bonus {
  color: rgba(255, 215, 0, 0.6);
  font-weight: 400;
}

.step-text h3 {
  margin: 0 0 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  color: #e87fff;
}
.step-text p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.75);
}
.step-text strong {
  color: white;
}

.modal-btn {
  display: block;
  width: 100%;
  margin-top: 2rem;
  padding: 0.85rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #b432dc, #ff50b4);
  color: white;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: "Exo 2", sans-serif;
  cursor: none;
  letter-spacing: 0.04em;
  transition:
    opacity 0.2s,
    transform 0.15s;
  box-shadow: 0 4px 24px rgba(180, 50, 220, 0.4);
}
.modal-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.modal-btn:active {
  transform: translateY(0);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  opacity: 0;
  transform: scale(0.95) translateY(12px);
}
</style>
