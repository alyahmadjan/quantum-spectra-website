const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const open = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });

  siteNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();

// ---- Contact form ----
const CONTACT_EMAIL = 'alidatainsights@gmail.com';
const FORM_ENDPOINT = 'https://api.web3forms.com/submit';

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  console.info('[Quantum Spectra] contact form ready (v3)');
  const submitBtn = contactForm.querySelector('.form-submit');
  const successEl = contactForm.querySelector('.form-success');
  let statusEl = contactForm.querySelector('.form-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.className = 'form-status';
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', 'polite');
    submitBtn.insertAdjacentElement('afterend', statusEl);
  }
  const submitLabel = submitBtn.innerHTML;

  const setStatus = (type, html) => {
    statusEl.className = 'form-status ' + type;
    statusEl.innerHTML = html;
  };

  const showSent = (firstName) => {
    if (successEl) {
      const n = successEl.querySelector('.sent-name');
      if (n) n.textContent = firstName ? ', ' + firstName : '';
    }
    contactForm.classList.add('is-sent');
    contactForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const mailtoFallback = (d) => {
    const bodyLines = [
      `Name: ${d.name}`,
      `Email: ${d.email}`,
      d.phone ? `Phone / WhatsApp: ${d.phone}` : null,
      `What they need help with: ${d.topic}`,
      `Preferred pricing: ${d.budget}`,
      '',
      'Project details:',
      d.message
    ].filter(Boolean);
    return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Quantum Spectra inquiry: ' + d.topic)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  };

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(contactForm);
    const d = {};
    ['name', 'email', 'phone', 'topic', 'budget', 'message'].forEach((k) => {
      d[k] = (fd.get(k) || '').toString().trim();
    });

    // Honeypot: real visitors never tick this
    if (fd.get('botcheck')) return;

    // Validation
    contactForm.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
    const errors = [];
    if (!d.name) errors.push('name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errors.push('email');
    if (d.message.length < 10) errors.push('message');
    if (errors.length) {
      errors.forEach((n) => contactForm.querySelector(`[name="${n}"]`).classList.add('invalid'));
      contactForm.querySelector(`[name="${errors[0]}"]`).focus();
      setStatus('error', 'Please fill in your name, a valid email, and a few details about the project.');
      return;
    }

    const subjectEl = contactForm.querySelector('[name="subject"]');
    if (subjectEl) subjectEl.value = `Quantum Spectra inquiry: ${d.topic}`;

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending… <span>↻</span>';
    setStatus('', '');

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(contactForm)
      });
      const json = await res.json();
      console.info('[Quantum Spectra] form response', res.status, json);
      if (!res.ok || !json.success) throw new Error(json.message || 'Request failed');

      // Event for Google Tag Manager / GA4
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'generate_lead', form_id: 'contact-form', form_topic: d.topic });

      contactForm.reset();
      setStatus('', '');
      showSent(d.name.split(' ')[0]);
    } catch (err) {
      console.error('[Quantum Spectra] form error', err);
      setStatus('error', `Sorry, that didn't send. Please try again, or <a href="${mailtoFallback(d)}">email me directly</a> at ${CONTACT_EMAIL}.`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitLabel;
    }
  });

  contactForm.querySelectorAll('input, textarea').forEach((el) =>
    el.addEventListener('input', () => el.classList.remove('invalid'))
  );

  const another = contactForm.querySelector('.send-another');
  if (another) another.addEventListener('click', () => {
    contactForm.classList.remove('is-sent');
    setStatus('', '');
    const first = contactForm.querySelector('[name="name"]');
    if (first) first.focus();
  });

  // Returning from the no-JavaScript fallback redirect
  if (new URLSearchParams(window.location.search).get('sent') === '1') {
    showSent('');
    if (window.history && history.replaceState) history.replaceState(null, '', window.location.pathname + '#contact');
  }
}

// ---- Email Quantum Spectra: opens a Gmail compose popup on desktop ----
const emailBtn = document.querySelector('.email-trigger');
if (emailBtn) {
  emailBtn.addEventListener('click', (e) => {
    // Phones and tablets: let the normal mailto link open their mail app
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    e.preventDefault();
    const url = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(CONTACT_EMAIL) +
                '&su=' + encodeURIComponent('Quantum Spectra Project Inquiry');
    const w = 720, h = 680;
    const left = Math.max(0, Math.round((window.screen.width - w) / 2));
    const top = Math.max(0, Math.round((window.screen.height - h) / 2));
    const win = window.open(url, 'qs-email', `popup=yes,width=${w},height=${h},left=${left},top=${top}`);
    // Popup blocked: fall back to the normal email link
    if (!win) window.location.href = emailBtn.href;
  });
}

// ---- FAQ: show more questions ----
const faqToggle = document.querySelector('.faq-toggle');
if (faqToggle) {
  const faqMore = document.getElementById('faq-more');
  const faqLabel = faqToggle.querySelector('.faq-toggle-label');
  faqToggle.addEventListener('click', () => {
    const open = faqToggle.getAttribute('aria-expanded') !== 'true';
    faqToggle.setAttribute('aria-expanded', String(open));
    faqMore.classList.toggle('open', open);
    faqLabel.textContent = open ? 'Show fewer questions' : 'More questions';
    if (!open) faqMore.querySelectorAll('details[open]').forEach((d) => d.removeAttribute('open'));
  });
}

// ---- Header shadow, back-to-top, active nav link ----
const siteHeader = document.querySelector('.site-header');
const toTop = document.querySelector('.to-top');
const onScroll = () => {
  const y = window.scrollY || document.documentElement.scrollTop;
  if (siteHeader) siteHeader.classList.toggle('scrolled', y > 8);
  if (toTop) toTop.classList.toggle('show', y > 900);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const navLinks = [...document.querySelectorAll('.site-nav > a[href^="#"]:not(.nav-cta)')];
if (navLinks.length && 'IntersectionObserver' in window) {
  const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
      const link = byId.get(entry.target.id);
      if (link) { link.classList.add('active'); link.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  byId.forEach((_, id) => { const sec = document.getElementById(id); if (sec) spy.observe(sec); });
}
