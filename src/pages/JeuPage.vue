<template>
  <div v-if="!gameState && !decompteActif" class="overlay">
    <button @click="demarrerDecompte" :disabled="!audioCharge">
      {{ audioCharge ? "Commencer" : "Chargement..." }}
    </button>
  </div>

  <div v-if="decompteActif" class="decompte">
    <span :key="decompteVal" class="decompte-chiffre">{{ decompteVal }}</span>
  </div>

  <!-- Pop-up Pause -->
  <Transition name="modal">
    <div v-if="pause" class="pause-backdrop">
      <div class="pause-modal">
        <h2 class="pause-titre">En pause</h2>
        <div class="pause-actions">
          <button class="btn-primary" @click="reprendre">Reprendre</button>
          <RouterLink to="/" class="btn-secondary">Quitter</RouterLink>
        </div>
      </div>
    </div>
  </Transition>

  <canvas @pointerdown="hitCircle" ref="canvas" class="c"></canvas>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter, useRoute } from "vue-router";

const route = useRoute();
const router = useRouter();

const difficulte = route.query.difficulte || "classique";
const musique = route.query.musique || "aroundTheWorld.mp3";

const seuils = {
  classique: { rms: 0.15, gap: 0.6 },
  extreme: { rms: 0.1, gap: 0.42 },
};

// ── Partie Audio ──
const audioCtx = new AudioContext();
let audioBuffer = null;
let sourceNode = null;
let analyser = null;
let beatTimestamps = [];
const audioCharge = ref(false);

async function audioCharging() {
  const response = await fetch(`/audio/${musique}`);
  const arrayBuffer = await response.arrayBuffer();
  audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  beatTimestamps = beatsDetection(audioBuffer);
  audioCharge.value = true;
}

function beatsDetection(buffer) {
  const { rms: seuilRms, gap: seuilGap } = seuils[difficulte] ?? seuils.classique;
  const channelData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const windowSize = Math.floor(sampleRate * 0.05);
  const beats = [];
  let lastBeat = -seuilGap;

  for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
    let sum = 0;
    for (let j = i; j < i + windowSize; j++) {
      sum += channelData[j] * channelData[j];
    }
    const rms = Math.sqrt(sum / windowSize);
    const timeStamp = i / sampleRate;

    if (rms > seuilRms && timeStamp - lastBeat > seuilGap) {
      beats.push(timeStamp);
      lastBeat = timeStamp;
    }
  }
  return beats;
}

// ── Décompte ──
const decompteActif = ref(false);
const decompteVal = ref("");

function demarrerDecompte() {
  if (audioCtx.state === "suspended") audioCtx.resume();
  decompteActif.value = true;

  const etapes = ["3", "2", "1", "Go !"];
  let i = 0;
  decompteVal.value = etapes[i];

  const intervalle = setInterval(() => {
    i++;
    if (i < etapes.length) decompteVal.value = etapes[i];
    if (i === etapes.length - 1) launchMusic();
    if (i >= etapes.length) {
      clearInterval(intervalle);
      decompteActif.value = false;
    }
  }, 900);
}

// ── Pause et reprendre ──
const pause = ref(false);

function togglePause() {
  if (!gameState.value) return;
  if (pause.value) {
    reprendre();
  } else {
    pause.value = true;
    audioCtx.suspend();
  }
}

function reprendre() {
  pause.value = false;
  decompteActif.value = true;
  decompteVal.value = "3";

  const etapes = ["3", "2", "1", "Go !"];
  let i = 0;

  const intervalle = setInterval(() => {
    i++;
    if (i < etapes.length) decompteVal.value = etapes[i];
    if (i === etapes.length - 1) audioCtx.resume();
    if (i >= etapes.length) {
      clearInterval(intervalle);
      decompteActif.value = false;
    }
  }, 900);
}

function onKeyDown(e) {
  if (e.key === "Escape") togglePause();
}

// ── Partie Jeu ──
const gameState = ref(false);
const canvas = ref(null);
const startTime = ref(null);
const songTime = ref(null);
let ctx = null;
let loopId = null;
const radius = 60;
const anticipation = 1.5;
const expiration = 1;

const stats = ref({
  perfect: 0,
  great: 0,
  good: 0,
  early: 0,
  late: 0,
  miss: 0,
  comboMax: 0,
  totalCercles: 0,
});

function launchMusic() {
  gameState.value = true;

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;

  sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = audioBuffer;
  sourceNode.connect(analyser);
  analyser.connect(audioCtx.destination);
  sourceNode.start();
  startTime.value = audioCtx.currentTime;

  sourceNode.onended = () => {
    if (pause.value) return;
    router.push({
      path: "/recapitulatif",
      query: {
        score: score.value,
        perfect: stats.value.perfect,
        great: stats.value.great,
        good: stats.value.good,
        early: stats.value.early,
        late: stats.value.late,
        miss: stats.value.miss,
        comboMax: stats.value.comboMax,
        totalCercles: stats.value.totalCercles,
        musique: musique,
        difficulte: difficulte,
      },
    });
  };
}

const circles = ref([]);

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function addCircle(beatTime) {
  const c = canvas.value;
  stats.value.totalCercles++;
  circles.value.push({
    id: Date.now(),
    cx: radius + getRandomInt(c.width - 2 * radius),
    cy: radius + getRandomInt(c.height - 2 * radius),
    color: "lightblue",
    visible: true,
    touche: false,
    beatTime: beatTime,
  });
}

const score = ref(0);
const combo = ref(0);
const bonusCombo = ref(0);
const scorePopups = ref([]);

function hitCircle(event) {
  if (!gameState.value || pause.value) return;

  const c = canvas.value;
  const rect = c.getBoundingClientRect();
  const mx = (event.clientX - rect.left) * (c.width / rect.width);
  const my = (event.clientY - rect.top) * (c.height / rect.height);
  const songNow = audioCtx.currentTime - startTime.value;

  for (const circle of circles.value.filter((c) => c.visible && !c.touche)) {
    const dx = mx - circle.cx;
    const dy = my - circle.cy;

    if (dx * dx + dy * dy <= radius * radius) {
      const delta = songNow - circle.beatTime;
      let points, label, color;

      if (Math.abs(delta) <= 0.08) {
        points = 500;
        color = "#FFD700";
        combo.value++;
        stats.value.perfect++;
        stats.value.comboMax = Math.max(stats.value.comboMax, combo.value);
        if (combo.value >= 3) {
          bonusCombo.value = (combo.value - 2) * 25;
          points += bonusCombo.value;
          label = `PERFECT +${bonusCombo.value}🌟`;
        } else {
          label = "PERFECT";
        }
      } else {
        combo.value = 0;
        bonusCombo.value = 0;
        if (Math.abs(delta) <= 0.2) {
          points = 300;
          label = "GREAT";
          color = "#B0FF80";
          stats.value.great++;
        } else if (Math.abs(delta) <= 0.5) {
          points = 100;
          label = "GOOD";
          color = "#80CFFF";
          stats.value.good++;
        } else if (delta < 0) {
          points = 50;
          label = "EARLY";
          color = "#80CFFF";
          stats.value.early++;
        } else {
          points = 0;
          label = "LATE";
          color = "#AAAAAA";
          stats.value.late++;
        }
      }

      score.value += points;
      scorePopups.value.push({
        id: Date.now(),
        x: circle.cx,
        y: circle.cy - radius - 10,
        label: points > 0 ? `${label} +${points}` : label,
        color,
        opacity: 1,
        spawnTime: songNow,
      });

      circle.touche = true;
      circle.color = color;
      setTimeout(() => {
        circle.visible = false;
      }, 300);
      break;
    }
  }
}

function game() {
  // Fond
  const c = canvas.value;
  const animTime = audioCtx.currentTime * 0.3;
  const songNow = audioCtx.currentTime - startTime.value;

  const x1 = c.width * (0.5 + 0.4 * Math.sin(animTime * 0.7));
  const y1 = c.height * (0.5 + 0.4 * Math.cos(animTime * 0.5));
  const x2 = c.width * (0.5 + 0.4 * Math.cos(animTime * 0.4));
  const y2 = c.height * (0.5 + 0.4 * Math.sin(animTime * 0.6));

  const angle = animTime * 0.3;
  const gx1 = c.width * 0.5 + Math.cos(angle) * c.width;
  const gy1 = c.height * 0.5 + Math.sin(angle) * c.height;
  const gx2 = c.width * 0.5 - Math.cos(angle) * c.width;
  const gy2 = c.height * 0.5 - Math.sin(angle) * c.height;

  const gradBase = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
  gradBase.addColorStop(0, "#1a0033");
  gradBase.addColorStop(0.5, "#3d0066");
  gradBase.addColorStop(1, "#1a0033");
  ctx.fillStyle = gradBase;
  ctx.fillRect(0, 0, c.width, c.height);

  const orb1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, c.width * 0.55);
  orb1.addColorStop(0, "rgba(180, 50, 220, 0.55)");
  orb1.addColorStop(0.5, "rgba(120, 20, 180, 0.25)");
  orb1.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = orb1;
  ctx.fillRect(0, 0, c.width, c.height);

  const orb2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, c.width * 0.5);
  orb2.addColorStop(0, "rgba(255, 80, 180, 0.5)");
  orb2.addColorStop(0.5, "rgba(200, 40, 120, 0.2)");
  orb2.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = orb2;
  ctx.fillRect(0, 0, c.width, c.height);

  // Cibles

  for (const circle of circles.value) {
    const delta = songNow - circle.beatTime;

    if (delta > expiration) {
      if (circle.visible && !circle.touche) {
        combo.value = 0;
        bonusCombo.value = 0;
        score.value -= 50;
        stats.value.miss++;
        scorePopups.value.push({
          id: Date.now(),
          x: circle.cx,
          y: circle.cy - radius - 10,
          label: "MISS -50",
          color: "#FF4444",
          opacity: 1,
          spawnTime: songNow,
        });
      }
      circle.visible = false;
    }

    if (!circle.visible) continue;

    ctx.beginPath();
    ctx.arc(circle.cx, circle.cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = circle.color;
    ctx.fill();

    if (delta < 0) {
      const ratio = -delta / anticipation;
      const ringRadius = radius + 60 * ratio;
      ctx.beginPath();
      ctx.arc(circle.cx, circle.cy, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  circles.value = circles.value.filter((c) => c.visible);

  const popupDuration = 0.8;
  for (const popup of scorePopups.value) {
    const age = songNow - popup.spawnTime;
    popup.opacity = Math.max(0, 1 - age / popupDuration);
    popup.y -= 0.8;
    ctx.globalAlpha = popup.opacity;
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = popup.color;
    ctx.textAlign = "center";
    ctx.fillText(popup.label, popup.x, popup.y);
    ctx.globalAlpha = 1;
  }
  scorePopups.value = scorePopups.value.filter((p) => p.opacity > 0);

  // ── Panneau score ──
  const panX = 20;
  const panY = c.height - 110;
  const panW = 230;
  const panH = 90;
  const panR = 14;

  ctx.globalAlpha = 0.82;
  ctx.fillStyle = "rgba(26, 0, 51, 0.92)";
  ctx.beginPath();
  ctx.roundRect(panX, panY, panW, panH, panR);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = "rgba(200, 100, 255, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(panX, panY, panW, panH, panR);
  ctx.stroke();

  const glowPan = ctx.createRadialGradient(
    panX + 30,
    panY + panH / 2,
    0,
    panX + 30,
    panY + panH / 2,
    80,
  );
  glowPan.addColorStop(0, "rgba(180, 50, 220, 0.18)");
  glowPan.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glowPan;
  ctx.beginPath();
  ctx.roundRect(panX, panY, panW, panH, panR);
  ctx.fill();

  if (combo.value >= 3) {
    ctx.font = "bold 13px sans-serif";
    ctx.fillStyle = "#FFD700";
    ctx.textAlign = "left";
    ctx.fillText(`🌟 Combo x${combo.value}  (+${bonusCombo.value} bonus)`, panX + 16, panY + 26);
  }

  ctx.font = "600 11px sans-serif";
  ctx.fillStyle = "rgba(232, 127, 255, 0.7)";
  ctx.textAlign = "left";
  ctx.fillText("SCORE", panX + 16, panY + (combo.value >= 3 ? 50 : 36));

  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${score.value}`, panX + 16, panY + (combo.value >= 3 ? 76 : 66));

  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

let beatIndex = 0;

function loop() {
  if (gameState.value && !pause.value) {
    songTime.value = audioCtx.currentTime - startTime.value;
    while (
      beatIndex < beatTimestamps.length &&
      songTime.value >= beatTimestamps[beatIndex] - anticipation
    ) {
      addCircle(beatTimestamps[beatIndex]);
      beatIndex++;
    }
  }
  game();
  loopId = requestAnimationFrame(loop);
}

function resizeCanvas() {
  const c = canvas.value;
  if (!c) return;
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}

onMounted(async () => {
  const c = canvas.value;
  ctx = c.getContext("2d");
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", onKeyDown);
  await audioCharging();
  loop();
});

onBeforeUnmount(() => {
  if (loopId) cancelAnimationFrame(loopId);
  window.removeEventListener("resize", resizeCanvas);
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<style scoped>
.overlay {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 0, 25, 0.75);
  backdrop-filter: blur(6px);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.overlay button {
  padding: 0.85rem 2.5rem;
  background: linear-gradient(135deg, #b432dc, #ff50b4);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: none;
  box-shadow: 0 4px 28px rgba(180, 50, 220, 0.45);
  transition:
    opacity 0.2s,
    transform 0.15s;
}

.overlay button:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-2px);
}

.overlay button:disabled {
  opacity: 0.5;
  cursor: none;
}

.decompte {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
}

.decompte-chiffre {
  display: block;
  font-size: 3rem;
  font-weight: 700;
  font-family: sans-serif;
  background: linear-gradient(90deg, #e87fff, #ff80c8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: pop-in 0.4s ease-out;
  filter: drop-shadow(0 0 12px rgba(232, 127, 255, 0.7));
}

@keyframes pop-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  60% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.pause-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 0, 25, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.pause-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  background:
    radial-gradient(ellipse at 10% 20%, rgba(180, 50, 220, 0.35) 0%, transparent 55%),
    radial-gradient(ellipse at 90% 80%, rgba(255, 80, 180, 0.25) 0%, transparent 55%),
    rgba(26, 0, 51, 0.95);
  border: 1px solid rgba(200, 100, 255, 0.3);
  border-radius: 20px;
  padding: 3rem 4rem;
  box-shadow: 0 0 60px rgba(180, 50, 220, 0.3);
}

.pause-titre {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0;
  font-family: sans-serif;
  background: linear-gradient(90deg, #e87fff, #ff80c8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.05em;
}

.pause-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary {
  padding: 0.75rem 2.2rem;
  background: linear-gradient(135deg, #b432dc, #ff50b4);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: none;
  box-shadow: 0 4px 24px rgba(180, 50, 220, 0.4);
  transition:
    opacity 0.2s,
    transform 0.15s;
  text-decoration: none;
  text-align: center;
}

.btn-primary:hover {
  opacity: 0.88;
  transform: translateY(-1px);
}

.btn-secondary {
  padding: 0.75rem 1.8rem;
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.75);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none;
  text-align: center;
  font-size: 1rem;
  transition:
    background 0.2s,
    color 0.2s;
  font-family: sans-serif;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.13);
  color: white;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.c {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 1;
}
</style>
