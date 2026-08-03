"use strict";

(() => {
  const PROGRAM_VERSION = "2026-08-03-final-2";

  const finalExercises = {
    v3_flat_press: ex(
      "v3_flat_press",
      "Converging Chest Press (Makine)",
      ["Göğüs", "Triceps"],
      3, 8, 12, 27.5,
      "main", 2.5, 120, false,
      "Yatay veya çok hafif eğimli makineyi kullan. Plaka yüklü makinede kg alanına taraf başı ağırlığı gir.",
      "https://www.youtube.com/results?search_query=converging+machine+chest+press+proper+form",
      "high"
    ),
    v2_supported_row: ex(
      "v2_supported_row",
      "Chest Supported Row (Makine)",
      ["Orta Sırt", "Biceps"],
      3, 8, 12, 32.5,
      "main", 2.5, 120, false,
      "Göğüs pedden ayrılmasın; dirsekleri geriye çek, gövdeyi savurma.",
      "https://www.youtube.com/results?search_query=chest+supported+row+machine+proper+form",
      "high"
    ),
    v2_leg_press: ex(
      "v2_leg_press",
      "45° Leg Press",
      ["Quadriceps", "Kalça"],
      2, 10, 15, 125,
      "main", 5, 120, false,
      "Bel ve kalça pedden kalkmasın; dizleri üstte kilitleme.",
      "https://www.youtube.com/results?search_query=45+degree+leg+press+proper+form"
    ),
    v2_lateral_raise: ex(
      "v2_lateral_raise",
      "Dumbbell Lateral Raise",
      ["Yan Omuz"],
      3, 12, 20, 7.5,
      "accessory", 1, 75, false,
      "Dirsek hafif kırık; savurmadan omuz hizasına yaklaş.",
      "https://www.youtube.com/results?search_query=dumbbell+lateral+raise+proper+form",
      "high"
    ),
    v2_db_curl: ex(
      "v2_db_curl",
      "EZ Bar Curl",
      ["Biceps"],
      3, 8, 12, 10,
      "accessory", 2.5, 75, true,
      "Kg alanına bara eklenen toplam plakayı gir; bar ağırlığını ayrıca sayma.",
      "https://www.youtube.com/results?search_query=standing+ez+bar+curl+proper+form"
    ),
    v2_pushdown: ex(
      "v2_pushdown",
      "Rope Triceps Pushdown",
      ["Triceps"],
      3, 10, 15, 16.5,
      "accessory", 5.5, 75, true,
      "Dirsekler gövde yanında sabit; altta ipi kontrollü şekilde iki yana aç.",
      "https://www.youtube.com/results?search_query=rope+triceps+pushdown+proper+form"
    ),
    v2_plank: ex(
      "v2_plank",
      "Plank (İsteğe Bağlı)",
      ["Core"],
      2, 30, 45, 0,
      "core", 0, 60, true,
      "Süreyi tekrar alanına saniye olarak gir. Bel boşluğunu artırma.",
      "https://www.youtube.com/results?search_query=plank+proper+form",
      "support"
    ),
    v2_incline_press: ex(
      "v2_incline_press",
      "Incline Chest Press (Makine)",
      ["Üst Göğüs", "Triceps"],
      3, 8, 12, 15,
      "main", 2.5, 120, false,
      "Düşük-orta eğim kullan; omuzları geriye ve aşağı sabitle. Ağrı yapan açıya zorlama.",
      "https://www.youtube.com/results?search_query=incline+chest+press+machine+proper+form",
      "high"
    ),
    v2_neutral_pulldown: ex(
      "v2_neutral_pulldown",
      "Neutral Grip Lat Pulldown",
      ["Sırt", "Biceps"],
      3, 8, 12, 45,
      "main", 2.5, 120, false,
      "Nötr veya hafif dar tutuş; barı göğsün üstüne kontrollü çek.",
      "https://www.youtube.com/results?search_query=neutral+grip+lat+pulldown+proper+form",
      "high"
    ),
    v2_leg_curl: ex(
      "v2_leg_curl",
      "Seated Leg Curl",
      ["Hamstring"],
      3, 10, 15, 41,
      "accessory", 2.5, 90, false,
      "Diz eklemini makinenin dönüş noktasıyla hizala; kalçayı pedden kaldırma.",
      "https://www.youtube.com/results?search_query=seated+leg+curl+proper+form"
    ),
    v2_face_pull: ex(
      "v2_face_pull",
      "Reverse Pec Deck",
      ["Arka Omuz", "Orta Sırt"],
      3, 12, 20, 32,
      "accessory", 2.5, 75, false,
      "Göğüs pedde; kolları savurmadan yana ve geriye aç.",
      "https://www.youtube.com/results?search_query=reverse+pec+deck+proper+form",
      "high"
    ),
    v2_shrug: ex(
      "v2_shrug",
      "Dumbbell Shrug",
      ["Trapez", "Ön Kol"],
      3, 10, 15, 20,
      "accessory", 2.5, 90, false,
      "Kg alanına tek dambılın ağırlığını gir. Omuzları düz yukarı kaldır; çevirmeden indir.",
      "https://www.youtube.com/results?search_query=dumbbell+shrug+proper+form",
      "high"
    ),
    v2_hammer: ex(
      "v2_hammer",
      "Hammer Curl",
      ["Biceps", "Ön Kol"],
      3, 10, 15, 10,
      "accessory", 1, 75, true,
      "Kg alanına tek dambılın ağırlığını gir; dirsek sabit, negatif kontrollü.",
      "https://www.youtube.com/results?search_query=hammer+curl+proper+form"
    ),
    v3_overhead_extension: ex(
      "v3_overhead_extension",
      "Overhead Rope Triceps Extension",
      ["Triceps"],
      3, 10, 15, 13.5,
      "accessory", 5.5, 75, true,
      "Dirsekleri mümkün olduğunca sabit tut; omuzda rahatsızlık olursa hareketi atla.",
      "https://www.youtube.com/results?search_query=overhead+rope+triceps+extension+proper+form"
    )
  };

  const finalWorkouts = [
    {
      id: "v2_a",
      name: "A Günü",
      focus: "Göğüs, orta sırt, bacak, yan omuz ve kollar",
      exerciseIds: [
        "v3_flat_press",
        "v2_supported_row",
        "v2_leg_press",
        "v2_lateral_raise",
        "v2_db_curl",
        "v2_pushdown",
        "v2_plank"
      ]
    },
    {
      id: "v2_b",
      name: "B Günü",
      focus: "Üst göğüs, sırt, hamstring, arka omuz, trapez ve kollar",
      exerciseIds: [
        "v2_incline_press",
        "v2_neutral_pulldown",
        "v2_leg_curl",
        "v2_face_pull",
        "v2_shrug",
        "v2_hammer",
        "v3_overhead_extension"
      ]
    }
  ];

  const hasFinalStructure = Boolean(
    state.exercises?.v3_flat_press &&
    state.exercises?.v3_overhead_extension &&
    state.workouts?.some(workout => workout.id === "v2_a") &&
    state.workouts?.some(workout => workout.id === "v2_b")
  );

  if (state.programVersion !== PROGRAM_VERSION && !hasFinalStructure) {
    Object.entries(finalExercises).forEach(([id, exercise]) => {
      state.exercises[id] = normalizeExercise(exercise);
    });

    state.workouts = finalWorkouts;

    if (!finalWorkouts.some(workout => workout.id === state.settings.activeWorkoutId)) {
      state.settings.activeWorkoutId = "v2_a";
    }

    resetSession();
    toast("Güncel A/B programı yüklendi.");
  }

  state.programVersion = PROGRAM_VERSION;
  saveState();

  const versionLabel = document.querySelector(".version");
  if (versionLabel) versionLabel.textContent = "v6.2";
  renderAll();
})();
