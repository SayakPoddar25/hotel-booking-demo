// ============================================
// MAIN.JS - Global JavaScript for ALL Pages
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // 1. NAVBAR SCROLL EFFECT 
    // ============================================
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    // ============================================
    // 2. MOBILE HAMBURGER MENU 
    // ============================================
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });
        
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
    
    // ============================================
    // 3. SMOOTH SCROLLING 
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                const offset = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ============================================
    // 4. GALLERY LIGHTBOX (index.html এ)
    // ============================================
    function initGalleryLightbox() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        
        const lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 9999;
            cursor: pointer;
            align-items: center;
            justify-content: center;
        `;
        
        const lightboxImg = document.createElement('img');
        lightboxImg.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 10px;
        `;
        
        lightbox.appendChild(lightboxImg);
        document.body.appendChild(lightbox);
        
        galleryItems.forEach(item => {
            item.addEventListener('click', function() {
                const img = this.querySelector('img');
                if (img) {
                    lightboxImg.src = img.src;
                    lightbox.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                }
            });
        });
        
        lightbox.addEventListener('click', function() {
            this.style.display = 'none';
            document.body.style.overflow = '';
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && lightbox.style.display === 'flex') {
                lightbox.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
    
    // ============================================
    // 5. TESTIMONIAL SLIDER (index.html এ)
    // ============================================
    function initTestimonialSlider() {
        const slider = document.querySelector('.testimonials-slider');
        if (!slider) return;
        
        let isDown = false;
        let startX;
        let scrollLeft;
        
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        
        slider.addEventListener('mouseleave', () => {
            isDown = false;
        });
        
        slider.addEventListener('mouseup', () => {
            isDown = false;
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2;
            slider.scrollLeft = scrollLeft - walk;
        });
        
        slider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        
        slider.addEventListener('touchmove', (e) => {
            const x = e.touches[0].pageX - slider.offsetLeft;
            const walk = (x - startX) * 2;
            slider.scrollLeft = scrollLeft - walk;
        });
    }
    
    // ============================================
    // 6. ROOM CARD IMAGE SLIDERS (rooms.html, index.html)
    // ============================================
    function initRoomSliders() {
        const roomCards = document.querySelectorAll('.room-card');
        
        roomCards.forEach(card => {
            const sliderContainer = card.querySelector('.slider-container');
            if (!sliderContainer) return;
            
            const images = sliderContainer.querySelectorAll('img');
            if (images.length <= 1) return;
            
            let currentIndex = 0;
            const totalImages = images.length;
            
            const prevBtn = document.createElement('button');
            prevBtn.className = 'slider-btn slider-prev';
            prevBtn.innerHTML = '❮';
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'slider-btn slider-next';
            nextBtn.innerHTML = '❯';
            
            sliderContainer.appendChild(prevBtn);
            sliderContainer.appendChild(nextBtn);
            
            function updateImage() {
                images.forEach((img, idx) => {
                    img.style.display = idx === currentIndex ? 'block' : 'none';
                });
            }
            
            updateImage();
            
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = (currentIndex - 1 + totalImages) % totalImages;
                updateImage();
            });
            
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = (currentIndex + 1) % totalImages;
                updateImage();
            });
        });
    }
    
    // ============================================
    // 7. FORM VALIDATION (contact, login, booking)
    // ============================================
    function initFormValidation() {
        const forms = document.querySelectorAll('form[data-validate="true"], .contact-form form, #bookingForm');
        
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                let isValid = true;
                const requiredFields = this.querySelectorAll('[required]');
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.style.borderColor = '#dc3545';
                        
                        let errorMsg = field.nextElementSibling;
                        if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                            errorMsg = document.createElement('small');
                            errorMsg.className = 'error-message';
                            errorMsg.style.cssText = 'color: #dc3545; font-size: 0.8rem; margin-top: 5px; display: block;';
                            field.parentNode.insertBefore(errorMsg, field.nextSibling);
                        }
                        errorMsg.textContent = 'This field is required';
                    } else {
                        field.style.borderColor = '#e0e0e0';
                        const errorMsg = field.nextElementSibling;
                        if (errorMsg && errorMsg.classList.contains('error-message')) {
                            errorMsg.remove();
                        }
                    }
                });
                
                if (!isValid) {
                    e.preventDefault();
                }
            });
        });
    }
    
    // ============================================
    // 8. NEWSLETTER SUBSCRIPTION (footer এ)
    // ============================================
    function initNewsletter() {
        const newsletterBtn = document.querySelector('.footer-col button');
        const newsletterInput = document.querySelector('.footer-col input[type="email"]');
        
        if (newsletterBtn && newsletterInput) {
            newsletterBtn.addEventListener('click', function() {
                const email = newsletterInput.value;
                if (email && email.includes('@')) {
                    showToast('Thank you for subscribing!', 'success');
                    newsletterInput.value = '';
                } else {
                    showToast('Please enter a valid email', 'error');
                }
            });
        }
    }
    
    // ============================================
    // 9. TOAST NOTIFICATION SYSTEM
    // ============================================
    window.showToast = function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };
    
    // ============================================
    // 10. LAZY LOADING IMAGES
    // ============================================
    function initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const dataSrc = img.getAttribute('data-src');
                        if (dataSrc) {
                            img.src = dataSrc;
                            img.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
    
    // ============================================
    // 11. ACTIVE NAV LINK HIGHLIGHT
    // ============================================
    function setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link-desktop, .menu-links a');
        
        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath && linkPath !== '/' && currentPath.includes(linkPath)) {
                link.classList.add('active');
            } else if (linkPath === '/' && currentPath === '/') {
                link.classList.add('active');
            }
        });
    }
    
    // ============================================
    // 12. PRICE FORMATTER (গ্লোবাল হেল্পার)
    // ============================================
    window.formatPrice = function(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
    };
    
    // ============================================
    // 13. DATE RANGE CALCULATOR
    // ============================================
    window.calculateNights = function(checkIn, checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    
    // Initialize all features
    initGalleryLightbox();
    initTestimonialSlider();
    initRoomSliders();
    initFormValidation();
    initNewsletter();
    initLazyLoading();
    setActiveNavLink();
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .nav-link-desktop.active, .menu-links a.active {
        color: var(--accent);
    }
    .nav-link-desktop.active::after {
        width: 100%;
    }
`;
document.head.appendChild(style);