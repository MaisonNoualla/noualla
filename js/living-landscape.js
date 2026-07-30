/* Noualla — shared site behavior (header, mobile menu, reveals, accessible modals, form) */

(function () {
  "use strict";

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById('siteHeader');
  if (header) {
    window.addEventListener('scroll', function () {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- Mobile menu ---------- */
  var menuToggle = document.querySelector('.menu-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');
  var menuClose = document.querySelector('.mobile-menu-close');
  if (menuToggle && mobileMenu) {
    var openMenu = function () {
      mobileMenu.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      var firstLink = mobileMenu.querySelector('a');
      if (firstLink) firstLink.focus();
      document.addEventListener('keydown', menuEscape);
    };
    var closeMenu = function () {
      mobileMenu.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.focus();
      document.removeEventListener('keydown', menuEscape);
    };
    var menuEscape = function (e) { if (e.key === 'Escape') closeMenu(); };
    menuToggle.addEventListener('click', openMenu);
    if (menuClose) menuClose.addEventListener('click', closeMenu);
    mobileMenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  /* ---------- Accessible modal system (trail markers + experience previews) ---------- */
  var activeModal = null;
  var lastFocused = null;

  function trapFocus(e) {
    if (!activeModal) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    var focusable = activeModal.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openModal(overlay) {
    lastFocused = document.activeElement;
    overlay.classList.add('open');
    activeModal = overlay;
    var closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
    document.addEventListener('keydown', trapFocus);
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!activeModal) return;
    activeModal.classList.remove('open');
    activeModal = null;
    document.removeEventListener('keydown', trapFocus);
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('[data-open-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var target = document.getElementById(trigger.getAttribute('data-open-modal'));
      if (target) openModal(target);
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    var closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
  });

  /* ---------- Early-interest form ---------- */
  var form = document.getElementById('earlyInterestForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot spam check — if filled, silently drop
      var honeypot = form.querySelector('input[name="company"]');
      if (honeypot && honeypot.value) return;

      var statusBox = document.getElementById('eiStatus');

      var name = form.querySelector('#eiName').value.trim();
      var email = form.querySelector('#eiEmail').value.trim();
      var country = form.querySelector('#eiCountry').value.trim();
      var stayLength = form.querySelector('#eiStayLength').value;
      var budget = form.querySelector('input[name="budget"]:checked');
      var activities = Array.from(form.querySelectorAll('input[name="activities"]:checked')).map(function (c) { return c.value; });
      var message = form.querySelector('#eiMessage').value.trim();

      if (!name || !email) {
        statusBox.textContent = 'Please fill in your name and email before sending.';
        statusBox.classList.add('show');
        return;
      }

      // NOTE: This site has no connected form backend yet (no Formspree /
      // Netlify Forms endpoint configured). Rather than silently discarding
      // the submission, we open the visitor's email client with the
      // responses pre-filled, so the message genuinely reaches Noualla.
      // Replace this with a real form provider before launch — see README.
      var bodyLines = [
        'Name: ' + name,
        'Email: ' + email,
        'Country: ' + country,
        'Preferred stay length: ' + stayLength,
        'Activities of interest: ' + (activities.length ? activities.join(', ') : '—'),
        'Expected nightly budget: ' + (budget ? budget.value : '—'),
        'Message: ' + (message || '—')
      ];
      var mailto = 'mailto:info@noualla.com?subject=' + encodeURIComponent('Early interest — Noualla') +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));

      window.location.href = mailto;
      statusBox.textContent = 'Thank you. Your feedback will help shape Noualla\'s first guest experience. Your email app should now open with your details ready to send — please hit send there to complete it.';
      statusBox.classList.add('show');
      form.reset();
    });
  }

})();
