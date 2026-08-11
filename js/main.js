/* ============================================================
   Tue Minh Cao — Personal Website
   Main JavaScript
   ============================================================ */

// ── Mobile navigation ──────────────────────────────────────
const menuBtn = document.querySelector('.nav-menu-btn');
const navLinks = document.querySelector('.nav-links');

menuBtn?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  menuBtn.classList.toggle('is-open', isOpen);
  menuBtn.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    menuBtn?.classList.remove('is-open');
    menuBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// ── Active section in nav ──────────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

if (sections.length && navAnchors.length) {
  const sectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navAnchors.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
          });
        }
      });
    },
    {
      rootMargin: `-${56 + 16}px 0px -55% 0px`,
      threshold: 0,
    }
  );
  sections.forEach(s => sectionObserver.observe(s));
}

// Blog filtering lives in js/blog.js — it owns the post data.

// ── Keep citation tooltips inside the viewport ─────────────
// Posts render asynchronously, so bind after blog.js signals it is done.
function wireCiteTooltips() {
  document.querySelectorAll('.cite').forEach(cite => {
    const tooltip = cite.querySelector('.cite-tooltip');
    if (!tooltip || cite.dataset.wired) return;
    cite.dataset.wired = '1';

    cite.addEventListener('mouseenter', () => {
      tooltip.style.transform = 'translateX(-50%)';
      const rect = tooltip.getBoundingClientRect();
      if (rect.left < 8) {
        tooltip.style.transform = `translateX(calc(-50% + ${8 - rect.left}px))`;
      } else if (rect.right > window.innerWidth - 8) {
        tooltip.style.transform = `translateX(calc(-50% - ${rect.right - window.innerWidth + 8}px))`;
      }
    });

    cite.addEventListener('mouseleave', () => { tooltip.style.transform = ''; });
  });
}

wireCiteTooltips();
document.addEventListener('post:rendered', wireCiteTooltips);

// ── Year in footer copyright ───────────────────────────────
document.querySelectorAll('.copyright-year').forEach(el => {
  el.textContent = new Date().getFullYear();
});
