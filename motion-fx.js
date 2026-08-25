/* Lago site motion layer. Built on Motion One (motion.dev, the Framer Motion family).
   Falls back to WAAPI if the CDN is unavailable, and disables transforms entirely
   under prefers-reduced-motion. All behaviour is driven by data attributes. */
(function () {
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = [0.16, 1, 0.3, 1];
  var EASE_CSS = 'cubic-bezier(0.16,1,0.3,1)';

  /* CSS-transition tween. Writes the END state to inline style, so an element
     can never be left stuck at its start value if a frame or library misbehaves.
     keyframes: { prop: [from, to] }. */
  function anim(el, keyframes, opts) {
    opts = opts || {};
    var dur = opts.duration || 600, delay = opts.delay || 0;
    var props = [], k;
    el.style.transition = 'none';
    for (k in keyframes) { props.push(k); el.style[k] = keyframes[k][0]; }
    void el.offsetHeight;
    if (REDUCE) {
      for (k in keyframes) el.style[k] = keyframes[k][1];
      return;
    }
    el.style.transition = props.map(function (p) {
      return p + ' ' + dur + 'ms ' + EASE_CSS + ' ' + delay + 'ms';
    }).join(', ');
    for (k in keyframes) el.style[k] = keyframes[k][1];
  }

  function inView(el, cb, amount) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var fired = false;
    function run() { if (fired) return; fired = true; cb(); }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.disconnect(); run(); } });
    }, { threshold: amount == null ? 0.25 : amount, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    /* Safety net: if the observer never reports (detached root, zero-height
       element, odd scroll container), show the content anyway. */
    setTimeout(function () {
      if (fired) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) { io.disconnect(); run(); }
    }, 1600);
  }

  /* ---------- scroll ticker ---------- */
  var tickers = [];
  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      var vh = window.innerHeight;
      for (var i = 0; i < tickers.length; i++) tickers[i](vh);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- behaviours ---------- */

  function reveal(root) {
    var groups = root.querySelectorAll('[data-stagger]');
    groups.forEach(function (g) {
      var step = parseInt(g.getAttribute('data-stagger'), 10) || 70;
      var kids = Array.prototype.filter.call(g.children, function (c) {
        return !c.hasAttribute('data-no-reveal');
      });
      kids.forEach(function (c, i) { c.setAttribute('data-reveal', ''); c.dataset.revealDelay = i * step; });
    });

    root.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el.dataset.revealBound) return;
      el.dataset.revealBound = '1';
      var dy = parseInt(el.getAttribute('data-reveal-y'), 10);
      if (isNaN(dy)) dy = 26;
      var delay = parseInt(el.dataset.revealDelay, 10) || 0;
      if (REDUCE) { el.style.opacity = '1'; return; }
      el.style.opacity = '0';
      el.style.willChange = 'opacity, transform';
      inView(el, function () {
        anim(el, { opacity: [0, 1], transform: ['translateY(' + dy + 'px)', 'translateY(0px)'] },
          { duration: 760, delay: delay });
        setTimeout(function () {
          el.style.willChange = '';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0px)';
        }, 900 + delay);
      }, 0.12);
    });
  }

  function loadIn(root) {
    var els = root.querySelectorAll('[data-load]');
    if (!els.length) return;
    els.forEach(function (el, i) {
      var d = parseInt(el.getAttribute('data-load'), 10);
      if (isNaN(d)) d = i * 90;
      if (REDUCE) { el.style.opacity = '1'; return; }
      el.style.opacity = '0';
      anim(el, { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0px)'] },
        { duration: 820, delay: 120 + d });
      setTimeout(function () {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0px)';
      }, 1000 + d);
    });
  }

  function parallax(root) {
    if (REDUCE) return;
    root.querySelectorAll('[data-parallax]').forEach(function (el) {
      if (el.dataset.pxBound) return;
      el.dataset.pxBound = '1';
      var rate = parseFloat(el.getAttribute('data-parallax')) || 0.12;
      tickers.push(function (vh) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var mid = r.top + r.height / 2;
        var off = (mid - vh / 2) * -rate;
        el.style.transform = 'translate3d(0,' + off.toFixed(2) + 'px,0)';
      });
    });
    onScroll();
  }

  function magnetic(root) {
    if (REDUCE) return;
    root.querySelectorAll('[data-magnetic]').forEach(function (el) {
      if (el.dataset.magBound) return;
      el.dataset.magBound = '1';
      var pull = parseFloat(el.getAttribute('data-magnetic')) || 8;
      var lift = el.hasAttribute('data-magnetic-lift');
      el.style.transition = 'transform 420ms ' + EASE_CSS;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        el.style.transition = 'transform 120ms linear';
        el.style.transform = 'translate3d(' + (dx * pull).toFixed(1) + 'px,' +
          (dy * pull - (lift ? 6 : 0)).toFixed(1) + 'px,0)' + (lift ? ' scale(1.02)' : '');
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform 520ms ' + EASE_CSS;
        el.style.transform = 'translate3d(0,0,0)';
      });
    });
  }

  function counters(root) {
    root.querySelectorAll('[data-count]').forEach(function (el) {
      if (el.dataset.cntBound) return;
      el.dataset.cntBound = '1';
      var to = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-count-suffix') || '';
      if (REDUCE) { el.textContent = to + suffix; return; }
      el.textContent = '0' + suffix;
      inView(el, function () {
        var t0 = null, dur = 1400;
        function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min((t - t0) / dur, 1);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * e) + suffix;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = to + suffix;
        }
        requestAnimationFrame(step);
      }, 0.35);
    });
  }

  function stickySwap(root) {
    root.querySelectorAll('[data-swap-root]').forEach(function (rt) {
      if (rt.dataset.swapBound) return;
      rt.dataset.swapBound = '1';
      var steps = Array.prototype.slice.call(rt.querySelectorAll('[data-swap-step]'));
      var slides = Array.prototype.slice.call(rt.querySelectorAll('[data-swap-slide]'));
      if (!steps.length || !slides.length) return;
      var active = -1;
      function set(i) {
        if (i === active) return;
        active = i;
        slides.forEach(function (s, n) {
          var on = n === i;
          s.style.opacity = on ? '1' : '0';
          s.style.transform = on ? 'translate3d(0,0,0) scale(1)' : 'translate3d(0,' + (n < i ? -18 : 18) + 'px,0) scale(0.965)';
          s.style.zIndex = on ? '2' : '1';
          s.style.pointerEvents = on ? 'auto' : 'none';
        });
        steps.forEach(function (s, n) {
          var on = n === i;
          s.style.opacity = on ? '1' : '0.34';
          var bar = s.querySelector('[data-swap-bar]');
          if (bar) { bar.style.transform = on ? 'scaleY(1)' : 'scaleY(0.18)'; bar.style.opacity = on ? '1' : '0.5'; }
        });
      }
      slides.forEach(function (s) {
        s.style.transition = REDUCE ? 'none' : 'opacity 620ms ' + EASE_CSS + ', transform 720ms ' + EASE_CSS;
      });
      steps.forEach(function (s) {
        s.style.transition = 'opacity 420ms ease';
        var bar = s.querySelector('[data-swap-bar]');
        if (bar) { bar.style.transformOrigin = 'top'; bar.style.transition = 'transform 520ms ' + EASE_CSS + ', opacity 400ms ease'; }
        s.addEventListener('click', function () { set(steps.indexOf(s)); });
      });
      set(0);
      tickers.push(function (vh) {
        var anchor = vh * 0.45;
        var best = 0, bestD = Infinity;
        for (var i = 0; i < steps.length; i++) {
          var r = steps[i].getBoundingClientRect();
          var d = Math.abs(r.top + r.height / 2 - anchor);
          if (d < bestD) { bestD = d; best = i; }
        }
        set(best);
      });
      onScroll();
    });
  }

  function dragScroller(root) {
    root.querySelectorAll('[data-drag]').forEach(function (el) {
      if (el.dataset.dragBound) return;
      el.dataset.dragBound = '1';
      var down = false, startX = 0, startS = 0, moved = 0, vx = 0, lastX = 0, lastT = 0, raf = null;
      el.style.cursor = 'grab';
      el.addEventListener('pointerdown', function (e) {
        down = true; moved = 0; vx = 0;
        startX = e.clientX; lastX = e.clientX; lastT = performance.now();
        startS = el.scrollLeft;
        el.style.cursor = 'grabbing';
        el.style.scrollBehavior = 'auto';
        if (raf) cancelAnimationFrame(raf);
        el.setPointerCapture && el.setPointerCapture(e.pointerId);
      });
      el.addEventListener('pointermove', function (e) {
        if (!down) return;
        var dx = e.clientX - startX;
        moved = Math.abs(dx);
        el.scrollLeft = startS - dx;
        var now = performance.now();
        if (now - lastT > 8) { vx = (e.clientX - lastX) / (now - lastT); lastX = e.clientX; lastT = now; }
        e.preventDefault();
      });
      function up() {
        if (!down) return;
        down = false;
        el.style.cursor = 'grab';
        if (REDUCE || Math.abs(vx) < 0.15) return;
        var v = vx * 16;
        (function glide() {
          el.scrollLeft -= v;
          v *= 0.93;
          if (Math.abs(v) > 0.4) raf = requestAnimationFrame(glide);
        })();
      }
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
      el.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
      var prev = el.parentElement && el.parentElement.querySelector('[data-drag-prev]');
      var next = el.parentElement && el.parentElement.querySelector('[data-drag-next]');
      function page(dir) {
        var first = el.firstElementChild;
        var w = first ? first.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
        el.style.scrollBehavior = REDUCE ? 'auto' : 'smooth';
        el.scrollLeft += dir * w;
      }
      if (prev) prev.addEventListener('click', function () { page(-1); });
      if (next) next.addEventListener('click', function () { page(1); });
    });
  }

  function accordion(root) {
    root.querySelectorAll('[data-acc-item]').forEach(function (item) {
      if (item.dataset.accBound) return;
      item.dataset.accBound = '1';
      var q = item.querySelector('[data-acc-q]');
      var a = item.querySelector('[data-acc-a]');
      var mark = item.querySelector('[data-acc-mark]');
      if (!q || !a) return;
      a.style.overflow = 'hidden';
      a.style.height = '0px';
      a.style.opacity = '0';
      a.style.transition = REDUCE ? 'none' : 'height 480ms ' + EASE_CSS + ', opacity 320ms ease';
      if (mark) mark.style.transition = 'transform 420ms ' + EASE_CSS;
      var open = false;
      q.setAttribute('role', 'button');
      q.setAttribute('tabindex', '0');
      q.setAttribute('aria-expanded', 'false');
      function toggle() {
        open = !open;
        q.setAttribute('aria-expanded', String(open));
        a.style.height = open ? a.scrollHeight + 'px' : '0px';
        a.style.opacity = open ? '1' : '0';
        if (mark) mark.style.transform = open ? 'rotate(45deg)' : 'rotate(0deg)';
        item.style.background = open ? '#ffffff' : 'transparent';
      }
      q.addEventListener('click', toggle);
      q.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  function headerShrink(root) {
    var h = root.querySelector('[data-header]');
    if (!h || h.dataset.hdrBound) return;
    h.dataset.hdrBound = '1';
    h.style.transition = 'padding 320ms ' + EASE_CSS + ', box-shadow 320ms ease, background 320ms ease';
    tickers.push(function () {
      var s = window.scrollY > 24;
      h.style.paddingTop = s ? '12px' : '20px';
      h.style.paddingBottom = s ? '12px' : '20px';
      h.style.boxShadow = s ? '0 1px 24px rgba(0,0,0,0.07)' : 'none';
      h.style.background = s ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.8)';
    });
    onScroll();
  }

  function progressBar(root) {
    var p = root.querySelector('[data-progress]');
    if (!p || p.dataset.pgBound) return;
    p.dataset.pgBound = '1';
    p.style.transformOrigin = 'left';
    tickers.push(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var v = max > 0 ? window.scrollY / max : 0;
      p.style.transform = 'scaleX(' + v.toFixed(4) + ')';
    });
    onScroll();
  }

  window.LagoMotion = {
    reduce: REDUCE,
    init: function (root) {
      root = root || document;
      try {
        headerShrink(root);
        progressBar(root);
        loadIn(root);
        reveal(root);
        parallax(root);
        magnetic(root);
        counters(root);
        stickySwap(root);
        dragScroller(root);
        accordion(root);
      } catch (e) { console.warn('LagoMotion', e); }
    }
  };
})();
