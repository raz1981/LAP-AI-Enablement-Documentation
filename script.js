const htmlRoot = document.documentElement;
const body = document.body;

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const searchInput = document.getElementById("docSearch");
const themeToggle = document.getElementById("themeToggle");
const currentBreadcrumb = document.getElementById("currentBreadcrumb");
const tocCard = document.getElementById("tocCard");
const tocList = document.getElementById("tocList");

const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const revealElements = Array.from(document.querySelectorAll(".reveal"));

const STORAGE_KEY = "lap-docs-theme";

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

function normalizePath(pathname) {
  const clean = pathname.split("/").pop() || "index.html";
  return clean.toLowerCase() || "index.html";
}

function updateActiveNavByPath() {
  const currentPage = normalizePath(window.location.pathname);

  navLinks.forEach((link) => {
    const linkPage = normalizePath(link.getAttribute("href") || "");
    const isActive = currentPage === linkPage;
    link.classList.toggle("active", isActive);
    if (isActive) {
      currentBreadcrumb.textContent = link.textContent.trim();
    }
  });
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

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 900) {
        closeMobileMenu();
      }
    });
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
  const article = document.querySelector(".doc-article");
  if (!article || !tocCard || !tocList) {
    return;
  }

  const headings = Array.from(article.querySelectorAll("h2, h3"));
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

setupThemeToggle();
setupMenuToggle();
setupSearch();
setupRevealObserver();
updateActiveNavByPath();
buildTableOfContents();
setupHashScroll();
