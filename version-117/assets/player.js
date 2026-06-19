function initMoviePlayer(src) {
  var video = document.getElementById("movie-video");
  var overlay = document.getElementById("player-overlay");
  var hls = null;
  var attached = false;

  if (!video || !overlay || !src) {
    return;
  }

  function attach() {
    if (attached) {
      return;
    }
    attached = true;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      return;
    }

    video.src = src;
  }

  function start() {
    attach();
    overlay.classList.add("is-hidden");
    video.setAttribute("controls", "controls");
    var result = video.play();

    if (result && typeof result.catch === "function") {
      result.catch(function () {
        overlay.classList.remove("is-hidden");
      });
    }
  }

  overlay.addEventListener("click", start);
  video.addEventListener("click", function () {
    if (video.paused) {
      start();
    }
  });

  window.addEventListener("pagehide", function () {
    if (hls && typeof hls.destroy === "function") {
      hls.destroy();
    }
  });
}
