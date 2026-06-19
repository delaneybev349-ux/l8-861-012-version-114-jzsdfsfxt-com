(function () {
  var menuButton = document.querySelector(".menu-toggle");
  var panel = document.querySelector(".mobile-panel");

  if (menuButton && panel) {
    menuButton.addEventListener("click", function () {
      var isOpen = panel.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
  var current = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("is-active", slideIndex === current);
    });
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle("is-active", dotIndex === current);
    });
  }

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      var index = parseInt(dot.getAttribute("data-slide") || "0", 10);
      showSlide(index);
    });
  });

  if (slides.length > 1) {
    setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  document.querySelectorAll(".movie-filter-page").forEach(function (panelNode) {
    var search = panelNode.querySelector(".js-card-search");
    var year = panelNode.querySelector(".js-year-filter");
    var type = panelNode.querySelector(".js-type-filter");
    var grid = panelNode.nextElementSibling ? panelNode.nextElementSibling.querySelector(".movie-grid") : null;
    var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll(".movie-card")) : [];

    function applyFilter() {
      var keyword = search ? search.value.trim().toLowerCase() : "";
      var selectedYear = year ? year.value : "";
      var selectedType = type ? type.value : "";

      cards.forEach(function (card) {
        var haystack = [
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year"),
          card.getAttribute("data-tags")
        ].join(" ").toLowerCase();
        var ok = true;

        if (keyword && haystack.indexOf(keyword) === -1) {
          ok = false;
        }
        if (selectedYear && card.getAttribute("data-year") !== selectedYear) {
          ok = false;
        }
        if (selectedType && card.getAttribute("data-type") !== selectedType) {
          ok = false;
        }

        card.classList.toggle("is-hidden-card", !ok);
      });
    }

    [search, year, type].forEach(function (control) {
      if (control) {
        control.addEventListener("input", applyFilter);
        control.addEventListener("change", applyFilter);
      }
    });
  });

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  var searchInput = document.getElementById("site-search-input");
  var searchResults = document.getElementById("search-results");
  var emptySearch = document.getElementById("empty-search");

  if (searchInput && searchResults && Array.isArray(window.MOVIE_SEARCH_INDEX)) {
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    searchInput.value = initial;

    function renderSearch() {
      var keyword = searchInput.value.trim().toLowerCase();
      var source = window.MOVIE_SEARCH_INDEX;
      var results = source.filter(function (movie) {
        if (!keyword) {
          return false;
        }
        return movie.searchText.toLowerCase().indexOf(keyword) !== -1;
      }).slice(0, 96);

      searchResults.innerHTML = results.map(function (movie) {
        return [
          '<article class="movie-card">',
          '<a class="poster-wrap" href="./' + escapeHtml(movie.file) + '" aria-label="' + escapeHtml(movie.title) + '">',
          '<img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" decoding="async">',
          '<span class="poster-shade"></span>',
          '<span class="play-pill">立即播放</span>',
          '</a>',
          '<div class="movie-card-body">',
          '<div class="card-meta"><span>' + escapeHtml(movie.year) + '</span><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>',
          '<h2><a href="./' + escapeHtml(movie.file) + '">' + escapeHtml(movie.title) + '</a></h2>',
          '<p>' + escapeHtml(movie.oneLine) + '</p>',
          '<div class="tag-row"><span>' + escapeHtml(movie.category) + '</span></div>',
          '</div>',
          '</article>'
        ].join("");
      }).join("");

      emptySearch.textContent = keyword && !results.length ? "暂无匹配影片。" : (!keyword ? "输入关键词后查看匹配影片。" : "");
    }

    searchInput.addEventListener("input", renderSearch);
    renderSearch();
  }
})();
