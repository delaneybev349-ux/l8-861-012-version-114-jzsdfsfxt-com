(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var index = parseInt(dot.getAttribute("data-hero-dot"), 10);
        show(index);
        restart();
      });
    });
    show(0);
    restart();
  }

  function setupFilters() {
    var bars = Array.prototype.slice.call(document.querySelectorAll("[data-filter-bar]"));
    bars.forEach(function (bar) {
      var searchInput = bar.querySelector("[data-card-search]");
      var regionSelect = bar.querySelector("[data-card-region]");
      var list = document.querySelector("[data-card-list]");
      if (!list) {
        return;
      }
      var cards = Array.prototype.slice.call(list.querySelectorAll(".movie-card"));

      function apply() {
        var keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
        var region = regionSelect ? regionSelect.value.trim() : "";
        cards.forEach(function (card) {
          var text = [
            card.getAttribute("data-title") || "",
            card.getAttribute("data-tags") || "",
            card.getAttribute("data-year") || "",
            card.getAttribute("data-category") || "",
            card.getAttribute("data-region") || ""
          ].join(" ").toLowerCase();
          var cardRegion = card.getAttribute("data-region") || "";
          var visible = (!keyword || text.indexOf(keyword) !== -1) && (!region || cardRegion.indexOf(region) !== -1);
          card.classList.toggle("is-hidden", !visible);
        });
      }

      if (searchInput) {
        searchInput.addEventListener("input", apply);
      }
      if (regionSelect) {
        regionSelect.addEventListener("change", apply);
      }
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q");
      if (q && searchInput) {
        searchInput.value = q;
        apply();
      }
    });
  }

  window.initMoviePlayer = function (videoId, source, buttonId, frameId) {
    var video = document.getElementById(videoId);
    var button = document.getElementById(buttonId);
    var frame = document.getElementById(frameId);
    var attached = false;
    var hls = null;

    function attach() {
      if (!video || attached) {
        return;
      }
      attached = true;
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }

    function play() {
      if (!video) {
        return;
      }
      attach();
      if (frame) {
        frame.classList.add("has-started");
      }
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {
          if (frame) {
            frame.classList.remove("has-started");
          }
        });
      }
    }

    attach();
    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        play();
      });
    }
    if (frame) {
      frame.addEventListener("click", function (event) {
        if (event.target === frame) {
          play();
        }
      });
    }
    if (video) {
      video.addEventListener("play", function () {
        if (frame) {
          frame.classList.add("has-started");
        }
      });
    }
    window.addEventListener("pagehide", function () {
      if (hls && typeof hls.destroy === "function") {
        hls.destroy();
      }
    });
  };

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
})();
