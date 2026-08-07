"use strict";

(() => {
  const baseProgression = progression;
  const baseRenderProgram = renderProgram;

  progression = function strictV7Progression(ex) {
    const result = baseProgression(ex);
    if (ex.type === "core" || result.status !== "Ağırlık artır") return result;
    const last = latest(ex.id);
    const sets = last ? normalizeLog(last, ex).sets : [];
    if (!sets.length) return result;
    const allDone = sets.every(set => set.done);
    const allTop = allDone && sets.every(set => int(set.reps) >= ex.repMax);
    const sameWeight = allDone && sets.every(set => Math.abs(num(set.weight) - num(sets[0].weight)) < 0.001);
    if (allTop && sameWeight) return result;
    const currentWeight = Math.max(...sets.filter(set => set.done).map(set => num(set.weight, ex.weight)), num(ex.weight));
    return {
      ...result,
      weight: currentWeight,
      status: "Koru",
      text: `${currentWeight} kg ile devam et; tüm çalışma setleri ${ex.repMax} tekrara ulaşmadan ağırlık artmaz.`
    };
  };

  installTargetProgram = function preventLegacyProgramInstall() {
    toast("v7 programı zaten aktif.");
  };

  renderProgram = function v7ProgramSettings() {
    baseRenderProgram();
    const legacyInstaller = document.querySelector("#programContent > .panel");
    if (legacyInstaller) legacyInstaller.remove();
  };

  function workoutForLog(log) {
    return state.workouts.find(workout => workout.id === log.workoutId)
      || state.workouts.find(workout => String(log.workoutName || "").trim().startsWith(workout.name.charAt(0)))
      || null;
  }

  function editorIds(log) {
    const workout = workoutForLog(log);
    return [...new Set([...(workout?.exerciseIds || []), ...Object.keys(log.entries || {})])];
  }

  window.openHistoryEditor = function openCompleteHistoryEditor(logId) {
    if (!$("historyEditModal")) {
      document.body.insertAdjacentHTML("beforeend", '<div class="overlay" id="historyEditModal"><div class="modal v7-history-modal"><div id="historyEditBody"></div></div></div>');
    }
    const log = state.logs.find(item => item.id === logId);
    if (!log) return toast("Kayıt bulunamadı.");
    window.v7EditingLogId = logId;
    const ids = editorIds(log);
    $("historyEditBody").innerHTML = `<div class="v7-editor-head"><div><div class="modal-title">${esc(log.date)} · ${esc(log.workoutName)}</div><div class="mode-note">Eksik hareketleri ekleyebilir, eski setleri düzeltebilirsin.</div></div><button class="v7-close" onclick="closeHistoryEditor()">×</button></div><div class="field"><label>Süre (dk)</label><input class="input" id="historyDuration" type="number" inputmode="numeric" value="${int(log.duration,0)}"></div>${ids.map(id => {
      const ex = state.exercises[id];
      if (!ex) return "";
      const raw = log.entries?.[id];
      const existing = raw ? normalizeLog(raw, ex).sets : [];
      const count = Math.max(ex.sets, existing.length);
      return `<div class="v7-edit-ex"><div class="v7-edit-title">${esc(ex.name)} <span>${ex.sets}×${ex.repMin}–${ex.repMax}</span></div>${Array.from({length:count},(_,index) => {
        const set = existing[index];
        const key = `${id}:${index}`;
        return `<div class="v7-edit-row"><label><input type="checkbox" data-edit-done="${key}" ${set?.done?"checked":""}> ${index+1}. set</label>${ex.type === "core" ? '<span class="v7-edit-static">Vücut</span>' : `<input class="input" data-edit-weight="${key}" type="number" inputmode="decimal" value="${set?num(set.weight):num(ex.weight)}" aria-label="Kilo">`}<input class="input" data-edit-reps="${key}" type="number" inputmode="numeric" value="${set?int(set.reps):ex.repMin}" aria-label="${ex.type === "core" ? "Saniye" : "Tekrar"}"></div>`;
      }).join("")}</div>`;
    }).join("")}<div class="modal-actions"><button class="btn ghost" onclick="closeHistoryEditor()">Vazgeç</button><button class="btn primary" onclick="saveHistoryEdit()">Değişiklikleri Kaydet</button></div>`;
    $("historyEditModal").classList.add("open");
  };

  window.saveHistoryEdit = function saveCompleteHistoryEdit() {
    const logIndex = state.logs.findIndex(item => item.id === window.v7EditingLogId);
    if (logIndex < 0) return;
    const log = state.logs[logIndex];
    const ids = editorIds(log);
    storage.setItem(`${LS_STATE}_duzenleme_yedek_${Date.now()}`, JSON.stringify(state));
    const entries = {...(log.entries || {})};

    ids.forEach(id => {
      const ex = state.exercises[id];
      if (!ex) return;
      const checkboxes = [...document.querySelectorAll(`[data-edit-done^="${id}:"]`)];
      const sets = checkboxes.map((checkbox, index) => {
        const key = `${id}:${index}`;
        return {
          done: checkbox.checked,
          weight: ex.type === "core" ? 0 : num(document.querySelector(`[data-edit-weight="${key}"]`)?.value, ex.weight),
          reps: int(document.querySelector(`[data-edit-reps="${key}"]`)?.value, ex.repMin),
          rir: null
        };
      });
      if (sets.some(set => set.done)) entries[id] = {name:ex.name,sets,note:entries[id]?.note || ""};
      else delete entries[id];
    });

    let totalVolume = 0;
    Object.entries(entries).forEach(([id,item]) => {
      const ex = state.exercises[id] || {};
      if (ex.type === "core") return;
      normalizeLog(item, ex).sets.filter(set => set.done).forEach(set => { totalVolume += num(set.weight) * int(set.reps); });
    });

    state.logs[logIndex] = {
      ...log,
      duration: Math.max(1, int($("historyDuration").value, log.duration || 1)),
      entries,
      totalVolume,
      editedAt: Date.now()
    };
    saveState();
    closeHistoryEditor();
    renderHistory();
    toast("Antrenman kaydı güncellendi.");
  };

  const optionalField = $("fOptional")?.closest("label");
  if (optionalField) optionalField.style.display = "none";
  renderWorkout();
})();
