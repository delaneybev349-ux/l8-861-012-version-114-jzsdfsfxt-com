(function() {
    const header = document.querySelector("[data-header]");
    const menuButton = document.querySelector("[data-menu-toggle]");
    const mobilePanel = document.querySelector("[data-mobile-panel]");

    function updateHeader() {
        if (!header) {
            return;
        }
        if (window.scrollY > 20) {
            header.classList.add("is-scrolled");
        } else {
            header.classList.remove("is-scrolled");
        }
    }

    updateHeader();
    window.addEventListener("scroll", updateHeader);

    if (menuButton && mobilePanel && header) {
        menuButton.addEventListener("click", function() {
            mobilePanel.classList.toggle("is-open");
            header.classList.toggle("is-open", mobilePanel.classList.contains("is-open"));
        });
    }

    document.querySelectorAll("[data-search-form]").forEach(function(form) {
        form.addEventListener("submit", function(event) {
            event.preventDefault();
            const input = form.querySelector("input[name='q']");
            const value = input ? input.value.trim() : "";
            const action = form.getAttribute("action") || "search.html";
            const target = value ? action + "?q=" + encodeURIComponent(value) : action;
            window.location.href = target;
        });
    });

    const hero = document.querySelector("[data-hero]");
    if (hero) {
        const slides = Array.from(hero.querySelectorAll("[data-hero-slide]"));
        const dots = Array.from(hero.querySelectorAll("[data-hero-dot]"));
        let active = 0;

        function showSlide(index) {
            active = (index + slides.length) % slides.length;
            slides.forEach(function(slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === active);
            });
            dots.forEach(function(dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === active);
            });
        }

        dots.forEach(function(dot) {
            dot.addEventListener("click", function() {
                const index = Number(dot.getAttribute("data-hero-dot") || 0);
                showSlide(index);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function() {
                showSlide(active + 1);
            }, 5000);
        }
    }

    const resultsNode = document.querySelector("[data-search-results]");
    const pageSearchForm = document.querySelector("[data-search-page-form]");
    if (resultsNode && window.SITE_MOVIES) {
        const params = new URLSearchParams(window.location.search);
        const queryInput = pageSearchForm ? pageSearchForm.querySelector("input[name='q']") : null;
        const titleNode = document.querySelector("[data-search-title]");
        let query = params.get("q") || "";
        let category = params.get("category") || "";
        let year = params.get("year") || "";

        if (queryInput) {
            queryInput.value = query;
        }

        function movieCard(movie) {
            const tags = (movie.tags || []).slice(0, 3).map(function(tag) {
                return "<span>" + escapeHtml(tag) + "</span>";
            }).join("");
            return "<article class=\"movie-card\">" +
                "<a class=\"poster-link\" href=\"movie/" + movie.file + "\">" +
                    "<img src=\"" + movie.cover + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\">" +
                    "<span class=\"poster-shade\"></span>" +
                    "<span class=\"movie-type\">" + escapeHtml(movie.type) + "</span>" +
                    "<span class=\"movie-year\">" + escapeHtml(movie.year) + "</span>" +
                    "<span class=\"poster-play\">▶</span>" +
                "</a>" +
                "<div class=\"movie-card-body\">" +
                    "<p class=\"card-meta\">" + escapeHtml(movie.region) + " · " + escapeHtml(movie.categoryLabel) + "</p>" +
                    "<h3><a href=\"movie/" + movie.file + "\">" + escapeHtml(movie.title) + "</a></h3>" +
                    "<p class=\"card-line\">" + escapeHtml(trimText(movie.oneLine, 90)) + "</p>" +
                    "<div class=\"card-tags\">" + tags + "</div>" +
                "</div>" +
            "</article>";
        }

        function escapeHtml(value) {
            return String(value).replace(/[&<>\"']/g, function(char) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "\"": "&quot;",
                    "'": "&#39;"
                }[char];
            });
        }

        function trimText(value, length) {
            const text = String(value || "").replace(/\s+/g, " ").trim();
            return text.length > length ? text.slice(0, length - 1) + "…" : text;
        }

        function setActiveButtons() {
            document.querySelectorAll("[data-filter-category]").forEach(function(button) {
                button.classList.toggle("is-active", button.getAttribute("data-filter-category") === category);
            });
            document.querySelectorAll("[data-filter-year]").forEach(function(button) {
                button.classList.toggle("is-active", button.getAttribute("data-filter-year") === year);
            });
        }

        function renderResults() {
            const normalized = query.trim().toLowerCase();
            const list = window.SITE_MOVIES.filter(function(movie) {
                const haystack = [movie.title, movie.region, movie.type, movie.year, movie.genreRaw, movie.oneLine, movie.summary, (movie.tags || []).join(" ")].join(" ").toLowerCase();
                const queryOk = !normalized || haystack.indexOf(normalized) !== -1;
                const categoryOk = !category || movie.category === category;
                const yearOk = !year || movie.year === year;
                return queryOk && categoryOk && yearOk;
            }).slice(0, 120);

            if (titleNode) {
                titleNode.textContent = query ? "“" + query + "” 的搜索结果" : "搜索结果";
            }
            resultsNode.innerHTML = list.length ? list.map(movieCard).join("") : "<div class=\"empty-state\"><h3>未找到相关内容</h3><p>换个关键词或筛选条件再试试。</p></div>";
            setActiveButtons();
        }

        function updateUrl() {
            const next = new URLSearchParams();
            if (query) {
                next.set("q", query);
            }
            if (category) {
                next.set("category", category);
            }
            if (year) {
                next.set("year", year);
            }
            const suffix = next.toString();
            history.replaceState(null, "", suffix ? "search.html?" + suffix : "search.html");
        }

        if (pageSearchForm) {
            pageSearchForm.addEventListener("submit", function(event) {
                event.preventDefault();
                query = queryInput ? queryInput.value.trim() : "";
                updateUrl();
                renderResults();
            });
        }

        document.querySelectorAll("[data-filter-category]").forEach(function(button) {
            button.addEventListener("click", function() {
                category = button.getAttribute("data-filter-category") || "";
                updateUrl();
                renderResults();
            });
        });

        document.querySelectorAll("[data-filter-year]").forEach(function(button) {
            button.addEventListener("click", function() {
                year = button.getAttribute("data-filter-year") || "";
                updateUrl();
                renderResults();
            });
        });

        renderResults();
    }
})();
