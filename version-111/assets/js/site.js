(function () {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-mobile-toggle]");

  function setHeaderState() {
    if (!header) {
      return;
    }
    if (window.scrollY > 18) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  if (toggle && header) {
    toggle.addEventListener("click", function () {
      header.classList.toggle("is-open");
    });
  }

  const hero = document.querySelector("[data-hero]");
  if (hero) {
    const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(hero.querySelectorAll("[data-hero-dots] button"));
    let current = 0;
    let timer = null;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function startHero() {
      stopHero();
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5600);
    }

    function stopHero() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        showSlide(dotIndex);
        startHero();
      });
    });

    hero.addEventListener("mouseenter", stopHero);
    hero.addEventListener("mouseleave", startHero);
    startHero();
  }

  setupFilters();
})();

function setupFilters() {
  const panels = Array.from(document.querySelectorAll("[data-filter-panel]"));
  panels.forEach(function (panel) {
    const section = panel.closest("section") || document;
    const grid = section.querySelector("[data-grid]");
    if (!grid) {
      return;
    }
    const cards = Array.from(grid.querySelectorAll("[data-card]"));
    const input = panel.querySelector("[data-filter-input]");
    const year = panel.querySelector("[data-filter-year]");
    const genre = panel.querySelector("[data-filter-genre]");

    function normalize(value) {
      return String(value || "").trim().toLowerCase();
    }

    function filterCards() {
      const keyword = normalize(input ? input.value : "");
      const selectedYear = normalize(year ? year.value : "");
      const selectedGenre = normalize(genre ? genre.value : "");

      cards.forEach(function (card) {
        const text = normalize(card.getAttribute("data-search"));
        const cardYear = normalize(card.getAttribute("data-year"));
        const cardGenre = normalize(card.getAttribute("data-genre"));
        const keywordMatch = !keyword || text.indexOf(keyword) !== -1;
        const yearMatch = !selectedYear || cardYear === selectedYear;
        const genreMatch = !selectedGenre || cardGenre.indexOf(selectedGenre) !== -1 || text.indexOf(selectedGenre) !== -1;
        card.classList.toggle("is-hidden", !(keywordMatch && yearMatch && genreMatch));
      });
    }

    [input, year, genre].forEach(function (control) {
      if (control) {
        control.addEventListener("input", filterCards);
        control.addEventListener("change", filterCards);
      }
    });
  });
}

function applyQueryToSearch() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";
  const input = document.querySelector("[data-filter-input]");
  if (input && query) {
    input.value = query;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function setupMoviePlayer(mediaUrl) {
  const video = document.getElementById("movie-video");
  const cover = document.querySelector("[data-player-cover]");
  let hlsInstance = null;
  let loaded = false;

  if (!video || !mediaUrl) {
    return;
  }

  function loadMedia() {
    if (loaded) {
      return;
    }
    loaded = true;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = mediaUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsInstance.loadSource(mediaUrl);
      hlsInstance.attachMedia(video);
    } else {
      video.src = mediaUrl;
    }
  }

  function playMedia() {
    loadMedia();
    if (cover) {
      cover.classList.add("is-hidden");
    }
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {});
    }
  }

  if (cover) {
    cover.addEventListener("click", playMedia);
  }

  video.addEventListener("click", function () {
    if (video.paused) {
      playMedia();
    }
  });

  video.addEventListener("play", function () {
    if (cover) {
      cover.classList.add("is-hidden");
    }
  });

  window.addEventListener("pagehide", function () {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
  });
}
