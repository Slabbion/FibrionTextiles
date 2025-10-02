/* site-main.js
   Combined form logic, theme toggling, and modal code.
   Drop in /js and include with defer. */

(() => {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const normalizePhone = phone => phone ? phone.replace(/[^\d\+]/g, '') : '';

  const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = phone => {
    const norm = normalizePhone(phone);
    return norm.length >= 7; // simple sanity check; can be tightened
  };

  /* ---------- DOMContentLoaded init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    // Elements (form)
    const form = $('#orderForm');
    if (!form) {
      console.warn('orderForm not found — form scripts will not run.');
    }

    const companyNameInput = $('#companyName');
    const emailInput = $('#email');
    const phoneInput = $('#phone');
    const inquiryInput = $('#Inquiry');
    const billingCheckbox = $('#billingSame');
    const companyDetails = $('#companyDetails');
    const purposeSelect = $('#Purpose');
    const howHeardSelect = $('#howHeard');
    const termsCheckbox = $('#terms'); // optional
    const submitBtn = $('#submitBtn');
    const clearBtn = $('#clearBtn');
    const formAlert = $('#formAlert');
    const spinner = $('#formSpinner');
    const honeypot = $('#website_hp'); // hidden field
    const themeToggleBtn = $('#theme-toggle');

    /* ---------- Utility UI functions ---------- */
    function showMessage(type, text) {
      if (!formAlert) return;
      const cls = type === 'error' ? 'danger' : (type === 'success' ? 'success' : 'info');
      formAlert.innerHTML = `<div class="alert alert-${cls}" role="alert">${text}</div>`;
      const alertEl = formAlert.querySelector('.alert');
      if (alertEl) {
        alertEl.setAttribute('tabindex', '-1');
        alertEl.focus();
      }
    }

    function clearMessage() {
      if (formAlert) formAlert.innerHTML = '';
    }

    function setSubmitting(isSubmitting) {
      if (submitBtn) submitBtn.disabled = isSubmitting;
      if (spinner) spinner.style.display = isSubmitting ? 'inline-block' : 'none';
    }

    /* ---------- Billing toggle ---------- */
    function toggleCompanyDetails() {
      if (!companyDetails || !billingCheckbox) return;
      const show = !billingCheckbox.checked;
      companyDetails.style.display = show ? 'block' : 'none';
      companyDetails.setAttribute('aria-hidden', (!show).toString());
      if (!show) {
        // clear inputs inside companyDetails when hiding to avoid accidental submission
        $$('input, textarea, select', companyDetails).forEach(i => i.value = '');
      }
    }

    // Setup initial state and listeners for billing toggle
    if (billingCheckbox && companyDetails) {
      toggleCompanyDetails();
      billingCheckbox.addEventListener('change', toggleCompanyDetails);
    }

    /* ---------- Form validation ---------- */
    function validateForm() {
      if (!form) return false;

      // Reset custom invalid state styling
      form.classList.remove('was-validated');
      $$('.is-invalid', form).forEach(el => el.classList.remove('is-invalid'));

      // Use Constraint API first
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        // focus the first invalid
        const invalid = form.querySelector(':invalid');
        if (invalid) invalid.focus();
        return false;
      }

      // Honeypot check
      if (honeypot && honeypot.value.trim() !== '') {
        showMessage('error', 'Spam detected — submission blocked.');
        return false;
      }

      // Email check
      if (emailInput && !isValidEmail(emailInput.value)) {
        emailInput.classList.add('is-invalid');
        emailInput.focus();
        return false;
      }

      // Phone check
      if (phoneInput && !isValidPhone(phoneInput.value)) {
        phoneInput.classList.add('is-invalid');
        phoneInput.focus();
        return false;
      } else if (phoneInput) {
        phoneInput.value = normalizePhone(phoneInput.value); // replace with normalized version
      }

      // Required selects/textarea (some double-checks)
      if (purposeSelect && !purposeSelect.value) { purposeSelect.classList.add('is-invalid'); purposeSelect.focus(); return false; }
      if (howHeardSelect && !howHeardSelect.value) { howHeardSelect.classList.add('is-invalid'); howHeardSelect.focus(); return false; }
      if (inquiryInput && !inquiryInput.value.trim()) { inquiryInput.classList.add('is-invalid'); inquiryInput.focus(); return false; }

      // Terms checkbox if present
      if (termsCheckbox && !termsCheckbox.checked) { termsCheckbox.classList.add('is-invalid'); termsCheckbox.focus(); return false; }

      return true;
    }

    /* ---------- Async submit with fallback ---------- */
    async function handleSubmit(evt) {
      evt.preventDefault();
      clearMessage();

      if (!validateForm()) return;

      // Prepare FormData (we already have the form)
      const fd = new FormData(form);

      setSubmitting(true);
      showMessage('info', 'Submitting — please wait...');

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: fd,
          credentials: 'same-origin',
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (res.ok) {
          const ct = (res.headers.get('content-type') || '');
          let message = 'Form submitted successfully.';
          if (ct.includes('application/json')) {
            const json = await res.json();
            message = json.message || message;
            if (json.success === false) {
              showMessage('error', message);
              setSubmitting(false);
              return;
            }
          } else {
            const text = await res.text();
            message = (text && text.trim()) ? text : message;
          }

          showMessage('success', message);
          form.reset();
          toggleCompanyDetails();
        } else {
          const txt = await res.text();
          showMessage('error', `Server error: ${txt || res.statusText}`);
          // fallback: leave the form as-is for manual retry
        }
      } catch (err) {
        // Network/CORS error — fallback to classic submit to ensure server receives data
        showMessage('error', 'Network error — attempting classic submit as fallback.');
        // Remove our handler to avoid infinite loop and submit
        form.removeEventListener('submit', handleSubmit);
        setSubmitting(false);
        form.submit();
        return;
      } finally {
        setSubmitting(false);
      }
    }

    /* ---------- Clear button ---------- */
    if (clearBtn && form) {
      clearBtn.addEventListener('click', e => {
        form.reset();
        form.classList.remove('was-validated');
        clearMessage();
        toggleCompanyDetails();
      });
    }

    /* ---------- Wire up form submit ---------- */
    if (form) {
      form.addEventListener('submit', handleSubmit);
      // Extra: allow Enter in textarea to submit (without shift)
      const inquiry = inquiryInput;
      if (inquiry) {
        inquiry.addEventListener('keydown', e => {
          if ((e.key === 'Enter' || e.keyCode === 13) && !e.shiftKey) {
            e.preventDefault();
            submitBtn && submitBtn.click();
          }
        });
      }
    }

    /* ---------- Theme toggle (persisted) ---------- */
    function applySavedTheme() {
      const saved = localStorage.getItem('theme');
      if (saved === 'light') {
        document.body.classList.add('light-mode');
      } else if (saved === 'dark') {
        document.body.classList.remove('light-mode');
      }
    }

    function toggleTheme() {
      document.body.classList.toggle('light-mode');
      const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
      localStorage.setItem('theme', theme);
    }

    applySavedTheme();
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

    /* ---------- Modal functionality (optional) ---------- */
    const modal = $('#projectModal');
    const closeBtn = modal ? modal.querySelector('.close') : null;
    const viewProjectButtons = $$('.btn-primary[data-id]');

    if (modal && closeBtn && viewProjectButtons.length) {
      const modalImages = modal.querySelector('.modal-images');

      function openModal(id) {
        if (!modalImages) return;
        modal.style.display = 'flex';
        modalImages.innerHTML = '';
        // Example: populate 3 images; adapt to your project reale data if needed
        for (let i = 1; i <= 3; i++) {
          const img = document.createElement('img');
          img.src = `images/project${id}_image${i}.jpg`;
          img.alt = `Project ${id} Image ${i}`;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '90vh';
          modalImages.appendChild(img);
        }
      }

      function closeModal() { modal.style.display = 'none'; }

      viewProjectButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (id) openModal(id);
        });
      });

      closeBtn.addEventListener('click', closeModal);
      window.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    }

    /* ---------- End of DOMContentLoaded ---------- */
  }); // DOMContentLoaded end

})(); // IIFE end
