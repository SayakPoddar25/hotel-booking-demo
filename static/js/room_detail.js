document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // 1. PRICING OPTIONS SELECTION
    // ============================================
    let selectedPlanId = null;
    let selectedPlanPrice = 0;
    const basePrice = parseFloat(document.getElementById('basePrice')?.value || 0);
    
    const planCards = document.querySelectorAll('.plan-card');
    const totalPriceSpan = document.getElementById('totalPrice');
    const selectedPlanInput = document.getElementById('selectedPlanId');
    
    function updateTotalPrice() {
        const checkIn = document.getElementById('checkIn')?.value;
        const checkOut = document.getElementById('checkOut')?.value;
        
        // ডিফল্ট ১ রাত, যাতে ডেট সিলেক্ট না করলেও দাম দেখায়
        let nights = 1;
        
        if (checkIn && checkOut) {
            const calculatedNights = calculateNights(checkIn, checkOut);
            if (calculatedNights > 0) {
                nights = calculatedNights;
            }
        }
        
        // আপনার পারফেক্ট লজিক: কোনো যোগ-বিয়োগ নেই।
        // যদি প্ল্যান সিলেক্ট করা থাকে, তাহলে সরাসরি সেই প্ল্যানের প্রাইস। 
        // না থাকলে রুমের বেস প্রাইস।
        let effectivePricePerNight = selectedPlanPrice > 0 ? selectedPlanPrice : basePrice;
        
        let total = effectivePricePerNight * nights;
        
        if (totalPriceSpan) {
            totalPriceSpan.textContent = total.toFixed(2);
        }
    }
    
    // Plan card click handlers
    if (planCards.length > 0) {
        planCards.forEach(card => {
            card.addEventListener('click', function() {
                // Remove selected class from all cards
                planCards.forEach(c => c.classList.remove('selected'));
                
                // Add selected class to clicked card
                this.classList.add('selected');
                
                // Get exact plan data
                selectedPlanId = this.dataset.planId;
                selectedPlanPrice = parseFloat(this.dataset.price || 0);
                
                if (selectedPlanInput) {
                    selectedPlanInput.value = selectedPlanId;
                }
                
                // Update total price immediately
                updateTotalPrice();
            });
        });
    }
    
    // ============================================
    // 2. AVAILABILITY CHECK
    // ============================================
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    const availabilityStatus = document.getElementById('availabilityStatus');
    const roomId = document.getElementById('roomId')?.value;
    const bookNowBtn = document.getElementById('bookNowBtn');
    const guestsInput = document.getElementById('guests');
    
    async function checkAvailability() {
        const checkIn = checkInInput?.value;
        const checkOut = checkOutInput?.value;
        
        if (!checkIn || !checkOut || !roomId) {
            if (availabilityStatus) {
                availabilityStatus.innerHTML = '<i class="fas fa-info-circle"></i> Please select check-in and check-out dates';
                availabilityStatus.style.backgroundColor = '#f8f9fa';
                availabilityStatus.style.color = '#666';
            }
            if (bookNowBtn) bookNowBtn.disabled = true;
            return;
        }
        
        if (availabilityStatus) {
            availabilityStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking availability...';
            availabilityStatus.style.backgroundColor = '#f8f9fa';
            availabilityStatus.style.color = '#666';
        }
        
        try {
            const response = await fetch(`/check-availability/?room_id=${roomId}&check_in=${checkIn}&check_out=${checkOut}`);
            const data = await response.json();
            
            if (availabilityStatus) {
                if (data.available) {
                    availabilityStatus.innerHTML = '<i class="fas fa-check-circle"></i> ✓ Room available for selected dates!';
                    availabilityStatus.style.backgroundColor = '#d4edda';
                    availabilityStatus.style.color = '#155724';
                    
                    if (bookNowBtn) bookNowBtn.disabled = false;
                } else {
                    availabilityStatus.innerHTML = '<i class="fas fa-times-circle"></i> ✗ ' + (data.message || 'Room not available for selected dates');
                    availabilityStatus.style.backgroundColor = '#f8d7da';
                    availabilityStatus.style.color = '#721c24';
                    
                    if (bookNowBtn) bookNowBtn.disabled = true;
                }
            }
            
            // Update total price with correct nights
            if (data.nights) {
                updateTotalPrice();
            }
            
        } catch (error) {
            console.error('Availability check failed:', error);
            if (availabilityStatus) {
                availabilityStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Unable to check availability. Please try again.';
                availabilityStatus.style.backgroundColor = '#fff3cd';
                availabilityStatus.style.color = '#856404';
            }
            if (bookNowBtn) bookNowBtn.disabled = true;
        }
    }
    
    let debounceTimer;
    function debouncedAvailabilityCheck() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(checkAvailability, 500);
    }
    
    if (checkInInput && checkOutInput) {
        const today = new Date().toISOString().split('T')[0];
        checkInInput.min = today;
        checkOutInput.min = today;
        
        checkInInput.addEventListener('change', function() {
            checkOutInput.min = this.value;
            if (checkOutInput.value && checkOutInput.value < this.value) {
                checkOutInput.value = this.value;
            }
            updateTotalPrice();
            debouncedAvailabilityCheck();
        });
        
        checkOutInput.addEventListener('change', function() {
            updateTotalPrice();
            debouncedAvailabilityCheck();
        });
        
        guestsInput?.addEventListener('change', debouncedAvailabilityCheck);
    }
    
    // ============================================
    // 3. IMAGE GALLERY SLIDER
    // ============================================
    let currentImageIndex = 0;
    let galleryImages = [];
    
    function initGallerySlider() {
        const mainImage = document.getElementById('mainImage');
        const thumbnails = document.querySelectorAll('.thumbnail');
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');
        
        galleryImages = Array.from(thumbnails).map(t => t.dataset.fullImage || t.src);
        
        if (thumbnails.length > 0) {
            thumbnails.forEach((thumb, index) => {
                thumb.addEventListener('click', function() {
                    currentImageIndex = index;
                    if (mainImage) {
                        mainImage.src = this.dataset.fullImage || this.src;
                    }
                    updateActiveThumbnail(index);
                });
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (galleryImages.length > 0) {
                    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
                    if (mainImage) {
                        mainImage.src = galleryImages[currentImageIndex];
                    }
                    updateActiveThumbnail(currentImageIndex);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (galleryImages.length > 0) {
                    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
                    if (mainImage) {
                        mainImage.src = galleryImages[currentImageIndex];
                    }
                    updateActiveThumbnail(currentImageIndex);
                }
            });
        }
    }
    
    function updateActiveThumbnail(index) {
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, i) => {
            if (i === index) {
                thumb.classList.add('active');
                thumb.style.border = '2px solid var(--accent)';
                thumb.style.transform = 'scale(1.05)';
            } else {
                thumb.classList.remove('active');
                thumb.style.border = 'none';
                thumb.style.transform = 'scale(1)';
            }
        });
    }
    
    initGallerySlider();
    
    // ============================================
    // 4. BOOKING FORM SUBMISSION
    // ============================================
    const bookingForm = document.getElementById('bookingForm');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const checkIn = checkInInput?.value;
            const checkOut = checkOutInput?.value;
            
            if (!checkIn || !checkOut) {
                showToast('Please select check-in and check-out dates', 'error');
                return;
            }
            
            if (!selectedPlanId && planCards.length > 0) {
                showToast('Please select a pricing plan', 'error');
                return;
            }
            
            const guestName = document.getElementById('guestName')?.value;
            if (!guestName || guestName.trim().length < 2) {
                showToast('Please enter your full name', 'error');
                return;
            }
            
            const email = document.getElementById('guestEmail')?.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }
            
            const phone = document.getElementById('guestPhone')?.value;
            const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
            if (!phone || phone.length < 10 || !phoneRegex.test(phone))  {
                showToast('Please enter a valid phone number', 'error');
                return;
            }
            
            try {
                const response = await fetch(`/check-availability/?room_id=${roomId}&check_in=${checkIn}&check_out=${checkOut}`);
                const data = await response.json();
                
                if (!data.available) {
                    showToast('Room is no longer available for selected dates', 'error');
                    return;
                }
                
                this.submit();
                
            } catch (error) {
                console.error('Availability check error:', error);
                showToast('Error checking availability. Please try again.', 'error');
            }
        });
    }
    
    // ============================================
    // 5. TOAST NOTIFICATION
    // ============================================
    function showToast(message, type = 'success') {
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
            toast.remove();
        }, 3000);
    }
    
    // পেজ লোড হওয়ার সাথে সাথেই বেস প্রাইসটা শো করানোর জন্য
    updateTotalPrice(); 
});

function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}