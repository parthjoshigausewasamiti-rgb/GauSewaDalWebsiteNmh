document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Sticky nav blur on scroll ---------- */
  const nav = document.getElementById('mainNav');
  const backTop = document.getElementById('backTop');

  document.querySelectorAll(".media-card__video video, .hero__bg-video").forEach(v => {
    v.muted = true;
    v.play().catch(err => console.log("Autoplay blocked:", err));
  });

  /* ---------- Precisely measure header height (fixes any gap above hero) ---------- */
  const topbar = document.querySelector('.topbar');
  const setHeaderHeight = () => {
    const h = (topbar?.offsetHeight || 0) + (nav?.offsetHeight || 0);
    document.documentElement.style.setProperty('--header-h', h + 'px');
  };
  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight);
  window.addEventListener('load', setHeaderHeight);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(setHeaderHeight);
  }
  let resizeDebounce;
  document.addEventListener('scroll', () => {
    clearTimeout(resizeDebounce);
    resizeDebounce = setTimeout(setHeaderHeight, 150);
  }, { passive: true });

  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
    if (window.scrollY > 500) backTop.classList.add('is-visible');
    else backTop.classList.remove('is-visible');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Mobile menu ---------- */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('is-open');
    navLinks.classList.toggle('is-open');
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    hamburger.classList.remove('is-open');
    navLinks.classList.remove('is-open');
  }));

  /* ---------- Language dropdown ---------- */
  const langSwitch = document.getElementById('langSwitch');
  const langBtn = document.getElementById('langBtn');
  const langMenu = document.getElementById('langMenu');
  langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langSwitch.classList.toggle('is-open');
  });
  langMenu.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      langMenu.querySelectorAll('li').forEach(x => x.classList.remove('is-active'));
      li.classList.add('is-active');
      langBtn.firstChild.textContent = li.textContent + ' ';
      langSwitch.classList.remove('is-open');
      // Hook point: wire this up to real i18n (next-intl / JSON dictionaries) in production.
    });
  });
  document.addEventListener('click', () => langSwitch.classList.remove('is-open'));

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('.stat__num');
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1600;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + '+';
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countIO.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach(el => countIO.observe(el));

  /* ---------- Services carousel: infinite auto-scroll, no arrows ----------
     - Clones the card set once so scrolling past the original set seamlessly
       continues into an identical copy (infinite-loop illusion).
     - Auto-advances by one card every ~3.2s, smooth scroll, no visible jump.
     - Pauses on hover, touch, and keyboard focus; resumes automatically after.
     - Fully keyboard accessible (Arrow Left/Right) and touch-swipe friendly
       (native overflow-x scrolling handles the swipe gesture itself). */
  const track = document.getElementById('carouselTrack');
  if (track) {
    const originalCards = Array.from(track.children);

    // Duplicate the set so looping never shows an empty gap or hard jump.
    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));
      track.appendChild(clone);
    });

    let isPaused = false;
    let resumeTimeout;
    let autoScrollInterval;

    const cardStep = () => (track.querySelector('.service-card')?.offsetWidth || 270) + 26;
    const loopWidth = () => track.scrollWidth / 2;

    const scrollNext = () => {
      if (isPaused) return;
      track.scrollBy({ left: cardStep(), behavior: 'smooth' });
      // Once we've scrolled past the first (original) set, snap back losslessly
      // — content is identical, so the reset is invisible to the user.
      setTimeout(() => {
        if (track.scrollLeft >= loopWidth() - 4) {
          track.scrollLeft -= loopWidth();
        }
      }, 550);
    };

    const startAutoScroll = () => {
      clearInterval(autoScrollInterval);
      autoScrollInterval = setInterval(scrollNext, 3200);
    };
    startAutoScroll();

    const pauseAutoScroll = () => { isPaused = true; };
    const resumeAutoScrollSoon = (delay = 1200) => {
      clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => { isPaused = false; }, delay);
    };

    track.addEventListener('mouseenter', pauseAutoScroll);
    track.addEventListener('mouseleave', () => { isPaused = false; });
    track.addEventListener('touchstart', pauseAutoScroll, { passive: true });
    track.addEventListener('touchend', () => resumeAutoScrollSoon(1500));
    track.addEventListener('focusin', pauseAutoScroll);
    track.addEventListener('focusout', () => { isPaused = false; });

    // Keyboard accessibility: Arrow Left/Right manually navigate the carousel.
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        pauseAutoScroll();
        track.scrollBy({ left: cardStep(), behavior: 'smooth' });
        resumeAutoScrollSoon();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        pauseAutoScroll();
        track.scrollBy({ left: -cardStep(), behavior: 'smooth' });
        resumeAutoScrollSoon();
      }
    });
  }

  /* ---------- Donation amount selector ---------- */
  document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const amt = btn.textContent.replace(/[₹,]/g, '').trim();
      const phonepeBtn = document.getElementById('phonepeBtn');
      if (phonepeBtn && !isNaN(amt)) {
        phonepeBtn.href = `upi://pay?pa=YOUR-UPI-ID@bank&pn=Gau%20Sewa%20Samiti%20Neemuch&am=${amt}&cu=INR`;
      }
    });
  });

  /* ---------- Gallery "View More" / "View Less" ----------
     The extra images already sit in the DOM (inside #galleryMore, collapsed
     via CSS max-height:0). This just measures the real content height and
     animates to/from it, so the transition is smooth no matter how many
     images are inside. Once fully open, the inline max-height is cleared
     to 'none' so a later window resize (which can change row height on a
     grid) never clips the content. Doesn't touch the main gallery grid,
     its hover effects, or the lightbox — those keep working exactly as
     before for both the first 8 images and the revealed ones. */
  const galleryMore = document.getElementById('galleryMore');
  const galleryMoreBtn = document.getElementById('galleryMoreBtn');
  if (galleryMore && galleryMoreBtn) {
    const toggleLabel = galleryMoreBtn.querySelector('.gallery__toggle-text');
    let onTransitionEnd;

    galleryMoreBtn.addEventListener('click', () => {
      const isOpen = galleryMore.classList.contains('is-open');
      galleryMore.removeEventListener('transitionend', onTransitionEnd);

      if (isOpen) {
        // Collapsing: fix the current pixel height first so the browser
        // has a "from" value to animate down to 0 from.
        galleryMore.style.maxHeight = galleryMore.scrollHeight + 'px';
        requestAnimationFrame(() => {
          galleryMore.style.maxHeight = '0px';
        });
        galleryMore.classList.remove('is-open');
        galleryMoreBtn.classList.remove('is-open');
        galleryMoreBtn.setAttribute('aria-expanded', 'false');
        if (toggleLabel) toggleLabel.textContent = 'और तस्वीरें देखें';
      } else {
        galleryMore.classList.add('is-open');
        galleryMore.style.maxHeight = galleryMore.scrollHeight + 'px';
        galleryMoreBtn.classList.add('is-open');
        galleryMoreBtn.setAttribute('aria-expanded', 'true');
        if (toggleLabel) toggleLabel.textContent = 'कम तस्वीरें देखें';

        onTransitionEnd = (e) => {
          if (e.propertyName === 'max-height' && galleryMore.classList.contains('is-open')) {
            galleryMore.style.maxHeight = 'none';
          }
        };
        galleryMore.addEventListener('transitionend', onTransitionEnd);

        // Keep the button in view; no jarring jump, just a gentle nudge
        // so the user can see the new images appear.
        requestAnimationFrame(() => {
          galleryMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxStage = document.getElementById('lightboxStage');
  const lightboxClose = document.getElementById('lightboxClose');
  document.querySelectorAll('[data-lightbox]').forEach(item => {
    item.addEventListener('click', () => {
      const fullSrc = item.dataset.img || item.querySelector('img')?.src || '';
      lightboxStage.innerHTML = `<img src="${fullSrc}" alt="गौ माता गैलरी" />`;
      lightbox.classList.add('is-open');
    });
  });
  const closeLightbox = () => lightbox.classList.remove('is-open');
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  /* ---------- Hero floating particles ---------- */
  const particlesRoot = document.getElementById('particles');
  const particleCount = window.innerWidth < 600 ? 12 : 26;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('span');
    const size = 2 + Math.random() * 4;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (10 + Math.random() * 14) + 's';
    p.style.animationDelay = (Math.random() * 14) + 's';
    p.style.opacity = (0.3 + Math.random() * 0.5).toString();
    particlesRoot.appendChild(p);
  }

  /* ---------- Hero parallax on mouse move (desktop only) ---------- */
  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero__content');
  if (window.matchMedia('(pointer:fine)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      heroContent.style.transform = `translate(${x}px, ${y}px)`;
    });
    hero.addEventListener('mouseleave', () => { heroContent.style.transform = 'translate(0,0)'; });
  }

  /* ---------- Newsletter subscribe (static/demo — swap with real endpoint) ---------- */
  const subscribeForm = document.getElementById('subscribeForm');
  const subscribeNote = document.getElementById('subscribeNote');
  subscribeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    subscribeNote.textContent = 'धन्यवाद! आप सब्सक्राइब हो गए हैं।';
    subscribeForm.reset();
  });

});