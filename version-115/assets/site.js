(function () {
  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback);
  }

  function initMobileMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var mobileNav = document.querySelector(".mobile-nav");
    if (!toggle || !mobileNav) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initHero() {
    var carousel = document.querySelector("[data-hero-carousel]");
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
    if (slides.length <= 1) {
      return;
    }
    var index = 0;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
      });
    });
    setInterval(function () {
      show(index + 1);
    }, 5600);
  }

  function initSearchForms() {
    var forms = document.querySelectorAll(".site-search-form");
    forms.forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = form.querySelector("input[name='q'], input[type='search']");
        var query = input ? input.value.trim() : "";
        var target = form.getAttribute("action") || "./library.html";
        if (query) {
          window.location.href = target + "?q=" + encodeURIComponent(query);
        } else {
          window.location.href = target;
        }
      });
    });
  }

  function initFilters() {
    var areas = document.querySelectorAll("[data-filter-area]");
    areas.forEach(function (area) {
      var section = area.closest("section") || document;
      var grid = section.querySelector("[data-filter-grid]");
      if (!grid) {
        return;
      }
      var input = area.querySelector(".filter-input");
      var selects = Array.prototype.slice.call(area.querySelectorAll(".filter-select"));
      var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-movie-card]"));
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get("q") || "";
      if (input && initialQuery) {
        input.value = initialQuery;
      }
      function apply() {
        var query = input ? input.value.trim().toLowerCase() : "";
        var selectValues = selects.map(function (select) {
          return {
            key: select.getAttribute("data-filter-key"),
            value: select.value
          };
        });
        cards.forEach(function (card) {
          var searchText = (card.getAttribute("data-search") || "").toLowerCase();
          var matchedQuery = !query || searchText.indexOf(query) !== -1;
          var matchedSelects = selectValues.every(function (item) {
            return !item.value || card.getAttribute("data-" + item.key) === item.value;
          });
          card.classList.toggle("is-filter-hidden", !(matchedQuery && matchedSelects));
        });
      }
      if (input) {
        input.addEventListener("input", apply);
      }
      selects.forEach(function (select) {
        select.addEventListener("change", apply);
      });
      apply();
    });
  }

  function enhanceImages() {
    var images = document.querySelectorAll("img");
    images.forEach(function (image) {
      image.addEventListener("error", function () {
        image.classList.add("image-hidden");
      }, { once: true });
    });
  }

  window.initMoviePlayer = function (source) {
    var video = document.getElementById("movie-player");
    var cover = document.getElementById("player-cover");
    if (!video || !source) {
      return;
    }
    var stream = null;
    function bind() {
      if (video.getAttribute("data-ready") === "1") {
        return;
      }
      video.setAttribute("data-ready", "1");
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        stream = new Hls({ maxBufferLength: 40 });
        stream.loadSource(source);
        stream.attachMedia(video);
      } else {
        video.src = source;
      }
    }
    function start() {
      bind();
      if (cover) {
        cover.classList.add("is-hidden");
      }
      video.controls = true;
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    }
    if (cover) {
      cover.addEventListener("click", start);
    }
    video.addEventListener("click", function () {
      if (video.getAttribute("data-ready") !== "1") {
        start();
      }
    });
    window.addEventListener("beforeunload", function () {
      if (stream) {
        stream.destroy();
      }
    });
  };

  ready(function () {
    initMobileMenu();
    initHero();
    initSearchForms();
    initFilters();
    enhanceImages();
  });
})();
