"use strict";

(() => {
  const V7_VERSION = "7.0.0";
  const V7_PROGRAM_VERSION = "2026-08-07-v7";
  const legacyFinishWorkout = finishWorkout;
  const legacyShowTab = showTab;

  function backupStateOnce() {
    if (state.v7Version === V7_VERSION) return;
    const raw = storage.getItem(LS_STATE);
    if (raw) storage.setItem(`${LS_STATE}_v7_yedek_${Date.now()}`, raw);
  }

  function updateExercise(copy, definition) {
    const current = copy.exercises[definition.id];
    if (!current) {
      copy.exercises[definition.id] = normalizeExercise({ ...definition });
      return;
    }
    const preserved = {
      weight: current.weight,
      increment: current.increment,
      note: current.note,
      video: current.video
    };
    Object.assign(current, definition);
    Object.entries(preserved).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") current[key] = value;
    });
    normalizeExercise(current);
  }

  function migrateToV7() {
    if (state.v7Version === V7_VERSION && state.v7ProgramVersion === V7_PROGRAM_VERSION) return;
    backupStateOnce();

    const copy = JSON.parse(JSON.stringify(state));
    copy.exercises = copy.exercises || {};
    copy.settings = copy.settings || {};

    const definitions = [
      {id:"v3_flat_press",name:"Converging Chest Press",muscles:["Göğüs","Triceps"],sets:3,repMin:8,repMax:12,weight:27.5,type:"main",increment:2.5,restSec:120,optional:false,note:"Yatay veya çok hafif eğimli makine. Plaka yüklü makinede kg alanına taraf başı ağırlığı gir.",video:"https://www.youtube.com/results?search_query=converging+machine+chest+press+proper+form",priority:"high"},
      {id:"v2_supported_row",name:"Chest Supported Row",muscles:["Orta Sırt","Biceps"],sets:3,repMin:8,repMax:12,weight:32.5,type:"main",increment:2.5,restSec:120,optional:false,note:"Göğüs pedden ayrılmasın; dirsekleri geriye çek, gövdeyi savurma.",video:"https://www.youtube.com/results?search_query=chest+supported+row+machine+proper+form",priority:"high"},
      {id:"v2_leg_press",name:"45° Leg Press",muscles:["Quadriceps","Kalça"],sets:2,repMin:10,repMax:15,weight:125,type:"main",increment:5,restSec:120,optional:false,note:"Bel ve kalça pedden kalkmasın; dizleri üstte kilitleme.",video:"https://www.youtube.com/results?search_query=45+degree+leg+press+proper+form",priority:"normal"},
      {id:"v3_calf_raise",name:"Leg Press Calf Raise",muscles:["Baldır"],sets:2,repMin:12,repMax:20,weight:40,type:"accessory",increment:5,restSec:75,optional:false,note:"Leg press platformunda yalnızca ayak bileğinden çalış. Aşilde ağrı olursa yapma.",video:"https://www.youtube.com/results?search_query=leg+press+calf+raise+proper+form",priority:"normal"},
      {id:"v2_lateral_raise",name:"Dumbbell Lateral Raise",muscles:["Yan Omuz"],sets:3,repMin:12,repMax:20,weight:7.5,type:"accessory",increment:1,restSec:75,optional:false,note:"Dirsek hafif kırık; savurmadan omuz hizasına yaklaş.",video:"https://www.youtube.com/results?search_query=dumbbell+lateral+raise+proper+form",priority:"high"},
      {id:"v2_db_curl",name:"EZ Bar Curl",muscles:["Biceps"],sets:3,repMin:8,repMax:12,weight:10,type:"accessory",increment:2.5,restSec:75,optional:false,note:"Kg alanına bara eklenen toplam plakayı gir; bar ağırlığını ayrıca sayma.",video:"https://www.youtube.com/results?search_query=standing+ez+bar+curl+proper+form",priority:"normal"},
      {id:"v2_pushdown",name:"Rope Triceps Pushdown",muscles:["Triceps"],sets:3,repMin:10,repMax:15,weight:16.5,type:"accessory",increment:5.5,restSec:75,optional:false,note:"Dirsekler gövde yanında sabit; altta ipi kontrollü şekilde iki yana aç.",video:"https://www.youtube.com/results?search_query=rope+triceps+pushdown+proper+form",priority:"normal"},
      {id:"v2_plank",name:"Plank (İsteğe Bağlı)",muscles:["Core"],sets:2,repMin:30,repMax:45,weight:0,type:"core",increment:0,restSec:60,optional:true,note:"Süreyi saniye olarak gir. Bel boşluğunu artırma.",video:"https://www.youtube.com/results?search_query=plank+proper+form",priority:"support"},
      {id:"v2_incline_press",name:"Incline Chest Press",muscles:["Üst Göğüs","Triceps"],sets:3,repMin:8,repMax:12,weight:15,type:"main",increment:2.5,restSec:120,optional:false,note:"Düşük-orta eğim kullan; omuzları geriye ve aşağı sabitle.",video:"https://www.youtube.com/results?search_query=incline+chest+press+machine+proper+form",priority:"high"},
      {id:"v2_neutral_pulldown",name:"Neutral Grip Lat Pulldown",muscles:["Sırt","Biceps"],sets:3,repMin:8,repMax:12,weight:45,type:"main",increment:2.5,restSec:120,optional:false,note:"Nötr veya hafif dar tutuş; kontrollü çek.",video:"https://www.youtube.com/results?search_query=neutral+grip+lat+pulldown+proper+form",priority:"high"},
      {id:"v2_leg_curl",name:"Seated Leg Curl",muscles:["Hamstring"],sets:3,repMin:10,repMax:15,weight:41,type:"accessory",increment:2.5,restSec:90,optional:false,note:"Diz eklemini makinenin dönüş noktasıyla hizala; kalçayı pedden kaldırma.",video:"https://www.youtube.com/results?search_query=seated+leg+curl+proper+form",priority:"normal"},
      {id:"v3_glute_bridge",name:"Dumbbell Glute Bridge",muscles:["Kalça","Arka Zincir"],sets:3,repMin:10,repMax:15,weight:15,type:"main",increment:2.5,restSec:90,optional:false,note:"Topuklardan it; üstte kalçayı 1 saniye sık.",video:"https://www.youtube.com/results?search_query=dumbbell+glute+bridge+proper+form",priority:"high"},
      {id:"v2_face_pull",name:"Reverse Pec Deck",muscles:["Arka Omuz","Orta Sırt"],sets:3,repMin:12,repMax:20,weight:32,type:"accessory",increment:2.5,restSec:75,optional:false,note:"Göğüs pedde; kolları savurmadan yana ve geriye aç.",video:"https://www.youtube.com/results?search_query=reverse+pec+deck+proper+form",priority:"high"},
      {id:"v2_shrug",name:"Dumbbell Shrug",muscles:["Trapez","Ön Kol"],sets:3,repMin:10,repMax:15,weight:20,type:"accessory",increment:2.5,restSec:90,optional:false,note:"Kg alanına tek dambılın ağırlığını gir. Omuzları düz yukarı kaldır.",video:"https://www.youtube.com/results?search_query=dumbbell+shrug+proper+form",priority:"high"},
      {id:"v2_hammer",name:"Hammer Curl",muscles:["Biceps","Ön Kol"],sets:3,repMin:10,repMax:15,weight:10,type:"accessory",increment:1,restSec:75,optional:false,note:"Kg alanına tek dambılın ağırlığını gir; dirsek sabit.",video:"https://www.youtube.com/results?search_query=hammer+curl+proper+form",priority:"normal"}
    ];
    definitions.forEach(definition => updateExercise(copy, definition));

    copy.workouts = [
      {id:"v2_a",name:"A Günü",focus:"Göğüs, sırt, bacak, yan omuz ve kollar",exerciseIds:["v3_flat_press","v2_supported_row","v2_leg_press","v3_calf_raise","v2_lateral_raise","v2_db_curl","v2_pushdown","v2_plank"]},
      {id:"v2_b",name:"B Günü",focus:"Üst göğüs, sırt, hamstring, kalça, arka omuz ve trapez",exerciseIds:["v2_incline_press","v2_neutral_pulldown","v2_leg_curl","v3_glute_bridge","v2_face_pull","v2_shrug","v2_hammer"]}
    ];

    if (!copy.workouts.some(workout => workout.id === copy.settings.activeWorkoutId)) copy.settings.activeWorkoutId = "v2_a";
    copy.settings.defaultMode = "normal";
    copy.v7Version = V7_VERSION;
    copy.v7ProgramVersion = V7_PROGRAM_VERSION;
    copy.appVersion = V7_VERSION;

    if (!Array.isArray(copy.logs) || !Array.isArray(copy.cardioLog) || !Array.isArray(copy.bodyWeightLog)) {
      throw new Error("v7 migration validation failed");
    }

    state = copy;
    saveState();
  }

  function completedSets(ex) {
    const last = latest(ex.id);
    return last ? normalizeLog(last, ex).sets.filter(set => set.done) : [];
  }

  function nextRepTarget(reps, ex) {
    const target = Array.from({length: ex.sets}, (_, index) => clamp(int(reps[index], ex.repMin), ex.repMin, ex.repMax));
    const candidates = target.map((rep, index) => ({rep, index})).filter(item => item.rep < ex.repMax);
    if (!candidates.length) return target;
    candidates.sort((a, b) => a.rep - b.rep || a.index - b.index);
    target[candidates[0].index] += 1;
    return target;
  }

  progression = function v7Progression(ex) {
    if (ex.type === "core") {
      const sets = completedSets(ex);
      const reps = sets.map(set => int(set.reps));
      return {
        weight: 0,
        status: reps.length ? "Koru" : "Başlangıç",
        text: reps.length ? `Son: ${reps.join(" / ")} sn.` : `${ex.repMin}–${ex.repMax} saniye kontrollü tut.`,
        targetReps: reps.length ? nextRepTarget(reps, ex) : Array(ex.sets).fill(ex.repMin)
      };
    }

    const sets = completedSets(ex);
    if (!sets.length) {
      return {weight:ex.weight,status:"Başlangıç",text:`${ex.repMin}–${ex.repMax} tekrar aralığında başla.`,targetReps:Array(ex.sets).fill(ex.repMin)};
    }

    const used = sets.slice(0, Math.max(ex.sets, sets.length));
    const weights = used.map(set => num(set.weight, ex.weight));
    const reps = used.map(set => int(set.reps, ex.repMin));
    const currentWeight = Math.max(...weights, num(ex.weight));
    const enoughSets = sets.length >= ex.sets;
    const requiredSets = sets.slice(0, ex.sets);
    const sameWeight = requiredSets.length === ex.sets && requiredSets.every(set => Math.abs(num(set.weight) - num(requiredSets[0].weight)) < 0.001);
    const allAtTop = enoughSets && sameWeight && requiredSets.every(set => int(set.reps) >= ex.repMax);

    if (allAtTop) {
      const baseWeight = num(requiredSets[0].weight, currentWeight);
      const nextWeight = Math.round((baseWeight + ex.increment) / ex.increment) * ex.increment;
      return {weight:nextWeight,status:"Ağırlık artır",text:`${nextWeight} kg ile ${ex.repMin} tekrardan başla.`,targetReps:Array(ex.sets).fill(ex.repMin)};
    }

    if (!sameWeight && enoughSets) {
      return {weight:currentWeight,status:"Kiloyu sabitle",text:`Son çalışma setlerinde farklı kilolar var. Önce tüm setleri aynı kiloda tamamla.`,targetReps:nextRepTarget(reps, ex)};
    }

    const targetReps = nextRepTarget(reps, ex);
    const displayWeight = num(requiredSets[0]?.weight, currentWeight);
    const below = reps.filter(rep => rep < ex.repMin).length;
    if (below) {
      return {weight:displayWeight,status:"Koru",text:`${displayWeight} kg · önce tüm setleri en az ${ex.repMin} tekrara çıkar.`,targetReps};
    }
    return {weight:displayWeight,status:"+1 tekrar hedefi",text:`${displayWeight} kg · son ${reps.slice(0,ex.sets).join("/")} → bugün ${targetReps.join("/")}.`,targetReps};
  };

  defaultSet = function v7DefaultSet(ex, index) {
    const recommendation = progression(ex);
    return {
      done:false,
      weight:recommendation.weight,
      reps:clamp(int(recommendation.targetReps?.[index], ex.repMin), ex.repMin, ex.repMax),
      rir:null
    };
  };

  plannedExercises = function v7PlannedExercises() {
    return workoutExercises();
  };

  function propagateWeight(ex, index, value) {
    const data = entry(ex);
    for (let i = 0; i < plannedSets(ex); i++) {
      const set = getSet(ex, i);
      if (i === index || !set.done) set.weight = value;
    }
    saveSession();
  }

  updateSet = function v7UpdateSet(id, index, field, value) {
    const ex = state.exercises[id];
    const set = getSet(ex, index);
    const parsed = Math.max(0, num(value, set[field]));
    if (field === "weight" && ex.type !== "core") propagateWeight(ex, index, parsed);
    else { set[field] = parsed; saveSession(); }
    renderWorkout();
  };

  nudge = function v7Nudge(id, index, field, direction) {
    const ex = state.exercises[id];
    const set = getSet(ex, index);
    const step = field === "weight" ? Math.max(0.5, num(ex.increment, 1)) : 1;
    const value = Math.max(0, num(set[field]) + direction * step);
    if (field === "weight" && ex.type !== "core") propagateWeight(ex, index, value);
    else { set[field] = value; saveSession(); }
    renderWorkout();
  };

  let wakeLock = null;
  async function requestWakeLock() {
    if (!state.settings?.wakeLock || !navigator.wakeLock || wakeLock) return;
    try { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => { wakeLock = null; }); } catch (_) {}
  }
  async function releaseWakeLock() {
    if (!wakeLock) return;
    try { await wakeLock.release(); } catch (_) {}
    wakeLock = null;
  }

  toggleSet = function v7ToggleSet(id, index) {
    const ex = state.exercises[id];
    const set = getSet(ex, index);
    set.done = !set.done;
    if (set.done) {
      session.v7LastCompleted = {exerciseId:id,index};
      startWorkout();
      requestWakeLock();
      if (state.settings.autoRest) startRest(ex.restSec);
      if (state.settings.vibration && navigator.vibrate) navigator.vibrate(30);
    } else if (session.v7LastCompleted?.exerciseId === id && session.v7LastCompleted?.index === index) {
      session.v7LastCompleted = null;
    }
    saveSession();
    renderWorkout();
  };

  completeNextSet = function v7CompleteNextSet() {
    const current = currentExercise();
    if (!current) return toast("Tüm setler tamam. Antrenmanı sayfanın sonundan bitirebilirsin.");
    toggleSet(current.ex.id, current.index);
    setTimeout(scrollCurrent, 60);
  };

  window.undoLastSet = function undoLastSet() {
    const last = session.v7LastCompleted;
    if (!last) return toast("Geri alınacak son set yok.");
    const ex = state.exercises[last.exerciseId];
    if (!ex) return;
    const set = getSet(ex, last.index);
    if (!set.done) return toast("Son set zaten açık.");
    set.done = false;
    session.v7LastCompleted = null;
    timer.restRunning = false;
    saveTimer();
    saveSession();
    renderWorkout();
    toast("Son set geri alındı.");
  };

  window.addRest30 = function addRest30() {
    if (timer.restRunning && timer.restEndsAt) timer.restEndsAt += 30000;
    else startRest(Math.max(30, int(timer.restTarget, 90) + 30));
    saveTimer();
    syncTimers();
  };

  function warmupMarkup(ex) {
    const rows = session.warmups?.[ex.id] || [];
    if (!rows.length) return "";
    return `<div class="v7-warmups"><div class="v7-warmup-title">Isınma <button onclick="removeWarmupSet('${ex.id}')">Sonuncuyu sil</button></div>${rows.map((row,index)=>`<div class="v7-set-row warmup-row ${row.done?"done":""}"><div class="v7-set-no">I${index+1}</div><div class="v7-stepper"><button onclick="nudgeWarmupSet('${ex.id}',${index},'weight',-1)">−</button><input type="number" inputmode="decimal" value="${row.weight}" onchange="updateWarmupSet('${ex.id}',${index},'weight',this.value)"><button onclick="nudgeWarmupSet('${ex.id}',${index},'weight',1)">+</button></div><div class="v7-stepper"><button onclick="nudgeWarmupSet('${ex.id}',${index},'reps',-1)">−</button><input type="number" inputmode="numeric" value="${row.reps}" onchange="updateWarmupSet('${ex.id}',${index},'reps',this.value)"><button onclick="nudgeWarmupSet('${ex.id}',${index},'reps',1)">+</button></div><button class="v7-done ${row.done?"on":""}" onclick="toggleWarmupSet('${ex.id}',${index})">${row.done?"✓":"○"}</button></div>`).join("")}</div>`;
  }

  exerciseHTML = function v7ExerciseHTML(ex, index, currentId) {
    const data = entry(ex);
    const setCount = plannedSets(ex);
    const sets = Array.from({length:setCount}, (_,i)=>getSet(ex,i));
    const completed = data.skipped ? 0 : sets.filter(set=>set.done).length;
    const complete = completed === setCount && !data.skipped;
    const recommendation = progression(ex);
    const previous = latest(ex.id);
    const previousSets = previous ? normalizeLog(previous,ex).sets.filter(set=>set.done) : [];

    const rows = sets.map((set,i)=>{
      const old = previousSets[i];
      const previousText = old ? (ex.type === "core" ? `${old.reps} sn` : `${old.weight} kg × ${old.reps}`) : "—";
      return `<div class="v7-set-wrap"><div class="v7-set-row ${set.done?"done":""}"><div class="v7-set-no">${i+1}</div>${ex.type==="core"?`<div class="v7-static">Vücut</div>`:`<div class="v7-stepper"><button onclick="nudge('${ex.id}',${i},'weight',-1)">−</button><input type="number" inputmode="decimal" value="${set.weight}" onchange="updateSet('${ex.id}',${i},'weight',this.value)"><button onclick="nudge('${ex.id}',${i},'weight',1)">+</button></div>`}<div class="v7-stepper"><button onclick="nudge('${ex.id}',${i},'reps',-1)">−</button><input type="number" inputmode="numeric" value="${set.reps}" onchange="updateSet('${ex.id}',${i},'reps',this.value)"><button onclick="nudge('${ex.id}',${i},'reps',1)">+</button></div><button class="v7-done ${set.done?"on":""}" onclick="toggleSet('${ex.id}',${i})">${set.done?"✓":"○"}</button></div><div class="v7-prev">Önceki: ${esc(previousText)}</div></div>`;
    }).join("");

    return `<section class="exercise v7-exercise ${currentId===ex.id?"current":""} ${complete?"complete":""} ${data.skipped?"skipped":""}" id="ex-${ex.id}"><div class="v7-ex-head"><div class="ex-no">${complete?"✓":index+1}</div><div class="v7-ex-title"><div class="ex-name">${esc(ex.name)}</div><div class="v7-range">${setCount} × ${ex.repMin}–${ex.repMax}${ex.type==="core"?" sn":""} · ${ex.restSec} sn dinlenme</div></div><div class="ex-score"><strong>${completed}/${setCount}</strong><span>set</span></div></div><div class="v7-coach"><b>${esc(recommendation.status)}</b><span>${esc(recommendation.text)}</span></div>${warmupMarkup(ex)}<div class="v7-set-head"><span>Set</span><span>Kg</span><span>${ex.type==="core"?"Saniye":"Tekrar"}</span><span>Bitti</span></div>${rows}<details class="v7-more"><summary>Diğer seçenekler</summary><div class="v7-tools">${ex.type==="core"?"":`<button onclick="addWarmupSet('${ex.id}')">+ Isınma</button>`}<button onclick="addWorkingSet('${ex.id}')">+ Set</button><button onclick="removeWorkingSet('${ex.id}')">− Set</button><a target="_blank" href="${esc(ex.video)}">Form</a><button onclick="openExerciseModal('${activeWorkout().id}','${ex.id}')">Hareketi düzenle</button><button onclick="skipExercise('${ex.id}')">${data.skipped?"Geri al":"Bugün atla"}</button></div>${ex.note?`<div class="v7-tech-note">${esc(ex.note)}</div>`:""}<input class="input" value="${esc(data.note)}" placeholder="Bu antrenmana not..." onchange="updateNote('${ex.id}',this.value)"></details></section>`;
  };

  renderWorkout = function v7RenderWorkout() {
    session.mode = "normal";
    const workout = activeWorkout();
    const count = counts();
    const current = currentExercise();
    const percent = count.total ? Math.round(count.done / count.total * 100) : 0;
    const recommendation = current ? progression(current.ex) : null;
    $("hero").innerHTML = `<div class="hero v7-hero"><div><div class="eyebrow">${esc(workout.name)} · ${count.done}/${count.total} set</div><div class="hero-name">${current?esc(current.ex.name):"Tüm setler tamam ✓"}</div><div class="hero-focus">${current?`Set ${current.index+1} · ${esc(recommendation.text)}`:"Antrenmanı sayfanın sonundaki butondan güvenle bitirebilirsin."}</div></div><div class="progress"><i style="width:${percent}%"></i></div></div>`;
    $("exerciseList").innerHTML = plannedExercises().map((ex,index)=>exerciseHTML(ex,index,current?.ex.id)).join("");
    renderLive();
    renderSelect();
    const nextButton = document.querySelector(".bottom-next");
    if (nextButton) { nextButton.disabled = !current; nextButton.textContent = current ? "Seti Bitir ✓" : "Setler Tamam ✓"; }
  };

  renderLive = function v7RenderLive() {
    const total = totals();
    $("liveMetrics").innerHTML = `<div class="metric"><div class="metric-value">${total.sets}</div><div class="metric-label">Set</div></div><div class="metric"><div class="metric-value">${Math.round(total.volume)}</div><div class="metric-label">Hacim</div></div>`;
  };

  finishWorkout = function v7FinishWorkout(force=false) {
    const count = counts();
    if (!count.done) return toast("Önce en az bir set tamamla.");
    if (!force && count.done < count.total) {
      const missing = count.total - count.done;
      return openConfirm("Eksik setler var",`${missing} set henüz tamamlanmadı. Yine de antrenmanı bitirmek istiyor musun?`,()=>v7FinishWorkout(true));
    }
    legacyFinishWorkout();
    releaseWakeLock();
  };

  function workoutForLog(log) {
    return state.workouts.find(workout => workout.id === log.workoutId)
      || state.workouts.find(workout => String(log.workoutName||"").trim().startsWith(workout.name.charAt(0)))
      || null;
  }

  renderHistory = function v7RenderHistory() {
    const logs = state.logs.slice().reverse();
    $("historyContent").innerHTML = logs.length ? logs.map(log=>`<div class="card log-card v7-history-card"><div class="log-top"><div><div class="log-title">${esc(log.date)} · ${esc(log.workoutName)}</div><div class="v7-history-sub">${log.duration||"?"} dk · ${Math.round(log.totalVolume||0)} kg hacim</div></div><button class="btn blue" onclick="openHistoryEditor('${log.id}')">Düzenle</button></div><div class="log-body">${Object.entries(log.entries||{}).map(([id,item])=>{const ex=state.exercises[id]||{};const sets=normalizeLog(item,ex).sets.filter(set=>set.done);return `<div class="log-ex"><b>${esc(item.name||ex.name||"Hareket")}</b><br>${sets.map(set=>ex.type==="core"?`${set.reps} sn`:`${set.weight} kg × ${set.reps}`).join(" · ")}</div>`}).join("")}</div><button class="btn danger v7-delete" onclick="deleteLog('${log.id}')">Kaydı sil</button></div>`).join("") : `<div class="empty">Henüz antrenman kaydı yok.</div>`;
  };

  function ensureHistoryModal() {
    if ($("historyEditModal")) return;
    document.body.insertAdjacentHTML("beforeend",`<div class="overlay" id="historyEditModal"><div class="modal v7-history-modal"><div id="historyEditBody"></div></div></div>`);
  }

  window.openHistoryEditor = function openHistoryEditor(logId) {
    ensureHistoryModal();
    const log = state.logs.find(item=>item.id===logId);
    if (!log) return toast("Kayıt bulunamadı.");
    const workout = workoutForLog(log);
    const ids = workout ? workout.exerciseIds : Object.keys(log.entries||{});
    window.v7EditingLogId = logId;
    $("historyEditBody").innerHTML = `<div class="v7-editor-head"><div><div class="modal-title">${esc(log.date)} · ${esc(log.workoutName)}</div><div class="mode-note">Eksik setleri ekleyebilir veya eski değerleri düzeltebilirsin.</div></div><button class="v7-close" onclick="closeHistoryEditor()">×</button></div><div class="field"><label>Süre (dk)</label><input class="input" id="historyDuration" type="number" inputmode="numeric" value="${int(log.duration,0)}"></div>${ids.map(id=>{const ex=state.exercises[id];if(!ex)return"";const raw=log.entries?.[id];const existing=raw?normalizeLog(raw,ex).sets:[];const count=Math.max(ex.sets,existing.length);return `<div class="v7-edit-ex" data-edit-ex="${id}"><div class="v7-edit-title">${esc(ex.name)} <span>${ex.sets}×${ex.repMin}–${ex.repMax}</span></div>${Array.from({length:count},(_,index)=>{const set=existing[index];return `<div class="v7-edit-row"><label><input type="checkbox" data-edit-done="${id}:${index}" ${set?.done?"checked":""}> ${index+1}. set</label>${ex.type==="core"?`<span class="v7-edit-static">Vücut</span>`:`<input class="input" data-edit-weight="${id}:${index}" type="number" inputmode="decimal" value="${set?num(set.weight):num(ex.weight)}" aria-label="Kilo">`}<input class="input" data-edit-reps="${id}:${index}" type="number" inputmode="numeric" value="${set?int(set.reps):ex.repMin}" aria-label="${ex.type==="core"?"Saniye":"Tekrar"}"></div>`}).join("")}</div>`}).join("")}<div class="modal-actions"><button class="btn ghost" onclick="closeHistoryEditor()">Vazgeç</button><button class="btn primary" onclick="saveHistoryEdit()">Değişiklikleri Kaydet</button></div>`;
    $("historyEditModal").classList.add("open");
  };

  window.closeHistoryEditor = function closeHistoryEditor() {
    $("historyEditModal")?.classList.remove("open");
    window.v7EditingLogId = null;
  };

  window.saveHistoryEdit = function saveHistoryEdit() {
    const logIndex = state.logs.findIndex(item=>item.id===window.v7EditingLogId);
    if (logIndex < 0) return;
    const log = state.logs[logIndex];
    const workout = workoutForLog(log);
    const ids = workout ? workout.exerciseIds : Object.keys(log.entries||{});
    storage.setItem(`${LS_STATE}_duzenleme_yedek_${Date.now()}`, JSON.stringify(state));
    const entries = {...(log.entries||{})};

    ids.forEach(id=>{
      const ex=state.exercises[id];
      if(!ex)return;
      const rows = document.querySelectorAll(`[data-edit-done^="${id}:"]`);
      const sets=[];
      rows.forEach((checkbox,index)=>{
        const key=`${id}:${index}`;
        const done=checkbox.checked;
        const weight=ex.type==="core"?0:num(document.querySelector(`[data-edit-weight="${key}"]`)?.value, ex.weight);
        const reps=int(document.querySelector(`[data-edit-reps="${key}"]`)?.value, ex.repMin);
        sets.push({done,weight,reps,rir:null});
      });
      if(sets.some(set=>set.done)) entries[id]={name:ex.name,sets,note:entries[id]?.note||""};
      else delete entries[id];
    });

    let volume=0;
    Object.entries(entries).forEach(([id,item])=>{
      const ex=state.exercises[id]||{};
      if(ex.type==="core")return;
      normalizeLog(item,ex).sets.filter(set=>set.done).forEach(set=>{volume+=num(set.weight)*int(set.reps)});
    });
    state.logs[logIndex]={...log,duration:Math.max(1,int($("historyDuration").value,log.duration||1)),entries,totalVolume:volume,editedAt:Date.now()};
    saveState();
    closeHistoryEditor();
    renderHistory();
    toast("Antrenman kaydı güncellendi.");
  };

  function exerciseSeries(id) {
    return state.logs.slice().sort((a,b)=>num(a.ts)-num(b.ts)).map(log=>{
      const raw=log.entries?.[id];
      if(!raw)return null;
      const ex=state.exercises[id]||{};
      const sets=normalizeLog(raw,ex).sets.filter(set=>set.done);
      if(!sets.length)return null;
      const weights=sets.map(set=>num(set.weight));
      return {date:log.date||log.dateISO,weight:Math.max(...weights,0),reps:sets.map(set=>int(set.reps)),totalReps:sets.reduce((sum,set)=>sum+int(set.reps),0)};
    }).filter(Boolean).slice(-8);
  }

  window.renderV7Progress = function renderV7Progress(id) {
    state.settings.progressExerciseId=id;
    saveState();
    const root=$("v7ProgressBody");
    if(!root)return;
    const ex=state.exercises[id];
    const series=exerciseSeries(id);
    if(!series.length){root.innerHTML=`<div class="empty">Bu hareket için henüz kayıt yok.</div>`;return;}
    const last=series[series.length-1];
    const previous=series[series.length-2];
    let delta="İlk kayıt";
    if(previous){
      if(last.weight>previous.weight) delta=`+${(last.weight-previous.weight).toFixed(1).replace(".0","")} kg`;
      else if(Math.abs(last.weight-previous.weight)<0.001){const d=last.totalReps-previous.totalReps;delta=`${d>=0?"+":""}${d} tekrar`;}
      else delta="Kilo değişti";
    }
    const p=progression(ex);
    root.innerHTML=`<div class="v7-progress-summary"><div><strong>${last.weight||"Vücut"}${last.weight?" kg":""}</strong><span>Son çalışma kilosu</span></div><div><strong>${esc(delta)}</strong><span>Önceki antrenmana göre</span></div></div><div class="v7-progress-target"><b>${esc(p.status)}</b>${esc(p.text)}</div><div class="v7-progress-list">${series.slice().reverse().map(item=>`<div><span>${esc(item.date)}</span><strong>${item.weight?`${item.weight} kg · `:""}${item.reps.join(" / ")}</strong></div>`).join("")}</div>`;
  };

  renderAnalysis = function v7RenderAnalysis() {
    const weekly=weekLogs();
    const ids=[...new Set(state.workouts.flatMap(workout=>workout.exerciseIds))].filter(id=>state.exercises[id]&&state.exercises[id].type!=="core");
    const selected=ids.includes(state.settings.progressExerciseId)?state.settings.progressExerciseId:ids[0];
    const weights=state.bodyWeightLog.slice().sort((a,b)=>num(a.ts)-num(b.ts));
    const lastWeight=weights.at(-1)?.weight ?? state.settings.bodyWeightKg;
    const previousWeight=weights.at(-2)?.weight;
    const weightChange=previousWeight==null?"—":`${lastWeight-previousWeight>=0?"+":""}${(lastWeight-previousWeight).toFixed(1)} kg`;
    $("analysisContent").innerHTML=`<div class="v7-summary-grid"><div class="summary-card"><strong>${weekly.length}/${state.settings.weeklyWorkoutTarget}</strong><span>Bu hafta</span></div><div class="summary-card"><strong>${lastWeight} kg</strong><span>Vücut ağırlığı · ${weightChange}</span></div></div><div class="section-title">Hareket gelişimi</div><div class="panel"><div class="field"><label>Hareket</label><select class="select" onchange="renderV7Progress(this.value)">${ids.map(id=>`<option value="${id}" ${id===selected?"selected":""}>${esc(state.exercises[id].name)}</option>`).join("")}</select></div><div id="v7ProgressBody"></div></div><div class="section-title">Kilo kaydı</div><div class="panel"><div class="v7-weight-row"><input class="input" id="v7WeightInput" type="number" inputmode="decimal" value="${state.settings.bodyWeightKg}"><button class="btn primary" onclick="v7AddWeight()">Kaydet</button></div></div>`;
    if(selected)renderV7Progress(selected);
  };

  window.v7AddWeight=function v7AddWeight(){
    const weight=num($("v7WeightInput")?.value);
    if(weight<50||weight>300)return toast("Geçerli kilo gir.");
    state.settings.bodyWeightKg=weight;
    state.bodyWeightLog.push({id:uid(),date:trDate(),dateISO:iso(),ts:Date.now(),weight});
    saveState();renderAnalysis();toast("Kilo kaydedildi.");
  };

  showTab = function v7ShowTab(tab) {
    legacyShowTab(tab);
    document.body.classList.toggle("v7-workout-tab",tab==="workout");
  };

  exportData = function v7ExportData() {
    const blob=new Blob([JSON.stringify({appVersion:V7_VERSION,state},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download=`antrenman-yedek-${iso()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),500);
  };

  function buildBottomBars() {
    const bottom=document.querySelector(".bottom-in");
    if(bottom)bottom.innerHTML=`<div class="v7-session-time"><span>Antrenman</span><strong id="workoutTimer">0:00</strong></div><button class="v7-undo" onclick="undoLastSet()" aria-label="Son seti geri al">↶</button><button class="bottom-rest" id="restTimer" onclick="toggleRest()">1:30</button><button class="v7-plus30" onclick="addRest30()">+30</button><button class="bottom-next" onclick="completeNextSet()">Seti Bitir ✓</button>`;
    const labels={workout:["🏋️","Antrenman"],history:["🕘","Geçmiş"],analysis:["📈","Gelişim"],cardio:["♥","Kardiyo"],program:["⚙️","Ayarlar"]};
    document.querySelectorAll(".tab").forEach(button=>{const item=labels[button.dataset.tab];if(item)button.innerHTML=`<span>${item[0]}</span><small>${item[1]}</small>`;});
    const finish=document.querySelector('#page-workout > .btn.primary.full');
    if(finish)finish.textContent="Antrenmanı Bitir";
  }

  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible"&&timer.workoutRunning)requestWakeLock();
  });

  try {
    migrateToV7();
    session.mode="normal";
    state.settings.defaultMode="normal";
    saveSession();
    saveState();
    buildBottomBars();
    const versionLabel=document.querySelector(".version");
    if(versionLabel)versionLabel.textContent="v7";
    document.title="Antrenman Takip 7.0";
    document.body.classList.add("v7-workout-tab");
    renderAll();
    syncTimers();
  } catch (error) {
    console.error("v7 başlatılamadı",error);
    toast("v7 yüklenemedi; mevcut veriler korunuyor.");
  }
})();
