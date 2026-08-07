"use strict";

(() => {
  const baseExerciseHTML = exerciseHTML;

  exerciseHTML = function v7ExerciseHTMLWithVideo(ex, index, currentId) {
    let html = baseExerciseHTML(ex, index, currentId);

    // Form bağlantısını ikincil "Diğer seçenekler" menüsünden kaldır.
    html = html.replace(/<a target="_blank" href="[^"]*">Form<\/a>/, "");

    if (!ex.video) return html;

    const videoLink = `<a class="v7-youtube-link" target="_blank" rel="noopener noreferrer" href="${esc(ex.video)}" aria-label="${esc(ex.name)} hareket videosunu YouTube'da aç"><span class="v7-youtube-icon" aria-hidden="true">▶</span><span class="v7-youtube-copy"><strong>Hareket Videosu</strong><small>YouTube'da formunu gör</small></span><span class="v7-youtube-arrow" aria-hidden="true">›</span></a>`;

    return html.replace(/(<div class="v7-coach">[\s\S]*?<\/div>)/, `$1${videoLink}`);
  };

  renderWorkout();
})();
