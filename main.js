/* Patron Breakfast Diner — interactions
   Vanilla JS, no dependencies. Every animation is transform/opacity only
   and fully disabled under prefers-reduced-motion. */
(() => {
  'use strict';

  // ---- Config -------------------------------------------------------------
  // Paste the online ordering URL here (e.g. from the Google Business Profile).
  // Leave empty and "Order" buttons fall back to calling the diner.
  const ORDER_URL = '';
  const PHONE = 'tel:+12815494941';
  const TIMEZONE = 'America/Chicago';
  const OPEN_HOUR = 7;   // 7:00 am, every day
  const CLOSE_HOUR = 15; // 3:00 pm

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---- Order links --------------------------------------------------------
  $$('[data-order-link]').forEach((a) => {
    if (ORDER_URL) {
      a.href = ORDER_URL;
    } else {
      a.href = PHONE;
      a.removeAttribute('target');
      a.removeAttribute('rel');
    }
  });

  // ---- Hero entrance ------------------------------------------------------
  const heroImg = $('.arch img');
  const start = () => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));
  const ready = heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve();
  // Never hold the page hostage to a slow image: start after 700ms regardless.
  Promise.race([ready, new Promise((r) => setTimeout(r, 700))]).then(start);

  // ---- Open / closed status ----------------------------------------------
  function chicagoNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE, hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    return get('hour') + get('minute') / 60;
  }
  function updateStatus() {
    const h = chicagoNow();
    const open = h >= OPEN_HOUR && h < CLOSE_HOUR;
    let text;
    if (open) {
      const minsLeft = Math.round((CLOSE_HOUR - h) * 60);
      text = minsLeft <= 45 ? `Open now · closing soon (3pm)` : 'Open now · until 3pm';
    } else {
      text = h < OPEN_HOUR ? 'Closed · opens today at 7am' : 'Closed · opens tomorrow at 7am';
    }
    $$('[data-status]').forEach((el) => {
      el.classList.toggle('is-open', open);
      const t = $('[data-status-text]', el);
      if (t) t.textContent = text;
    });
  }
  updateStatus();
  setInterval(updateStatus, 60_000);

  // ---- Nav: solid on scroll, hide on scroll down, show on scroll up -------
  const nav = $('[data-nav]');
  const quickbar = $('.quickbar');
  let lastY = window.scrollY;
  let ticking = false;
  let sheetOpen = false;

  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('is-solid', y > 24);
    const goingDown = y > lastY;
    nav.classList.toggle('is-hidden', !sheetOpen && goingDown && y > 480);
    if (quickbar) quickbar.classList.toggle('is-visible', y > window.innerHeight * 0.6);
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // ---- Mobile sheet -------------------------------------------------------
  const toggle = $('[data-menu-toggle]');
  const sheet = $('[data-sheet]');
  const toggleLabel = toggle && $('.sr-only', toggle);

  function setSheet(open) {
    sheetOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggleLabel.textContent = open ? 'Close menu' : 'Open menu';
    document.body.style.overflow = open ? 'hidden' : '';
    root.classList.toggle('sheet-open', open);
    if (open) {
      sheet.hidden = false;
      nav.classList.remove('is-hidden');
      requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('is-open')));
      setTimeout(() => $('a', sheet)?.focus({ preventScroll: true }), 200);
    } else {
      sheet.classList.remove('is-open');
      const done = () => { if (!sheetOpen) sheet.hidden = true; };
      reduceMotion.matches ? done() : setTimeout(done, 640);
    }
  }
  if (toggle && sheet) {
    toggle.addEventListener('click', () => setSheet(!sheetOpen));
    $$('a', sheet).forEach((a) => a.addEventListener('click', () => setSheet(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sheetOpen) { setSheet(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1000px)').addEventListener('change', (e) => { if (e.matches && sheetOpen) setSheet(false); });
  }

  // ---- Scroll reveal ------------------------------------------------------
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  // ---- Active section in nav ---------------------------------------------
  const navLinks = $$('.nav__links a');
  if ('IntersectionObserver' in window && navLinks.length) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = byId.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((a) => a.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  // ---- Parallax (only while in view, transform-only) ---------------------
  const parallaxEls = $$('[data-parallax]');
  if (parallaxEls.length && !reduceMotion.matches && 'IntersectionObserver' in window) {
    const active = new Set();
    let raf = 0;
    const render = () => {
      raf = 0;
      const vh = window.innerHeight;
      active.forEach((el) => {
        const box = el.parentElement.getBoundingClientRect();
        const progress = (box.top + box.height / 2 - vh / 2) / (vh + box.height); // ~ -0.5 .. 0.5
        el.style.transform = `translate3d(0, ${(progress * -12).toFixed(2)}%, 0)`;
      });
    };
    const queue = () => { if (!raf && active.size) raf = requestAnimationFrame(render); };
    const pio = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? active.add(e.target) : active.delete(e.target)));
      queue();
    });
    parallaxEls.forEach((el) => pio.observe(el));
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
  }

  // ---- Marquee: pause control + pause offscreen --------------------------
  const marquee = $('[data-marquee]');
  const mToggle = $('[data-marquee-toggle]');
  if (marquee && mToggle) {
    let userPaused = false;
    mToggle.addEventListener('click', () => {
      userPaused = !userPaused;
      marquee.classList.toggle('is-paused', userPaused);
      mToggle.setAttribute('aria-pressed', String(userPaused));
      $('.sr-only', mToggle).textContent = userPaused ? 'Play scrolling text' : 'Pause scrolling text';
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        marquee.classList.toggle('is-paused', userPaused || !e.isIntersecting);
      }).observe(marquee);
    }
  }

  // ---- Menu tabs (WAI-ARIA tabs pattern) ---------------------------------
  const tabs = $('[data-tabs]');
  if (tabs) {
    const list = $('[role="tablist"]', tabs);
    const buttons = $$('[role="tab"]', tabs);
    const ink = $('.tabs__ink', tabs);

    const moveInk = (btn) => {
      if (!ink) return;
      ink.style.width = `${btn.offsetWidth}px`;
      ink.style.transform = `translateX(${btn.offsetLeft}px)`;
    };

    const select = (btn, focus = true) => {
      buttons.forEach((b) => {
        const on = b === btn;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(b.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on) {
          $$('li', panel).forEach((li, n) => li.style.setProperty('--n', n));
          panel.classList.remove('is-entering');
          void panel.offsetWidth; // restart animation
          panel.classList.add('is-entering');
        }
      });
      moveInk(btn);
      if (focus) btn.focus();
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    };

    buttons.forEach((btn, i) => {
      btn.addEventListener('click', () => select(btn, false));
      btn.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowRight') next = buttons[(i + 1) % buttons.length];
        if (e.key === 'ArrowLeft') next = buttons[(i - 1 + buttons.length) % buttons.length];
        if (e.key === 'Home') next = buttons[0];
        if (e.key === 'End') next = buttons[buttons.length - 1];
        if (next) { e.preventDefault(); select(next); }
      });
    });

    const current = () => buttons.find((b) => b.getAttribute('aria-selected') === 'true');
    // Fonts change button widths; re-measure once they're loaded and on resize.
    moveInk(current());
    document.fonts?.ready.then(() => moveInk(current()));
    window.addEventListener('resize', () => moveInk(current()), { passive: true });
    if (!ink) list.classList.add('no-ink');
  }

  // ---- Footer year --------------------------------------------------------
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
