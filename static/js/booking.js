document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // 1. STATE & CONFIGURATION
    // ============================================
    const config = {
        taxRate: 0.18, // 18% GST/Tax
        currency: 'Inr', // Based on the screenshot provided ($ sign)
        defaultNights: 1
    };

    const state = {
        roomPrice: 0,
        planPrice: 0,
        nights: config.defaultNights,
        discountPercentage: 0,
        subtotal: 0,
        taxAmount: 0,
        total: 0
    };

    // ============================================
    // 2. DOM ELEMENTS CACHING
    // ============================================
    // Inputs
    const elements = {
        roomPriceInput: document.getElementById('roomPrice'),
        planPriceInput: document.getElementById('planPrice'),
        nightsInput: document.getElementById('nights'),
        checkInInput: document.getElementById('checkInDate'), 
        checkOutInput: document.getElementById('checkOutDate'), 
        
        // Display Spans
        subtotalSpan: document.getElementById('subtotal'),
        taxSpan: document.getElementById('taxAmount'),
        totalSpan: document.getElementById('totalAmount'),
        discountLine: document.getElementById('discountLine'),
        discountAmountSpan: document.getElementById('discountAmount'),
        
        // Form & Buttons
        bookingForm: document.getElementById('bookingForm'),
        paymentBtn: document.getElementById('paymentBtn'),
        promoInput: document.getElementById('promoCode'),
        applyPromoBtn: document.getElementById('applyPromo'),
        
        // Plan Cards 
        planCards: document.querySelectorAll('.plan-card') 
    };

    // ============================================
    // 3. CORE PRICE CALCULATION ENGINE
    // ============================================
    window.calculateTotal = function() {
        console.log("Calculating total..."); // Debugging log

        // Helper to safely parse values from inputs or text content
        const getVal = (elem) => {
            if (!elem) return 0;
            let rawVal = elem.value !== undefined ? elem.value : elem.textContent;
            let parsed = parseFloat(rawVal);
            return isNaN(parsed) ? 0 : parsed;
        };

        state.roomPrice = getVal(elements.roomPriceInput);
        state.planPrice = getVal(elements.planPriceInput);
        
        // Get nights from input, fallback to state
        let currentNights = parseInt(elements.nightsInput?.value);
        state.nights = isNaN(currentNights) || currentNights < 1 ? config.defaultNights : currentNights;

        // ==========================================================
        // আপনার পারফেক্ট লজিক: কোনো যোগ-বিয়োগ নেই।
        // যদি প্ল্যান সিলেক্ট করা থাকে, তাহলে সরাসরি সেই প্ল্যানের প্রাইস। 
        // না থাকলে রুমের বেস প্রাইস।
        // ==========================================================
        const effectivePrice = state.planPrice > 0 ? state.planPrice : state.roomPrice; 
        
        // Base calculations
        state.subtotal = effectivePrice * state.nights;
        
        // Apply discount if any
        let activeDiscount = 0;
        if (state.discountPercentage > 0) {
            activeDiscount = state.subtotal * (state.discountPercentage / 100);
            state.subtotal = state.subtotal - activeDiscount;
            
            // Update discount UI
            if (elements.discountLine) elements.discountLine.style.display = 'flex';
            if (elements.discountAmountSpan) elements.discountAmountSpan.textContent = formatPrice(activeDiscount);
        } else {
            if (elements.discountLine) elements.discountLine.style.display = 'none';
        }

        // Tax & Final Total
        state.taxAmount = state.subtotal * config.taxRate;
        state.total = state.subtotal + state.taxAmount;
        
        // Update the DOM efficiently
        updatePriceUI();
        
        return state.total;
    };

    function updatePriceUI() {
        if (elements.subtotalSpan) {
            elements.subtotalSpan.textContent = formatPrice(state.subtotal);
        }
        if (elements.taxSpan) {
            elements.taxSpan.textContent = formatPrice(state.taxAmount);
        }
        if (elements.totalSpan) {
            elements.totalSpan.textContent = formatPrice(state.total);
            
            // If there's a hidden input for total price that gets submitted with the form
            const hiddenTotalInput = document.getElementById('hiddenTotalPrice');
            if(hiddenTotalInput) {
                hiddenTotalInput.value = state.total;
            }
        }
    }

    // ============================================
    // 4. EVENT LISTENERS FOR DYNAMIC UPDATES
    // ============================================
    function setupEventListeners() {
        // Listen to direct changes on hidden/number inputs
        const updateTriggers = [elements.roomPriceInput, elements.planPriceInput, elements.nightsInput];
        updateTriggers.forEach(input => {
            if (input) {
                input.addEventListener('change', window.calculateTotal);
                input.addEventListener('input', window.calculateTotal);
            }
        });

        // Listen for Check-in / Check-out changes to calculate nights automatically
        if (elements.checkInInput && elements.checkOutInput) {
            elements.checkInInput.addEventListener('change', calculateNights);
            elements.checkOutInput.addEventListener('change', calculateNights);
        }

        // Setup Plan Card clicks
        if (elements.planCards.length > 0) {
            elements.planCards.forEach(card => {
                card.addEventListener('click', function() {
                    // Remove active class from all
                    elements.planCards.forEach(c => c.classList.remove('selected-plan', 'border-warning'));
                    
                    // Add active class to clicked
                    this.classList.add('selected-plan', 'border-warning');
                    
                    // Extract price from data attribute (e.g., data-price="5200")
                    const newPrice = this.getAttribute('data-price');
                    if (newPrice && elements.planPriceInput) {
                        elements.planPriceInput.value = newPrice;
                        // Trigger recalculation immediately
                        window.calculateTotal(); 
                    }
                });
            });
        }
    }

    function calculateNights() {
        if (!elements.checkInInput?.value || !elements.checkOutInput?.value) return;

        const checkIn = new Date(elements.checkInInput.value);
        const checkOut = new Date(elements.checkOutInput.value);

        // Ensure valid dates and checkout is after checkin
        if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime()) && checkOut > checkIn) {
            const timeDifference = checkOut.getTime() - checkIn.getTime();
            const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
            
            if (elements.nightsInput) {
                elements.nightsInput.value = daysDifference;
                window.calculateTotal(); // Recalculate price with new nights
            }
        }
    }

    // ============================================
    // 5. FORM VALIDATION
    // ============================================
    window.validateForm = function() {
        let isValid = true;
        
        // 1. Guest Name
        const guestName = document.getElementById('guestName')?.value;
        if (!guestName || guestName.trim().length < 2) {
            isValid = false;
            showFieldError('guestName', 'Name must be at least 2 characters');
        } else {
            clearFieldError('guestName');
        }
        
        // 2. Email Validation
        const email = document.getElementById('guestEmail')?.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            isValid = false;
            showFieldError('guestEmail', 'Valid email is required');
        } else {
            clearFieldError('guestEmail');
        }
        
        // 3. Phone Validation
        const phone = document.getElementById('guestPhone')?.value;
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
        if (!phone || phone.length < 10 || !phoneRegex.test(phone)) {
            isValid = false;
            showFieldError('guestPhone', 'Valid phone number required (min 10 digits)');
        } else {
            clearFieldError('guestPhone');
        }

        // 4. Dates Validation
        const checkIn = document.getElementById('checkInDate')?.value;
        const checkOut = document.getElementById('checkOutDate')?.value;
        
        if (checkIn && checkOut) {
            if (new Date(checkOut) <= new Date(checkIn)) {
                isValid = false;
                showToast('Check-out date must be after Check-in date', 'error');
                showFieldError('checkOutDate', 'Invalid Date');
            } else {
                clearFieldError('checkOutDate');
            }
        }
        
        return isValid;
    };
    
    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '#dc3545';
            let errorDiv = field.parentElement.querySelector('.field-error');
            if (!errorDiv) {
                errorDiv = document.createElement('small');
                errorDiv.className = 'field-error text-danger mt-1 d-block';
                field.parentElement.appendChild(errorDiv);
            }
            errorDiv.textContent = message;
        }
    }
    
    function clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '#e0e0e0';
            const errorDiv = field.parentElement.querySelector('.field-error');
            if (errorDiv) errorDiv.remove();
        }
    }

    // Real-time Validation Binding
    const validationInputs = ['guestName', 'guestEmail', 'guestPhone', 'checkInDate', 'checkOutDate'];
    validationInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('blur', window.validateForm);
            input.addEventListener('input', function() {
                clearFieldError(inputId);
            });
        }
    });

    // ============================================
    // 6. PROMO CODE ENGINE
    // ============================================
    if (elements.applyPromoBtn) {
        elements.applyPromoBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            const promoCode = elements.promoInput?.value;
            
            if (!promoCode) {
                showToast('Please enter a promo code', 'error');
                return;
            }
            
            // UI Feedback during request
            const originalBtnText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            this.disabled = true;
            
            try {
                const response = await fetch('/validate-promo/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCsrfToken()
                    },
                    body: JSON.stringify({ code: promoCode })
                });
                
                const data = await response.json();
                
                if (data.valid && data.discount) {
                    showToast(`Promo code applied! ${data.discount}% off`, 'success');
                    state.discountPercentage = parseFloat(data.discount);
                    window.calculateTotal(); // Recalculate everything with discount
                } else {
                    showToast(data.message || 'Invalid or expired promo code', 'error');
                    state.discountPercentage = 0;
                    window.calculateTotal();
                }
            } catch (error) {
                console.error('Promo validation error:', error);
                showToast('Error applying promo code', 'error');
            } finally {
                this.innerHTML = originalBtnText;
                this.disabled = false;
            }
        });
    }

    // ============================================
    // 7. PAYMENT INITIALIZATION (RAZORPAY)
    // ============================================
    if (elements.paymentBtn) {
        elements.paymentBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // 1. Validate Form First
            if (!window.validateForm()) {
                showToast('Please fix the errors in the form before proceeding', 'error');
                return;
            }
            
            // 2. Ensure price is greater than 0
            if (state.total <= 0) {
                showToast('Booking total cannot be zero. Please check your selections.', 'error');
                return;
            }
            
            // Disable button to prevent double submission
            const originalBtnText = this.innerHTML;
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            // Collect form data
            const formData = new FormData(elements.bookingForm);
            
            // Ensure the exactly calculated frontend amount is sent
            formData.append('total_price', state.total);
            formData.append('nights', state.nights);
            
            try {
                const response = await fetch('/create-booking/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': getCsrfToken()
                    }
                });
                
                const data = await response.json();
                
                if (data.razorpay_order_id) {
                    initializeRazorpayPayment(data);
                } else {
                    showToast(data.error || 'Error initializing payment gateway', 'error');
                    resetPaymentButton(originalBtnText);
                }
            } catch (error) {
                console.error('Payment initialization error:', error);
                showToast('Network error while connecting to payment gateway. Please try again.', 'error');
                resetPaymentButton(originalBtnText);
            }
        });
    }
    
    function resetPaymentButton(originalText) {
        if (elements.paymentBtn) {
            elements.paymentBtn.disabled = false;
            elements.paymentBtn.innerHTML = originalText || 'Proceed to Payment';
        }
    }
    
    function initializeRazorpayPayment(paymentData) {
        const options = {
            key: paymentData.razorpay_key_id,
            amount: paymentData.amount, // amount in paisa/cents
            currency: paymentData.currency || 'INR', // Based on ÉCLAT screenshot
            name: 'ÉCLAT Hotels',
            description: `Room Booking - ${state.nights} Night(s)`,
            order_id: paymentData.razorpay_order_id,
            handler: function(response) {
                // Payment successful - submit the final booking
                submitBookingConfirmation(response);
            },
            prefill: {
                name: document.getElementById('guestName')?.value || '',
                email: document.getElementById('guestEmail')?.value || '',
                contact: document.getElementById('guestPhone')?.value || ''
            },
            notes: {
                booking_source: 'Website',
            },
            theme: {
                color: '#d4af37' // ÉCLAT brand golden color
            },
            modal: {
                ondismiss: function() {
                    console.log('Payment modal closed by user');
                    resetPaymentButton();
                    showToast('Payment was cancelled', 'error');
                }
            }
        };
        
        try {
            const razorpayInstance = new Razorpay(options);
            
            razorpayInstance.on('payment.failed', function (response){
                console.error('Payment Failed:', response.error);
                showToast(`Payment Failed: ${response.error.description}`, 'error');
                resetPaymentButton();
            });
            
            razorpayInstance.open();
        } catch (err) {
            console.error('Razorpay SDK not loaded:', err);
            showToast('Payment gateway failed to load. Please refresh the page.', 'error');
            resetPaymentButton();
        }
    }
    
    // ============================================
    // 8. FINAL BOOKING SUBMISSION
    // ============================================
    async function submitBookingConfirmation(paymentResponse) {
        showToast('Payment successful! Confirming booking...', 'success');
        
        const formData = new FormData(elements.bookingForm);
        formData.append('razorpay_payment_id', paymentResponse.razorpay_payment_id);
        formData.append('razorpay_order_id', paymentResponse.razorpay_order_id);
        formData.append('razorpay_signature', paymentResponse.razorpay_signature);
        
        try {
            const response = await fetch('/confirm-booking/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Clear any stored drafts or session storage if used
                sessionStorage.removeItem('bookingDraft');
                
                // Redirect to success page
                window.location.href = data.redirect_url || `/booking-success/${data.booking_id}/`;
            } else {
                showToast(data.error || 'Server failed to confirm the booking.', 'error');
                resetPaymentButton();
            }
        } catch (error) {
            console.error('Confirmation server error:', error);
            showToast('Critical Error: Booking confirmed but failed to update server. Please contact support.', 'error');
            resetPaymentButton();
        }
    }

    // ============================================
    // 9. INITIALIZATION CALLS
    // ============================================
    setupEventListeners();
    
    // Slight delay ensures all external scripts/DOM elements are fully populated
    setTimeout(() => {
        window.calculateTotal();
    }, 100);
});

/**
 * ============================================
 * 10. GLOBAL HELPER FUNCTIONS
 * ============================================
 */

/**
 * Formats a raw number into a stylized currency string.
 * Uses USD based on the ÉCLAT screenshot provided.
 * @param {number} price - The raw price number
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
    if (isNaN(price)) price = 0;
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD', // Changed from INR to USD to match your screenshot
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

/**
 * Retrieves the CSRF token from browser cookies (Standard Django/Laravel pattern)
 * @returns {string} CSRF token
 */
function getCsrfToken() {
    if (!document.cookie) return '';
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}

/**
 * Displays a non-blocking toast notification on the screen.
 * @param {string} message - The message to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
    // Remove existing toast if present to prevent stacking clutter
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    // Choose appropriate icon
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
    
    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span style="font-weight: 500; letter-spacing: 0.3px;">${message}</span>
    `;
    
    // Inline CSS for foolproof rendering regardless of external stylesheets
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${type === 'success' ? '#2e7d32' : '#d32f2f'};
        color: #ffffff;
        padding: 16px 24px;
        border-radius: 8px;
        z-index: 99999;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.remove();
            }
        }, 400); // Wait for fade out animation
    }, 4000);
}