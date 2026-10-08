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
// Paste your Web3Forms access key below (free, from web3forms.com).
// Until a key is set, the form falls back to opening the visitor's email client.
const FORM_ACCESS_KEY = '6a546fe0-930b-4513-ac04-395c67969639';
const CONTACT_EMAIL = 'alidatainsights@gmail.com';

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const statusEl = contactForm.querySelector('.form-status');
  const submitBtn = contactForm.querySelector('.form-submit');
  const submitLabel = submitBtn.innerHTML;

  const setStatus = (type, html) => {
    statusEl.className = 'form-status ' + type;
    statusEl.innerHTML = html;
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

    // Honeypot: real visitors never fill this in
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

    // No key yet: keep the old email-client behaviour
    if (FORM_ACCESS_KEY.startsWith('YOUR_')) {
      window.location.href = mailtoFallback(d);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending… <span>↻</span>';
    setStatus('', '');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: FORM_ACCESS_KEY,
          subject: `Quantum Spectra inquiry: ${d.topic}`,
          from_name: 'Quantum Spectra website',
          name: d.name,
          email: d.email,
          phone: d.phone || 'Not provided',
          topic: d.topic,
          pricing: d.budget,
          message: d.message
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Request failed');

      // Event for Google Tag Manager / GA4
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'generate_lead', form_id: 'contact-form', form_topic: d.topic });

      contactForm.reset();
      setStatus('success', `<strong>Thanks, ${d.name.split(' ')[0]}.</strong> Your brief has been sent and I'll get back to you by email.`);
    } catch (err) {
      setStatus('error', `Something went wrong sending that. Please try again, or <a href="${mailtoFallback(d)}">email me directly</a> at ${CONTACT_EMAIL}.`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitLabel;
    }
  });

  contactForm.querySelectorAll('input, textarea').forEach((el) =>
    el.addEventListener('input', () => el.classList.remove('invalid'))
  );
}
