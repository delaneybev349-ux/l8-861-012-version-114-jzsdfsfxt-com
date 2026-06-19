(function () {
    function getRoot() {
        return document.body.getAttribute('data-site-root') || '.';
    }

    function joinRoot(path) {
        var root = getRoot();
        if (root === '.' || root === './' || root === '') {
            return path;
        }
        return root.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function setupMenu() {
        var button = document.querySelector('[data-menu-button]');
        var menu = document.querySelector('[data-mobile-menu]');
        if (!button || !menu) {
            return;
        }
        button.addEventListener('click', function () {
            menu.classList.toggle('is-open');
        });
    }

    function setupHero() {
        var slider = document.querySelector('[data-hero-slider]');
        if (!slider) {
            return;
        }
        var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
        if (slides.length <= 1) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(next) {
            index = (next + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                var next = Number(dot.getAttribute('data-hero-dot')) || 0;
                show(next);
                start();
            });
        });

        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', start);
        start();
    }

    function setupInlineFilter() {
        var input = document.querySelector('[data-page-filter]');
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
        if (!input || cards.length === 0) {
            return;
        }
        input.addEventListener('input', function () {
            var q = normalize(input.value);
            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-tags')
                ].join(' '));
                card.style.display = !q || haystack.indexOf(q) !== -1 ? '' : 'none';
            });
        });
    }

    function movieCardHtml(movie) {
        var root = getRoot();
        var base = root === '.' ? '' : root.replace(/\/$/, '') + '/';
        var tags = (movie.tags || []).slice(0, 2).map(function (tag) {
            return '<span class="meta-badge">' + escapeHtml(tag) + '</span>';
        }).join('');
        return [
            '<article class="movie-card">',
            '  <a href="' + base + movie.detailPath + '" class="poster-link" aria-label="观看 ' + escapeHtml(movie.title) + '">',
            '    <span class="poster-frame">',
            '      <img src="' + base + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
            '      <span class="poster-shade"></span>',
            '      <span class="poster-play">▶</span>',
            '    </span>',
            '  </a>',
            '  <div class="movie-card-body">',
            '    <a class="movie-title" href="' + base + movie.detailPath + '">' + escapeHtml(movie.title) + '</a>',
            '    <p class="movie-one-line">' + escapeHtml(movie.oneLine || '') + '</p>',
            '    <div class="movie-meta">',
            '      <span class="meta-badge year">' + escapeHtml(movie.year || '') + '</span>',
            '      <span class="meta-badge">' + escapeHtml(movie.region || '') + '</span>',
            '      <span class="meta-badge">' + escapeHtml(movie.type || '') + '</span>',
            tags,
            '    </div>',
            '  </div>',
            '</article>'
        ].join('');
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function setupGlobalSearch() {
        var input = document.querySelector('[data-global-search]');
        var results = document.querySelector('[data-search-results]');
        var status = document.querySelector('[data-search-status]');
        if (!input || !results || !status || !window.MOVIE_SEARCH_DATA) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var initial = params.get('q') || '';
        input.value = initial;

        function render() {
            var q = normalize(input.value);
            if (!q) {
                results.innerHTML = '';
                status.textContent = '输入关键词后显示匹配结果。';
                return;
            }
            var matched = window.MOVIE_SEARCH_DATA.filter(function (movie) {
                var haystack = normalize([
                    movie.title,
                    movie.region,
                    movie.type,
                    movie.year,
                    movie.genreRaw,
                    (movie.tags || []).join(' '),
                    movie.oneLine
                ].join(' '));
                return haystack.indexOf(q) !== -1;
            }).slice(0, 120);
            status.textContent = matched.length ? '已显示匹配结果。' : '没有找到匹配内容，可尝试更换关键词。';
            results.innerHTML = matched.map(movieCardHtml).join('');
        }

        input.addEventListener('input', render);
        render();
    }

    var hlsLoadingPromise = null;

    function loadHlsLibrary() {
        if (window.Hls) {
            return Promise.resolve(window.Hls);
        }
        if (hlsLoadingPromise) {
            return hlsLoadingPromise;
        }
        hlsLoadingPromise = new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
            script.async = true;
            script.onload = function () {
                resolve(window.Hls);
            };
            script.onerror = function () {
                reject(new Error('hls-load-failed'));
            };
            document.head.appendChild(script);
        });
        return hlsLoadingPromise;
    }

    function setupPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('.js-player'));
        players.forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('[data-play-button]');
            var message = player.querySelector('[data-player-message]');
            if (!video) {
                return;
            }
            var src = video.getAttribute('data-src');
            var hlsInstance = null;
            var initialized = false;

            function showMessage(text) {
                if (!message) {
                    return;
                }
                message.textContent = text;
                message.classList.add('is-visible');
                window.setTimeout(function () {
                    message.classList.remove('is-visible');
                }, 2600);
            }

            function bindNative() {
                video.src = src;
                initialized = true;
                return Promise.resolve();
            }

            function bindHls(HlsConstructor) {
                if (!HlsConstructor || !HlsConstructor.isSupported()) {
                    return bindNative();
                }
                hlsInstance = new HlsConstructor({
                    enableWorker: true,
                    lowLatencyMode: false
                });
                hlsInstance.loadSource(src);
                hlsInstance.attachMedia(video);
                hlsInstance.on(HlsConstructor.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        showMessage('播放连接正在恢复，请稍后重试。');
                        if (data.type === HlsConstructor.ErrorTypes.NETWORK_ERROR) {
                            hlsInstance.startLoad();
                        } else if (data.type === HlsConstructor.ErrorTypes.MEDIA_ERROR) {
                            hlsInstance.recoverMediaError();
                        }
                    }
                });
                initialized = true;
                return Promise.resolve();
            }

            function initialize() {
                if (initialized) {
                    return Promise.resolve();
                }
                if (!src) {
                    showMessage('当前影片暂未绑定播放源。');
                    return Promise.reject(new Error('no-source'));
                }
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    return bindNative();
                }
                return loadHlsLibrary().then(bindHls).catch(function () {
                    return bindNative();
                });
            }

            function play() {
                initialize().then(function () {
                    return video.play();
                }).then(function () {
                    player.classList.add('is-playing');
                }).catch(function () {
                    showMessage('浏览器阻止了自动播放，请再次点击播放。');
                });
            }

            if (button) {
                button.addEventListener('click', play);
            }
            video.addEventListener('click', function () {
                if (video.paused) {
                    play();
                }
            });
            video.addEventListener('play', function () {
                player.classList.add('is-playing');
            });
            video.addEventListener('pause', function () {
                player.classList.remove('is-playing');
            });
            window.addEventListener('beforeunload', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupMenu();
        setupHero();
        setupInlineFilter();
        setupGlobalSearch();
        setupPlayers();
    });
})();
