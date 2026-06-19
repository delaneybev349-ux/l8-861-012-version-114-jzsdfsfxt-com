
(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function initHero() {
    var slider = document.querySelector('[data-hero-slider]');
    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
    var current = 0;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
      });
    });

    window.setInterval(function () {
      show(current + 1);
    }, 5000);
  }

  function initRails() {
    document.querySelectorAll('[data-rail]').forEach(function (rail) {
      var track = rail.querySelector('[data-rail-track]');
      var left = rail.querySelector('[data-rail-left]');
      var right = rail.querySelector('[data-rail-right]');
      if (!track) {
        return;
      }
      if (left) {
        left.addEventListener('click', function () {
          track.scrollBy({ left: -420, behavior: 'smooth' });
        });
      }
      if (right) {
        right.addEventListener('click', function () {
          track.scrollBy({ left: 420, behavior: 'smooth' });
        });
      }
    });
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initFilters() {
    document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
      var section = panel.closest('section') || document;
      var cards = Array.prototype.slice.call(section.querySelectorAll('[data-movie-card]'));
      var keyword = panel.querySelector('[data-filter-keyword]');
      var year = panel.querySelector('[data-filter-year]');
      var type = panel.querySelector('[data-filter-type]');
      var region = panel.querySelector('[data-filter-region]');
      var count = panel.querySelector('[data-visible-count]');
      var params = new URLSearchParams(window.location.search);
      var initialQuery = params.get('q');

      if (initialQuery && keyword) {
        keyword.value = initialQuery;
      }

      function matches(card) {
        var q = normalize(keyword && keyword.value);
        var y = normalize(year && year.value);
        var t = normalize(type && type.value);
        var r = normalize(region && region.value);
        var haystack = normalize([
          card.dataset.title,
          card.dataset.year,
          card.dataset.type,
          card.dataset.region,
          card.dataset.genre,
          card.dataset.tags,
          card.textContent
        ].join(' '));

        if (q && haystack.indexOf(q) === -1) {
          return false;
        }
        if (y && normalize(card.dataset.year) !== y) {
          return false;
        }
        if (t && normalize(card.dataset.type) !== t) {
          return false;
        }
        if (r && normalize(card.dataset.region) !== r) {
          return false;
        }
        return true;
      }

      function apply() {
        var visible = 0;
        cards.forEach(function (card) {
          var ok = matches(card);
          card.hidden = !ok;
          if (ok) {
            visible += 1;
          }
        });
        if (count) {
          count.textContent = String(visible);
        }
      }

      [keyword, year, type, region].forEach(function (control) {
        if (control) {
          control.addEventListener('input', apply);
          control.addEventListener('change', apply);
        }
      });

      apply();
    });
  }

  ready(function () {
    initHero();
    initRails();
    initFilters();
  });
})();
