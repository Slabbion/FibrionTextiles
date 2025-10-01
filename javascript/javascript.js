document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('#orderForm');
    const companyNameInput = document.querySelector('#companyName');
    const emailInput = document.querySelector('#email');
    const phoneInput = document.querySelector('#phone');
    const inquiryInput = document.querySelector('#Inquiry');
    const billingCheckbox = document.querySelector('#billingSame');
    const companyDetails = document.querySelector('#companyDetails');
    const purposeSelect = document.querySelector('#Purpose');
    const howHeardSelect = document.querySelector('#howHeard');
    const termsCheckbox = document.querySelector('#terms');

    if (!form) {
        console.error("Form not found.");
        return;
    }

    // Function to validate email
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Function to validate phone number
    function isValidPhone(phone) {
        const re = /^\(?\+?[0-9]*\)?[-.\s]?([0-9]{1,3})?[-.\s]?[0-9]{1,3}[-.\s]?[0-9]{4,6}$/;
        return re.test(phone);
    }

    // Toggle company details section
    function toggleCompanyDetails() {
        if (billingCheckbox.checked) {
            companyDetails.style.display = 'none';
        } else {
            companyDetails.style.display = 'block';
        }
    }

    // Attach toggle event to the checkbox
    billingCheckbox.addEventListener('change', toggleCompanyDetails);

    // Form submission validation
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        // Reset previous error styles
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

        let isValid = true;

        // Validate all required fields
        if (!fullNameInput.value.trim()) {
            fullNameInput.classList.add('is-invalid');
            isValid = false;
        }

        if (!isValidEmail(emailInput.value)) {
            emailInput.classList.add('is-invalid');
            isValid = false;
        }

        if (!isValidPhone(phoneInput.value)) {
            phoneInput.classList.add('is-invalid');
            isValid = false;
        }

        if (!inquiryInput.value.trim()) {
            inquiryInput.classList.add('is-invalid');
            isValid = false;
        }

        if (!purposeSelect.value) {
            purposeSelect.classList.add('is-invalid');
            isValid = false;
        }

        if (!howHeardSelect.value) {
            howHeardSelect.classList.add('is-invalid');
            isValid = false;
        }

        if (!termsCheckbox.checked) {
            termsCheckbox.classList.add('is-invalid');
            isValid = false;
        }

        if (isValid) {
            console.log('Form Data:', {
                fullName: fullNameInput.value,
                email: emailInput.value,
                phone: phoneInput.value,
                inquiry: inquiryInput.value,
                purpose: purposeSelect.value,
                howHeard: howHeardSelect.value
            });

            alert('Form submitted successfully!');
            form.reset();
            toggleCompanyDetails(); // Reset company details visibility
        } else {
            const invalidField = document.querySelector('.is-invalid');
            if (invalidField) invalidField.focus();
        }
    });

    // Initial call to toggleCompanyDetails to set the correct state
    toggleCompanyDetails();
});


// Theme toggle functionality
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', theme);
}

document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
}

// Modal functionality
const modal = document.getElementById('projectModal');
const closeBtn = modal?.querySelector('.close');
const viewProjectButtons = document.querySelectorAll('.btn-primary');

if (modal && closeBtn && viewProjectButtons.length > 0) {
    function openModal(id) {
        modal.style.display = 'flex';
        const modalImages = modal.querySelector('.modal-images');
        modalImages.innerHTML = ''; // Clear existing content
        for (let i = 1; i <= 3; i++) {
            const img = document.createElement('img');
            img.src = `images/project${id}_image${i}.jpg`;
            img.alt = `Project ${id} Image ${i}`;
            img.style.maxWidth = '100%';
            img.style.maxHeight = '90vh';
            modalImages.appendChild(img);
        }
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    viewProjectButtons.forEach(button => {
        button.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            openModal(id);
        });
    });

    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });
}
