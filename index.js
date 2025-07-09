// Configuration
const displayDistance = 60; // distance in px to display another photo
const nDisplay = 20; // number of pictures to display at once

// State
let globalIndex = 0; // used to count up the images
let lastMousePosition = {x: 0, y: 0}; // used to get the last mouse position
let imagesLoaded = false;
let images = [];

// Function to handle image loading
function loadImages() {
    const imageElements = document.getElementsByClassName('image');
    images = Array.from(imageElements);
    
    images.forEach((img, index) => {
        // Set initial styles
        img.style.opacity = '0';
        img.style.visibility = 'hidden';
        img.style.position = 'absolute';
        img.style.transition = 'opacity 0.3s ease';
        
        // Handle image load
        if (img.complete) {
            onImageLoad(img);
        } else {
            img.addEventListener('load', () => onImageLoad(img));
            img.addEventListener('error', () => onImageError(img));
        }
    });
}

// Handle successful image load
function onImageLoad(img) {
    img.style.opacity = '1';
    img.style.visibility = 'visible';
    img.classList.add('loaded');
    
    // Check if all images are loaded
    const allLoaded = Array.from(images).every(img => img.complete);
    if (allLoaded) {
        imagesLoaded = true;
        document.body.classList.add('images-loaded');
        // Show hero content once images are loaded
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.classList.add('visible');
        }
    }
}

// Handle image load error
function onImageError(img) {
    console.error('Error loading image:', img.src);
    img.style.display = 'none';
}

// Function to position photos
function positionPic(img, x, y) {
    if (!img) return;
    
    img.style.left = `${x}px`;
    img.style.top = `${y + 80}px`; // offset images downward by 80px
    img.style.zIndex = -1; // Keep all images behind content
    lastMousePosition = {x: x, y: y}; // update the last mouse position
}

// Compute mouse distance 
function mouseDistance(x, y) {
    return Math.hypot(x - lastMousePosition.x, y - lastMousePosition.y);
}

// Throttled mousemove handler
let isThrottled = false;
const throttleDelay = 16; // ~60fps

function handleMouseMove(e) {
    if (!isThrottled && imagesLoaded && images.length > 0) {
        if (mouseDistance(e.clientX, e.clientY) > displayDistance) {
            // Get the next image in sequence
            const currentPic = images[globalIndex % images.length];
            
            // Position the current image at the cursor
            positionPic(currentPic, e.clientX, e.clientY);
            
            // Move to the next image for the next update
            globalIndex = (globalIndex + 1) % images.length;
        }
        
        isThrottled = true;
        setTimeout(() => {
            isThrottled = false;
        }, throttleDelay);
    }
}

// Initialize
function init() {
    // Add JS class to HTML element
    document.documentElement.classList.add('js');
    
    // Load images
    loadImages();
    
    // Add mousemove event listener
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Recalculate positions on resize
            if (imagesLoaded) {
                const lastPos = lastMousePosition;
                handleMouseMove({ clientX: lastPos.x, clientY: lastPos.y });
            }
        }, 250);
    }, { passive: true });
}

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

