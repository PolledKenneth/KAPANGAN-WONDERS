// Authentication Functions
function openAuthModal(mode = 'signin') {
    const modal = document.getElementById('authModal');
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10); // Add show class for fade-in
    switchAuthTab(mode);
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // Wait for fade-out transition
}

function switchAuthTab(mode) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    forms.forEach(form => form.classList.remove('active'));
    
    if (mode === 'signin') {
        tabs[0].classList.add('active');
        document.getElementById('signinForm').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }
}

function handleSignIn(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value.trim();
    const password = e.target.querySelector('input[type="password"]').value;

    // Basic validation
    if (!email || !password) {
        alert('Please fill in all required fields.');
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    // Always fetch the latest users from localStorage
    const usersRaw = localStorage.getItem('users');
    let users = [];
    try {
        users = usersRaw ? JSON.parse(usersRaw) : [];
    } catch (err) {
        users = [];
    }
    const user = users.find(u => u.email === email);

    // In a real app, you would hash the password and verify it against the stored hash
    if (user && user.password === password) {
        // Don't store password in currentUser for security
        const { password: _, ...userWithoutPassword } = user;
        window.currentUser = userWithoutPassword; // Ensure global assignment
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        localStorage.setItem('isLoggedIn', 'true'); // Persist login state
        updateAuthUI();
        closeAuthModal();
        alert('Welcome back, ' + user.name + '!');
    } else {
        alert('Invalid email or password. Please try again.');
    }
}

function handleSignUp(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const phone = document.getElementById('signupPhone').value.trim();
    const address = document.getElementById('signupAddress').value.trim();
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Password validation
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email)) {
        alert('User with this email already exists!');
        return;
    }
    
    // In a real app, you would hash the password before storing it
    // For example: const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // In production, store only the hashed password
        phone: phone || null,
        address: address || null,
        joinDate: new Date().toISOString(),
        role: 'user' // Default role
    };
    
    // Save user to local storage
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Set current user (without password)
    const { password: _, ...userWithoutPassword } = newUser;
    window.currentUser = userWithoutPassword;
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    localStorage.setItem('isLoggedIn', 'true'); // Persist login state
    
    // Update UI and show success message
    updateAuthUI();
    closeAuthModal();
    alert('Account created successfully! Welcome to Kapangan Wonders, ' + name + '!');
}

function logout() {
    window.currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn'); // Remove login state
    updateAuthUI();
    showHome();
    alert('You have been logged out successfully!');
}

// Global Variables
let currentFilter = 'all';
let currentSpot = null;
let userTravels = JSON.parse(localStorage.getItem('userTravels')) || [];
let currentTravelId = null;

// Calendar state
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = new Date();

// On page load, check persistent login state
if (localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('currentUser')) {
    try {
        window.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    } catch (e) {
        window.currentUser = null;
    }
} else {
    window.currentUser = null;
}

// Ensure UI reflects login state on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAuthUI);
} else {
    updateAuthUI();
}

function updateAuthUI() {
    const mobileAuthButtons = document.querySelector('.mobile-auth-buttons');
    const mobileUserMenu = document.getElementById('mobileUserMenu');
    
    if (window.currentUser) {
        // Hide mobile auth buttons when user is logged in
        if (mobileAuthButtons) {
            mobileAuthButtons.style.display = 'none';
        }
        // Show mobile user menu when user is logged in
        if (mobileUserMenu) {
            mobileUserMenu.style.display = 'flex';
            document.getElementById('mobileUserNameDisplay').textContent = window.currentUser.name;
        }
    } else {
        // Show mobile auth buttons when user is not logged in
        if (mobileAuthButtons) {
            mobileAuthButtons.style.display = 'flex';
        }
        // Hide mobile user menu when user is not logged in
        if (mobileUserMenu) {
            mobileUserMenu.style.display = 'none';
        }
    }
}

// Booking status thresholds (0-1 scale)
const BOOKING_THRESHOLDS = {
    LOW: 0.3,    // 0-30% booked (shows as available/green)
    MEDIUM: 0.7  // 31-70% booked (shows as moderate/yellow)
    // 71-100% is considered high (shows as fully-booked/red)
};

// Global variable to track selected date
let selectedVisitDate = null;
let selectedTimeSlots = {}; // Track selected time slots for each barangay

// Schedule Visit Functions
function scheduleVisit(spot = null) {
    if (!window.currentUser) {
        alert('Please sign in to schedule a visit.');
        openAuthModal('signin');
        return;
    }
    
    const modal = document.getElementById('scheduleModal');
    
    // Reset form and pre-fill user data
    document.getElementById('scheduleForm').reset();
    prefillScheduleForm();
    
    // Reset global variables
    selectedVisitDate = null;
    selectedTimeSlots = {};
    
    // Show the modal
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Update date picker styles and initialize calendar
    updateDatePickerStyles();
    
    // Force re-render of the calendar after a short delay to ensure it's visible
    setTimeout(() => {
        const dateInput = document.getElementById('visitDate');
        if (dateInput && dateInput._flatpickr) {
            dateInput._flatpickr.redraw();
            dateInput._flatpickr.jumpToDate(new Date());
        }
    }, 100);
    
    // Pre-select barangay and spot if provided
    if (spot) {
        currentSpot = spot;
        
        // Find the barangay this spot belongs to
        const barangayMatch = spot.location.match(/(Balakbak|Cuba|Beleng-Belis|Taba-ao|Toplac|Labueg|Payapay|Pudtong)/);
        if (barangayMatch && barangayMatch[1]) {
            const barangay = barangayMatch[1];
            const checkbox = document.querySelector(`input[name="barangay"][value="${barangay}"]`);
            if (checkbox) {
                checkbox.checked = true;
                // Trigger spot update
                updateSpotCheckboxes();
                
                // After a short delay, check the spot checkbox
                setTimeout(() => {
                    const spotCheckbox = document.querySelector(`input[name="spot"][data-spot-id="${spot.id}"]`);
                    if (spotCheckbox) {
                        spotCheckbox.checked = true;
                    }
                }, 100);
            }
        }
    }
    
    // Show modal with animation
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Close other modals
    closeModal();
    closeAuthModal();
}

function closeScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

async function handleScheduleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scheduling...';
        
        // Get form values
        const name = document.getElementById('scheduleUserName').value.trim();
        const email = document.getElementById('scheduleUserEmail').value.trim();
        const age = parseInt(document.getElementById('scheduleUserAge').value);
        const medicalCheckbox = document.getElementById('medicalDeclaration');
        const visitDate = selectedVisitDate;

        // Get selected barangays and spots
        const selectedBarangays = Array.from(document.querySelectorAll('input[name="barangay"]:checked')).map(cb => cb.value);
        const selectedSpots = Array.from(document.querySelectorAll('input[name="spot"]:checked')).map(cb => ({
            name: cb.value,
            id: cb.dataset.spotId,
            barangay: cb.dataset.barangay
        }));

        // Validate form
        if (selectedBarangays.length === 0) {
            document.getElementById('barangayError').style.display = 'block';
            throw new Error('Please select at least one barangay.');
        } else {
            document.getElementById('barangayError').style.display = 'none';
        }

        if (selectedSpots.length === 0) {
            document.getElementById('spotError').style.display = 'block';
            throw new Error('Please select at least one tourist spot.');
        } else {
            document.getElementById('spotError').style.display = 'none';
        }

        if (!visitDate) {
            throw new Error('Please select a visit date.');
        }

        // Get general visitors count
        const generalVisitorsInput = document.getElementById('generalVisitorsInput');
        const totalVisitors = generalVisitorsInput ? parseInt(generalVisitorsInput.value, 10) : 0;
        
        if (isNaN(totalVisitors) || totalVisitors < 1 || totalVisitors > 50) {
            throw new Error('Total number of visitors must be between 1 and 50.');
        }
        
        // Validate that all selected barangays have a time slot and end time
        const barangaySchedules = {};
        for (const barangay of selectedBarangays) {
            const timeSlot = selectedTimeSlots[barangay]?.time;
            const endTime = selectedTimeSlots[barangay]?.endTime;
            
            if (!timeSlot) {
                throw new Error(`Please select a time slot for ${barangay}.`);
            }
            
            if (!endTime) {
                throw new Error(`Please select an end time for ${barangay}.`);
            }
            
            barangaySchedules[barangay] = { 
                date: visitDate, 
                time: timeSlot, 
                endTime: endTime,
                visitors: totalVisitors // Use the general visitors count for all barangays
            };
        }

        if (!medicalCheckbox.checked) {
            throw new Error('Please confirm your medical condition declaration before submitting.');
        }

        // Check age restrictions for certain barangays
        const restrictedBarangays = ['Balakbak', 'Cuba'];
        const hasRestrictedBarangay = selectedBarangays.some(barangay =>
            restrictedBarangays.includes(barangay) && age >= 80
        );
        if (hasRestrictedBarangay) {
            throw new Error('Visitors aged 80 and above are not allowed in certain barangays for safety reasons.');
        }

        // Create travel objects for each selected spot, using barangay-specific schedule
        const travels = [];
        for (const spotInfo of selectedSpots) {
            const spot = touristSpots.find(s => s.id === parseInt(spotInfo.id));
            if (!spot) {
                throw new Error(`Tourist spot '${spotInfo.name}' not found.`);
            }
            
            const barangay = spotInfo.barangay;
            const sched = barangaySchedules[barangay];
            
            if (!sched) {
                console.warn(`No schedule found for barangay ${barangay}`);
                continue;
            }
            
            // Check for time conflicts with other barangays
            const hasConflict = Object.entries(barangaySchedules).some(([b, otherSched]) => {
                if (b === barangay) return false; // Skip current barangay
                return isTimeOverlap(sched.time, otherSched.time);
            });
            
            if (hasConflict) {
                throw new Error(`The selected time slot for ${barangay} conflicts with another barangay's schedule.`);
            }
            
            travels.push({
                id: `visit-${Date.now()}-${spot.id}-${barangay}`,
                userId: window.currentUser.id,
                userName: name,
                userEmail: email,
                userAge: age,
                barangay: barangay,
                spot: spot,
                date: sched.date,
                time: sched.time,
                endTime: sched.endTime,
                visitors: sched.visitors,
                status: 'scheduled',
                referenceNumber: `KWV-${Math.floor(10000 + Math.random() * 90000)}`,
                createdAt: new Date().toISOString()
            });
        }
        
        if (travels.length === 0) {
            throw new Error('No valid travel entries were created. Please check your selections.');
        }

        // In a real app, you would send this to your backend
        for (const travel of travels) {
            userTravels.push(travel);
        }

        localStorage.setItem('userTravels', JSON.stringify(userTravels));

        // Reset form
        form.reset();
        closeScheduleModal();
        
        // Reset scheduling state
        selectedVisitDate = null;
        selectedTimeSlots = {};

        // Show success message
        const spotNames = selectedSpots.map(s => s.name).join(', ');
        showNotification('success', `Visits scheduled successfully for: ${spotNames}`);

        // Show dashboard and My Scheduled Travels
        showDashboard();
        showDashboardSection('travels');

        // Generate and show QR code for the first spot
        if (travels.length > 0) {
            generateQRCode(travels[0]);
        }

    } catch (error) {
        console.error('Scheduling error:', error);
        showNotification('error', error.message || 'Failed to schedule visits. Please try again.');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

function updateSpotCheckboxes() {
    const selectedBarangays = Array.from(document.querySelectorAll('input[name="barangay"]:checked')).map(cb => cb.value);
    const spotGroup = document.getElementById('spotCheckboxGroup');
    let barangaySchedulesGroup = document.getElementById('barangaySchedulesGroup');

    // Create the barangaySchedulesGroup container if not present
    if (!barangaySchedulesGroup) {
        barangaySchedulesGroup = document.createElement('div');
        barangaySchedulesGroup.id = 'barangaySchedulesGroup';
        spotGroup.parentNode.parentNode.insertBefore(barangaySchedulesGroup, spotGroup.parentNode.nextSibling);
    }

    // Clear existing spots and barangay schedules
    spotGroup.innerHTML = '';
    barangaySchedulesGroup.innerHTML = '';

    if (selectedBarangays.length === 0) {
        spotGroup.innerHTML = '';
        return;
    }

    // Filter spots that belong to any of the selected barangays
    const filteredSpots = touristSpots.filter(spot =>
        selectedBarangays.some(barangay => spot.location.includes(barangay))
    );

    if (filteredSpots.length === 0) {
        spotGroup.innerHTML = '';
        return;
    }

    // Create checkboxes for each spot, grouped by barangay
    selectedBarangays.forEach(barangay => {
        const spotsForBarangay = filteredSpots.filter(spot => spot.location.includes(barangay));
        if (spotsForBarangay.length > 0) {
            const barangayLabel = document.createElement('div');
            barangayLabel.innerHTML = `<strong>${barangay}</strong>`;
            spotGroup.appendChild(barangayLabel);

            spotsForBarangay.forEach(spot => {
                const label = document.createElement('label');
                label.className = 'checkbox-label';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = 'spot';
                checkbox.value = spot.name;
                checkbox.dataset.spotId = spot.id;
                checkbox.dataset.barangay = barangay;
                checkbox.onchange = validateSpotSelection;

                const span = document.createElement('span');
                span.textContent = spot.name;

                label.appendChild(checkbox);
                label.appendChild(span);
                spotGroup.appendChild(label);
            });
        }
    });

    // Render barangay-specific schedule forms
    renderBarangayScheduleForms(selectedBarangays);
}

// Function to render schedule forms for selected barangays
function getBookingStatus(date) {
    // Mock function - in a real app, this would check actual bookings
    // For demo purposes, we'll use a pseudo-random but consistent value per date
    const dateStr = new Date(date).toDateString();
    const hash = Array.from(dateStr).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomFactor = (hash % 100) / 100; // 0-1 based on date
    
    return randomFactor; // 0-1 representing booking percentage
}

function getBookingStatusClass(percentage) {
    if (percentage < BOOKING_THRESHOLDS.LOW) return 'available';
    if (percentage < BOOKING_THRESHOLDS.MEDIUM) return 'moderate';
    return 'fully-booked';
}

function updateDatePickerStyles() {
    const dateInput = document.getElementById('visitDate');
    if (!dateInput) return;
    
    // Add booking status legend
    const bookingLegend = `
        <div class="booking-legend">
            <div class="legend-item legend-available">
                <span class="legend-color"></span>
                <span class="legend-item-text">Open (0-30% booked)</span>
            </div>
            <div class="legend-item legend-moderate">
                <span class="legend-color"></span>
                <span class="legend-item-text">Moderate (31-70% booked)</span>
            </div>
            <div class="legend-item legend-fully-booked">
                <span class="legend-color"></span>
                <span class="legend-item-text">Fully Booked (71-100%)</span>
            </div>
        </div>
    `;
    
    // Insert legend after the date input if not already present
    if (!dateInput.nextElementSibling || !dateInput.nextElementSibling.classList.contains('booking-legend')) {
        dateInput.insertAdjacentHTML('afterend', bookingLegend);
    }
    
    // Add wrapper div for better styling control
    if (!dateInput.parentNode.classList.contains('flatpickr-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flatpickr-wrapper';
        dateInput.parentNode.insertBefore(wrapper, dateInput);
        wrapper.appendChild(dateInput);
    }
    
    // Initialize Flatpickr with custom styling
    if (typeof flatpickr !== 'undefined') {
        // Remove any existing flatpickr instances
        if (dateInput._flatpickr) {
            dateInput._flatpickr.destroy();
        }
        
        // Add a small delay to ensure the input is in the DOM
        setTimeout(() => {
            const fp = flatpickr(dateInput, {
                minDate: 'today',
                dateFormat: 'Y-m-d',
                disableMobile: true, // Better UX on mobile
                static: true, // Keep calendar visible
                monthSelectorType: 'static', // Show month/year dropdowns
                wrap: true, // Allow custom wrapper
                clickOpens: true, // Ensure calendar opens on click
                onOpen: function(selectedDates, dateStr, instance) {
                    // Force calendar to be visible
                    const calendar = instance.calendarContainer;
                    calendar.style.display = 'block';
                    calendar.style.opacity = '1';
                    
                    // Add custom class to the calendar
                    calendar.classList.add('custom-calendar');
                },
                onChange: function(selectedDates, dateStr) {
                    selectedVisitDate = dateStr;
                    const selectedBarangays = Array.from(document.querySelectorAll('input[name="barangay"]:checked')).map(cb => cb.value);
                    renderBarangayScheduleForms(selectedBarangays);
                },
                    onDayCreate: function(dObj, dStr, fp, dayElem) {
                    // Skip if not a valid date
                    if (!dayElem.dateObj) return;
                    
                    const date = dayElem.dateObj;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    // Skip past dates
                    if (date < today) {
                        dayElem.classList.add('flatpickr-disabled');
                        dayElem.title = 'This date has passed';
                        return;
                    }
                    
                    // Get booking status
                    const bookingPercentage = getBookingStatus(date);
                    let statusClass = 'available';
                    let statusText = 'Open';
                    
                    // Determine status class and text
                    if (bookingPercentage <= 0.3) {
                        statusClass = 'available';
                        statusText = 'Open';
                    } else if (bookingPercentage <= 0.7) {
                        statusClass = 'moderate';
                        statusText = 'Moderate';
                    } else {
                        statusClass = 'fully-booked';
                        statusText = 'Fully Booked';
                    }
                    
                    // Add status class to the day element
                    dayElem.classList.add(statusClass);
                    
                    // Add today class if applicable
                    if (date.toDateString() === today.toDateString()) {
                        dayElem.classList.add('today');
                    }
                    
                    // Add tooltip with booking status and percentage
                    dayElem.title = `${statusText} (${Math.round(bookingPercentage * 100)}% booked)`;
                }
            });
            
            // Force calendar to open initially
            fp.open();
        }, 100);
    }
}

// Function to handle date selection
function handleDateSelection() {
    const dateInput = document.getElementById('visitDate');
    if (!dateInput) return;
    
    dateInput.addEventListener('change', (e) => {
        selectedVisitDate = e.target.value;
        const selectedBarangays = Array.from(document.querySelectorAll('input[name="barangay"]:checked')).map(cb => cb.value);
        renderBarangayScheduleForms(selectedBarangays);
    });
}

// Initialize the date picker when the script loads
document.addEventListener('DOMContentLoaded', () => {
    updateDatePickerStyles();
    handleDateSelection();
    
    // Re-initialize date picker when the schedule modal is opened
    document.getElementById('scheduleVisitModal')?.addEventListener('shown.bs.modal', () => {
        updateDatePickerStyles();
        handleDateSelection();
    });
});

function renderBarangayScheduleForms(barangays) {
    const container = document.getElementById('barangaySchedulesGroup');
    if (!container) return;
    
    // Store existing time range containers before clearing
    const existingTimeRanges = {};
    barangays.forEach(barangay => {
        const existingRange = document.getElementById(`timeRange-${barangay}`);
        if (existingRange) {
            existingTimeRanges[barangay] = existingRange.cloneNode(true);
        }
    });
    
    container.innerHTML = '';

    // Custom calendar container
    const calendarDiv = document.createElement('div');
    calendarDiv.id = 'customCalendarContainer';
    calendarDiv.className = 'calendar-container';
    calendarDiv.style.marginBottom = '20px';
    container.appendChild(calendarDiv);
    // Render the custom calendar
    renderCustomCalendar('customCalendarContainer', barangays);

    // If we have a selected date, show the time slots
    if (selectedVisitDate) {
        // Add back button to change date
        const backButton = document.createElement('button');
        backButton.type = 'button';
        backButton.className = 'btn btn-outline';
        backButton.style.marginBottom = '15px';
        backButton.innerHTML = '&larr; Change Date';
        backButton.onclick = () => {
            selectedVisitDate = null;
            renderBarangayScheduleForms(barangays);
        };
        container.appendChild(backButton);

        // Show selected date
        const dateDisplay = document.createElement('h4');
        const formattedDate = new Date(selectedVisitDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        dateDisplay.textContent = `Visit Date: ${formattedDate}`;
        dateDisplay.style.marginBottom = '20px';
        container.appendChild(dateDisplay);

        // Create a container for the barangay schedule forms
        const schedulesContainer = document.createElement('div');
        schedulesContainer.className = 'barangay-schedules';
        
        // Render time slot selection for each barangay
        barangays.forEach(barangay => {
            const scheduleDiv = document.createElement('div');
            scheduleDiv.className = 'barangay-schedule-form';
            scheduleDiv.dataset.barangay = barangay;
            scheduleDiv.style.cssText = `
                margin: 1.5rem 0;
                padding: 1.5rem;
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                border-radius: 12px;
                border: 1px solid #e9ecef;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                position: relative;
                overflow: hidden;
            `;

            // Add subtle background pattern
            const patternDiv = document.createElement('div');
            patternDiv.style.cssText = `
                position: absolute;
                top: 0;
                right: 0;
                width: 100px;
                height: 100px;
                background: linear-gradient(45deg, transparent 40%, rgba(40, 167, 69, 0.03) 50%, transparent 60%);
                border-radius: 50%;
                transform: translate(30px, -30px);
            `;
            scheduleDiv.appendChild(patternDiv);

            // Get existing time slots for this barangay
            const existingSlots = getBookedTimeSlots(barangay, selectedVisitDate);
            
            // Create header with barangay name and icon
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e9ecef;
            `;
            
            const iconDiv = document.createElement('div');
            iconDiv.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            iconDiv.style.cssText = `
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
            `;
            
            const titleDiv = document.createElement('div');
            titleDiv.innerHTML = `
                <h4 style="margin: 0; color: #2c3e50; font-size: 1.3rem; font-weight: 700;">${barangay}</h4>
                <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 0.9rem;">Select your preferred time slot</p>
            `;
            
            headerDiv.appendChild(iconDiv);
            headerDiv.appendChild(titleDiv);
            scheduleDiv.appendChild(headerDiv);

            // Create a container for both time sections side by side
            const timeSectionsContainer = document.createElement('div');
            timeSectionsContainer.style.cssText = `
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            `;
            
            // Add responsive styles
            const style = document.createElement('style');
            style.textContent = `
                @media (max-width: 768px) {
                    .time-sections-container {
                        grid-template-columns: 1fr !important;
                        gap: 15px !important;
                    }
                }
            `;
            document.head.appendChild(style);
            timeSectionsContainer.className = 'time-sections-container';
            
            // Create start time selection section
            const startTimeSection = document.createElement('div');
            startTimeSection.className = 'form-group';
            startTimeSection.style.cssText = `
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                border-radius: 12px;
                border: 2px solid #e9ecef;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            `;
            
            const startTimeLabel = document.createElement('label');
            startTimeLabel.innerHTML = '<i class="fas fa-play"></i> Step 1: Select Start Time <span style="color: #dc3545;">*</span>';
            startTimeLabel.style.cssText = `
                display: block;
                font-weight: 600;
                margin-bottom: 15px;
                color: #2c3e50;
                font-size: 1.1rem;
            `;
            
            const startTimeContainer = document.createElement('div');
            startTimeContainer.id = `startTimeSlots-${barangay}`;
            startTimeContainer.className = 'time-slot-container';
            
            const startTimeErrorDiv = document.createElement('div');
            startTimeErrorDiv.id = `startTimeError-${barangay}`;
            startTimeErrorDiv.className = 'error-message';
            startTimeErrorDiv.style.cssText = 'color: #dc3545; display: none; margin-top: 10px; font-size: 0.9rem;';
            
            startTimeSection.appendChild(startTimeLabel);
            startTimeSection.appendChild(startTimeContainer);
            startTimeSection.appendChild(startTimeErrorDiv);
            
            // Generate and append start time slots
            const startTimeSlotsElement = generateTimeSlots(barangay, existingSlots, 'start');
            startTimeContainer.appendChild(startTimeSlotsElement);
            
            // Create end time selection section
            const endTimeSection = document.createElement('div');
            endTimeSection.className = 'form-group';
            endTimeSection.style.cssText = `
                background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
                border-radius: 12px;
                border: 2px solid #28a745;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(40, 167, 69, 0.1);
                opacity: 0.6;
                pointer-events: none;
            `;
            
            const endTimeLabel = document.createElement('label');
            endTimeLabel.innerHTML = '<i class="fas fa-stop"></i> Step 2: Select End Time <span style="color: #dc3545;">*</span>';
            endTimeLabel.style.cssText = `
                display: block;
                font-weight: 600;
                margin-bottom: 15px;
                color: #155724;
                font-size: 1.1rem;
            `;
            
            const endTimeContainer = document.createElement('div');
            endTimeContainer.id = `endTimeSlots-${barangay}`;
            endTimeContainer.className = 'time-slot-container';
            
            const endTimeErrorDiv = document.createElement('div');
            endTimeErrorDiv.id = `endTimeError-${barangay}`;
            endTimeErrorDiv.className = 'error-message';
            endTimeErrorDiv.style.cssText = 'color: #dc3545; display: none; margin-top: 10px; font-size: 0.9rem;';
            
            endTimeSection.appendChild(endTimeLabel);
            endTimeSection.appendChild(endTimeContainer);
            endTimeSection.appendChild(endTimeErrorDiv);
            
            // Add placeholder for end time slots
            endTimeContainer.innerHTML = '<p style="text-align: center; color: #6c757d; font-style: italic;">Select a start time first</p>';
            
            // Add both sections to the container
            timeSectionsContainer.appendChild(startTimeSection);
            timeSectionsContainer.appendChild(endTimeSection);
            
            scheduleDiv.appendChild(timeSectionsContainer);
            
            scheduleDiv.appendChild(timeSectionsContainer);
            
            // Restore existing time range container if it exists
            if (existingTimeRanges[barangay]) {
                scheduleDiv.appendChild(existingTimeRanges[barangay]);
            }
            
            schedulesContainer.appendChild(scheduleDiv);
        });
        
        container.appendChild(schedulesContainer);
        
        // Add general visitors section
        const generalVisitorsSection = document.createElement('div');
        generalVisitorsSection.style.cssText = `
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border-radius: 12px;
            border: 2px solid #ffc107;
            padding: 20px;
            margin-top: 20px;
            box-shadow: 0 2px 8px rgba(255, 193, 7, 0.1);
        `;
        
        const visitorsLabel = document.createElement('label');
        visitorsLabel.innerHTML = '<i class="fas fa-users"></i> Total Number of Visitors <span style="color: #dc3545;">*</span>';
        visitorsLabel.style.cssText = `
            display: block;
            font-weight: 600;
            margin-bottom: 15px;
            color: #856404;
            font-size: 1.1rem;
        `;
        
        const visitorsInput = document.createElement('input');
        visitorsInput.type = 'number';
        visitorsInput.id = 'generalVisitorsInput';
        visitorsInput.min = '1';
        visitorsInput.max = '50';
        visitorsInput.value = '1';
        visitorsInput.required = true;
        visitorsInput.style.cssText = `
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #ced4da;
            border-radius: 8px;
            font-size: 1rem;
            background: white;
        `;
        
        const visitorsHelp = document.createElement('small');
        visitorsHelp.style.cssText = 'color: #856404; font-size: 0.85rem; display: block; margin-top: 8px;';
        visitorsHelp.innerHTML = '<i class="fas fa-info-circle"></i> Maximum 50 visitors for the entire visit';
        
        generalVisitorsSection.appendChild(visitorsLabel);
        generalVisitorsSection.appendChild(visitorsInput);
        generalVisitorsSection.appendChild(visitorsHelp);
        
        container.appendChild(generalVisitorsSection);
    }
    
    // Only add confirmation button if we have a selected date and barangays
    if (selectedVisitDate && barangays.length > 0) {
        const confirmButton = document.createElement('button');
        confirmButton.type = 'button';
        confirmButton.className = 'btn btn-primary';
        confirmButton.textContent = 'Confirm Schedule';
        confirmButton.style.marginTop = '20px';
        confirmButton.style.width = '100%';
        confirmButton.style.padding = '12px';
        confirmButton.onclick = validateAndSubmitSchedule;
        container.appendChild(confirmButton);
    }
}

// Generate time slots from 7 AM to 5 PM with 1-hour intervals
function generateTimeSlots(barangay, existingSlots = [], type = 'start') {
    const timeSlotsContainer = document.createElement('div');
    timeSlotsContainer.className = 'time-slots-grid';
    timeSlotsContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin: 15px 0;
        max-height: 300px;
        overflow-y: auto;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 12px;
        border: 1px solid #e9ecef;
    `;

    const startHour = 7; // 7 AM
    const endHour = 17; // 5 PM
    
    // Get selected start time to restrict end time options
    const selectedStartTime = selectedTimeSlots[barangay]?.time;
    const selectedStartHour = selectedStartTime ? parseInt(selectedStartTime.split(':')[0]) : 0;

    // Gather all selected time ranges for other barangays
    const otherBarangayTimeRanges = Object.entries(selectedTimeSlots)
        .filter(([b, slot]) => b !== barangay && slot.time && slot.endTime)
        .map(([b, slot]) => ({
            start: parseInt(slot.time.split(':')[0]),
            end: parseInt(slot.endTime.split(':')[0]),
            barangay: b
        }));
    
    for (let hour = startHour; hour <= endHour; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        const isBooked = existingSlots.some(slot => slot.time === timeString);
        
        // Check if this time conflicts with any other barangay's time range
        const conflictingRange = otherBarangayTimeRanges.find(range => 
            hour >= range.start && hour < range.end
        );
        const isConflict = conflictingRange !== undefined;
        
        // For end time selection, only show times after the selected start time
        if (type === 'end' && selectedStartTime) {
            if (hour <= selectedStartHour) {
                continue; // Skip times that are before or equal to start time
            }
        }
        
        // For start time selection, disable times that would leave no room for end time
        if (type === 'start' && hour >= endHour) {
            continue; // Skip the last hour as it leaves no room for end time
        }
        
        const isSelected = type === 'start' 
            ? selectedTimeSlots[barangay]?.time === timeString
            : selectedTimeSlots[barangay]?.endTime === timeString;
        
        const timeSlot = document.createElement('div');
        timeSlot.className = `time-slot-card ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`;
        timeSlot.style.cssText = `
            background: ${isBooked ? '#f8d7da' : isSelected ? '#d4edda' : isConflict ? '#ffeaa7' : '#ffffff'};
            border: 2px solid ${isBooked ? '#dc3545' : isSelected ? '#28a745' : isConflict ? '#ffc107' : '#dee2e6'};
            border-radius: 8px;
            padding: 12px 8px;
            text-align: center;
            cursor: ${(isBooked || isConflict) ? 'not-allowed' : 'pointer'};
            transition: all 0.2s ease;
            position: relative;
            font-weight: 500;
            font-size: 0.9rem;
            color: ${isBooked ? '#721c24' : isSelected ? '#155724' : isConflict ? '#bfa100' : '#495057'};
            box-shadow: ${isSelected ? '0 4px 8px rgba(40, 167, 69, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'};
        `;

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `timeSlot-${barangay}-${type}`;
        radio.className = 'time-slot';
        radio.value = timeString;
        radio.dataset.barangay = barangay;
        radio.dataset.type = type;
        radio.disabled = isBooked || isConflict;
        radio.checked = isSelected;
        radio.style.display = 'none';

        const timeDisplay = document.createElement('div');
        timeDisplay.textContent = formatTimeDisplay(timeString);
        timeDisplay.style.cssText = `
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 4px;
        `;

        const statusText = document.createElement('div');
        statusText.textContent = isBooked ? 'Booked' : isConflict ? 'Conflict' : isSelected ? 'Selected' : 'Available';
        statusText.style.cssText = `
            font-size: 0.75rem;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;

        if (isBooked) {
            const bookedBadge = document.createElement('div');
            bookedBadge.textContent = 'FULL';
            bookedBadge.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                background: #dc3545;
                color: white;
                font-size: 0.7rem;
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 10px;
                border: 2px solid white;
            `;
            timeSlot.appendChild(bookedBadge);
        }
        if (isConflict) {
            const conflictBadge = document.createElement('div');
            conflictBadge.textContent = 'CONFLICT';
            conflictBadge.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ffc107;
                color: #856404;
                font-size: 0.7rem;
                font-weight: bold;
                padding: 2px 6px;
                border-radius: 10px;
                border: 2px solid white;
            `;
            timeSlot.appendChild(conflictBadge);
        }

        timeSlot.appendChild(radio);
        timeSlot.appendChild(timeDisplay);
        timeSlot.appendChild(statusText);

        // Add hover effects
        if (!isBooked && !isConflict) {
            timeSlot.addEventListener('mouseenter', () => {
                if (!isSelected) {
                    timeSlot.style.transform = 'translateY(-2px)';
                    timeSlot.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    timeSlot.style.borderColor = '#28a745';
                }
            });

            timeSlot.addEventListener('mouseleave', () => {
                if (!isSelected) {
                    timeSlot.style.transform = 'translateY(0)';
                    timeSlot.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    timeSlot.style.borderColor = '#dee2e6';
                }
            });

            timeSlot.addEventListener('click', () => {
                radio.checked = true;
                if (type === 'start') {
                    handleStartTimeSelection(barangay);
                } else {
                    handleEndTimeSelection(barangay);
                }
            });
        }

        if (isConflict) {
            timeSlot.addEventListener('click', (e) => {
                e.preventDefault();
                const conflictingBarangay = conflictingRange.barangay;
                const startTime = formatTimeDisplay(`${conflictingRange.start.toString().padStart(2, '0')}:00`);
                const endTime = formatTimeDisplay(`${conflictingRange.end.toString().padStart(2, '0')}:00`);
                showTimeRangeConflictNotice(barangay, conflictingBarangay, startTime, endTime);
            });
        }

        timeSlotsContainer.appendChild(timeSlot);
    }

    return timeSlotsContainer;
}

// Format time for display (e.g., "07:00" -> "7:00 AM")
function formatTimeDisplay(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Check if two time slots overlap (1-hour slots)
function isTimeOverlap(time1, time2) {
    if (!time1 || !time2) return false;
    return time1 === time2; // Simple comparison for 1-hour slots
}

// Handle start time selection
function handleStartTimeSelection(barangay) {
    const selectedTime = document.querySelector(`input[name="timeSlot-${barangay}-start"]:checked`);
    if (selectedTime) {
        console.log('Start time selected for barangay:', barangay, 'Time:', selectedTime.value);
        
        // Check for conflicts with other barangays
        const conflicts = [];
        Object.entries(selectedTimeSlots).forEach(([b, slot]) => {
            if (b !== barangay && isTimeOverlap(selectedTime.value, slot.time)) {
                conflicts.push(b);
            }
        });
        
        if (conflicts.length > 0) {
            // Show warning and uncheck the conflicting selection
            selectedTime.checked = false;
            showTimeConflictWarning(barangay, conflicts, selectedTime.value);
            return;
        }
        
        // Update selected time slot
        selectedTimeSlots[barangay] = {
            time: selectedTime.value,
            element: selectedTime,
            endTime: null // Reset end time when start time changes
        };
        
        console.log('Updated selectedTimeSlots:', selectedTimeSlots);
        
        // Update UI to show selection
        updateTimeSlotUI(barangay, 'start');
        
        // Activate end time selection section
        activateEndTimeSection(barangay);
        
        // Refresh time slots for all other barangays to show conflicts
        refreshAllBarangayTimeSlots();
    }
}

// Refresh all barangay time slots to show updated conflicts
function refreshAllBarangayTimeSlots() {
    const selectedBarangays = Array.from(document.querySelectorAll('input[name="barangay"]:checked')).map(cb => cb.value);
    
    selectedBarangays.forEach(barangay => {
        const startTimeContainer = document.getElementById(`startTimeSlots-${barangay}`);
        if (startTimeContainer) {
            const existingSlots = getBookedTimeSlots(barangay, selectedVisitDate);
            startTimeContainer.innerHTML = '';
            const newTimeSlots = generateTimeSlots(barangay, existingSlots, 'start');
            startTimeContainer.appendChild(newTimeSlots);
        }
    });
}

// Handle end time selection
function handleEndTimeSelection(barangay) {
    const selectedTime = document.querySelector(`input[name="timeSlot-${barangay}-end"]:checked`);
    if (selectedTime) {
        console.log('End time selected for barangay:', barangay, 'Time:', selectedTime.value);
        
        const selectedSlot = selectedTimeSlots[barangay];
        if (!selectedSlot || !selectedSlot.time) {
            alert('Please select a start time first.');
            selectedTime.checked = false;
            return;
        }
        
        // Validate that end time is after start time
        const startHour = parseInt(selectedSlot.time.split(':')[0]);
        const endHour = parseInt(selectedTime.value.split(':')[0]);
        
        if (endHour <= startHour) {
            alert('End time must be after start time.');
            selectedTime.checked = false;
            return;
        }
        
        // Update the selected slot with the end time
        selectedTimeSlots[barangay] = {
            ...selectedSlot,
            endTime: selectedTime.value
        };
        
        // Update UI to show selection
        updateTimeSlotUI(barangay, 'end');
        
        // Show success feedback
        showEndTimeSelectionFeedback(barangay, selectedTime.value);
        
        // Update the UI to show the selected range
        updateTimeRangeDisplay(barangay);
        
        // Refresh time slots for all other barangays to show conflicts
        refreshAllBarangayTimeSlots();
        
        // Automatically focus on the general visitors input after a short delay
        setTimeout(() => {
            const visitorsInput = document.getElementById('generalVisitorsInput');
            if (visitorsInput) {
                visitorsInput.focus();
                visitorsInput.style.borderColor = '#28a745';
                visitorsInput.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
                
                // Remove the highlight after 2 seconds
                setTimeout(() => {
                    visitorsInput.style.borderColor = '#ced4da';
                    visitorsInput.style.boxShadow = 'none';
                }, 2000);
            }
        }, 1000);
    }
}

// Activate end time selection section
function activateEndTimeSection(barangay) {
    console.log('activateEndTimeSection called for barangay:', barangay);
    const selectedSlot = selectedTimeSlots[barangay];
    if (!selectedSlot || !selectedSlot.time) {
        console.error('No start time selected for barangay:', barangay);
        return;
    }

    console.log('Selected slot:', selectedSlot);

    // Find the end time section and activate it
    const endTimeSection = document.querySelector(`[data-barangay="${barangay}"] .form-group:nth-child(2)`);
    if (endTimeSection) {
        // Activate the end time section
        endTimeSection.style.opacity = '1';
        endTimeSection.style.pointerEvents = 'auto';
        endTimeSection.style.borderColor = '#28a745';
        endTimeSection.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.15)';
        
        // Update the end time slots
        const endTimeContainer = endTimeSection.querySelector('.time-slot-container');
        if (endTimeContainer) {
            endTimeContainer.innerHTML = generateEndTimeSlots(barangay);
        }
        
        // Add a subtle animation
        endTimeSection.style.transition = 'all 0.3s ease';
        endTimeSection.style.transform = 'scale(1.02)';
        setTimeout(() => {
            endTimeSection.style.transform = 'scale(1)';
        }, 300);
        
        console.log('End time section activated successfully');
    } else {
        console.error('End time section not found for barangay:', barangay);
    }
}



// Calculate end time (1 hour after start time)
function calculateEndTime(startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = hours + 1;
    return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Generate end time slots for the grid
function generateEndTimeSlots(barangay) {
    console.log('generateEndTimeSlots called for barangay:', barangay);
    const selectedSlot = selectedTimeSlots[barangay];
    if (!selectedSlot || !selectedSlot.time) {
        return '<p style="text-align: center; color: #6c757d;">Please select a start time first</p>';
    }

    const startTime = selectedSlot.time;
    const [startHours] = startTime.split(':').map(Number);
    let slotsHTML = '';
    
    // Generate slots from start time + 1 hour to 5 PM (17:00)
    for (let hour = startHours + 1; hour <= 17; hour++) {
        const timeString = `${hour.toString().padStart(2, '0')}:00`;
        const displayTime = formatTimeDisplay(timeString);
        const isSelected = selectedSlot.endTime === timeString;
        
        // Check if this time slot is available (not booked)
        const isBooked = false; // In a real app, check against booked slots
        
        if (!isBooked) {
            slotsHTML += `
                <div class="time-slot-card ${isSelected ? 'selected' : ''}" 
                     style="
                         background: ${isSelected ? '#d4edda' : '#ffffff'};
                         border: 2px solid ${isSelected ? '#28a745' : '#dee2e6'};
                         border-radius: 8px;
                         padding: 12px 8px;
                         text-align: center;
                         cursor: pointer;
                         transition: all 0.2s ease;
                         position: relative;
                         font-weight: 500;
                         font-size: 0.9rem;
                         color: ${isSelected ? '#155724' : '#495057'};
                         box-shadow: ${isSelected ? '0 4px 8px rgba(40, 167, 69, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'};
                     "
                     onclick="selectEndTime('${barangay}', '${timeString}')">
                    <div style="font-size: 1rem; font-weight: 600; margin-bottom: 4px;">${displayTime}</div>
                    <div style="font-size: 0.75rem; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${isSelected ? 'Selected' : 'Available'}
                    </div>
                    </div>
            `;
        }
    }
    
    console.log('Generated end time slots HTML:', slotsHTML);
    return slotsHTML;
}

// Function to select end time from the grid
function selectEndTime(barangay, timeString) {
    console.log('selectEndTime called for barangay:', barangay, 'time:', timeString);
    
    const selectedSlot = selectedTimeSlots[barangay];
    if (!selectedSlot || !selectedSlot.time) {
        alert('Please select a start time first.');
        return;
    }
    
    // Validate that end time is after start time
    const startHour = parseInt(selectedSlot.time.split(':')[0]);
    const endHour = parseInt(timeString.split(':')[0]);
    
    if (endHour <= startHour) {
        alert('End time must be after start time.');
        return;
    }
    
    // Update the selected slot with the end time
    selectedTimeSlots[barangay] = {
        ...selectedSlot,
        endTime: timeString
    };
    
    // Update the end time slots display
    const endTimeSlotsContainer = document.getElementById(`endTimeSlots-${barangay}`);
    if (endTimeSlotsContainer) {
        endTimeSlotsContainer.innerHTML = generateEndTimeSlots(barangay);
    }
    
    // Show success feedback
    showEndTimeSelectionFeedback(barangay, timeString);
    
    // Update the UI to show the selected range
    updateTimeRangeDisplay(barangay);
    
    // Automatically focus on the general visitors input after a short delay
    setTimeout(() => {
        const visitorsInput = document.getElementById('generalVisitorsInput');
        if (visitorsInput) {
            visitorsInput.focus();
            visitorsInput.style.borderColor = '#28a745';
            visitorsInput.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
            
            // Remove the highlight after 2 seconds
            setTimeout(() => {
                visitorsInput.style.borderColor = '#ced4da';
                visitorsInput.style.boxShadow = 'none';
            }, 2000);
        }
    }, 1000);
}

// Handle end time selection
function handleEndTimeSelection(barangay) {
    const endTimeSelect = document.getElementById(`endTimeSelect-${barangay}`);
    if (!endTimeSelect) return;
    
    const selectedEndTime = endTimeSelect.value;
    const selectedSlot = selectedTimeSlots[barangay];
    
    if (selectedEndTime && selectedSlot) {
        // Update the selected slot with the end time
        selectedTimeSlots[barangay] = {
            ...selectedSlot,
            endTime: selectedEndTime
        };
        
        // Show success feedback
        showEndTimeSelectionFeedback(barangay, selectedEndTime);
        
        // Update the UI to show the selected range
        updateTimeRangeDisplay(barangay);
        
        // Automatically focus on the general visitors input after a short delay
        setTimeout(() => {
            const visitorsInput = document.getElementById('generalVisitorsInput');
            if (visitorsInput) {
                visitorsInput.focus();
                visitorsInput.style.borderColor = '#28a745';
                visitorsInput.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.1)';
                
                // Remove the highlight after 2 seconds
                setTimeout(() => {
                    visitorsInput.style.borderColor = '#ced4da';
                    visitorsInput.style.boxShadow = 'none';
                }, 2000);
            }
        }, 1000);
    }
}

// Show feedback when end time is selected
function showEndTimeSelectionFeedback(barangay, endTime) {
    const rangeContainer = document.getElementById(`timeRange-${barangay}`);
    if (!rangeContainer) return;
    
    // Create a prominent success message
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
        background: linear-gradient(135deg, #d4edda 0%, #c3e6c3 100%);
        color: #155724;
        padding: 15px 20px;
        border-radius: 8px;
        margin: 15px 0;
        font-size: 1rem;
        border: 2px solid #28a745;
        text-align: center;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.2);
        animation: slideInRight 0.3s ease-out;
    `;
    
    const selectedSlot = selectedTimeSlots[barangay];
    const duration = selectedSlot ? calculateDuration(selectedSlot.time, endTime) : '';
    
    successMsg.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 8px;">
            <i class="fas fa-check-circle" style="font-size: 1.2rem; color: #28a745;"></i>
            <span style="font-weight: 600;">Perfect! Time Range Set</span>
                </div>
        <div style="font-size: 0.9rem; opacity: 0.9;">
            ${formatTimeDisplay(selectedSlot.time)} - ${formatTimeDisplay(endTime)} (${duration})
            </div>
        <div style="margin-top: 8px; font-size: 0.85rem; color: #6c757d;">
            <i class="fas fa-arrow-down"></i> Now enter the number of visitors below
            </div>
    `;
    
    // Insert at the top of the range container
    rangeContainer.insertBefore(successMsg, rangeContainer.firstChild);
    
    // Remove the message after 5 seconds
    setTimeout(() => {
        if (successMsg.parentNode) {
            successMsg.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
            }, 300);
        }
    }, 5000);
}

// Update time range display to show the selected range
function updateTimeRangeDisplay(barangay) {
    const selectedSlot = selectedTimeSlots[barangay];
    if (!selectedSlot || !selectedSlot.endTime) return;
    
    const rangeContainer = document.getElementById(`timeRange-${barangay}`);
    if (!rangeContainer) return;
    
    // Add a summary of the selected time range
    let summaryDiv = document.getElementById(`timeRangeSummary-${barangay}`);
    if (!summaryDiv) {
        summaryDiv = document.createElement('div');
        summaryDiv.id = `timeRangeSummary-${barangay}`;
        summaryDiv.style.cssText = `
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 12px;
            margin-top: 15px;
            text-align: center;
        `;
        rangeContainer.appendChild(summaryDiv);
    }
    
    const duration = calculateDuration(selectedSlot.time, selectedSlot.endTime);
    summaryDiv.innerHTML = `
        <div style="font-weight: 600; color: #856404; margin-bottom: 5px;">
            <i class="fas fa-calendar-check"></i> Time Range Confirmed
        </div>
        <div style="color: #856404; font-size: 0.9rem;">
            ${formatTimeDisplay(selectedSlot.time)} - ${formatTimeDisplay(selectedSlot.endTime)} (${duration})
        </div>
    `;
}

// Calculate duration between two times
function calculateDuration(startTime, endTime) {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    const durationMinutes = endTotal - startTotal;
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
        return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
}

// Update time slot UI to show selection
function updateTimeSlotUI(barangay, type = 'start') {
    // Reset all time slots for this barangay and type
    const timeSlotCards = document.querySelectorAll(`[data-barangay="${barangay}"][data-type="${type}"]`);
    timeSlotCards.forEach(card => {
        card.classList.remove('selected');
        card.style.background = '#ffffff';
        card.style.borderColor = '#dee2e6';
        card.style.color = '#495057';
        card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    // Highlight selected time slot
    const selectedSlot = selectedTimeSlots[barangay];
    if (selectedSlot) {
        const selectedValue = type === 'start' ? selectedSlot.time : selectedSlot.endTime;
        if (selectedValue) {
            const selectedInput = document.querySelector(`input[name="timeSlot-${barangay}-${type}"][value="${selectedValue}"]`);
        if (selectedInput) {
            const selectedCard = selectedInput.closest('.time-slot-card');
            if (selectedCard) {
                selectedCard.classList.add('selected');
                selectedCard.style.background = '#d4edda';
                selectedCard.style.borderColor = '#28a745';
                selectedCard.style.color = '#155724';
                selectedCard.style.boxShadow = '0 4px 8px rgba(40, 167, 69, 0.2)';
                }
            }
        }
    }
    
    // Clear any error messages
    const errorElement = document.getElementById(`timeSlotError-${barangay}`);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Get already booked time slots for a barangay on a specific date
function getBookedTimeSlots(barangay, date) {
    // In a real app, this would fetch from your database
    // For now, we'll return an empty array
    return [];
}

// Notification function for showing success/error messages
function showNotification(type, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}" style="font-size: 1.2rem;"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Validate spot selection to ensure at least one spot is selected per barangay
function validateSpotSelection() {
    const selectedBarangays = Array.from(document.querySelectorAll('input[name="barangay"]:checked'));
    let allValid = true;
    
    selectedBarangays.forEach(barangayCheckbox => {
        const barangay = barangayCheckbox.value;
        const spotsForBarangay = Array.from(document.querySelectorAll(`input[name="spot"][data-barangay="${barangay}"]:checked`));
        
        if (spotsForBarangay.length === 0) {
            allValid = false;
            // You might want to show an error message here
        }
    });
    
    return allValid;
}

// Validate and submit the schedule
function validateAndSubmitSchedule() {
    const selectedBarangays = Array.from(document.querySelectorAll('input[name="barangay"]:checked'));
    const form = document.getElementById('scheduleForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    try {
        // Validate that all selected barangays have a time slot
        for (const barangayCheckbox of selectedBarangays) {
            const barangay = barangayCheckbox.value;
            if (!selectedTimeSlots[barangay]) {
                throw new Error(`Please select a time slot for ${barangay}`);
            }
        }
        
        // Validate general visitors number
        const generalVisitorsInput = document.getElementById('generalVisitorsInput');
        const totalVisitors = generalVisitorsInput ? parseInt(generalVisitorsInput.value, 10) : 0;
        if (isNaN(totalVisitors) || totalVisitors < 1 || totalVisitors > 50) {
            throw new Error('Total number of visitors must be between 1 and 50');
        }
        
        // If all validations pass, submit the form
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scheduling...';
        
        // Set the hidden date field if it exists
        const dateInput = document.createElement('input');
        dateInput.type = 'hidden';
        dateInput.name = 'visitDate';
        dateInput.value = selectedVisitDate;
        form.appendChild(dateInput);
        
        // Submit the form
        form.dispatchEvent(new Event('submit'));
        
    } catch (error) {
        showNotification('error', error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

function prefillScheduleForm() {
    if (window.currentUser) {
        document.getElementById('scheduleUserName').value = window.currentUser.name || '';
        document.getElementById('scheduleUserEmail').value = window.currentUser.email || '';
        document.getElementById('scheduleUserAge').value = window.currentUser.age || '';
    }

    // Clear any existing selections
    document.querySelectorAll('input[name="barangay"]').forEach(cb => cb.checked = false);
    document.getElementById('spotCheckboxGroup').innerHTML = '';
    document.getElementById('barangayError').style.display = 'none';
    document.getElementById('spotError').style.display = 'none';
    // Clear barangay schedules group if present
    if (document.getElementById('barangaySchedulesGroup')) {
        document.getElementById('barangaySchedulesGroup').innerHTML = '';
    }
}

// Tourist Spots Data
const touristSpots = [
    {
        id: 12,
        name: "Badol Camping Grounds",
        location: "Barangay Sagubo, Kapangan, Benguet",
        category: "private",
        description: "A serene camping ground nestled in the mountains of Barangay Badol, perfect for nature lovers and adventure seekers. Experience the cool mountain air and stunning views of the surrounding landscape.",
        image: "assets/badolcamping.jpg",
        rating: 4.8,
        difficulty: "Moderate",
        bestTime: "November to April",
        features: ["Camping Tents", "Bonfire Area", "Mountain View", "Restrooms"],
        coordinates: { lat: 16.6167, lng: 120.6000 },
        contact: "+639123456789",
        email: "badolcamping@example.com",
        website: "https://badolcamping.com",
        isFeatured: true,
        gallery: [
            "assets/badolcamping.jpg"
        ],
        tips: [
            "Bring warm clothing as temperatures can drop at night",
            "Book your camping spot in advance",
            "Pack enough food and water for your stay",
            "Respect nature and practice Leave No Trace principles"
        ]
    },
    {
        id: 1,
        name: "Mt. Kalukasog",
        location: "Barangay Balakbak, Kapangan, Benguet",
        category: "mountains",
        image: "assets/Mt.%20Kalukasog%20(Cuba).jpg",
        description: "This rugged mountain peak offers panoramic views, forest trails, and dramatic rock formations for hikers and sunrise chasers. Mt. Kalakasog provides an excellent hiking experience with stunning vistas of the surrounding valleys and mountains of Benguet.",
        featured: true
    },
    {
        id: 2,
        name: "Longog Cave",
        location: "Barangay Cuba, Kapangan, Benguet",
        category: "caves",
        image: "assets/Longog%20Cave%20(Balakbak).jpg",
        description: "A deep cave network with maze-like tunnels and impressive natural formations, perfect for experienced spelunkers and curious explorers. The cave system features stunning limestone formations and underground chambers.",
        featured: true
    },
    {
        id: 3,
        name: "Badi Falls",
        location: "Barangay Beleng-Belis, Kapangan, Benguet",
        category: "waterfalls",
        image: "assets/Badi%20Falls%20(Sagubo).jpg",
        description: "A tall and powerful waterfall flowing into crystal-clear pools, surrounded by bamboo groves and accessible through a short scenic hike. Perfect for swimming and relaxation with family and friends.",
        featured: true
    },
    {
        id: 4,
        name: "Dumanay Cave",
        location: "Barangay Taba-ao, Kapangan, Benguet",
        category: "caves",
        image: "assets/Dumanay%20Cave%20(Pongayan).jpg",
        description: "A cave system rich in folklore, Dumany features stunning rock formations and was once used as a wartime hideout—perfect for cave explorers and history enthusiasts. The cave offers a glimpse into local history and natural beauty.",
        featured: false
    },
    {
        id: 5,
        name: "Toplac Rice Terraces",
        location: "Barangay Toplac, Kapangan, Benguet",
        category: "viewpoint",
        image: "assets/Toplac%20Rice%20Fields%20(Pudong).jpg",
        description: "Handcrafted over generations, these layered rice paddies reflect indigenous farming techniques and offer a peaceful, scenic view of Kapangan's agricultural heritage. Best visited during planting and harvest seasons."
    },
    {
        id: 6,
        name: "Pey-og Falls",
        location: "Barangay Balakbak, Kapangan, Benguet",
        category: "waterfalls",
        image: "assets/Pey-og%20Falls%20(Boklaoan).jpg",
        description: "A tall and scenic waterfall reached through a forest trail, with natural pools ideal for a refreshing dip and a quiet escape into nature. The falls are surrounded by lush vegetation and offer a peaceful retreat.",
        featured: true
    },
    {
        id: 7,
        name: "Dangwa Cave",
        location: "Barangay Payapay, Kapangan, Benguet",
        category: "caves",
        image: "assets/Dangwa%20Cave%20(Taba-ao).jpg",
        description: "An undeveloped cave with raw limestone structures and narrow pathways, offering an off-the-grid spelunking experience for the adventurous. Features unique rock formations and underground chambers.",
        featured: false
    },
    {
        id: 8,
        name: "Puga Coffin Cave",
        location: "Barangay Labueg, Kapangan, Benguet",
        category: "caves",
        image: "assets/Puga%20Coffin%20Cave%20(Sagubo).jpg",
        description: "A sacred burial cave with traditional hanging coffins that reflect ancient Igorot customs and ancestral practices unique to the Cordillera. This cultural site offers insight into indigenous burial traditions.",
        featured: true
    },
    {
        id: 9,
        name: "Mt. Dakiwagan",
        location: "Boundary of Barangay Taba-ao and Cuba, Kapangan, Benguet",
        category: "mountains",
        image: "assets/Mt.%20Dakiwagan%20(Balakbak).jpg",
        description: "A scenic mountain ideal for hiking, Mt. Dakiwagan features dense pine forests and summit views overlooking the Cordillera highlands. Perfect for sunrise and sunset viewing with panoramic mountain vistas.",
        featured: false
    },
    {
        id: 10,
        name: "Manahongkong Falls",
        location: "Barangay Balakbak, Kapangan, Benguet",
        category: "waterfalls",
        image: "assets/DSC00132.jpeg",
        description: "A multi-tiered waterfall hidden within forest trails, forming layered cascades and a tranquil atmosphere for nature walks and meditation. The falls offer a serene environment perfect for relaxation.",
        featured: false
    },
    {
        id: 11,
        name: "Amburayan River",
        location: "Barangay Pudtong and nearby areas",
        category: "rivers",
        image: "assets/Amburayan%20River%20(Taba-ao).jpg",
        description: "A clean, calm river with rocky banks perfect for swimming, tubing, and riverside picnics, popular among locals during the summer season. The river offers refreshing waters and scenic surroundings.",
        featured: true
    }
];

// Add featured property to tourist spots
touristSpots.forEach((spot, index) => {
    // Keep Badol Camping Grounds as featured
    spot.featured = index < 4 || spot.name === "Badol Camping Grounds";
});

// Blog Posts Data
const blogPosts = [
    {
        id: 1,
        title: "Complete Guide to Hiking Mt. Kalakasog",
        excerpt: "Everything you need to know about hiking the highest peak in Kapangan, including trail maps, preparation tips, and best viewing spots.",
        date: "2024-01-15",
        image: "assets/Mt.%20Kalakasog%20(Cuba).jpg",
        category: "Hiking Guides"
    },
    {
        id: 2,
        title: "Hidden Waterfalls of Kapangan: A Photographer's Paradise",
        excerpt: "Discover the most photogenic waterfalls in Kapangan, with insider tips on the best angles and lighting conditions.",
        date: "2024-01-10",
        image: "assets/Badi%20Falls%20(Sagubo).jpg",
        category: "Photography"
    },
    {
        id: 3,
        title: "Cultural Heritage: The Sacred Caves of Kapangan",
        excerpt: "Learn about the historical significance and cultural importance of Kapangan's cave systems and burial sites.",
        date: "2024-01-05",
        image: "assets/Dumanay%20Cave%20(Pongayan).jpg",
        category: "Culture & History"
    },
    {
        id: 4,
        title: "Best Time to Visit Kapangan's Rice Terraces",
        excerpt: "Seasonal guide to experiencing the magnificent rice terraces of Kapangan at their most beautiful.",
        date: "2023-12-28",
        image: "assets/rice-terraces.jpg",
        category: "Travel Tips"
    }
];

// Initialize the website
document.addEventListener('DOMContentLoaded', function() {
    // Initialize modals functionality
    const blogModal = document.getElementById('blogModal');
    if (blogModal) {
        // Make sure clicks on the modal content don't close the modal
        const blogModalContent = blogModal.querySelector('.modal-content');
        if (blogModalContent) {
            blogModalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
        
        // Close when clicking on the modal background
        blogModal.addEventListener('click', function(e) {
            if (e.target === blogModal) {
                closeBlogModal();
            }
        });
    }

    // Tourist spot modal click outside to close
    const spotModal = document.getElementById('spotModal');
    if (spotModal) {
        // Make sure clicks on the modal content don't close the modal
        const spotModalContent = spotModal.querySelector('.modal-content');
        if (spotModalContent) {
            spotModalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
        
        // Close when clicking on the modal background
        spotModal.addEventListener('click', function(e) {
            if (e.target === spotModal) {
                closeModal();
            }
        });
    }

    // Initialize the application
    initializeApp();
    
    // Initialize calendar event listeners
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
        
    if (prevMonthBtn && nextMonthBtn) {
        prevMonthBtn.addEventListener('click', function() { changeMonth(-1); });
        nextMonthBtn.addEventListener('click', function() { changeMonth(1); });
    }
        
    // Initial calendar render
    renderCalendar();
});

function initializeApp() {
    // Initialize app components
    displayFeaturedSpots();
    displayTouristSpots();
    displayBlogs();
    updateAuthUI();
    setupEventListeners();
    
    // Set minimum date for scheduling to today
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('scheduleDate')) {
        document.getElementById('scheduleDate').min = today;
    }
}

function setupEventListeners() {
    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Form submissions
    document.getElementById('signinForm').addEventListener('submit', handleSignIn);
    document.getElementById('signupForm').addEventListener('submit', handleSignUp);
    document.getElementById('scheduleForm').addEventListener('submit', handleScheduleSubmit);
    
    if (document.getElementById('profileForm')) {
        document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    }
}

// Navigation Functions
function showHome() {
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('blogSection').style.display = 'none';
    document.getElementById('accommodationsSection').style.display = 'none';
    document.getElementById('contactSection').style.display = 'none';
    document.getElementById('allTouristSpots').style.display = 'none';
    document.getElementById('featuredSpots').style.display = 'block';
    // Show advisories only on homepage
    var advisories = document.getElementById('advisoriesSection');
    if (advisories) advisories.style.display = 'block';
    window.scrollTo(0, 0);
}

function showAllTouristSpots() {
    document.querySelector('.hero').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('blogSection').style.display = 'none';
    document.getElementById('accommodationsSection').style.display = 'none';
    document.getElementById('contactSection').style.display = 'none';
    document.getElementById('featuredSpots').style.display = 'none';
    document.getElementById('allTouristSpots').style.display = 'block';
    // Hide advisories on other pages
    var advisories = document.getElementById('advisoriesSection');
    if (advisories) advisories.style.display = 'none';
    document.getElementById('allTouristSpots').scrollIntoView({ behavior: 'smooth' });
}

function showBlogs() {
    document.querySelector('.hero').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('featuredSpots').style.display = 'none';
    document.getElementById('allTouristSpots').style.display = 'none';
    document.getElementById('blogSection').style.display = 'block';
    document.getElementById('accommodationsSection').style.display = 'none';
    document.getElementById('contactSection').style.display = 'none';
    // Hide advisories on other pages
    var advisories = document.getElementById('advisoriesSection');
    if (advisories) advisories.style.display = 'none';
    updateActiveNavItem('blogs');
    window.scrollTo(0, 0);
    displayBlogs(); // Ensure blogs are rendered when showing the blog section
}

function showAccommodations() {
    document.querySelector('.hero').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('featuredSpots').style.display = 'none';
    document.getElementById('allTouristSpots').style.display = 'none';
    document.getElementById('blogSection').style.display = 'none';
    document.getElementById('accommodationsSection').style.display = 'block';
    document.getElementById('contactSection').style.display = 'none';
    // Hide advisories on other pages
    var advisories = document.getElementById('advisoriesSection');
    if (advisories) advisories.style.display = 'none';
    updateActiveNavItem('accommodations');
    window.scrollTo(0, 0);
}

function showContact() {
    document.querySelector('.hero').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('featuredSpots').style.display = 'none';
    document.getElementById('allTouristSpots').style.display = 'none';
    document.getElementById('blogSection').style.display = 'none';
    document.getElementById('accommodationsSection').style.display = 'none';
    document.getElementById('contactSection').style.display = 'block';
    // Hide advisories on other pages
    var advisories = document.getElementById('advisoriesSection');
    if (advisories) advisories.style.display = 'none';
    updateActiveNavItem('contact');
    window.scrollTo(0, 0);
}

function showDashboard() {
    if (!window.currentUser) {
        openAuthModal('signin');
        return;
    }
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.querySelector('.hero').style.display = 'none';
    // Hide advisories on other pages
    var advisories = document.getElementById('advisoriesSection');
    if (advisories) advisories.style.display = 'none';
    updateDashboard();
    window.scrollTo(0, 0);
}

function updateActiveNavItem(section) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const link = item.querySelector('.nav-link');
        if (link) {
            link.classList.remove('active');
        }
    });
    
    // Find and activate the clicked nav item
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.textContent.toLowerCase().includes(section) || 
            (section === 'home' && link.textContent === 'Home')) {
            link.classList.add('active');
        }
    });
}

// Tourist Spots Functions
function displayFeaturedSpots() {
    const featuredGrid = document.getElementById('featuredSpotsGrid');
    const featuredSpots = touristSpots.filter(spot => spot.featured);
    
    featuredGrid.innerHTML = featuredSpots.map(spot => `
        <div class="spot-card" onclick="openSpotModal(${spot.id})">
            <div class="spot-image">
                <img src="${spot.image}" alt="${spot.name}">
                <div class="spot-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${spot.location.split(',')[0]}
                </div>
            </div>
            <div class="spot-content">
                <h3>${spot.name}</h3>
                <p>${spot.description.substring(0, 100)}...</p>
                <div class="spot-actions">
                    <span class="btn btn-sm btn-primary">View More</span>
                </div>
            </div>
        </div>
    `).join('');
}

function displayTouristSpots(filter = 'all') {
    const spotsGrid = document.getElementById('spotsGrid');
    let filteredSpots = touristSpots;
    
    if (filter !== 'all') {
        filteredSpots = touristSpots.filter(spot => spot.category === filter);
    }
    
    spotsGrid.innerHTML = filteredSpots.map(spot => `
        <div class="spot-card" onclick="openSpotModal(${spot.id})">
            <div class="spot-image">
                <img src="${spot.image}" alt="${spot.name}">
                <div class="spot-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${spot.location.split(',')[0]}
                </div>
            </div>
            <div class="spot-content">
                <h3>${spot.name}</h3>
                <p>${spot.description.substring(0, 120)}...</p>
                <div class="spot-actions">
                    <span class="btn btn-sm btn-primary">View More</span>
                </div>
            </div>
        </div>
    `).join('');
}

function filterSpots(category) {
    currentFilter = category;
    
    // Update active filter tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Display filtered spots
    displayTouristSpots(category);
    
    // If called from dropdown, show tourist spots section
    showAllTouristSpots();
}

function openSpotModal(spotId) {
    try {
        const spot = touristSpots.find(spot => spot.id === spotId);
        if (!spot) {
            console.error('Spot not found with ID:', spotId);
            return;
        }
        const modal = document.getElementById('spotModal');
        const modalContent = document.getElementById('spotModalContent');

        if (!modal || !modalContent) {
            console.error('Spot modal elements not found');
            return;
        }

        // Always show the image at the top of the modal, matching the card
        const spotHTML = `
            <div class="spot-image">
                <img 
                    src="${spot.image}" 
                    alt="${spot.name}" 
                    onerror="this.onerror=null; this.src='assets/placeholder.jpg'; this.alt='Image not available'"
                >
            </div>
            <h2>${spot.name}</h2>
            <div class="spot-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${spot.location}</span>
                ${spot.category ? `<span><i class="fas fa-tag"></i> ${spot.category.charAt(0).toUpperCase() + spot.category.slice(1)}</span>` : ''}
            </div>
            <div class="spot-description">
                <p>${spot.description}</p>
            </div>
            <!-- Additional Information -->
            <div class="additional-info">
                <h4>Entrance & Other Fees</h4>
                <ul>
                    <li>Entrance Fee (Adults 11–59 years): ₱50</li>
                    <li>Entrance Fee (Seniors & PWDs): ₱40</li>
                    <li>Entrance Fee (Kids 6–10 years): ₱30</li>
                    <li>Children under 6 years: <strong>Free</strong></li>
                    <li>Environmental Fee: ₱100</li>
                    <li>Tour Guide Fee: ₱500 <span style="color:gray;">(Optional)</span></li>
                </ul>
            </div>
            <!-- Nearby Accommodations & Restaurants -->
            <div class="nearby-info">
                <h4>Nearby Accommodations & Restaurants</h4>
                <ul>
                    <li>
                        <strong>Avong Nen Suvani (Homestay)</strong><br>
                        <i class="fas fa-map-marker-alt"></i> Barangay Datakan<br>
                        <i class="fas fa-phone"></i> 0950 322 7830
                    </li>
                    <li>
                        <strong>Mayflor Fastfood Haus and Lodging</strong><br>
                        <i class="fas fa-map-marker-alt"></i> Barangay Cuba<br>
                        <i class="fas fa-phone"></i> 0921 243 5406
                    </li>
                    <li>
                        <strong>Marianos Restaurant</strong><br>
                        <i class="fas fa-map-marker-alt"></i> Barangay Lomon<br>
                        <i class="fas fa-phone"></i> 0945 452 0117
                    </li>
                    <li>
                        <strong>Pakawan Restaurant</strong><br>
                        <i class="fas fa-map-marker-alt"></i> Barangay Cuba<br>
                        <i class="fas fa-phone"></i> 0907 248 10971
                    </li>
                </ul>
            </div>
            <div class="spot-map">
                <h4>Location Map</h4>
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3872.508884474166!2d120.6326055148326!3d16.621278988420803!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3391f25f8b0a40ad%3A0x4b3d8edc74cc0264!2sKapangan%2C%20Benguet!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
                    width="100%"
                    height="250"
                    style="border:0; border-radius: 10px;"
                    allowfullscreen=""
                    loading="lazy"></iframe>
            </div>
        `;

        modalContent.innerHTML = spotHTML;
        modal.style.display = 'flex';
        void modal.offsetHeight;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error opening spot modal:', error);
    }
}

function closeModal() {
    try {
        const modal = document.getElementById('spotModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = ''; // Re-enable scrolling
            // Wait for the fade-out transition to complete before hiding the modal
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    } catch (error) {
        console.error('Error closing spot modal:', error);
    }
}

// Blog Functions (these were missing)
// Format date function
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function displayBlogs() {
    const blogGrid = document.getElementById('blogGrid');
    
    blogGrid.innerHTML = blogPosts.map(post => `
        <article class="blog-card" onclick="openBlogModal(${post.id})">
            <div class="blog-image">
                <img src="${post.image}" alt="${post.title}">
            </div>
            <div class="blog-content">
                <div class="blog-meta">
                    <span class="blog-date">${formatDate(post.date)}</span>
                    <span class="blog-category">${post.category}</span>
                </div>
                <h3 class="blog-title">${post.title}</h3>
                <p class="blog-excerpt">${post.excerpt}</p>
                <a href="#" class="read-more">Read More →</a>
            </div>
        </article>
    `).join('');
}

function openBlogModal(blogId) {
    const blog = blogPosts.find(post => post.id === blogId);
    if (!blog) return;
    
    const modal = document.getElementById('blogModal');
    const modalTitle = document.getElementById('blogModalTitle');
    const modalDate = document.getElementById('blogModalDate');
    const modalCategory = document.getElementById('blogModalCategory');
    const modalImage = document.getElementById('blogModalImage');
    const modalContent = document.getElementById('blogModalContent');
    
    // Update modal content
    modalTitle.textContent = blog.title;
    modalDate.textContent = formatDate(blog.date);
    modalCategory.textContent = blog.category;
    modalImage.src = blog.image;
    
    // For demo purposes - in a real app, this would come from a database
    modalContent.innerHTML = `
        <p>This is a detailed blog post about "${blog.title}". In a complete implementation, 
        this would contain the full article content.</p>
        
        <h4>Detailed Information</h4>
        <p>${blog.excerpt} This extended content would provide more in-depth information about 
        the topic discussed in the blog post.</p>
        
        <p>Additional paragraphs, images, and formatting would appear here to create a 
        comprehensive article for readers.</p>
    `;
    
    modal.style.display = 'block';
}

function closeBlogModal() {
    document.getElementById('blogModal').style.display = 'none';
}

// Dashboard Functions
function updateDashboard() {
    if (!window.currentUser) return;
    
    // Update user info in the dashboard header
    document.getElementById('dashboardUserName').textContent = window.currentUser.name;
    document.getElementById('dashboardAvatar').textContent = window.currentUser.name ? window.currentUser.name.charAt(0).toUpperCase() : 'U';
    
    // Update profile form fields
    document.getElementById('profileName').value = window.currentUser.name || '';
    document.getElementById('profileEmail').value = window.currentUser.email || '';
    document.getElementById('profilePhone').value = window.currentUser.phone || '';
    document.getElementById('profileAddress').value = window.currentUser.address || '';
    
    // Display user's travels
    displayUserTravels();
}

function showDashboardSection(section, event) {
    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    if (event && event.target.closest('.sidebar-link')) {
        event.target.closest('.sidebar-link').classList.add('active');
    }
    
    // Show/hide sections
    document.getElementById('profileSection').style.display = section === 'profile' ? 'block' : 'none';
    document.getElementById('travelsSection').style.display = section === 'travels' ? 'block' : 'none';
    document.getElementById('announcementsSection').style.display = section === 'announcements' ? 'block' : 'none';
    var placesVisited = document.getElementById('placesVisitedSection');
    if (placesVisited) placesVisited.style.display = section === 'placesVisited' ? 'block' : 'none';
}

function displayUserTravels() {
    const travelsList = document.getElementById('travelsList');
    const userTravels = JSON.parse(localStorage.getItem('userTravels') || '[]');
    const currentUserId = window.currentUser ? window.currentUser.id : null;
    
    if (!currentUserId) {
        travelsList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Please sign in to view your travels.</td></tr>';
        return;
    }
    
    const userTravelsFiltered = userTravels.filter(travel => travel.userId === currentUserId);
    
    if (userTravelsFiltered.length === 0) {
        travelsList.innerHTML = '<tr><td colspan="7" style="text-align: center;">No scheduled travels yet. Start exploring and schedule your visits!</td></tr>';
        return;
    }
    
    // Get companions data
    const companions = JSON.parse(localStorage.getItem('travelCompanions') || '{}');
    
    travelsList.innerHTML = userTravelsFiltered.map(travel => {
        // Format time range
        const timeDisplay = travel.endTime 
            ? `${formatTimeDisplay(travel.time)} - ${formatTimeDisplay(travel.endTime)}`
            : travel.time || 'N/A';
        
        // Get companions for this travel
        const travelCompanions = companions[travel.id] || [];
        const companionsDisplay = travelCompanions.length > 0 
            ? travelCompanions.map(c => `${c.name} (${c.age})`).join(', ')
            : 'None';
        
        return `
        <tr>
            <td>${travel.spot ? travel.spot.name : 'N/A'}</td>
            <td>${travel.date || 'N/A'}</td>
            <td>${timeDisplay}</td>
            <td>${travel.visitors || '1'}</td>
            <td><span class="status-badge ${travel.status || 'scheduled'}">${travel.status || 'Scheduled'}</span></td>
            <td class="companions-cell">
                <div class="companions-list">
                    ${travelCompanions.length > 0 
                        ? travelCompanions.map(c => `
                            <span class="companion-tag">
                                ${c.name} (${c.age})
                                <button class="remove-companion" onclick="deleteCompanion('${travel.id}', '${c.id}')" title="Remove companion">
                                    <i class="fas fa-times"></i>
                                </button>
                            </span>
                        `).join('')
                        : '<span class="no-companions">No companions</span>'
                    }
                </div>
            </td>
            <td class="actions">
                <button class="btn-icon" onclick="showAddCompanionModal('${travel.id}')" title="Add Companion">
                    <i class="fas fa-user-plus"></i>
                </button>
                <button class="btn-icon" onclick="viewQR('${travel.id}')" title="View QR Code">
                    <i class="fas fa-qrcode"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="cancelVisit('${travel.id}')" title="Cancel Visit">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

function handleProfileUpdate(e) {
    e.preventDefault();
    
    if (!window.currentUser) {
        alert('Please sign in to update your profile.');
        return;
    }
    
    // Get updated profile data
    const updatedUser = {
        ...window.currentUser,
        name: document.getElementById('profileName').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        address: document.getElementById('profileAddress').value.trim()
    };
    
    // Update in users array
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === window.currentUser.id);
    
    if (userIndex !== -1) {
        // Keep the password from the original user data
        updatedUser.password = users[userIndex].password;
        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    // Update current user in localStorage and global variable
    const { password, ...userWithoutPassword } = updatedUser;
    window.currentUser = userWithoutPassword;
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    
    // Update UI
    updateAuthUI();
    updateDashboard();
    
    alert('Profile updated successfully!');
}

// Tab Switching Functionality
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding tab pane
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs
    initTabs();
    // Add event listener for profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Initialize dashboard if we're on the dashboard page
    if (document.getElementById('dashboard')) {
        updateDashboard();
        showDashboardSection('profile');
    }
});

// Export functions for global access
window.viewQR = function(travelId) {
    const userTravels = JSON.parse(localStorage.getItem('userTravels') || '[]');
    const travel = userTravels.find(t => t.id === travelId);
    
    if (!travel) {
        alert('Travel record not found.');
        return;
    }
    
    generateQRCode(travel);
};

window.showAddCompanionModal = function(travelId) {
    if (!window.currentUser) {
        alert('Please sign in to add companions.');
        return;
    }
    
    // Store the current travel ID for the companion form
    window.currentTravelId = travelId;
    
    const modal = document.getElementById('addCompanionModal');
    const form = document.getElementById('addCompanionForm');
    
    // Reset form
    form.reset();
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
};

window.closeAddCompanionModal = function() {
    const modal = document.getElementById('addCompanionModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    // Clear current travel ID
    window.currentTravelId = null;
};

window.handleAddCompanion = function(e) {
    e.preventDefault();
    
    if (!window.currentTravelId) {
        alert('No travel selected for companion.');
        return;
    }
    
    const name = document.getElementById('companionName').value.trim();
    const age = parseInt(document.getElementById('companionAge').value);
    
    if (!name || age < 1 || age > 120) {
        alert('Please enter valid companion information.');
        return;
    }
    
    // Get existing companions or create new array
    const companions = JSON.parse(localStorage.getItem('travelCompanions') || '{}');
    if (!companions[window.currentTravelId]) {
        companions[window.currentTravelId] = [];
    }
    
    // Add new companion
    const newCompanion = {
        id: Date.now().toString(),
        name: name,
        age: age,
        addedAt: new Date().toISOString()
    };
    
    companions[window.currentTravelId].push(newCompanion);
    localStorage.setItem('travelCompanions', JSON.stringify(companions));
    
    // Close modal and show success
    closeAddCompanionModal();
    showNotification('success', `Companion ${name} added successfully!`);
    
    // Refresh the dashboard to show updated companion list
    updateDashboard();
};

window.deleteCompanion = function(travelId, companionId) {
    if (confirm('Are you sure you want to remove this companion?')) {
        const companions = JSON.parse(localStorage.getItem('travelCompanions') || '{}');
        
        if (companions[travelId]) {
            companions[travelId] = companions[travelId].filter(c => c.id !== companionId);
            localStorage.setItem('travelCompanions', JSON.stringify(companions));
            
            showNotification('success', 'Companion removed successfully!');
            updateDashboard();
        }
    }
};

window.cancelVisit = function(travelId) {
    if (confirm('Are you sure you want to cancel this visit? This action cannot be undone.')) {
        const userTravels = JSON.parse(localStorage.getItem('userTravels') || '[]');
        const travelIndex = userTravels.findIndex(t => t.id === travelId);
        
        if (travelIndex !== -1) {
            userTravels[travelIndex].status = 'canceled';
            userTravels[travelIndex].canceledAt = new Date().toISOString();
            localStorage.setItem('userTravels', JSON.stringify(userTravels));
            
            showNotification('success', 'Visit canceled successfully!');
            updateDashboard();
        }
    }
};

window.closeQRModal = function() {
    const modal = document.getElementById('qrModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
};

window.generateQRCode = function(travel) {
    const modal = document.getElementById('qrModal');
    const qrCodeContainer = document.getElementById('qrCode');
    const qrInfoContainer = document.getElementById('qrInfo');
    
    // Generate QR code data with all necessary information
    const qrData = JSON.stringify({
        type: 'kapangan_visit',
        travelId: travel.id,
        userId: travel.userId,
        userName: travel.userName,
        userEmail: travel.userEmail,
        spotId: travel.spot.id,
        spotName: travel.spot.name,
        barangay: travel.spot.barangay,
        date: travel.date,
        time: travel.time,
        endTime: travel.endTime,
        visitors: travel.visitors || 1,
        companions: travel.companions || [],
        timestamp: new Date().toISOString(),
        status: 'confirmed'
    });
    
    // Clear previous QR code
    qrCodeContainer.innerHTML = '';
    
    // Generate real QR code using QRCode.js library
    const qr = new QRCode(qrCodeContainer, {
        text: qrData,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Store QR data for potential download
    qrCodeContainer.setAttribute('data-qr-content', qrData);
    
    // Display travel information
    qrInfoContainer.innerHTML = `
        <div class="qr-info-item">
            <i class="fas fa-map-marker-alt"></i>
            <div>
                <span class="qr-info-label">Tourist Spot</span>
                <span class="qr-info-value">${travel.spot.name}</span>
            </div>
        </div>
        <div class="qr-info-item">
            <i class="fas fa-calendar"></i>
            <div>
                <span class="qr-info-label">Visit Date</span>
                <span class="qr-info-value">${new Date(travel.date).toLocaleDateString()}</span>
            </div>
        </div>
        <div class="qr-info-item">
            <i class="fas fa-clock"></i>
            <div>
                <span class="qr-info-label">Time</span>
                <span class="qr-info-value">${formatTimeDisplay(travel.time)}${travel.endTime ? ` - ${formatTimeDisplay(travel.endTime)}` : ''}</span>
            </div>
        </div>
        <div class="qr-info-item">
            <i class="fas fa-users"></i>
            <div>
                <span class="qr-info-label">Visitors</span>
                <span class="qr-info-value">${travel.visitors || 1}</span>
            </div>
        </div>

        <div class="qr-info-item">
            <i class="fas fa-user"></i>
            <div>
                <span class="qr-info-label">Booked By</span>
                <span class="qr-info-value">${travel.userName}</span>
            </div>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 10);
};

window.downloadQRCode = function() {
    const qrCodeContainer = document.getElementById('qrCode');
    const qrCanvas = qrCodeContainer.querySelector('canvas');
    
    if (qrCanvas) {
        // Create a download link
        const link = document.createElement('a');
        link.download = 'kapangan-visit-qr.png';
        link.href = qrCanvas.toDataURL();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('success', 'QR code downloaded successfully!');
    } else {
        showNotification('error', 'QR code not found. Please try again.');
    }
};

// Test function to manually trigger time range selection
window.testTimeRangeSelection = function(barangay) {
    console.log('Testing time range selection for barangay:', barangay);
    if (!selectedTimeSlots[barangay]) {
        // Create a dummy selected slot for testing
        selectedTimeSlots[barangay] = {
            time: '09:00',
            element: null,
            endTime: null
        };
    }
    activateEndTimeSection(barangay);
};

// Add this function at the end of the file or in a utilities section
function renderCustomCalendar(containerId, barangay) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // === Add calendar title ===
    const title = document.createElement('div');
    title.textContent = 'Select Date';
    title.className = 'calendar-title';
    title.style.fontSize = '1.35rem';
    title.style.fontWeight = '700';
    title.style.marginBottom = '10px';
    title.style.letterSpacing = '0.5px';
    title.style.color = '#263238';
    title.style.textAlign = 'center';
    container.appendChild(title);

    // Calendar state
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    const today = new Date();

    // Use global selectedVisitDate if set
    let selectedDate = selectedVisitDate ? new Date(selectedVisitDate) : null;

    function getBookingStatus(date) {
        // Dummy logic: random status for demo. Replace with real logic as needed.
        const day = date.getDate();
        if (day % 7 === 0) return 'fully-booked';
        if (day % 5 === 0) return 'moderate';
        return 'available';
    }

    function renderCalendar() {
        container.innerHTML = '';
        // Header
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        const prevBtn = document.createElement('button');
        prevBtn.className = 'calendar-nav-btn';
        prevBtn.innerHTML = '&lt;';
        prevBtn.setAttribute('aria-label', 'Previous Month');
        prevBtn.onclick = () => {
            if (currentMonth === 0) {
                currentMonth = 11;
                currentYear--;
            } else {
                currentMonth--;
            }
            renderCalendar();
        };
        const nextBtn = document.createElement('button');
        nextBtn.className = 'calendar-nav-btn';
        nextBtn.innerHTML = '&gt;';
        nextBtn.setAttribute('aria-label', 'Next Month');
        nextBtn.onclick = () => {
            if (currentMonth === 11) {
                currentMonth = 0;
                currentYear++;
            } else {
                currentMonth++;
            }
            renderCalendar();
        };
        const monthYear = document.createElement('span');
        monthYear.className = 'calendar-month-year';
        monthYear.textContent = `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}`;
        header.appendChild(prevBtn);
        header.appendChild(monthYear);
        header.appendChild(nextBtn);
        container.appendChild(header);

        // Legend
        const legend = document.createElement('div');
        legend.className = 'calendar-legend';
        legend.style.display = 'flex';
        legend.style.flexDirection = 'row';
        legend.style.justifyContent = 'center';
        legend.style.gap = '10px';
        legend.innerHTML = `
            <div class="legend-item"><span class="legend-color available"></span>Available</div>
            <div class="legend-item"><span class="legend-color moderate"></span>Moderate</div>
            <div class="legend-item"><span class="legend-color fully-booked"></span>Fully Booked</div>
        `;
        container.appendChild(legend);

        // Weekdays
        const weekdays = document.createElement('div');
        weekdays.className = 'calendar-weekdays';
        weekdays.style.display = 'grid';
        weekdays.style.gridTemplateColumns = 'repeat(7, 1fr)';
        ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
            const wd = document.createElement('div');
            wd.className = 'calendar-weekday';
            wd.textContent = d;
            wd.style.textAlign = 'center';
            weekdays.appendChild(wd);
        });
        container.appendChild(weekdays);

        // Days
        const daysGrid = document.createElement('div');
        daysGrid.className = 'calendar-days';
        daysGrid.style.display = 'grid';
        daysGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysGrid.style.gap = '4px';
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        // Fill blanks
        for (let i = 0; i < firstDay; i++) {
            const blank = document.createElement('div');
            blank.className = 'calendar-day disabled';
            daysGrid.appendChild(blank);
        }
        // Fill days
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentYear, currentMonth, d);
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            // Prevent past dates
            if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                dayDiv.classList.add('disabled');
                dayDiv.title = 'This date has passed';
            } else {
                // Color by booking status
                const status = getBookingStatus(date);
                if (status === 'fully-booked') dayDiv.classList.add('fully-booked');
                else if (status === 'moderate') dayDiv.classList.add('moderate');
                else dayDiv.classList.add('available');
                dayDiv.tabIndex = 0;
                dayDiv.setAttribute('role', 'button');
                dayDiv.setAttribute('aria-label', date.toDateString());
                dayDiv.onclick = () => {
                    if (dayDiv.classList.contains('fully-booked')) {
                        dayDiv.title = 'This date is fully booked and cannot be selected.';
                        return;
                    }
                    container.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
                    dayDiv.classList.add('selected');
                    selectedVisitDate = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    renderBarangayScheduleForms(Array.from(document.querySelectorAll('input[name="barangay"]:checked')).map(cb => cb.value));
                };
                // Highlight selected
                if (
                    selectedVisitDate &&
                    date.getFullYear() === new Date(selectedVisitDate).getFullYear() &&
                    date.getMonth() === new Date(selectedVisitDate).getMonth() &&
                    date.getDate() === new Date(selectedVisitDate).getDate()
                ) {
                    dayDiv.classList.add('selected');
                }
                // Highlight today
                if (
                    date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate()
                ) {
                    dayDiv.classList.add('today');
                }
            }
            dayDiv.textContent = d;
            daysGrid.appendChild(dayDiv);
        }
        container.appendChild(daysGrid);
    }
    renderCalendar();
}

let advisoryCurrentIndex = 0;

function moveAdvisoryCarousel(direction) {
    const carousel = document.getElementById('advisoryCarousel');
    const cards = carousel.querySelectorAll('.advisory-card');
    if (cards.length === 0) return;
    const cardWidth = cards[0].offsetWidth + 20; // card width + margin
    advisoryCurrentIndex += direction;
    if (advisoryCurrentIndex < 0) advisoryCurrentIndex = 0;
    if (advisoryCurrentIndex > cards.length - 1) advisoryCurrentIndex = cards.length - 1;
    carousel.scrollTo({
        left: advisoryCurrentIndex * cardWidth,
        behavior: 'smooth'
    });
}

// Inject calendar color styles directly if not present
(function injectCalendarStyles() {
    if (document.getElementById('calendar-inline-styles')) return;
    const style = document.createElement('style');
    style.id = 'calendar-inline-styles';
    style.textContent = `
    .calendar-title {
      font-family: 'Poppins', 'Segoe UI', Arial, sans-serif;
      color: #222;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
      text-align: center;
    }
    .calendar-header {
      background: #23272f;
      color: #fff;
      border-radius: 12px 12px 0 0;
      padding: 12px 18px;
      font-size: 1.1rem;
      margin-bottom: 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }
    .calendar-nav-btn {
      background: #374151;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      margin: 0 4px;
    }
    .calendar-nav-btn:hover {
      background: #111827;
    }
    .calendar-month-year {
      font-weight: 600;
      font-size: 1.1rem;
      letter-spacing: 0.5px;
    }
    .calendar-legend {
      background: #23272f;
      color: #fff;
      border-radius: 0 0 12px 12px;
      margin-bottom: 10px;
      padding: 8px 0 8px 0;
      font-size: 1rem;
      display: flex;
      justify-content: center;
      gap: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 1rem;
      font-weight: 500;
      color: #fff;
    }
    .legend-color {
      display: inline-block;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      margin-right: 8px;
      border: 2.5px solid #888;
      vertical-align: middle;
      box-shadow: 0 2px 6px rgba(0,0,0,0.10);
    }
    .legend-color.available { background: #1b5e20 !important; border-color: #43d16d; }
    .legend-color.moderate { background: #bfa100 !important; border-color: #ffe066; }
    .legend-color.fully-booked { background: #b71c1c !important; border-color: #ff5e5e; }
    .calendar-weekdays {
      background: #23272f;
      color: #fff;
      border-radius: 0 0 0 0;
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 2px;
      padding: 4px 0;
    }
    .calendar-weekday {
      text-align: center;
      padding: 6px 0;
      font-size: 1rem;
      color: #b0b7c3;
      letter-spacing: 0.5px;
    }
    .calendar-days {
      background: #23272f;
      border-radius: 0 0 12px 12px;
      padding: 10px 0 16px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .calendar-day {
      background: #374151;
      color: #fff;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 500;
      text-align: center;
      padding: 10px 0 6px 0;
      margin: 2px;
      cursor: pointer;
      transition: background 0.18s, color 0.18s, box-shadow 0.18s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      position: relative;
      outline: none;
    }
    .calendar-day:hover:not(.disabled):not(.fully-booked) {
      background: #111827;
      color: #ffe066;
      box-shadow: 0 2px 8px rgba(0,0,0,0.10);
      z-index: 2;
    }
    .calendar-day.selected {
      border: 2.5px solid #ffe066 !important;
      background: #111827 !important;
      color: #ffe066 !important;
      box-shadow: 0 2px 8px rgba(255,224,102,0.15);
      z-index: 3;
    }
    .calendar-day.available {
      background: #1b5e20 !important;
      color: #43d16d !important;
    }
    .calendar-day.moderate {
      background: #bfa100 !important;
      color: #ffe066 !important;
    }
    .calendar-day.fully-booked {
      background: #b71c1c !important;
      color: #ff5e5e !important;
      text-decoration: line-through;
      cursor: not-allowed !important;
      opacity: 0.6;
      pointer-events: auto;
    }
    .calendar-day.fully-booked.selected {
      border: none !important;
      background: #b71c1c !important;
      color: #ff5e5e !important;
    }
    .calendar-day.available::after {
      content: '';
      display: block;
      margin: 0 auto;
      margin-top: 2px;
      width: 8px;
      height: 8px;
      background: #43d16d;
      border-radius: 50%;
    }
    .calendar-day.moderate::after {
      content: '';
      display: block;
      margin: 0 auto;
      margin-top: 2px;
      width: 8px;
      height: 8px;
      background: #ffe066;
      border-radius: 50%;
    }
    .calendar-day.fully-booked::after {
      content: '';
      display: block;
      margin: 0 auto;
      margin-top: 2px;
      width: 8px;
      height: 8px;
      background: #ff5e5e;
      border-radius: 50%;
    }
    .calendar-day.today {
      border: 2px solid #43d16d;
      box-shadow: 0 0 0 2px #43d16d33;
    }
    .calendar-day.disabled {
      background: #23272f !important;
      color: #888 !important;
      opacity: 0.4;
      cursor: not-allowed !important;
      pointer-events: none;
    }
    @media (max-width: 600px) {
      .calendar-header, .calendar-legend, .calendar-days, .calendar-weekdays {
        font-size: 0.95rem;
        padding: 6px 2px;
      }
      .calendar-title {
        font-size: 1.1rem;
      }
    }

    /* Time Slot Selection Styles */
    .time-slots-grid {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e0 #f7fafc;
    }
    
    .time-slots-grid::-webkit-scrollbar {
      width: 6px;
    }
    
    .time-slots-grid::-webkit-scrollbar-track {
      background: #f7fafc;
      border-radius: 3px;
    }
    
    .time-slots-grid::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 3px;
    }
    
    .time-slots-grid::-webkit-scrollbar-thumb:hover {
      background: #a0aec0;
    }
    
    .time-slot-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .time-slot-card:hover:not(.booked) {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
    }
    
    .time-slot-card.selected {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 4px 8px rgba(40, 167, 69, 0.2);
      }
      50% {
        box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4);
      }
      100% {
        box-shadow: 0 4px 8px rgba(40, 167, 69, 0.2);
      }
    }
    
    .time-range-container {
      animation: slideDown 0.3s ease-out;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .barangay-schedule-form {
      transition: all 0.3s ease;
    }
    
    .barangay-schedule-form:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
    }
    
    /* End time selection styles */
    .end-time-select {
      transition: all 0.2s ease;
    }
    
    .end-time-select:focus {
      border-color: #28a745 !important;
      box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1) !important;
      outline: none;
    }
    
    .end-time-select:hover {
      border-color: #28a745;
    }
    
    .time-range-summary {
      animation: fadeIn 0.5s ease-in;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Success message animation */
    .success-message {
      animation: slideInRight 0.3s ease-out;
    }
    
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideOutRight {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(20px);
      }
    }
    `;
    document.head.appendChild(style);
})();

// Add this function near other notification helpers:
function showTimeRangeConflictNotice(barangay, conflictingBarangay, startTime, endTime) {
    // Find the barangay schedule form container
    const formDiv = document.querySelector(`.barangay-schedule-form[data-barangay="${barangay}"]`);
    if (!formDiv) return;
    // Remove any existing notice
    const existing = formDiv.querySelector('.time-conflict-notice');
    if (existing) existing.remove();
    // Create notice
    const notice = document.createElement('div');
    notice.className = 'time-conflict-notice';
    notice.style.cssText = `
        background: #ffeaa7;
        color: #856404;
        border: 1.5px solid #ffc107;
        border-radius: 8px;
        padding: 10px 16px;
        margin-bottom: 12px;
        font-size: 1rem;
        font-weight: 500;
        text-align: center;
        box-shadow: 0 2px 8px rgba(255, 193, 7, 0.08);
        animation: slideInRight 0.3s ease-out;
    `;
    notice.innerHTML = `<i class='fas fa-exclamation-triangle' style='margin-right:7px;'></i>This time slot conflicts with ${conflictingBarangay}'s schedule (${startTime} - ${endTime}).`;
    formDiv.insertBefore(notice, formDiv.firstChild);
    setTimeout(() => {
        if (notice.parentNode) {
            notice.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notice.parentNode) notice.parentNode.removeChild(notice);
            }, 300);
        }
    }, 3500);
}