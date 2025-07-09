

// Mobile menu toggle
function toggleMobileMenu() {
    console.log('Hamburger clicked'); // Debug log
    const navMenu = document.querySelector('.nav-menu');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (navMenu && mobileMenu) {
        navMenu.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    }
}

// Close mobile menu when clicking on a nav link
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link, .dropdown-item');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && navMenu.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });
});

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        // No need to add another event listener for .mobile-menu
    });
} else {
    init();
    // No need to add another event listener for .mobile-menu
}

