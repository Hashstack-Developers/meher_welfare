(function () {
  'use strict';

  function setStatus(el, text, isError) {
    if (!el) return;
    el.textContent = text || '';
    el.classList.remove('text-danger', 'text-success');
    el.style.color = '';
    if (!text) return;
    if (el.closest('.volunteer')) {
      if (text.indexOf('Sending') === 0) {
        el.style.color = 'rgba(255,255,255,0.75)';
      } else {
        el.style.color = isError ? '#fecaca' : '#bbf7d0';
      }
    } else {
      el.classList.add(isError ? 'text-danger' : 'text-success');
    }
  }

  function wireVolunteerForms() {
    var forms = document.querySelectorAll('form.volunter-form');
    forms.forEach(function (form) {
      if (form.dataset.mwtWired) return;
      form.dataset.mwtWired = '1';

      var status = form.querySelector('.volunteer-form-status');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = (form.querySelector('[name="name"]') || {}).value;
        var email = (form.querySelector('[name="email"]') || {}).value;
        var message = (form.querySelector('[name="message"]') || {}).value;
        var btn = form.querySelector('[type="submit"]');

        setStatus(status, 'Sending…', false);
        if (btn) {
          btn.disabled = true;
        }

        fetch('volunteer-submit.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify({
            name: (name || '').trim(),
            email: (email || '').trim(),
            message: (message || '').trim(),
          }),
        })
          .then(function (r) {
            return r.text().then(function (text) {
              try {
                return { ok: r.ok, data: JSON.parse(text) };
              } catch (e) {
                return {
                  ok: false,
                  data: {
                    error:
                      'Unexpected response from server. Upload volunteer-submit.php to the same folder as this page.',
                  },
                };
              }
            });
          })
          .then(function (res) {
            if (res.ok && res.data && res.data.ok) {
              setStatus(status, 'Thank you — we received your message and will get back to you soon.', false);
              form.reset();
            } else {
              var err =
                (res.data && res.data.error) ||
                'Something went wrong. This form needs PHP hosting (not GitHub Pages).';
              setStatus(status, err, true);
            }
          })
          .catch(function () {
            setStatus(
              status,
              'Could not reach the server. Ensure volunteer-submit.php is uploaded and PHP mail is enabled.',
              true
            );
          })
          .finally(function () {
            if (btn) btn.disabled = false;
          });
      });
    });
  }

  function wireContactForm() {
    var form = document.getElementById('contact-form');
    if (!form || form.dataset.mwtWired) return;
    form.dataset.mwtWired = '1';

    var status = form.querySelector('.contact-form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('[name="name"]') || {}).value;
      var email = (form.querySelector('[name="email"]') || {}).value;
      var subject = (form.querySelector('[name="subject"]') || {}).value;
      var message = (form.querySelector('[name="message"]') || {}).value;
      var btn = form.querySelector('[type="submit"]');

      setStatus(status, 'Sending…', false);
      if (btn) btn.disabled = true;

      fetch('contact-submit.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
          name: (name || '').trim(),
          email: (email || '').trim(),
          subject: (subject || '').trim(),
          message: (message || '').trim(),
        }),
      })
        .then(function (r) {
          return r.text().then(function (text) {
            try {
              return { ok: r.ok, data: JSON.parse(text) };
            } catch (e) {
              return {
                ok: false,
                data: {
                  error:
                    'Unexpected response from server. Upload contact-submit.php to the same folder as this page.',
                },
              };
            }
          });
        })
        .then(function (res) {
          if (res.ok && res.data && res.data.ok) {
            setStatus(status, 'Thank you — your message was sent. We will reply as soon as we can.', false);
            form.reset();
          } else {
            var err =
              (res.data && res.data.error) ||
              'Something went wrong. This form needs PHP hosting (not GitHub Pages).';
            setStatus(status, err, true);
          }
        })
        .catch(function () {
          setStatus(
            status,
            'Could not reach the server. Ensure contact-submit.php is uploaded and PHP mail is enabled.',
            true
          );
        })
        .finally(function () {
          if (btn) btn.disabled = false;
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      wireVolunteerForms();
      wireContactForm();
    });
  } else {
    wireVolunteerForms();
    wireContactForm();
  }
})();
