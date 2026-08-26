// ============================================
// ADMIN.JS - Admin Panel JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // 1. ROOM MANAGEMENT
    // ============================================
    
    // Add Room Modal
    const addRoomBtn = document.getElementById('addRoomBtn');
    const addRoomModal = document.getElementById('addRoomModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    
    if (addRoomBtn && addRoomModal) {
        addRoomBtn.addEventListener('click', () => {
            addRoomModal.style.display = 'block';
        });
    }
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // ============================================
    // 2. ROOM FORM VALIDATION
    // ============================================
    const roomForm = document.getElementById('roomForm');
    if (roomForm) {
        roomForm.addEventListener('submit', function(e) {
            const roomNumber = document.getElementById('roomNumber')?.value;
            const price = document.getElementById('priceBase')?.value;
            const capacity = document.getElementById('capacity')?.value;
            
            let isValid = true;
            
            if (!roomNumber || roomNumber.trim() === '') {
                showError('roomNumber', 'Room number is required');
                isValid = false;
            }
            
            if (!price || price <= 0) {
                showError('priceBase', 'Valid price is required');
                isValid = false;
            }
            
            if (!capacity || capacity < 1) {
                showError('capacity', 'Capacity must be at least 1');
                isValid = false;
            }
            
            if (!isValid) {
                e.preventDefault();
            }
        });
    }
    
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '#dc3545';
            let errorSpan = field.parentElement.querySelector('.error-message');
            if (!errorSpan) {
                errorSpan = document.createElement('small');
                errorSpan.className = 'error-message';
                errorSpan.style.cssText = 'color: #dc3545; font-size: 0.8rem; margin-top: 5px; display: block;';
                field.parentElement.appendChild(errorSpan);
            }
            errorSpan.textContent = message;
        }
    }
    
    // ============================================
    // 3. BOOKING FILTERS
    // ============================================
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchInput = document.getElementById('searchBookings');
    const filterBtn = document.getElementById('applyFilters');
    
    function filterBookings() {
        const status = statusFilter?.value;
        const date = dateFilter?.value;
        const search = searchInput?.value.toLowerCase();
        
        const rows = document.querySelectorAll('#bookingsTable tbody tr');
        
        rows.forEach(row => {
            let show = true;
            
            if (status && status !== 'all') {
                const rowStatus = row.querySelector('.status-badge')?.textContent.toLowerCase();
                if (rowStatus !== status) show = false;
            }
            
            if (date) {
                const rowDate = row.cells[4]?.textContent; // Check-in date column
                if (rowDate !== date) show = false;
            }
            
            if (search) {
                const guestName = row.cells[1]?.textContent.toLowerCase();
                const roomNumber = row.cells[2]?.textContent.toLowerCase();
                if (!guestName.includes(search) && !roomNumber.includes(search)) show = false;
            }
            
            row.style.display = show ? '' : 'none';
        });
    }
    
    if (filterBtn) {
        filterBtn.addEventListener('click', filterBookings);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keyup', filterBookings);
    }
    
    // ============================================
    // 4. BULK ACTIONS
    // ============================================
    const selectAllCheckbox = document.getElementById('selectAll');
    const bookingCheckboxes = document.querySelectorAll('.booking-checkbox');
    const bulkActionSelect = document.getElementById('bulkAction');
    const applyBulkBtn = document.getElementById('applyBulk');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            bookingCheckboxes.forEach(cb => {
                cb.checked = this.checked;
            });
        });
    }
    
    if (applyBulkBtn && bulkActionSelect) {
        applyBulkBtn.addEventListener('click', async function() {
            const action = bulkActionSelect.value;
            const selectedIds = Array.from(bookingCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            
            if (selectedIds.length === 0) {
                showToast('Please select at least one booking', 'error');
                return;
            }
            
            if (confirm(`Are you sure you want to ${action} ${selectedIds.length} booking(s)?`)) {
                try {
                    const response = await fetch('/admin/bulk-action/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': getCsrfToken()
                        },
                        body: JSON.stringify({
                            action: action,
                            ids: selectedIds
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showToast(`Successfully ${action}ed ${selectedIds.length} bookings`, 'success');
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        showToast('Error performing bulk action', 'error');
                    }
                } catch (error) {
                    showToast('Network error', 'error');
                }
            }
        });
    }
    
    // ============================================
    // 5. CHART.JS INTEGRATION FOR DASHBOARD
    // ============================================
    if (document.getElementById('revenueChart')) {
        // Load Chart.js from CDN if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = initCharts;
            document.head.appendChild(script);
        } else {
            initCharts();
        }
    }
    
    function initCharts() {
        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
        if (revenueCtx) {
            new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                    datasets: [{
                        label: 'Revenue (INR)',
                        data: window.revenueData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        borderColor: '#d4af37',
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        }
        
        // Booking Status Chart
        const statusCtx = document.getElementById('statusChart')?.getContext('2d');
        if (statusCtx && window.bookingStatusData) {
            new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
                    datasets: [{
                        data: window.bookingStatusData,
                        backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }
    
    // ============================================
    // 6. EXPORT DATA
    // ============================================
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const table = document.getElementById('bookingsTable');
            if (table) {
                const rows = table.querySelectorAll('tr');
                let csv = [];
                
                rows.forEach(row => {
                    const cols = row.querySelectorAll('td, th');
                    const rowData = Array.from(cols).map(col => col.textContent);
                    csv.push(rowData.join(','));
                });
                
                const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                
                showToast('Data exported successfully', 'success');
            }
        });
    }
    
    // ============================================
    // 7. IMAGE UPLOAD PREVIEW
    // ============================================
    const imageInput = document.getElementById('roomImages');
    const previewContainer = document.getElementById('imagePreview');
    
    if (imageInput && previewContainer) {
        imageInput.addEventListener('change', function(e) {
            previewContainer.innerHTML = '';
            const files = Array.from(e.target.files);
            
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(evt) {
                        const preview = document.createElement('div');
                        preview.className = 'image-preview-item';
                        preview.style.cssText = 'position: relative; display: inline-block; margin: 10px;';
                        preview.innerHTML = `
                            <img src="${evt.target.result}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                            <button type="button" class="remove-image" style="position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;">×</button>
                        `;
                        previewContainer.appendChild(preview);
                        
                        preview.querySelector('.remove-image').addEventListener('click', () => {
                            preview.remove();
                        });
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }
    
    // ============================================
    // 8. CSRF TOKEN HELPER
    // ============================================
    function getCsrfToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }
    
    // ============================================
    // 9. TOAST NOTIFICATION
    // ============================================
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-${type}`;
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
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
  // ============================================
    // 10. DYNAMIC INVENTORY / CALENDAR CHECKER LOGIC
    // ============================================
    const inventoryDate = document.getElementById('inventoryDate');
    const checkInventoryBtn = document.getElementById('checkInventoryBtn');
    const inventoryResults = document.getElementById('inventoryResults');

    if (inventoryDate && checkInventoryBtn && inventoryResults) {
        // Set today's date as default on load
        const today = new Date().toISOString().split('T')[0];
        inventoryDate.value = today;

        const fetchInventory = async (date) => {
            inventoryResults.innerHTML = '<p style="color: #666;"><i class="fas fa-spinner fa-spin"></i> Loading availability...</p>';
            try {
                // ==========================================
                // FIXED: /admin/ এর বদলে /api/ করা হলো 
                // ==========================================
                const response = await fetch(`/api/room-availability/?date=${date}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                inventoryResults.innerHTML = ''; // Clear loading
                
                data.inventory.forEach(item => {
                    // Logic for Sold Out
                    let statusColor = item.sold_out ? '#dc3545' : '#28a745'; // Red if sold out, Green if available
                    let statusText = item.sold_out ? 'SOLD OUT' : `${item.available} Rooms Available`;
                    let bgColor = item.sold_out ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)';
                    
                    // If Admin hasn't added any rooms of this type yet
                    if (item.total === 0) {
                        statusColor = '#6c757d';
                        statusText = 'No Inventory Added';
                        bgColor = '#f8f9fa';
                    }
                    
                    const card = document.createElement('div');
                    card.style.cssText = `
                        background: ${bgColor}; 
                        border: 2px solid ${statusColor}; 
                        border-radius: 12px; 
                        padding: 20px; 
                        text-align: center;
                        transition: transform 0.2s;
                    `;
                    
                    card.innerHTML = `
                        <h4 style="margin-bottom: 12px; color: var(--primary); font-size: 1.1rem;">${item.type_name}</h4>
                        <div style="font-size: 1.3rem; font-weight: 800; color: ${statusColor}; margin-bottom: 8px;">
                            ${statusText}
                        </div>
                        <div style="font-size: 0.9rem; color: #555; font-weight: 600;">
                            Total Inventory: <span style="color:#333;">${item.total}</span> <br>
                            Booked: <span style="color:#333;">${item.booked}</span>
                        </div>
                    `;
                    inventoryResults.appendChild(card);
                });
                
            } catch (error) {
                console.error("Error loading inventory:", error);
                inventoryResults.innerHTML = '<p style="color: red;">Failed to load inventory data.</p>';
            }
        };

        // Check availability on button click
        checkInventoryBtn.addEventListener('click', () => {
            if (inventoryDate.value) {
                fetchInventory(inventoryDate.value);
            }
        });

        // Also fetch automatically when date is changed
        inventoryDate.addEventListener('change', () => {
            fetchInventory(inventoryDate.value);
        });

        // Fetch for today's date automatically when dashboard loads
        fetchInventory(today);
    }
});