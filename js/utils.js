export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

export function setupReveal() {
  const revealEls = qsa(".reveal");
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          entry.target.classList.add("show");
        }
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach((el) => observer.observe(el));
}

export function setupSiteChrome() {
  const header = qs(".site-header");
  const menuToggle = qs("#menuToggle");
  const mobileMenu = qs("#mobileMenu");

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 16);
  };

  window.addEventListener("scroll", updateHeader);
  updateHeader();

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("open");
      menuToggle.classList.toggle("active", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    qsa(".mobile-link", mobileMenu).forEach((link) => {
      link.addEventListener("click", () => {
        menuToggle.classList.remove("active");
        mobileMenu.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const sections = qsa("main section[id]");
  const navLinks = qsa(".nav-link");
  if (sections.length && navLinks.length) {
    const onScroll = () => {
      const current = sections.find((section) => {
        const top = section.offsetTop - 120;
        const bottom = top + section.offsetHeight;
        return window.scrollY >= top && window.scrollY < bottom;
      })?.id;

      navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        link.classList.toggle("active", href === `#${current}`);
      });
    };

    window.addEventListener("scroll", onScroll);
    onScroll();
  }
}

export function setMessage(target, text = "", type = "") {
  if (!target) return;
  target.textContent = text;
  target.className = "form-message";
  if (type) target.classList.add(type);
}

export function formatProjectCount(count) {
  const value = String(count).padStart(2, "0");
  return `${value} / ${value} selected`;
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
