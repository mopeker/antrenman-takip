"use strict";

(() => {
  const ENHANCEMENT_VERSION = "6.2.0";
  const originalPlannedSets = plannedSets;
  const originalExerciseHTML = exerciseHTML;
  const originalProgression = progression;
  const originalRenderAnalysis = renderAnalysis;
  const originalRenderHistory = renderHistory;
  const originalFinishWorkout = finishWorkout;

  const setKey = ex => `${session?.mode || "normal"}:${ex.id}`;

  function ensureExtras() {
    session.setCounts = session.setCounts || {};
    session.warmups = session.warmups || {};
  }

  plannedSets = function enhancedPlannedSets(ex) {
    const base = originalPlannedSets(ex);
    ensureExtras();
    const custom = int(session.setCounts[setKey(ex)], base);
    return clamp(custom, 1, 8);
  };

  function workSetsFromLog(log, ex) {
    const done = normalizeLog(log, ex).sets.filter(s => s.done && num(s.weight) >= 0);
    if (!done.length || ex.type === "core") return done;
    const maxWeight = Math.max(...done.map(s => num(s.weight)));
    return done.filter(s => Math.abs(num(s.weight) - maxWeight) < 0.001);
  }

  function estimatedStrength(set) {
    const weight = num(set?.weight);
    const reps = Math.max(1, int(set?.reps, 1));
    return weight > 0 ? weight * (1 + reps / 30) : 0;
  }

  progression = function enhancedProgression(ex) {
    if (ex.type === "core") return originalProgression(ex);

    const last = latest(ex.id);
    if (!last) {
      return {
        weight: ex.weight,
        status: "Başlangıç",
        text: `${ex.repMin}–${ex.repMax} aralığında temiz tekrar yap; yaklaşık 1–3 tekrar yedek bırak.`
      };
    }

    const sets = workSetsFromLog(last, ex);
    if (!sets.length) return originalProgression(ex);

    const currentWeight = Math.max(...sets.map(s => num(s.weight, ex.weight)));
    const reps = sets.map(s => int(s.reps));
    const averageReps = reps.reduce((a, b) => a + b, 0) / reps.length;
    const rirValues = sets.map(s => s.rir).filter(v => v != null && Number.isFinite(Number(v))).map(Number);
    const averageRir = rirValues.length ? rirValues.reduce((a, b) => a + b, 0) / rirValues.length : null;
    const enoughSets = sets.length >= Math.min(2, Math.max(1, int(ex.sets, 2)));
    const allAtTop = enoughSets && reps.every(r => r >= ex.repMax);
    const belowRange = reps.filter(r => r < ex.repMin).length >= Math.ceil(reps.length / 2);
    const previous = latest(ex.id, 1);
    const previousSets = previous ? workSetsFromLog(previous, ex) : [];
    const previousBest = previousSets.length ? Math.max(...previousSets.map(estimatedStrength)) : 0;
    const currentBest = Math.max(...sets.map(estimatedStrength));
    const improved = previousBest > 0 && currentBest > previousBest * 1.015;

    let weight = currentWeight;
    let status = "Koru";
    let text = `${currentWeight} kg ile tekrarları doldur. Son çalışma setleri: ${reps.join("–")}.`;

    if (allAtTop && (averageRir == null || averageRir >= 1)) {
      weight = Math.round((currentWeight + ex.increment) / ex.increment) * ex.increment;
      status = "Artır";
      text = `Tüm çalışma setleri üst sınıra ulaştı. ${weight} kg ile ${ex.repMin}–${ex.repMax} tekrar dene.`;
    } else if (belowRange) {
      status = "Ağırlığı koru";
      text = `${currentWeight} kg şimdilik yeterli. Önce setlerin çoğunu ${ex.repMin} tekrarın üzerine çıkar.`;
    } else if (improved) {
      status = "İlerleme var";
      text = `Güç puanın yükselmiş. ${currentWeight} kg ile üst tekrar sınırına yaklaş.`;
    } else if (averageReps >= ex.repMax - 1) {
      status = "Çok yakın";
      text = `${currentWeight} kg ile bir antrenman daha tekrarları tamamla; sonra artır.`;
    }

    if (averageRir != null && averageRir < 0.75 && !allAtTop) {
      status = "Koru";
      text = `${currentWeight} kg zaten oldukça zorlayıcı. Tekrarları artırmadan ağırlık ekleme.`;
    }

    if (session.mode === "low" && weight > 0) {
      weight = Math.max(0, weight - ex.increment);
      status = "Bugün hafif";
      text = `${weight} kg kullan ve 3–4 tekrar yedek bırak.`;
    }

    return { weight, status, text };
  };

  function warmupsFor(ex) {
    ensureExtras();
    return session.warmups[ex.id] || (session.warmups[ex.id] = []);
  }

  function suggestedWarmup(ex, index) {
    const target = Math.max(0, num(progression(ex).weight, ex.weight));
    const ratio = index === 0 ? 0.5 : index === 1 ? 0.7 : 0.85;
    const step = Math.max(0.5, num(ex.increment, 1));
    const weight = target > 0 ? Math.max(step, Math.round((target * ratio) / step) * step) : 0;
    return { done: false, weight, reps: index === 0 ? 10 : 6 };
  }

  window.addWorkingSet = id => {
    const ex = state.exercises[id];
    if (!ex) return;
    ensureExtras();
    const current = plannedSets(ex);
    if (current >= 8) return toast("En fazla 8 çalışma seti eklenebilir.");
    session.setCounts[setKey(ex)] = current + 1;
    getSet(ex, current);
    saveSession();
    renderWorkout();
  };

  window.removeWorkingSet = id => {
    const ex = state.exercises[id];
    if (!ex) return;
    ensureExtras();
    const current = plannedSets(ex);
    if (current <= 1) return toast("En az 1 çalışma seti kalmalı.");
    const data = entry(ex);
    data.sets.splice(current - 1, 1);
    session.setCounts[setKey(ex)] = current - 1;
    saveSession();
    renderWorkout();
  };

  window.addWarmupSet = id => {
    const ex = state.exercises[id];
    if (!ex || ex.type === "core") return;
    const rows = warmupsFor(ex);
    if (rows.length >= 3) return toast("En fazla 3 ısınma seti eklenebilir.");
    rows.push(suggestedWarmup(ex, rows.length));
    saveSession();
    renderWorkout();
  };

  window.removeWarmupSet = id => {
    const ex = state.exercises[id];
    if (!ex) return;
    const rows = warmupsFor(ex);
    if (!rows.length) return;
    rows.pop();
    saveSession();
    renderWorkout();
  };

  window.updateWarmupSet = (id, index, field, value) => {
    const ex = state.exercises[id];
    const row = warmupsFor(ex)[index];
    if (!row) return;
    row[field] = Math.max(0, num(value, row[field]));
    saveSession();
  };

  window.nudgeWarmupSet = (id, index, field, direction) => {
    const ex = state.exercises[id];
    const row = warmupsFor(ex)[index];
    if (!row) return;
    const step = field === "weight" ? Math.max(0.5, num(ex.increment, 1)) : 1;
    row[field] = Math.max(0, num(row[field]) + direction * step);
    saveSession();
    renderWorkout();
  };

  window.toggleWarmupSet = (id, index) => {
    const ex = state.exercises[id];
    const row = warmupsFor(ex)[index];
    if (!row) return;
    row.done = !row.done;
    if (row.done) startWorkout();
    saveSession();
    renderWorkout();
  };

  function warmupMarkup(ex) {
    const rows = warmupsFor(ex);
    if (!rows.length) return "";
    const body = rows.map((row, index) => `
      <div class="set-row warmup-row ${row.done ? "done" : ""}">
        <div class="set-index">I${index + 1}</div>
        <div class="stepper">
          <button onclick="nudgeWarmupSet('${ex.id}',${index},'weight',-1)">−</button>
          <input type="number" value="${row.weight}" onchange="updateWarmupSet('${ex.id}',${index},'weight',this.value)">
          <button onclick="nudgeWarmupSet('${ex.id}',${index},'weight',1)">+</button>
        </div>
        <div class="stepper">
          <button onclick="nudgeWarmupSet('${ex.id}',${index},'reps',-1)">−</button>
          <input type="number" value="${row.reps}" onchange="updateWarmupSet('${ex.id}',${index},'reps',this.value)">
          <button onclick="nudgeWarmupSet('${ex.id}',${index},'reps',1)">+</button>
        </div>
        <div class="warmup-label">Isınma</div>
        <button class="done-btn ${row.done ? "on" : ""}" onclick="toggleWarmupSet('${ex.id}',${index})">${row.done ? "✓" : "○"}</button>
      </div>`).join("");

    return `<div class="warmup-block"><div class="warmup-title">Isınma setleri <button onclick="removeWarmupSet('${ex.id}')">Sonuncuyu sil</button></div>${body}</div>`;
  }

  exerciseHTML = function enhancedExerciseHTML(ex, index, currentId) {
    let html = originalExerciseHTML(ex, index, currentId);
    const controls = `<div class="set-tools">
      <button onclick="addWorkingSet('${ex.id}')">＋ Çalışma seti</button>
      <button onclick="removeWorkingSet('${ex.id}')">− Son set</button>
      ${ex.type === "core" ? "" : `<button class="warmup-tool" onclick="addWarmupSet('${ex.id}')">＋ Isınma</button>`}
    </div>`;
    html = html.replace('<div class="set-head">', `${warmupMarkup(ex)}${controls}<div class="set-head">`);
    return html;
  };

  finishWorkout = function enhancedFinishWorkout() {
    ensureExtras();
    const warmupSnapshot = JSON.parse(JSON.stringify(session.warmups || {}));
    const before = state.logs.length;
    originalFinishWorkout();
    if (state.logs.length > before) {
      const log = state.logs[state.logs.length - 1];
      const completedWarmups = {};
      Object.entries(warmupSnapshot).forEach(([id, rows]) => {
        const done = (rows || []).filter(row => row.done);
        if (done.length) completedWarmups[id] = done;
      });
      if (Object.keys(completedWarmups).length) log.warmups = completedWarmups;
      saveState();
    }
  };

  function exerciseSeries(id) {
    return state.logs
      .slice()
      .sort((a, b) => num(a.ts) - num(b.ts))
      .map(log => {
        const raw = log.entries?.[id];
        if (!raw) return null;
        const ex = state.exercises[id] || {};
        const sets = workSetsFromLog(raw, ex);
        if (!sets.length) return null;
        const best = sets.slice().sort((a, b) => estimatedStrength(b) - estimatedStrength(a))[0];
        return {
          date: log.date || log.dateISO,
          ts: log.ts || parseDate(log.dateISO).getTime(),
          weight: num(best.weight),
          reps: int(best.reps),
          score: estimatedStrength(best)
        };
      })
      .filter(Boolean)
      .slice(-10);
  }

  function chartSVG(points) {
    const width = 680;
    const height = 230;
    const left = 42;
    const right = 18;
    const top = 20;
    const bottom = 38;
    const values = points.map(p => p.score);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) { min *= 0.9; max *= 1.1; }
    const pad = Math.max(1, (max - min) * 0.15);
    min = Math.max(0, min - pad);
    max += pad;
    const x = i => left + (points.length === 1 ? (width - left - right) / 2 : i * (width - left - right) / (points.length - 1));
    const y = value => top + (max - value) * (height - top - bottom) / Math.max(1, max - min);
    const polyline = points.map((p, i) => `${x(i)},${y(p.score)}`).join(" ");
    const circles = points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.score)}" r="5"><title>${esc(p.date)} · ${p.weight} kg × ${p.reps}</title></circle>`).join("");
    const labels = points.map((p, i) => (i === 0 || i === points.length - 1 || (points.length > 4 && i === Math.floor(points.length / 2)))
      ? `<text x="${x(i)}" y="${height - 10}" text-anchor="middle">${esc(String(p.date).slice(0, 5))}</text>` : "").join("");
    return `<svg class="progress-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Hareket gelişim grafiği">
      <line x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}"></line>
      <line x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}"></line>
      <polyline points="${polyline}"></polyline>
      ${circles}${labels}
    </svg>`;
  }

  window.renderExerciseProgress = id => {
    if (!id) return;
    state.settings.progressExerciseId = id;
    saveState();
    const root = $("exerciseProgressChart");
    if (!root) return;
    const series = exerciseSeries(id);
    if (!series.length) {
      root.innerHTML = '<div class="empty">Bu hareket için henüz kayıt yok.</div>';
      return;
    }
    const first = series[0];
    const last = series[series.length - 1];
    const change = first.score > 0 ? ((last.score / first.score - 1) * 100) : 0;
    root.innerHTML = `<div class="chart-summary">
      <div><strong>${last.weight} kg × ${last.reps}</strong><span>Son en iyi set</span></div>
      <div><strong>${change >= 0 ? "+" : ""}${change.toFixed(1)}%</strong><span>Tahmini güç değişimi</span></div>
      <div><strong>${series.length}</strong><span>Kayıtlı antrenman</span></div>
    </div>${chartSVG(series)}<div class="chart-note">Grafik, her antrenmandaki en iyi çalışma setinin ağırlık ve tekrarını birlikte değerlendirir.</div>`;
  };

  function appendProgressSection() {
    const root = $("analysisContent");
    if (!root || $("exerciseProgressPanel")) return;
    const ids = [...new Set(state.workouts.flatMap(w => w.exerciseIds || []))].filter(id => state.exercises[id] && state.exercises[id].type !== "core");
    if (!ids.length) return;
    const selected = ids.includes(state.settings.progressExerciseId) ? state.settings.progressExerciseId : ids[0];
    root.insertAdjacentHTML("beforeend", `<div class="section-title">Hareket gelişimi</div>
      <div class="panel" id="exerciseProgressPanel">
        <div class="field"><label>Hareket</label><select class="select" onchange="renderExerciseProgress(this.value)">
          ${ids.map(id => `<option value="${id}" ${id === selected ? "selected" : ""}>${esc(state.exercises[id].name)}</option>`).join("")}
        </select></div>
        <div id="exerciseProgressChart"></div>
      </div>`);
    renderExerciseProgress(selected);
  }

  renderAnalysis = function enhancedRenderAnalysis() {
    originalRenderAnalysis();
    appendProgressSection();
  };

  renderHistory = function enhancedRenderHistory() {
    originalRenderHistory();
    const logs = state.logs.slice().reverse();
    const cards = document.querySelectorAll("#historyContent .log-card");
    cards.forEach((card, index) => {
      const log = logs[index];
      if (!log?.warmups) return;
      const count = Object.values(log.warmups).reduce((total, rows) => total + rows.length, 0);
      if (count) card.insertAdjacentHTML("afterbegin", `<div class="warmup-history">${count} ısınma seti kaydedildi</div>`);
    });
  };

  const versionLabel = document.querySelector(".version");
  if (versionLabel) versionLabel.textContent = `v${ENHANCEMENT_VERSION.replace(/\.0$/, "")}`;
  document.title = "Antrenman Takip 6.2";
  ensureExtras();
  saveSession();
  renderAll();
})();
