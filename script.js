const htmlRoot = document.documentElement;
const body = document.body;

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const searchInput = document.getElementById("docSearch");
const themeToggle = document.getElementById("themeToggle");
const currentBreadcrumb = document.getElementById("currentBreadcrumb");
const tocCard = document.getElementById("tocCard");
const tocList = document.getElementById("tocList");
const navList = document.getElementById("navList");
const docContent = document.getElementById("docContent");

let navLinks = [];
const revealElements = Array.from(document.querySelectorAll(".reveal"));

const STORAGE_KEY = "lap-docs-theme";
const PAGES_MANIFEST = "docs/pages.json";
const SITE_NAME = "LAP-AI Enablement Documentation";

function setTheme(theme) {
  htmlRoot.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  themeToggle.querySelector(".theme-label").textContent = isDark ? "Light" : "Dark";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

function getPreferredTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY);
  if (savedTheme) {
    return savedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getCurrentSlug() {
  const params = new URLSearchParams(window.location.search);
  return (params.get("page") || "home").trim().toLowerCase();
}

function updateActiveNavBySlug(slug, title) {
  navLinks.forEach((link) => {
    const isActive = link.dataset.slug === slug;
    link.classList.toggle("active", isActive);
  });

  if (title) {
    currentBreadcrumb.textContent = title;
    document.title = `${title} | ${SITE_NAME}`;
  }
}

function closeMobileMenu() {
  sidebar.classList.remove("open");
  body.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function openMobileMenu() {
  sidebar.classList.add("open");
  body.classList.add("menu-open");
  menuToggle.setAttribute("aria-expanded", "true");
}

function setupThemeToggle() {
  setTheme(getPreferredTheme());

  themeToggle.addEventListener("click", () => {
    const currentTheme = htmlRoot.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  });
}

function setupMenuToggle() {
  menuToggle.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("open");
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMobileMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      window.innerWidth <= 900 &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMobileMenu();
    }
  });

}

function setupSearch() {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    navLinks.forEach((link) => {
      const linkText = link.textContent.toLowerCase();
      const keywords = (link.dataset.keywords || "").toLowerCase();
      const isMatch = !query || linkText.includes(query) || keywords.includes(query);
      link.parentElement.hidden = !isMatch;
    });
  });
}

function setupRevealObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    },
    { threshold: 0.18 }
  );

  revealElements.forEach((item) => observer.observe(item));
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function ensureUniqueId(base, usedIds) {
  let candidate = base || "section";
  let index = 2;
  while (usedIds.has(candidate) || document.getElementById(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  usedIds.add(candidate);
  return candidate;
}

function addHeadingAnchor(heading) {
  if (heading.querySelector(".heading-anchor")) {
    return;
  }

  const anchor = document.createElement("a");
  anchor.className = "heading-anchor";
  anchor.href = `#${heading.id}`;
  anchor.setAttribute("aria-label", `Link to ${heading.textContent}`);
  anchor.textContent = "#";
  heading.append(anchor);
}

function buildTableOfContents() {
  if (!docContent || !tocCard || !tocList) {
    return;
  }

  tocList.innerHTML = "";
  tocCard.hidden = false;

  const headings = Array.from(docContent.querySelectorAll("h1, h2, h3"));
  if (headings.length <= 1) {
    tocCard.hidden = true;
    return;
  }

  const usedIds = new Set();
  const tocTargets = [];

  headings.forEach((heading, index) => {
    if (index === 0) {
      return;
    }

    const baseId = heading.id ? heading.id : slugify(heading.textContent);
    heading.id = ensureUniqueId(baseId, usedIds);
    addHeadingAnchor(heading);

    const item = document.createElement("li");
    item.className = heading.tagName.toLowerCase() === "h3" ? "toc-sub-item" : "toc-item";

    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.replace("#", "").trim();
    link.className = "toc-link";

    item.append(link);
    tocList.append(item);
    tocTargets.push({ heading, link });
  });

  if (tocTargets.length === 0) {
    tocCard.hidden = true;
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (visible.length === 0) {
        return;
      }

      const top = visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0].target.id;
      tocTargets.forEach(({ heading, link }) => {
        link.classList.toggle("active", heading.id === top);
      });
    },
    { rootMargin: "-22% 0px -68% 0px", threshold: [0.2, 0.45, 0.8] }
  );

  tocTargets.forEach(({ heading, link }) => {
    observer.observe(heading);
    link.addEventListener("click", (event) => {
      event.preventDefault();
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${heading.id}`);
    });
  });
}

function setupHashScroll() {
  const hash = window.location.hash;
  if (!hash) {
    return;
  }

  const target = document.querySelector(hash);
  if (target) {
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }
}

function renderMarkdown(markdown) {
  if (window.marked) {
    return window.marked.parse(markdown);
  }

  const escaped = markdown
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  return `<p>${escaped}</p>`;
}

function buildNavigation(pages, activeSlug) {
  navList.innerHTML = "";

  pages.forEach((page) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.className = "nav-link";
    link.href = `index.html?page=${encodeURIComponent(page.slug)}`;
    link.textContent = page.title;
    link.dataset.slug = page.slug;
    link.dataset.keywords = page.keywords || "";

    link.addEventListener("click", () => {
      if (window.innerWidth <= 900) {
        closeMobileMenu();
      }
    });

    li.append(link);
    navList.append(li);
  });

  navLinks = Array.from(document.querySelectorAll(".nav-link"));
  setupSearch();

  const activePage = pages.find((page) => page.slug === activeSlug) || pages[0];
  updateActiveNavBySlug(activePage.slug, activePage.title);
}

async function loadManifest() {
  const manifestCandidates = [PAGES_MANIFEST, `./${PAGES_MANIFEST}`];
  let response = null;

  for (const path of manifestCandidates) {
    // Try a couple of relative manifest paths for different hosting contexts.
    response = await fetch(path, { cache: "no-store" }).catch(() => null);
    if (response && response.ok) {
      break;
    }
  }

  if (!response || !response.ok) {
    throw new Error("Unable to load pages manifest (docs/pages.json).");
  }

  const pages = await response.json();
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error("Pages manifest is empty or invalid.");
  }

  return pages;
}

async function loadPageContent(page) {
  const response = await fetch(page.file, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to load markdown file: ${page.file}`);
  }

  const markdown = await response.text();
  docContent.innerHTML = renderMarkdown(markdown);
  updateActiveNavBySlug(page.slug, page.title);
  buildTableOfContents();
  setupHashScroll();
}

async function initializeDocs() {
  try {
    if (window.location.protocol === "file:") {
      throw new Error(
        "This site cannot load markdown over file://. Start a local web server and open http://localhost:8000/index.html?page=home"
      );
    }

    const pages = await loadManifest();
    const slug = getCurrentSlug();
    const activePage = pages.find((page) => page.slug === slug) || pages[0];

    buildNavigation(pages, activePage.slug);
    await loadPageContent(activePage);
  } catch (error) {
    docContent.innerHTML = `
      <h2>Content Unavailable</h2>
      <p>Unable to load documentation content from Markdown files.</p>
      <p>${error.message}</p>
      <h3>Quick Fix</h3>
      <p>Run a local server from the repository root:</p>
      <pre><code>python -m http.server 8000</code></pre>
      <p>Then open <code>http://localhost:8000/index.html?page=home</code>.</p>
    `;
    tocCard.hidden = true;
  }
}

setupThemeToggle();
setupMenuToggle();
setupRevealObserver();
initializeDocs();
