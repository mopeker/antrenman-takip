"use strict";

(() => {
  const PATCH_VERSION = "2026-08-07-b-straight-bar-triceps";
  const EXERCISE_ID = "v7_straight_bar_pushdown";

  if (!window.state || state.v7BTricepsPatch === PATCH_VERSION) return;

  const raw = storage.getItem(LS_STATE);
  if (raw) storage.setItem(`${LS_STATE}_b_triceps_yedek_${Date.now()}`, raw);

  if (!state.exercises[EXERCISE_ID]) {
    state.exercises[EXERCISE_ID] = normalizeExercise({
      id: EXERCISE_ID,
      name: "Straight-Bar Cable Triceps Pushdown",
      muscles: ["Triceps"],
      sets: 3,
      repMin: 10,
      repMax: 15,
      weight: 16.5,
      type: "accessory",
      increment: 5.5,
      restSec: 60,
      optional: false,
      note: "Kablo makinesinde düz metal bar kullan. Dirsekler gövde yanında sabit kalsın; barı kontrollü şekilde aşağı it.",
      video: "https://www.youtube.com/results?search_query=straight+bar+cable+triceps+pushdown+proper+form",
      priority: "normal"
    });
  }

  const workout = state.workouts.find(item => item.id === "v2_b");
  if (workout) {
    const ids = workout.exerciseIds.filter(id => id !== EXERCISE_ID);
    const hammerIndex = ids.indexOf("v2_hammer");
    ids.splice(hammerIndex >= 0 ? hammerIndex : ids.length, 0, EXERCISE_ID);
    workout.exerciseIds = ids;
    workout.focus = "Üst göğüs, sırt, hamstring, kalça, arka omuz, trapez, triceps ve biceps";
  }

  state.v7BTricepsPatch = PATCH_VERSION;
  saveState();
  renderAll();
})();
