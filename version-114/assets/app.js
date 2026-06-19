(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeText(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function setupMenu() {
    var toggle = $("[data-menu-toggle]");
    var panel = $("[data-menu-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
      document.body.classList.toggle("is-locked", panel.classList.contains("is-open"));
    });
    $$(".nav-link", panel).forEach(function (link) {
      link.addEventListener("click", function () {
        panel.classList.remove("is-open");
        document.body.classList.remove("is-locked");
      });
    });
  }

  function setupSearchForms() {
    $$("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        if (!input) {
          return;
        }
        var value = input.value.trim();
        if (!value) {
          event.preventDefault();
          input.focus();
          return;
        }
        input.value = value;
      });
    });
  }

  function setupBackTop() {
    var button = $("[data-back-top]");
    if (!button) {
      return;
    }
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function setupCarousel() {
    var carousel = $("[data-carousel]");
    if (!carousel) {
      return;
    }
    var slides = $$("[data-carousel-slide]", carousel);
    var dots = $$("[data-carousel-dot]", carousel);
    var prev = $("[data-carousel-prev]", carousel);
    var next = $("[data-carousel-next]", carousel);
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    start();
  }

  function setupFilters() {
    $$("[data-filter-input]").forEach(function (input) {
      var scopeId = input.getAttribute("data-filter-scope");
      var scope = scopeId ? document.getElementById(scopeId) : document;
      if (!scope) {
        return;
      }
      var cards = $$('[data-filter-text]', scope);
      input.addEventListener("input", function () {
        var value = input.value.trim().toLowerCase();
        cards.forEach(function (card) {
          var text = (card.getAttribute("data-filter-text") || "").toLowerCase();
          card.hidden = value && text.indexOf(value) === -1;
        });
      });
    });
  }

  function renderSearch() {
    var resultsBox = document.getElementById("search-results");
    if (!resultsBox || !window.SEARCH_MOVIES) {
      return;
    }
    var input = document.getElementById("search-page-input");
    var summary = document.getElementById("search-summary");
    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim();
    if (input) {
      input.value = query;
    }
    var words = query.toLowerCase().split(/\s+/).filter(Boolean);
    var list = window.SEARCH_MOVIES.filter(function (movie) {
      if (!words.length) {
        return true;
      }
      var text = [
        movie.title,
        movie.year,
        movie.region,
        movie.type,
        movie.genre,
        movie.category,
        (movie.tags || []).join(" "),
        movie.oneLine
      ].join(" ").toLowerCase();
      return words.every(function (word) {
        return text.indexOf(word) !== -1;
      });
    }).slice(0, words.length ? 160 : 48);
    if (summary) {
      summary.textContent = words.length ? "搜索结果：" + query : "热门内容推荐";
    }
    resultsBox.innerHTML = list.map(function (movie) {
      return "<article class=\"movie-card\">" +
        "<a href=\"./" + escapeText(movie.url) + "\" aria-label=\"" + escapeText(movie.title) + " 在线观看\">" +
        "<div class=\"poster-frame\">" +
        "<img src=\"" + escapeText(movie.cover) + "\" alt=\"" + escapeText(movie.title) + "\" loading=\"lazy\">" +
        "<span class=\"movie-year\">" + escapeText(movie.year) + "</span>" +
        "<span class=\"play-chip\">▶</span>" +
        "</div>" +
        "<div class=\"movie-card-body\">" +
        "<h3>" + escapeText(movie.title) + "</h3>" +
        "<p>" + escapeText(movie.oneLine) + "</p>" +
        "<div class=\"card-meta\"><span>" + escapeText(movie.type) + "</span><span>" + escapeText(movie.category) + "</span></div>" +
        "</div>" +
        "</a>" +
        "</article>";
    }).join("");
  }

  window.initMoviePlayer = function (playerId, sourceUrl) {
    var box = document.getElementById(playerId);
    if (!box) {
      return;
    }
    var video = box.querySelector("video");
    var cover = box.querySelector(".player-cover");
    var ready = false;
    var hlsInstance = null;
    if (!video || !cover) {
      return;
    }

    function attach() {
      if (ready) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = sourceUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true });
        hlsInstance.loadSource(sourceUrl);
        hlsInstance.attachMedia(video);
        box.hlsPlayer = hlsInstance;
      } else {
        video.src = sourceUrl;
      }
      ready = true;
    }

    function play() {
      attach();
      cover.classList.add("is-hidden");
      video.controls = true;
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {});
      }
    }

    cover.addEventListener("click", play);
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    video.addEventListener("ended", function () {
      if (hlsInstance && hlsInstance.detachMedia) {
        hlsInstance.detachMedia();
      }
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    setupMenu();
    setupSearchForms();
    setupBackTop();
    setupCarousel();
    setupFilters();
    renderSearch();
  });
})();
