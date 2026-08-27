"use strict";

(() => {
  const PROGRAM_VERSION = "2026-08-27-v7.2.2-upper-priority";
  const versionLabel = document.querySelector(".version");
  if (versionLabel) versionLabel.textContent = "v7.2.2";
  if (typeof state === "undefined" || !state) return;
  const needsMigration = state.v72ProgramVersion !== PROGRAM_VERSION;

  if (needsMigration) {
    const raw = storage.getItem(LS_STATE);
    if (raw) storage.setItem(`${LS_STATE}_v72_yedek_${Date.now()}`, raw);
  }

  state.exercises = state.exercises || {};

  const defs = [
    {
      id:"v72_flat_db_press", name:"Flat Dumbbell Bench Press", muscles:["Göğüs","Triceps"],
      sets:3, repMin:8, repMax:8, weight:17.5, type:"main", increment:2.5, restSec:120, optional:false,
      note:"Kg alanına tek dumbbell ağırlığını gir. Omuzları geriye-aşağı sabitle; kontrollü indir, dirsekleri aşırı yana açma.",
      video:"https://www.youtube.com/results?search_query=flat+dumbbell+bench+press+proper+form", priority:"high"
    },
    {
      id:"v72_lateral_raise", name:"Dumbbell Lateral Raise", muscles:["Yan Omuz"],
      sets:3, repMin:12, repMax:12, weight:7.5, type:"accessory", increment:1, restSec:75, optional:false,
      note:"Kg alanına tek dumbbell ağırlığını gir. Savurma yapma; dirsek hafif kırık, hareketi omuzdan başlat.",
      video:"https://www.youtube.com/results?search_query=dumbbell+lateral+raise+proper+form", priority:"high"
    },
    {
      id:"v72_ez_curl", name:"EZ Bar Curl", muscles:["Biceps"],
      sets:3, repMin:8, repMax:8, weight:12.5, type:"accessory", increment:2.5, restSec:75, optional:false,
      note:"Kg alanına EZ bara eklenen toplam plaka ağırlığını gir; bar ağırlığını ayrıca sayma. Dirsekleri sabit tut.",
      video:"https://www.youtube.com/results?search_query=standing+ez+bar+curl+proper+form", priority:"normal"
    },
    {
      id:"v72_rope_pushdown", name:"Rope Triceps Pushdown", muscles:["Triceps"],
      sets:3, repMin:8, repMax:8, weight:22, type:"accessory", increment:5.5, restSec:75, optional:false,
      note:"Dirsekler gövde yanında sabit kalsın; aşağıda ipi kontrollü biçimde hafifçe iki yana aç.",
      video:"https://www.youtube.com/results?search_query=rope+triceps+pushdown+proper+form", priority:"normal"
    },
    {
      id:"v72_leg_press", name:"45° Leg Press", muscles:["Quadriceps","Kalça"],
      sets:2, repMin:12, repMax:12, weight:135, type:"main", increment:5, restSec:120, optional:false,
      note:"Bel ve kalça pedden ayrılmasın; dizleri üstte kilitleme.",
      video:"https://www.youtube.com/results?search_query=45+degree+leg+press+proper+form", priority:"normal"
    },
    {
      id:"v72_supported_row", name:"Chest Supported Row", muscles:["Orta Sırt","Biceps"],
      sets:3, repMin:8, repMax:8, weight:35, type:"main", increment:2.5, restSec:120, optional:false,
      note:"Göğüs pedden ayrılmasın; gövdeyi savurma, dirsekleri kontrollü şekilde geriye çek.",
      video:"https://www.youtube.com/results?search_query=chest+supported+row+machine+proper+form", priority:"high"
    },
    {
      id:"v72_cable_crunch", name:"Cable Crunch", muscles:["Karın"],
      sets:3, repMin:12, repMax:12, weight:20, type:"accessory", increment:2.5, restSec:60, optional:false,
      note:"Kalçadan katlanmak yerine kaburgaları pelvise doğru kapat; hareketi karınla yap.",
      video:"https://www.youtube.com/results?search_query=kneeling+cable+crunch+proper+form", priority:"normal"
    },
    {
      id:"v72_incline_db_press", name:"Incline Dumbbell Press", muscles:["Üst Göğüs","Triceps"],
      sets:3, repMin:8, repMax:8, weight:15, type:"main", increment:2.5, restSec:120, optional:false,
      note:"Kg alanına tek dumbbell ağırlığını gir. Sehpayı düşük-orta eğimde tut; omuzları geriye-aşağı sabitle.",
      video:"https://www.youtube.com/results?search_query=incline+dumbbell+press+proper+form", priority:"high"
    },
    {
      id:"v72_reverse_pec_deck", name:"Reverse Pec Deck", muscles:["Arka Omuz","Üst Sırt"],
      sets:3, repMin:12, repMax:12, weight:32, type:"accessory", increment:2.5, restSec:75, optional:false,
      note:"Göğüs pedde kalsın; kolları savurmadan yana ve geriye aç.",
      video:"https://www.youtube.com/results?search_query=reverse+pec+deck+proper+form", priority:"high"
    },
    {
      id:"v72_hammer_curl", name:"Hammer Curl", muscles:["Biceps","Brachialis","Ön Kol"],
      sets:3, repMin:10, repMax:10, weight:12.5, type:"accessory", increment:2.5, restSec:75, optional:false,
      note:"Kg alanına tek dumbbell ağırlığını gir. Nötr tutuş; dirsek sabit, gövdeyi sallama.",
      video:"https://www.youtube.com/results?search_query=dumbbell+hammer+curl+proper+form", priority:"normal"
    },
    {
      id:"v72_straight_bar_pushdown", name:"Straight-Bar Cable Triceps Pushdown", muscles:["Triceps"],
      sets:3, repMin:8, repMax:8, weight:22, type:"accessory", increment:5.5, restSec:75, optional:false,
      note:"Dirsekleri gövde yanında sabitle; omuzdan hareket etme, aşağıda tricepsi sık. Overhead extension kullanma.",
      video:"https://www.youtube.com/results?search_query=straight+bar+cable+triceps+pushdown+proper+form", priority:"normal"
    },
    {
      id:"v72_seated_leg_curl", name:"Seated Leg Curl", muscles:["Hamstring"],
      sets:3, repMin:10, repMax:10, weight:50, type:"accessory", increment:2.5, restSec:90, optional:false,
      note:"Kalçayı pedden kaldırma; negatif kısmı kontrollü yap.",
      video:"https://www.youtube.com/results?search_query=seated+leg+curl+proper+form", priority:"normal"
    },
    {
      id:"v72_back_extension", name:"Back Extension", muscles:["Lower Back","Kalça","Hamstring"],
      sets:2, repMin:12, repMax:12, weight:0, type:"accessory", increment:0, restSec:75, optional:false,
      note:"Başlangıç vücut ağırlığıdır. Belden aşırı hiperekstansiyon yapma; üstte vücudu düz hizaya getir.",
      video:"https://www.youtube.com/results?search_query=45+degree+back+extension+proper+form", priority:"normal"
    },
    {
      id:"v72_hanging_knee_raise", name:"Hanging Knee Raise", muscles:["Karın"],
      sets:3, repMin:12, repMax:12, weight:0, type:"accessory", increment:0, restSec:60, optional:false,
      note:"Başlangıç vücut ağırlığıdır. Sallanma yapma; dizleri kaldırırken pelvisi hafifçe yukarı kıvır.",
      video:"https://www.youtube.com/results?search_query=hanging+knee+raise+proper+form", priority:"normal"
    }
  ];

  if (needsMigration) {
    defs.forEach(def => {
      state.exercises[def.id] = normalizeExercise({...def});
    });

    state.workouts = [
    {
      id:"v2_a",
      name:"A Günü",
      focus:"Göğüs, yan omuz, biceps, triceps, quadriceps, orta sırt ve karın",
      exerciseIds:[
        "v72_flat_db_press",
        "v72_lateral_raise",
        "v72_ez_curl",
        "v72_rope_pushdown",
        "v72_leg_press",
        "v72_supported_row",
        "v72_cable_crunch"
      ]
    },
    {
      id:"v2_b",
      name:"B Günü",
      focus:"Üst göğüs, arka omuz, biceps, triceps, hamstring, lower back ve karın",
      exerciseIds:[
        "v72_incline_db_press",
        "v72_reverse_pec_deck",
        "v72_hammer_curl",
        "v72_straight_bar_pushdown",
        "v72_seated_leg_curl",
        "v72_back_extension",
        "v72_hanging_knee_raise"
      ]
    }
    ];

    state.v72ProgramVersion = PROGRAM_VERSION;
    state.appVersion = "7.2.2";
    saveState();
  }

  const baseProgression = progression;
  progression = function v72FixedRepProgression(ex) {
    const result = baseProgression(ex);
    if (num(ex.increment, 0) <= 0 && result.status === "Ağırlık artır") {
      return {
        ...result,
        weight: num(ex.weight, 0),
        status: "Hedef tamam",
        text: `${ex.repMax} tekrar hedefini tüm setlerde tamamladın. Formu zorlaştırmadan aynı şekilde devam et.`
      };
    }
    return result;
  };

  renderAll();
})();
