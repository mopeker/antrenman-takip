"use strict";

(() => {
  const PROGRAM_VERSION = "2026-08-27-v7.2.3-max8-nonleg";
  const versionLabel = document.querySelector(".version");
  if (versionLabel) versionLabel.textContent = "v7.2.3";
  if (typeof state === "undefined" || !state) return;
  if (state.v723ProgramVersion === PROGRAM_VERSION) return;

  const raw = storage.getItem(LS_STATE);
  if (raw) storage.setItem(`${LS_STATE}_v723_yedek_${Date.now()}`, raw);

  const updates = {
    v72_flat_db_press: {repMin:8, repMax:8, weight:17.5},
    v72_lateral_raise: {repMin:8, repMax:8, weight:10},
    v72_ez_curl: {repMin:8, repMax:8, weight:17.5},
    v72_rope_pushdown: {repMin:8, repMax:8, weight:22},
    v72_leg_press: {repMin:12, repMax:12, weight:135},
    v72_supported_row: {repMin:8, repMax:8, weight:42.5},
    v72_cable_crunch: {repMin:8, repMax:8, weight:20},
    v72_incline_db_press: {repMin:8, repMax:8, weight:15},
    v72_reverse_pec_deck: {repMin:8, repMax:8, weight:36},
    v72_hammer_curl: {repMin:8, repMax:8, weight:15},
    v72_straight_bar_pushdown: {repMin:8, repMax:8, weight:22},
    v72_seated_leg_curl: {repMin:10, repMax:10, weight:50},
    v72_back_extension: {repMin:8, repMax:8, weight:0},
    v72_hanging_knee_raise: {repMin:8, repMax:8, weight:0}
  };

  Object.entries(updates).forEach(([id, patch]) => {
    const ex = state.exercises?.[id];
    if (!ex) return;
    Object.assign(ex, patch);
    normalizeExercise(ex);
  });

  state.v723ProgramVersion = PROGRAM_VERSION;
  state.appVersion = "7.2.3";
  saveState();
  renderAll();
})();
