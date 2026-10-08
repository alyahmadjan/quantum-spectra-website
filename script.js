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
