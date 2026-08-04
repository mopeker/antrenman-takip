"use strict";

(() => {
  const UX_VERSION = "6.3.0";

  MODE_INFO.normal = "Tam program. Temiz formu koru; son tekrarlar zorlayıcı olsun ama hareket bozulmasın.";
  MODE_INFO.short = "Ana hareketler korunur, yardımcı setler azalır. Hedef 30–40 dakika.";
  MODE_INFO.low = "Düşük enerji günü. Ağırlığı biraz azalt, temiz ve rahat setlerle zinciri koparma.";

  const addExerciseIfMissing = exercise => {
    if (!state.exercises[exercise.id]) state.exercises[exercise.id] = normalizeExercise(exercise);
  };

  const insertAfter = (workout, afterId, exerciseId) => {
    if (!workout || workout.exerciseIds.includes(exerciseId)) return;
    const index = workout.exerciseIds.indexOf(afterId);
    workout.exerciseIds.splice(index >= 0 ? index + 1 : workout.exerciseIds.length, 0, exerciseId);
  };

  if (state.settings.uxVersion !== UX_VERSION) {
    addExerciseIfMissing(ex(
      "v3_calf_raise",
      "Leg Press Calf Raise",
      ["Baldır"],
      2, 12, 20, 40,
      "accessory", 5, 75, true,
      "Leg press platformunda yalnızca ayak bileğinden çalış. Çok hafif başla; aşilde ağrı olursa yapma.",
      "https://www.youtube.com/results?search_query=leg+press+calf+raise+proper+form"
    ));

    addExerciseIfMissing(ex(
      "v3_glute_bridge",
      "Dumbbell Glute Bridge",
      ["Kalça", "Arka Zincir"],
      3, 10, 15, 15,
      "main", 2.5, 90, false,
      "Yerde sırtüstü yat, dambılı kalça kıvrımına koy. Topuklardan it; üstte kalçayı 1 saniye sık.",
      "https://www.youtube.com/results?search_query=dumbbell+glute+bridge+proper+form",
      "high"
    ));

    const workoutA = state.workouts.find(workout => workout.id === "v2_a");
    const workoutB = state.workouts.find(workout => workout.id === "v2_b");
    insertAfter(workoutA, "v2_leg_press", "v3_calf_raise");
    insertAfter(workoutB, "v2_leg_curl", "v3_glute_bridge");

    state.settings.uxVersion = UX_VERSION;
    saveState();
  }

  const workSets = (log, ex) => {
    const completed = normalizeLog(log, ex).sets.filter(set => set.done);
    if (!completed.length || ex.type === "core") return completed;
    const maxWeight = Math.max(...completed.map(set => num(set.weight)));
    return completed.filter(set => Math.abs(num(set.weight) - maxWeight) < 0.001);
  };

  progression = function simpleProgression(ex) {
    if (ex.type === "core") {
      const last = latest(ex.id);
      const lastSeconds = last?.sets?.filter(set => set.done).map(set => int(set.reps)) || [];
      return {
        weight: 0,
        status: lastSeconds.length ? "Koru" : "Başlangıç",
        text: lastSeconds.length ? `Son süreler: ${lastSeconds.join("–")} sn.` : `${ex.repMin}–${ex.repMax} saniye kontrollü tut.`
      };
    }

    const last = latest(ex.id);
    if (!last) {
      return {
        weight: ex.weight,
        status: "Başlangıç",
        text: `${ex.repMin}–${ex.repMax} tekrar aralığında temiz formu bul.`
      };
    }

    const sets = workSets(last, ex);
    if (!sets.length) return { weight: ex.weight, status: "Başlangıç", text: "Tamamlanmış çalışma seti bulunamadı." };

    const currentWeight = Math.max(...sets.map(set => num(set.weight, ex.weight)));
    const reps = sets.map(set => int(set.reps));
    const enoughSets = sets.length >= Math.min(2, Math.max(1, int(ex.sets, 2)));
    const allAtTop = enoughSets && reps.every(rep => rep >= ex.repMax);
    const mostBelowRange = reps.filter(rep => rep < ex.repMin).length >= Math.ceil(reps.length / 2);
    const average = reps.reduce((sum, rep) => sum + rep, 0) / reps.length;

    let weight = currentWeight;
    let status = "Koru";
    let text = `${currentWeight} kg ile devam et. Son setler: ${reps.join("–")}.`;

    if (allAtTop) {
      weight = Math.round((currentWeight + ex.increment) / ex.increment) * ex.increment;
      status = "Artır";
      text = `${weight} kg dene; yeni ağırlıkta ${ex.repMin} tekrardan başlaman normal.`;
    } else if (mostBelowRange) {
      status = "Ağırlığı koru";
      text = `Önce setlerin çoğunu ${ex.repMin} tekrarın üzerine çıkar.`;
    } else if (average >= ex.repMax - 1) {
      status = "Çok yakın";
      text = `Bir antrenman daha tekrarları tamamla; sonra ${currentWeight + ex.increment} kg dene.`;
    } else if (reps.every(rep => rep >= ex.repMin)) {
      status = "İlerleme var";
      text = `Aynı kiloda tekrarları yavaş yavaş ${ex.repMax}'e taşı.`;
    }

    if (session.mode === "low" && weight > 0) {
      weight = Math.max(0, weight - ex.increment);
      status = "Bugün hafif";
      text = `${weight} kg yeterli; temiz ve rahat setler yap.`;
    }

    return { weight, status, text };
  };

  defaultSet = function simpleDefaultSet(ex, index) {
    const last = latest(ex.id);
    const recommendation = progression(ex);
    const increased = recommendation.status === "Artır";
    const previousReps = last?.sets?.[index]?.reps;
    return {
      done: false,
      weight: recommendation.weight,
      reps: increased ? ex.repMin : clamp(int(previousReps, ex.repMin), ex.repMin, ex.repMax),
      rir: null
    };
  };

  const warmupRows = ex => session.warmups?.[ex.id] || [];

  const warmupHTML = ex => {
    const rows = warmupRows(ex);
    if (!rows.length) return "";
    return `<div class="v63-warmups">
      <div class="v63-warmup-title"><span>Isınma setleri</span><button onclick="removeWarmupSet('${ex.id}')">Sonuncuyu sil</button></div>
      ${rows.map((row, index) => `<div class="v63-set-row warmup-row ${row.done ? "done" : ""}">
        <div class="v63-set-number">I${index + 1}</div>
        <div class="v63-stepper"><button onclick="nudgeWarmupSet('${ex.id}',${index},'weight',-1)">−</button><input type="number" inputmode="decimal" value="${row.weight}" onchange="updateWarmupSet('${ex.id}',${index},'weight',this.value)"><button onclick="nudgeWarmupSet('${ex.id}',${index},'weight',1)">+</button></div>
        <div class="v63-stepper"><button onclick="nudgeWarmupSet('${ex.id}',${index},'reps',-1)">−</button><input type="number" inputmode="numeric" value="${row.reps}" onchange="updateWarmupSet('${ex.id}',${index},'reps',this.value)"><button onclick="nudgeWarmupSet('${ex.id}',${index},'reps',1)">+</button></div>
        <button class="v63-done ${row.done ? "on" : ""}" onclick="toggleWarmupSet('${ex.id}',${index})">${row.done ? "✓" : "○"}</button>
      </div>`).join("")}
    </div>`;
  };

  exerciseHTML = function simplifiedExerciseHTML(ex, index, currentId) {
    const data = entry(ex);
    const setCount = plannedSets(ex);
    const completedCount = data.skipped ? 0 : Array.from({ length: setCount }, (_, i) => getSet(ex, i)).filter(set => set.done).length;
    const complete = completedCount === setCount && !data.skipped;
    const recommendation = progression(ex);
    const last = latest(ex.id);
    const lastText = last
      ? last.sets.filter(set => set.done).map(set => `${set.weight || "Vücut"}${set.weight ? " kg" : ""} × ${set.reps}`).join(" · ")
      : "Kayıt yok";

    const rows = Array.from({ length: setCount }, (_, i) => {
      const set = getSet(ex, i);
      const core = ex.type === "core";
      return `<div class="v63-set-row ${set.done ? "done" : ""}">
        <div class="v63-set-number">${i + 1}</div>
        ${core
          ? `<div class="v63-static">Vücut</div>`
          : `<div class="v63-stepper"><button onclick="nudge('${ex.id}',${i},'weight',-1)">−</button><input type="number" inputmode="decimal" value="${set.weight}" onchange="updateSet('${ex.id}',${i},'weight',this.value)"><button onclick="nudge('${ex.id}',${i},'weight',1)">+</button></div>`}
        <div class="v63-stepper"><button onclick="nudge('${ex.id}',${i},'reps',-1)">−</button><input type="number" inputmode="numeric" value="${set.reps}" onchange="updateSet('${ex.id}',${i},'reps',this.value)"><button onclick="nudge('${ex.id}',${i},'reps',1)">+</button></div>
        <button class="v63-done ${set.done ? "on" : ""}" onclick="toggleSet('${ex.id}',${i})">${set.done ? "✓" : "○"}</button>
      </div>`;
    }).join("");

    return `<section class="exercise v63-exercise ${currentId === ex.id ? "current" : ""} ${complete ? "complete" : ""} ${data.skipped ? "skipped" : ""}" id="ex-${ex.id}">
      <div class="ex-head">
        <div class="ex-no">${complete ? "✓" : index + 1}</div>
        <div class="ex-main">
          <div class="ex-name">${esc(ex.name)}</div>
          <div class="ex-note">${esc(ex.note)}</div>
          <div class="tags">${ex.muscles.map(muscle => `<span class="tag accent">${esc(muscle)}</span>`).join("")}<span class="tag blue">${setCount}×${ex.repMin}–${ex.repMax}</span><span class="tag">${ex.restSec} sn</span></div>
        </div>
        <div class="ex-score"><strong>${completedCount}/${setCount}</strong><span>set</span></div>
      </div>
      <div class="coach v63-coach"><span class="v63-status">${esc(recommendation.status)}</span><span>${esc(recommendation.text)}</span><span class="last-line">Son: ${esc(lastText)}</span></div>
      ${warmupHTML(ex)}
      <div class="v63-set-tools">
        <button onclick="addWorkingSet('${ex.id}')">＋ Set</button>
        <button onclick="removeWorkingSet('${ex.id}')">− Set</button>
        ${ex.type === "core" ? "" : `<button onclick="addWarmupSet('${ex.id}')">＋ Isınma</button>`}
      </div>
      <div class="v63-set-head"><span>Set</span><span>Kg</span><span>${ex.type === "core" ? "Saniye" : "Tekrar"}</span><span>Bitti</span></div>
      ${rows}
      <div class="ex-actions"><div><a class="link-btn" target="_blank" href="${esc(ex.video)}">▶ Form</a><button class="link-btn muted" onclick="openExerciseModal('${activeWorkout().id}','${ex.id}')">Düzenle</button></div><button class="link-btn muted" onclick="skipExercise('${ex.id}')">${data.skipped ? "Geri al" : "Bugün atla"}</button></div>
      <div class="session-note"><input class="input" value="${esc(data.note)}" placeholder="Bu harekete not ekle..." onchange="updateNote('${ex.id}',this.value)"></div>
    </section>`;
  };

  renderHistory = function simplifiedHistory() {
    const logs = state.logs.slice().reverse();
    $("historyContent").innerHTML = logs.length
      ? logs.map(log => {
          const warmupCount = Object.values(log.warmups || {}).reduce((total, rows) => total + rows.length, 0);
          return `<div class="card log-card v63-log-card">
            <div class="log-top"><div class="log-title">${esc(log.date)} · ${esc(log.workoutName)}</div><div class="log-meta">${log.duration || "?"} dk<br>${Math.round(log.totalVolume || 0)} kg</div></div>
            ${warmupCount ? `<div class="warmup-history">${warmupCount} ısınma seti</div>` : ""}
            <div class="log-body">${Object.entries(log.entries || {}).map(([id, item]) => {
              const sets = normalizeLog(item, state.exercises[id]).sets.filter(set => set.done);
              return `<div class="log-ex"><b>${esc(item.name || state.exercises[id]?.name)}</b><br>${sets.map((set, i) => `${i + 1}. set: ${set.weight ? `${set.weight} kg × ` : ""}${set.reps}`).join("<br>")}</div>`;
            }).join("")}</div>
            <button class="btn danger" onclick="deleteLog('${log.id}')">Kaydı sil</button>
          </div>`;
        }).join("")
      : `<div class="empty">Henüz antrenman kaydı yok.</div>`;
  };

  const versionLabel = document.querySelector(".version");
  if (versionLabel) versionLabel.textContent = "v6.3";
  document.title = "Antrenman Takip 6.3";
  renderAll();
})();
