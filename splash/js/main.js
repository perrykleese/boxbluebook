/* ============================================================
   BoxBlueBook.com — Splash Page Scripts
   ============================================================ */

(function () {
  'use strict';

  /* ---- Particle System ---- */
  function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    const particles = [];
    const PARTICLE_COUNT = 60;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        hue: Math.random() > 0.5 ? 195 : 260, // cyan or purple
      });
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    draw();
  }

  /* ---- Campaign Monitor Form Handler ---- */
  function initForm() {
    const form = document.getElementById('signup-form');
    const input = document.getElementById('email-input');
    const btn = document.getElementById('signup-btn');
    const msgEl = document.getElementById('form-message');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const email = input.value.trim();
      if (!email || !isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Joining...';

      // Campaign Monitor AJAX subscribe
      // Replace YOUR_LIST_ID and YOUR_API_ENDPOINT with your Campaign Monitor values.
      // Campaign Monitor hosted form: https://YOUR_ACCOUNT.createsend.com/t/r/s/YOUR_LIST_ID/
      const cmFormUrl = form.getAttribute('action');

      if (cmFormUrl && cmFormUrl !== '#') {
        // Use Campaign Monitor's JSONP endpoint for cross-origin form submit
        const jsonpUrl =
          cmFormUrl.replace('/s/', '/s/') +
          '?callback=cmCallback&cm-' +
          getFieldId(form) +
          '=' +
          encodeURIComponent(email);

        window.cmCallback = function () {
          showMessage(
            'You\'re on the list! We\'ll notify you at launch.',
            'success'
          );
          input.value = '';
          btn.disabled = false;
          btn.textContent = 'Notify Me';
        };

        const script = document.createElement('script');
        script.src = jsonpUrl;
        script.onerror = function () {
          // Fallback: submit as regular form
          submitFormFallback(form, email, btn);
        };
        document.body.appendChild(script);
      } else {
        // No CM endpoint configured — demo mode
        setTimeout(function () {
          showMessage(
            'You\'re on the list! We\'ll notify you at launch.',
            'success'
          );
          input.value = '';
          btn.disabled = false;
          btn.textContent = 'Notify Me';
        }, 1200);
      }
    });

    function getFieldId(formEl) {
      // Extract the CM field name from the hidden input
      const hidden = formEl.querySelector('input[name^="cm-"]');
      return hidden ? hidden.name.replace('cm-', '') : 'email';
    }

    function submitFormFallback(formEl, email, button) {
      // Traditional form submission as last resort
      const data = new FormData(formEl);
      fetch(formEl.action, {
        method: 'POST',
        body: data,
        mode: 'no-cors',
      })
        .then(function () {
          showMessage(
            'You\'re on the list! We\'ll notify you at launch.',
            'success'
          );
          input.value = '';
        })
        .catch(function () {
          showMessage(
            'Something went wrong. Please try again.',
            'error'
          );
        })
        .finally(function () {
          button.disabled = false;
          button.textContent = 'Notify Me';
        });
    }

    function showMessage(text, type) {
      msgEl.textContent = text;
      msgEl.className = 'form-message form-message--' + type;
      // Auto-hide after 6 seconds
      setTimeout(function () {
        msgEl.className = 'form-message form-message--hidden';
      }, 6000);
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  }

  /* ---- Intersection Observer for scroll reveal ---- */
  function initScrollReveal() {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.info-card').forEach(function (card) {
      observer.observe(card);
    });
  }

  /* ---- Tilt effect on logo hover ---- */
  function initLogoTilt() {
    const container = document.querySelector('.logo-container');
    if (!container) return;

    container.addEventListener('mousemove', function (e) {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      container.style.transform =
        'perspective(600px) rotateY(' +
        x * 8 +
        'deg) rotateX(' +
        -y * 8 +
        'deg)';
    });

    container.addEventListener('mouseleave', function () {
      container.style.transform = 'perspective(600px) rotateY(0) rotateX(0)';
      container.style.transition = 'transform 0.5s ease';
    });

    container.addEventListener('mouseenter', function () {
      container.style.transition = 'none';
    });
  }

  /* ---- Boot ---- */
  document.addEventListener('DOMContentLoaded', function () {
    initParticles();
    initForm();
    initScrollReveal();
    initLogoTilt();
  });
})();
