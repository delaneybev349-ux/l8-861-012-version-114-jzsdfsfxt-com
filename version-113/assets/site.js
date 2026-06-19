(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function initMobileNavigation() {
        var toggle = document.querySelector('[data-mobile-toggle]');
        var panel = document.querySelector('[data-mobile-panel]');
        if (!toggle || !panel) {
            return;
        }
        toggle.addEventListener('click', function () {
            panel.classList.toggle('is-open');
        });
    }

    function initHeroSlider() {
        var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
        if (slides.length < 2) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, current) {
                slide.classList.toggle('is-active', current === index);
            });
            dots.forEach(function (dot, current) {
                dot.classList.toggle('is-active', current === index);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                window.clearInterval(timer);
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                start();
            });
        });

        start();
    }

    function initLocalCardFilter() {
        var input = document.querySelector('[data-card-filter]');
        if (!input) {
            return;
        }
        var cards = Array.prototype.slice.call(document.querySelectorAll('.movie-card'));
        input.addEventListener('input', function () {
            var keyword = normalize(input.value);
            cards.forEach(function (card) {
                var source = normalize(card.getAttribute('data-search'));
                card.classList.toggle('hidden-by-filter', keyword && source.indexOf(keyword) === -1);
            });
        });
    }

    function createSearchCard(item) {
        return [
            '<article class="movie-card">',
            '    <a class="card-link" href="' + item.href + '">',
            '        <div class="card-media">',
            '            <img src="' + item.cover + '" alt="' + item.title + '" loading="lazy">',
            '            <span class="year-badge">' + item.year + '</span>',
            '            <span class="play-badge">▶</span>',
            '        </div>',
            '        <div class="card-body">',
            '            <h3>' + item.title + '</h3>',
            '            <p>' + item.oneLine + '</p>',
            '            <div class="card-meta">',
            '                <span>' + item.type + '</span>',
            '                <span>' + item.category + '</span>',
            '            </div>',
            '        </div>',
            '    </a>',
            '</article>'
        ].join('');
    }

    function initSearchPage() {
        var box = document.querySelector('[data-search-results]');
        if (!box || !window.SEARCH_INDEX) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var query = normalize(params.get('q'));
        var input = document.querySelector('[data-search-page-input]');
        var title = document.querySelector('[data-search-title]');
        var subtitle = document.querySelector('[data-search-subtitle]');
        if (input) {
            input.value = params.get('q') || '';
        }
        var list = window.SEARCH_INDEX;
        var results = query
            ? list.filter(function (item) {
                return normalize([
                    item.title,
                    item.region,
                    item.type,
                    item.genre,
                    item.year,
                    item.category,
                    item.tags,
                    item.oneLine
                ].join(' ')).indexOf(query) !== -1;
            })
            : list.slice(0, 48);
        if (title) {
            title.textContent = query ? '搜索结果' : '推荐影片';
        }
        if (subtitle) {
            subtitle.textContent = query ? '已根据关键词匹配相关影片。' : '可通过顶部搜索框按关键词检索影片内容。';
        }
        box.innerHTML = results.slice(0, 120).map(createSearchCard).join('') || '<p>暂无匹配影片。</p>';
    }

    window.initMoviePlayer = function (options) {
        var video = document.getElementById(options.videoId);
        var cover = document.getElementById(options.coverId);
        var button = document.getElementById(options.buttonId);
        var source = options.source;
        var attached = false;

        if (!video || !source) {
            return;
        }

        function attachSource() {
            if (attached) {
                return;
            }
            attached = true;
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
            } else if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(source);
                hls.attachMedia(video);
                video.hlsInstance = hls;
            } else {
                video.src = source;
            }
        }

        function beginPlayback() {
            attachSource();
            if (cover) {
                cover.classList.add('is-hidden');
            }
            var playPromise = video.play();
            if (playPromise && playPromise.catch) {
                playPromise.catch(function () {
                    if (cover) {
                        cover.classList.remove('is-hidden');
                    }
                });
            }
        }

        if (cover) {
            cover.addEventListener('click', beginPlayback);
        }
        if (button) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                beginPlayback();
            });
        }
        video.addEventListener('click', function () {
            if (video.paused) {
                beginPlayback();
            } else {
                video.pause();
            }
        });
    };

    ready(function () {
        initMobileNavigation();
        initHeroSlider();
        initLocalCardFilter();
        initSearchPage();
    });
})();
