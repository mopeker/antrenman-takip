"use strict";

(() => {
  const PROGRAM_UPDATE = "6.4.0-triceps-swap";
  const NEW_ID = "v4_single_arm_pushdown";
  const OLD_ID = "v3_overhead_extension";

  if (state.tricepsSwapVersion !== PROGRAM_UPDATE) {
    if (!state.exercises[NEW_ID]) {
      state.exercises[NEW_ID] = normalizeExercise(ex(
        NEW_ID,
        "Single-Arm Cable Triceps Pushdown",
        ["Triceps"],
        3, 10, 15, 5.5,
        "accessory", 2.5, 75, true,
        "Tek sap kullan. Dirseği gövdene sabitle; kolu aşağı doğru aç. Sağ ve solu ayrı tamamla.",
        "https://www.youtube.com/results?search_query=single+arm+cable+triceps+pushdown+proper+form"
      ));
    }

    const workoutB = state.workouts.find(workout => workout.id === "v2_b");
    if (workoutB) {
      const oldIndex = workoutB.exerciseIds.indexOf(OLD_ID);
      const newIndex = workoutB.exerciseIds.indexOf(NEW_ID);

      if (oldIndex >= 0) {
        workoutB.exerciseIds[oldIndex] = NEW_ID;
      } else if (newIndex < 0) {
        workoutB.exerciseIds.push(NEW_ID);
      }

      workoutB.exerciseIds = workoutB.exerciseIds.filter((id, index, ids) => ids.indexOf(id) === index);
    }

    // Eski hareket ve geçmiş kayıtları özellikle silinmez.
    state.tricepsSwapVersion = PROGRAM_UPDATE;
    saveState();
  }

  const versionLabel = document.querySelector(".version");
  if (versionLabel) versionLabel.textContent = "v6.4";
  document.title = "Antrenman Takip 6.4";
  renderAll();
})();
