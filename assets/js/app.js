/* =========================================================
   TRAVION — App runtime
   GSAP · ScrollTrigger · Lenis · Typed.js · CountUp.js
   ========================================================= */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = window.matchMedia('(hover: none), (max-width: 991px)').matches;

  /* ---------- Preloader ---------- */
  function boot() {
    const p = document.getElementById('preloader');
    if (!p) return;
    const hide = () => setTimeout(() => p.classList.add('done'), 420);
    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide);
  }

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  function initLenis() {
    if (prefersReduced || !window.Lenis) return;
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.8
    });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------- Scroll progress bar ---------- */
  function initProgress() {
    const bar = document.getElementById('progressBar');
    if (!bar) return;
    const upd = () => {
      const h = document.documentElement;
      const height = h.scrollHeight - h.clientHeight;
      bar.style.width = height > 0 ? (h.scrollTop / height * 100) + '%' : '0%';
    };
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* ---------- Navbar scrolled state + active link ---------- */
  function initNav() {
    const nav = document.getElementById('navbar');
    const links = document.querySelectorAll('.nav-menu a[href^="#"]');
    const sections = Array.from(links).map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const onScroll = () => {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
      let active = sections[0];
      sections.forEach(s => { if (s.getBoundingClientRect().top <= 140) active = s; });
      if (active) {
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + active.id));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const burger = document.getElementById('burger');
    const menu = document.getElementById('navMenu');
    if (burger && menu) {
      burger.addEventListener('click', () => {
        burger.classList.toggle('open');
        menu.classList.toggle('open');
      });
      menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        burger.classList.remove('open'); menu.classList.remove('open');
      }));
    }
  }

  /* ---------- Smooth anchor scroll ---------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const t = document.querySelector(href);
        if (!t) return;
        e.preventDefault();
        const y = t.getBoundingClientRect().top + window.pageYOffset - 80;
        if (lenis) lenis.scrollTo(y, { duration: 1.2 });
        else if (window.gsap && window.ScrollToPlugin) gsap.to(window, { duration: 1.1, scrollTo: y, ease: 'power3.inOut' });
        else window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  /* ---------- Reveal animations (GSAP + IO fallback) ---------- */
  function initReveals() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (window.gsap && window.ScrollTrigger && !prefersReduced) {
      gsap.registerPlugin(ScrollTrigger, window.ScrollToPlugin || null);
      els.forEach(el => {
        const fromX = el.classList.contains('reveal-l') ? -50 : el.classList.contains('reveal-r') ? 50 : 0;
        const fromS = el.classList.contains('reveal-s') ? 0.9 : 1;
        gsap.fromTo(el,
          { opacity: 0, y: fromX ? 0 : 40, x: fromX, scale: fromS },
          { opacity: 1, y: 0, x: 0, scale: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
          });
      });
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.12 });
      els.forEach(el => io.observe(el));
    }
  }

  /* ---------- Typed.js hero headline ---------- */
  function initTyped() {
    const el = document.getElementById('typedText');
    if (!el || !window.Typed) return;
    new Typed(el, {
      strings: ['Ceylon', 'Sigiriya', 'Ella', 'Galle', 'Kandy', 'Mirissa', 'Yala'],
      typeSpeed: 70, backSpeed: 40, backDelay: 1800, startDelay: 500,
      loop: true, showCursor: false, smartBackspace: true
    });
  }

  /* ---------- CountUp stats ---------- */
  function initCounters() {
    const els = document.querySelectorAll('.hero-stat .n[data-count]');
    if (!els.length) return;
    const CU = (window.countUp && window.countUp.CountUp) || window.CountUp;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        if (el.dataset.done) return;
        el.dataset.done = '1';
        const target = parseFloat(el.dataset.count) || 0;
        let suffix = el.dataset.suffix || '';
        let display = target;
        if (target >= 1000) { display = target / 1000; suffix = 'K' + suffix; }
        if (CU) {
          const c = new CU(el, display, {
            duration: 2.2, useEasing: true, separator: ',', suffix: suffix,
            decimalPlaces: display % 1 === 0 ? 0 : 1
          });
          if (!c.error) c.start(); else el.textContent = display + suffix;
        } else {
          el.textContent = display + suffix;
        }
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    if (isCoarse || prefersReduced) return;
    const cur = document.getElementById('cursor');
    const dot = document.getElementById('cursorDot');
    if (!cur || !dot) return;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%,-50%)`; });
    const tick = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cur.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    };
    tick();
    const hoverables = 'a, button, .gap-card, .lit-card, .mate, .tech, .doc, .bento, .chip';
    document.querySelectorAll(hoverables).forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('hover'));
      el.addEventListener('mouseleave', () => cur.classList.remove('hover'));
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (isCoarse || prefersReduced || !window.gsap) return;
    document.querySelectorAll('.btn, .back-top, .nav-cta').forEach(b => {
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(b, { x: x * 0.22, y: y * 0.32, duration: 0.35, ease: 'power3.out' });
      });
      b.addEventListener('mouseleave', () => { gsap.to(b, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }); });
    });
  }

  /* ---------- Back to top ---------- */
  function initBackTop() {
    const bt = document.getElementById('backTop');
    if (!bt) return;
    const onScroll = () => bt.classList.toggle('show', window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Hero parallax (V2 — phone / polaroids / orbit chips) ---------- */
  function initHeroParallax() {
    if (isCoarse || prefersReduced || !window.gsap || !window.ScrollTrigger) return;
    const st = (trigger) => ({ trigger, start: 'top top', end: 'bottom top', scrub: 1 });
    if (document.querySelector('.hero-x')) {
      gsap.to('.phone-x', { yPercent: -8, scrollTrigger: st('.hero-x') });
      gsap.to('.polaroid.pol-1', { yPercent: -18, rotate: -10, scrollTrigger: st('.hero-x') });
      gsap.to('.polaroid.pol-2', { yPercent: 14, rotate: 10, scrollTrigger: st('.hero-x') });
      gsap.to('.orbit-chip', { yPercent: -6, scrollTrigger: st('.hero-x') });
      gsap.to('.hero-mesh .blob', { yPercent: 12, scrollTrigger: st('.hero-x') });
      gsap.to('.dest-ticker', { xPercent: -6, scrollTrigger: st('.hero-x') });
    }
  }

  /* ---------- Hero phone slide auto-cycle + dot nav ---------- */
  function initHeroSlides() {
    const slides = document.querySelectorAll('#phSlides .ph-slide');
    const dots = document.querySelectorAll('#phDots i');
    if (!slides.length) return;
    let idx = 0, timer = null;
    const go = (n) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    };
    const next = () => go(idx + 1);
    const start = () => { stop(); timer = setInterval(next, 4500); };
    const stop = () => { if (timer) clearInterval(timer); timer = null; };
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); start(); }));
    const stage = document.getElementById('phoneStage');
    if (stage) {
      stage.addEventListener('mouseenter', stop);
      stage.addEventListener('mouseleave', start);
    }
    go(0);
    start();
  }

  /* ---------- Phone 3D mouse tilt ---------- */
  function initPhoneTilt() {
    if (isCoarse || prefersReduced) return;
    const stage = document.getElementById('phoneStage');
    const phone = document.getElementById('phoneX');
    if (!stage || !phone) return;
    let rx = 0, ry = 0, tx = 0, ty = 0;
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tx = -py * 12; ty = px * 16;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    const tick = () => {
      rx += (tx - rx) * 0.08; ry += (ty - ry) * 0.08;
      phone.style.transform = `perspective(1400px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      requestAnimationFrame(tick);
    };
    stage.addEventListener('mousemove', onMove);
    stage.addEventListener('mouseleave', onLeave);
    tick();
  }

  /* ---------- Hero text split + entrance ---------- */
  function initSplitChars() {
    if (prefersReduced) return;
    if (window.Splitting) {
      Splitting({ target: '[data-split]', by: 'chars' });
      Splitting({ target: '[data-split-words]', by: 'words' });
    }
    if (!window.gsap) return;
    const chars = document.querySelectorAll('[data-split] .char');
    const words = document.querySelectorAll('[data-split-words] .word');
    if (chars.length) {
      gsap.from(chars, { yPercent: 110, opacity: 0, duration: 0.9, ease: 'power4.out', stagger: 0.018, delay: 0.15 });
    }
    if (words.length) {
      gsap.from(words, { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.04, delay: 0.55 });
    }
    gsap.from('.badge-live', { y: -16, opacity: 0, duration: 0.7, ease: 'power3.out' });
    gsap.from('.btn-x', { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, delay: 0.9 });
    gsap.from('.stat-x', { y: 24, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 1.1 });
    gsap.from('.phone-stage', { y: 40, opacity: 0, scale: 0.96, duration: 1.1, ease: 'power4.out', delay: 0.4 });
    gsap.from('.orbit-chip', { scale: 0.6, opacity: 0, duration: 0.8, ease: 'back.out(1.8)', stagger: 0.12, delay: 1.2 });
    gsap.from('.polaroid', { y: 30, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.15, delay: 1.3 });
  }

  /* ---------- Section-to-section transitions ---------- */
  function initSectionFX() {
    if (prefersReduced || !window.gsap || !window.ScrollTrigger) return;
    document.querySelectorAll('section, header.hero-x').forEach((sec) => {
      const h = sec.querySelector('h2, .section-title, .eyebrow');
      if (h) {
        gsap.from(h, {
          opacity: 0, y: 30, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: sec, start: 'top 82%' }
        });
      }
    });
  }

  /* ---------- Contact form (local demo — no backend) ---------- */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    const note = document.getElementById('formNote');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      if (!data.name || !data.email || !data.message) {
        note.textContent = 'Please fill in all fields.';
        note.classList.add('err');
        return;
      }
      note.classList.remove('err');
      note.textContent = 'Thanks, ' + data.name.split(' ')[0] + '! Your message is queued — we\'ll reply within 24 hours.';
      form.reset();
      setTimeout(() => { note.textContent = ''; }, 6000);
    });
  }

  /* ---------- Boot all ---------- */
  function run() {
    boot();
    initLenis();
    initProgress();
    initNav();
    initAnchors();
    initReveals();
    initTyped();
    initCounters();
    initCursor();
    initMagnetic();
    initBackTop();
    initHeroParallax();
    initHeroSlides();
    initPhoneTilt();
    initSplitChars();
    initSectionFX();
    initContactForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
