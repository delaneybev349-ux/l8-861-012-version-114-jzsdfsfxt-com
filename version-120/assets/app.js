const formatTime = function (seconds) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
};

const safeText = function (value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const initMobileMenu = function () {
  const button = document.querySelector(".mobile-menu-button");
  const panel = document.querySelector(".mobile-panel");
  if (!button || !panel) {
    return;
  }
  button.addEventListener("click", function () {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
  });
};

const initHeroCarousel = function () {
  const carousel = document.querySelector("[data-hero-carousel]");
  if (!carousel) {
    return;
  }
  const slides = Array.from(carousel.querySelectorAll(".hero-slide"));
  const dots = Array.from(carousel.querySelectorAll(".hero-dot"));
  if (slides.length <= 1) {
    return;
  }
  let current = 0;
  const show = function (index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("active", slideIndex === current);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("active", dotIndex === current);
    });
  };
  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      show(Number(dot.dataset.slide || 0));
    });
  });
  setInterval(function () {
    show(current + 1);
  }, 5000);
};

const initCardFilters = function () {
  document.querySelectorAll("[data-card-filter]").forEach(function (input) {
    const scope = input.closest("main") || document;
    const grid = scope.querySelector("[data-card-grid]");
    const count = scope.querySelector("[data-filter-count]");
    if (!grid) {
      return;
    }
    const cards = Array.from(grid.querySelectorAll("[data-filter-text]"));
    const update = function () {
      const keyword = input.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach(function (card) {
        const matched = !keyword || (card.dataset.filterText || "").includes(keyword);
        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });
      if (count) {
        count.textContent = `${visible} 部影片`;
      }
    };
    input.addEventListener("input", update);
  });
};

const initPlayers = async function () {
  const players = Array.from(document.querySelectorAll("[data-player]"));
  if (!players.length) {
    return;
  }
  let Hls = null;
  try {
    const module = await import("./hls-dru42stk.js");
    Hls = module.H;
  } catch (error) {
    Hls = null;
  }
  players.forEach(function (player) {
    const video = player.querySelector("video");
    const coverButton = player.querySelector(".player-cover-button");
    const playButton = player.querySelector(".player-play");
    const muteButton = player.querySelector(".player-mute");
    const fullButton = player.querySelector(".player-fullscreen");
    const progress = player.querySelector(".player-progress");
    const time = player.querySelector(".player-time");
    const stream = video ? video.dataset.stream : "";
    if (!video || !stream) {
      return;
    }
    if (Hls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(stream);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream;
    }
    const refresh = function () {
      const duration = video.duration || 0;
      const current = video.currentTime || 0;
      if (progress) {
        progress.max = duration || 0;
        progress.value = current || 0;
      }
      if (time) {
        time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
      }
    };
    const setPlaying = function (playing) {
      player.classList.toggle("playing", playing);
      if (playButton) {
        playButton.textContent = playing ? "❚❚" : "▶";
        playButton.setAttribute("aria-label", playing ? "暂停" : "播放");
      }
    };
    const togglePlay = function () {
      if (video.paused) {
        video.play().then(function () {
          setPlaying(true);
        }).catch(function () {
          setPlaying(false);
        });
      } else {
        video.pause();
        setPlaying(false);
      }
    };
    if (coverButton) {
      coverButton.addEventListener("click", togglePlay);
    }
    if (playButton) {
      playButton.addEventListener("click", togglePlay);
    }
    video.addEventListener("click", togglePlay);
    video.addEventListener("play", function () {
      setPlaying(true);
    });
    video.addEventListener("pause", function () {
      setPlaying(false);
    });
    video.addEventListener("timeupdate", refresh);
    video.addEventListener("loadedmetadata", refresh);
    if (muteButton) {
      muteButton.addEventListener("click", function () {
        video.muted = !video.muted;
        muteButton.textContent = video.muted ? "🔇" : "🔊";
      });
    }
    if (progress) {
      progress.addEventListener("input", function () {
        video.currentTime = Number(progress.value || 0);
        refresh();
      });
    }
    if (fullButton) {
      fullButton.addEventListener("click", function () {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (player.requestFullscreen) {
          player.requestFullscreen();
        }
      });
    }
  });
};

const movieCardTemplate = function (movie) {
  const tags = (movie.tags || []).slice(0, 3).map(function (tag) {
    return `<span>${safeText(tag)}</span>`;
  }).join("");
  return `
<article class="movie-card" data-filter-text="${safeText(movie.searchText || "")}">
  <a class="card-link" href="${safeText(movie.url)}" aria-label="观看 ${safeText(movie.title)}">
    <div class="poster-frame">
      <img class="poster-img" src="${safeText(movie.cover)}" alt="${safeText(movie.title)}" loading="lazy" onerror="this.closest('.poster-frame').classList.add('image-fallback'); this.remove();">
      <div class="poster-backdrop">国产影视库</div>
      <div class="poster-gradient"></div>
      <span class="year-pill">${safeText(movie.year)}</span>
      <span class="play-hover">▶</span>
    </div>
    <div class="card-body">
      <div class="card-meta">
        <span class="badge">${safeText(movie.category)}</span>
        <span>${safeText(movie.type)}</span>
      </div>
      <h2>${safeText(movie.title)}</h2>
      <p>${safeText(movie.oneLine)}</p>
      <div class="tag-row">${tags}</div>
    </div>
  </a>
</article>`;
};

const initSearchPage = function () {
  const root = document.getElementById("search-page");
  if (!root || !Array.isArray(window.MOVIES)) {
    return;
  }
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");
  const category = document.getElementById("categoryFilter");
  const type = document.getElementById("typeFilter");
  const year = document.getElementById("yearFilter");
  const results = document.getElementById("searchResults");
  const count = document.getElementById("searchCount");
  const params = new URLSearchParams(window.location.search);
  const types = Array.from(new Set(window.MOVIES.map(function (movie) {
    return movie.type;
  }).filter(Boolean))).sort();
  const years = Array.from(new Set(window.MOVIES.map(function (movie) {
    return movie.year;
  }).filter(Boolean))).sort().reverse();
  types.forEach(function (value) {
    type.insertAdjacentHTML("beforeend", `<option value="${safeText(value)}">${safeText(value)}</option>`);
  });
  years.forEach(function (value) {
    year.insertAdjacentHTML("beforeend", `<option value="${safeText(value)}">${safeText(value)}</option>`);
  });
  input.value = params.get("q") || "";
  const render = function () {
    const keyword = input.value.trim().toLowerCase();
    const categoryValue = category.value;
    const typeValue = type.value;
    const yearValue = year.value;
    const matched = window.MOVIES.filter(function (movie) {
      const keywordMatched = !keyword || (movie.searchText || "").includes(keyword);
      const categoryMatched = !categoryValue || movie.category === categoryValue;
      const typeMatched = !typeValue || movie.type === typeValue;
      const yearMatched = !yearValue || movie.year === yearValue;
      return keywordMatched && categoryMatched && typeMatched && yearMatched;
    });
    count.textContent = `找到 ${matched.length} 部影片`;
    results.innerHTML = matched.map(movieCardTemplate).join("");
  };
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    render();
  });
  [input, category, type, year].forEach(function (element) {
    element.addEventListener("input", render);
    element.addEventListener("change", render);
  });
  render();
};

initMobileMenu();
initHeroCarousel();
initCardFilters();
initPlayers();
initSearchPage();
