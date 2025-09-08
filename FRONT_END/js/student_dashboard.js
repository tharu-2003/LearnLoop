// /////////////////// images /////////////////////
// ==========================
// CLOUDINARY CONFIG
// ==========================
const CLOUD_NAME = "dodxgayab"; // your Cloudinary cloud name
const UPLOAD_PRESET = "learnloop_unsigned"; // your unsigned preset

// Upload function
async function uploadImageToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "learnloop/avatars"); // optional: organize uploads

    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        if (data.secure_url) {
            return data.secure_url; // Cloudinary hosted URL
        } else {
            throw new Error("Cloudinary upload failed");
        }
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        Swal.fire("Error", "Image upload failed!", "error");
        return null;
    }
}

////////////////////////////////////////////////////

// Flexible Pie Chart Class
class FlexiblePieChart {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        this.options = {
            size: options.size || 120,
            innerSize: options.innerSize || 65,
            colors: options.colors || ['#1164a3', '#f59e0b', '#2eb67d'],
            labels: options.labels || ['All Classes', 'Private', 'Public'],
            animationDuration: options.animationDuration || 1000,
            ...options
        };
        this.data = [];
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Pie chart container not found');
            return;
        }
        this.createChart();
    }

    createChart() {
        // Create pie chart element
        this.pieElement = document.createElement('div');
        this.pieElement.className = 'pie-chart-dynamic';
        this.pieElement.style.cssText = `
            width: ${this.options.size}px;
            height: ${this.options.size}px;
            border-radius: 50%;
            position: relative;
            transition: all ${this.options.animationDuration}ms ease;
        `;

        // Create inner circle
        this.innerCircle = document.createElement('div');
        this.innerCircle.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${this.options.innerSize}px;
            height: ${this.options.innerSize}px;
            background: #1a1d29;
            border-radius: 50%;
            z-index: 2;
        `;

        this.pieElement.appendChild(this.innerCircle);
        
        // Replace existing pie chart
        const existingChart = this.container.querySelector('.pie-chart, .student-pie-chart');
        if (existingChart) {
            this.container.replaceChild(this.pieElement, existingChart);
        } else {
            this.container.appendChild(this.pieElement);
        }
    }

    updateData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            this.showEmptyState();
            return;
        }

        this.data = data.map((value, index) => ({
            value: Math.max(0, value),
            color: this.options.colors[index % this.options.colors.length],
            label: this.options.labels[index] || `Item ${index + 1}`
        }));

        this.renderChart();
        this.updateLegend();
    }

    calculateAngles() {
        const total = this.data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) return [];

        let currentAngle = 0;
        return this.data.map(item => {
            const percentage = item.value / total;
            const angle = percentage * 360;
            const segment = {
                ...item,
                percentage: percentage * 100,
                startAngle: currentAngle,
                endAngle: currentAngle + angle,
                angle: angle
            };
            currentAngle += angle;
            return segment;
        });
    }

    renderChart() {
        const segments = this.calculateAngles();
        if (segments.length === 0) {
            this.showEmptyState();
            return;
        }

        // Create conic gradient
        let gradientParts = [];
        segments.forEach(segment => {
            if (segment.angle > 0) {
                gradientParts.push(`${segment.color} ${segment.startAngle}deg ${segment.endAngle}deg`);
            }
        });

        if (gradientParts.length > 0) {
            this.pieElement.style.background = `conic-gradient(${gradientParts.join(', ')})`;
        } else {
            this.showEmptyState();
        }

        // Add hover effects
        this.addHoverEffects(segments);
    }

    addHoverEffects(segments) {
        this.pieElement.style.cursor = 'pointer';
        
        this.pieElement.addEventListener('mouseenter', () => {
            this.pieElement.style.transform = 'scale(1.05)';
            this.pieElement.style.boxShadow = '0 8px 25px rgba(17, 100, 163, 0.4)';
        });

        this.pieElement.addEventListener('mouseleave', () => {
            this.pieElement.style.transform = 'scale(1)';
            this.pieElement.style.boxShadow = 'none';
        });

        // Add click handler for segments
        this.pieElement.addEventListener('click', (e) => {
            const rect = this.pieElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
            const normalizedAngle = (angle + 360) % 360;
            
            const clickedSegment = segments.find(segment => 
                normalizedAngle >= segment.startAngle && normalizedAngle <= segment.endAngle
            );

            if (clickedSegment && this.options.onSegmentClick) {
                this.options.onSegmentClick(clickedSegment);
            }
        });
    }

    updateLegend() {
        const legendContainer = this.container.parentElement.querySelector('.legend, .student-legend');
        if (!legendContainer) return;

        const segments = this.calculateAngles();
        const legendItems = legendContainer.querySelectorAll('.legend-item, .student-legend-item');

        legendItems.forEach((item, index) => {
            const segment = segments[index];
            if (segment) {
                const colorElement = item.querySelector('.legend-color, .student-legend-color');
                const textElement = item.querySelector('.legend-text, .student-legend-text');
                const numberElement = item.querySelector('.legend-number, .student-legend-number');

                if (colorElement) colorElement.style.backgroundColor = segment.color;
                if (textElement) textElement.textContent = segment.label;
                if (numberElement) {
                    numberElement.textContent = segment.value;
                    // Add percentage display
                    numberElement.title = `${segment.percentage.toFixed(1)}%`;
                }

                // Add animation
                item.style.opacity = '0';
                setTimeout(() => {
                    item.style.transition = 'opacity 0.5s ease';
                    item.style.opacity = '1';
                }, index * 100);
            }
        });
    }

    showEmptyState() {
        this.pieElement.style.background = '#404449';
        this.pieElement.style.opacity = '0.5';
        
        // Show "No Data" text
        if (!this.pieElement.querySelector('.empty-state')) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: rgba(255, 255, 255, 0.6);
                font-size: 12px;
                text-align: center;
                z-index: 3;
            `;
            emptyState.textContent = 'No Data';
            this.pieElement.appendChild(emptyState);
        }
    }

    // Method to animate chart updates
    animateUpdate(newData) {
        this.pieElement.style.opacity = '0.7';
        this.pieElement.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            this.updateData(newData);
            this.pieElement.style.opacity = '1';
            this.pieElement.style.transform = 'scale(1)';
        }, 200);
    }

    // Method to destroy the chart
    destroy() {
        if (this.pieElement && this.pieElement.parentElement) {
            this.pieElement.parentElement.removeChild(this.pieElement);
        }
    }
}

// Global variables
let pieChart;
let toastCount = 0;
const activeToasts = new Set();

function setupPage() {
    console.log("Setting up student page logic...");
    const token = sessionStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("current User"));

    if (!currentUser || !currentUser.userId) {
        console.error("No user found, redirecting to login");
        window.location.href = '../index.html';
        return;
    }

    loadUserData(currentUser.userId);

    console.log("Logged User Id " + currentUser.userId);
    
    // $('.student-name').text(currentUser.username || "Student");

    // Get modal elements using jQuery
    const $editProfileModal = $('#editProfileModal');
    const $editProfileBtn = $('.profile-edit-btn, .student-edit-btn');
    const $closeModalBtn = $('#closeModal');
    const $cancelEditBtn = $('#cancelEdit');
    const $editProfileForm = $('#editProfileForm');
    const $avatarInput = $('#avatarInput');
    const $uploadBtn = $('.upload-btn, .student-upload-btn');
    const $currentAvatar = $('.current-avatar, .student-current-avatar');
    const $body = $('body');

    // Open edit profile modal
    $editProfileBtn.on('click', function() {
        $editProfileModal.addClass('active');
        $body.css('overflow', 'hidden');
    });

    // Close modal functions
    function closeModal() {
        $editProfileModal.removeClass('active');
        $body.css('overflow', 'auto');
    }

    function navigateToClasses() {
        window.location.href = '/pages/student_classess.html';
    }

    // Add interactivity to navigation items using jQuery
    $('.nav-menu-item, .student-nav-item').each(function() {
        $(this).on('click', function() {
            
            $('.nav-menu-item, .student-nav-item').removeClass('active');
            $(this).addClass('active');
            
            // Check if this is the Classes navigation item
            const navText = $(this).find('.nav-menu-text, .student-nav-text').text();
            if (navText === 'Classes') {
                navigateToClasses();
            } else if(navText === 'Document') {
                // Document functionality
            } else if(navText === 'LogOut') {
                // Clear storage
                sessionStorage.clear();
                localStorage.clear();
                
                // Beautiful logout SweetAlert
                Swal.fire({
                    title: 'Logging Out...',
                    html: `
                        <div style="text-align: center; padding: 20px;">
                            <div style="
                                width: 80px; 
                                height: 80px; 
                                margin: 0 auto 20px; 
                                border-radius: 50%; 
                                background: linear-gradient(45deg, #667eea, #764ba2); 
                                display: flex; 
                                align-items: center; 
                                justify-content: center;
                                animation: rotateGlow 2s ease-in-out infinite;
                            ">
                                <i class="fas fa-sign-out-alt" style="font-size: 32px; color: white;"></i>
                            </div>
                            <p style="font-size: 18px; color: #6b7280; margin: 0; font-weight: 300;">
                                Thank you for using our service!
                            </p>
                            <p style="font-size: 14px; color: #9ca3af; margin: 10px 0 0; font-style: italic;">
                                Redirecting you safely...
                            </p>
                        </div>
                    `,
                    showConfirmButton: false,
                    timer: 2500,
                    timerProgressBar: true,
                    backdrop: `rgba(0,0,123,0.4)`,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    customClass: {
                        popup: 'beautiful-logout',
                        timerProgressBar: 'custom-progress-bar'
                    },
                    didOpen: () => {
                        const popup = Swal.getPopup();
                        popup.style.borderRadius = '25px';
                        popup.style.border = 'none';
                        popup.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                        popup.style.background = 'white';
                        popup.style.overflow = 'hidden';
                        popup.style.position = 'relative';
                        
                        // Add a subtle background pattern
                        popup.style.backgroundImage = `
                            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.05) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.05) 0%, transparent 50%)
                        `;
                        
                        // Add CSS animations if not already added
                        if (!document.getElementById('logout-animations')) {
                            const style = document.createElement('style');
                            style.id = 'logout-animations';
                            style.textContent = `
                                @keyframes rotateGlow {
                                    0% { 
                                        transform: rotate(0deg) scale(1);
                                        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                                    }
                                    50% { 
                                        transform: rotate(180deg) scale(1.05);
                                        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.6);
                                    }
                                    100% { 
                                        transform: rotate(360deg) scale(1);
                                        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                                    }
                                }
                                
                                .beautiful-logout {
                                    animation: slideInFromTop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
                                }
                                
                                .custom-progress-bar {
                                    background: linear-gradient(90deg, #667eea, #764ba2) !important;
                                    height: 6px !important;
                                    border-radius: 3px !important;
                                }
                                
                                @keyframes slideInFromTop {
                                    from {
                                        opacity: 0;
                                        transform: translate3d(0, -60px, 0) scale(0.9);
                                    }
                                    to {
                                        opacity: 1;
                                        transform: translate3d(0, 0, 0) scale(1);
                                    }
                                }
                            `;
                            document.head.appendChild(style);
                        }
                    }
                }).then(() => {
                    console.log("logout successful");
                    window.location.href = '../index.html';
                });
            }
        });
    });

    // Close modal events
    $closeModalBtn.on('click', closeModal);
    $cancelEditBtn.on('click', closeModal);

    // Close modal when clicking outside
    $editProfileModal.on('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Close modal with Escape key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            if ($editProfileModal.hasClass('active')) {
                closeModal();
            }
        }
    });

    // Avatar upload functionality
    $uploadBtn.on('click', function() {
        $avatarInput.click();
    });

    $avatarInput.on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $currentAvatar.html(`<img 
                src="${e.target.result}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`);
            };
            reader.readAsDataURL(file);
        }
    });

    // Add class button functionality
    $('.add-class-btn, .student-add-class-btn').on('click', function() {
        navigateToClasses();
    });

    // Load initial data
    if (currentUser && currentUser.userId) {
        loadStudentClasses(currentUser.userId);
        updateClassStatistics(currentUser.userId);
    }

    // Initialize pie chart
    setTimeout(() => {
        initializePieChart();
        startPieChartAutoRefresh();
    }, 500);

    // ========================== FORM SUBMISSIONS ==========================

    $editProfileForm.on('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        console.log("Student profile form submitted");

        const $submitBtn = $(this).find('button[type="submit"]');
        const originalText = $submitBtn.text();
        $submitBtn.text('Saving...').prop('disabled', true);

        const token = sessionStorage.getItem("token");
        const currentUser = JSON.parse(localStorage.getItem("current User"));

        if (!currentUser || !currentUser.userId) {
            showToast('User not found. Please login again.', 'error');
            $submitBtn.text(originalText).prop('disabled', false);
            return;
        }

        // Get form data
        const formData = {
            username: $('#studentName').val().trim(),
            email: $('#studentEmail').val().trim(),
            phoneNumber: parseInt($('#studentPhone').val().trim().replace(/[^0-9]/g, '')) || null,
            avatarUrl: currentUser.avatarUrl || null
        };

        const avatarFile = $avatarInput[0].files[0];
        if (avatarFile) {
            // Upload to Cloudinary
            const uploadedUrl = await uploadImageToCloudinary(avatarFile);

            console.log("uploadedUrl " + uploadedUrl);
            if (!uploadedUrl) {
                showToast('Failed to upload avatar', 'error');
                $submitBtn.text(originalText).prop('disabled', false);
                return;
            }
            formData.avatarUrl = uploadedUrl;
        }

        console.log("Sending data:", formData);
        console.log("URL:", `http://localhost:8080/auth/update/${currentUser.userId}`);

        $.ajax({
            url: `http://localhost:8080/auth/update/${currentUser.userId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function(data, textStatus, xhr) {
                console.log("=== SUCCESS RESPONSE ===");
                console.log("HTTP Status:", xhr.status);
                console.log("Response data:", data);

                if (xhr.status === 200) {
                    // response data structure: data.data.user and data.data.token
                    const respData = data && data.data ? data.data : null;

                    if (respData) {
                        // Update token in sessionStorage
                        if (respData.token) {
                            sessionStorage.setItem("token", respData.token);
                            console.log("Updated token in sessionStorage");
                        }

                        // Update current user in localStorage
                        if (respData.user) {
                            localStorage.setItem("current User", JSON.stringify(respData.user));
                            console.log("Updated current User in localStorage");
                        }

                        // reload UI from updated user
                        const currentUser = respData.user || JSON.parse(localStorage.getItem("current User"));
                        if (currentUser && currentUser.userId) {
                            loadUserData(currentUser.userId);
                        }

                        showToast('Profile updated successfully!', 'success');
                        closeModal();
                    } else {
                        showToast('Profile updated but unexpected response format', 'warning');
                    }
                } else {
                    showToast('Unexpected response status', 'error');
                }

                $submitBtn.text(originalText).prop('disabled', false);
            },

            error: function(xhr, textStatus, errorThrown) {
                console.log("=== ERROR RESPONSE ===");
                console.log("HTTP Status:", xhr.status);
                console.log("Status Text:", xhr.statusText);
                console.log("Error thrown:", errorThrown);
                console.log("Response text:", xhr.responseText);
                
                let errorMessage = 'Failed to update profile';
                
                if (xhr.status === 401) {
                    errorMessage = 'Unauthorized. Please login again.';
                } else if (xhr.status === 0) {
                    errorMessage = 'Unable to connect to server.';
                }
                
                showToast(errorMessage, 'error');
                $submitBtn.text(originalText).prop('disabled', false);
            }
        });
    });
}

// Initialize when document is ready
$(document).ready(function() {
    setupPage();
});

// Function to get user data and set it in the dashboard
function loadUserData(userId) {
    $.ajax({
        url: `http://localhost:8080/auth/user/${userId}`,
        method: 'GET',
        success: function(response) {
            if (response && response.data) {
                const user = response.data;

                // Set user name
                $('.student-name').text(user.username || 'Student Name');

                // Set user email and phone
                $('.student-email').text(user.email || 'No email provided');
                $('.student-phone').text(user.phoneNumber || 'No phone provided');

                // Set user avatar
                const avatarDiv = $('.teacher-avatar, .student-avatar');
                const editAvatarDiv = $('.current-avatar, .student-current-avatar');
                
                avatarDiv.empty(); // Remove existing content
                editAvatarDiv.empty();

                if (user.avatarUrl) {
                    avatarDiv.append(`<img src="${user.avatarUrl}" alt="${user.username}" class="user-avatar-img" style="border-radius: 50%; width: 100%; height: 100%; object-fit: cover;"> `);
                    editAvatarDiv.append(`<img src="${user.avatarUrl}" alt="${user.username}" class="user-avatar-img" style="border-radius: 50%; width: 100%; height: 100%; object-fit: cover;"> `);
                    
                } else {
                    avatarDiv.append('<i class="fas fa-user"></i>');
                    editAvatarDiv.append('<i class="fas fa-user"></i>');

                }

                // Update form fields
                $('#studentName').val(user.username);
                $('#studentEmail').val(user.email);
                $('#studentPhone').val(user.phoneNumber);
                
                const userName = user.username;
                const firstChar = userName.substring(0, 1);
                $('.user-avatar-nav, .student-user-avatar').text(firstChar);
            }
        },
        error: function(xhr, status, error) {
            console.error('Failed to fetch user data:', error);
        }
    });
}

// Function to update class statistics for students
function updateClassStatistics(studentId) {
    const token = sessionStorage.getItem("token");
    
    $.ajax({
        url: `http://localhost:8080/api/classes/student-statistics/${studentId}`,
        type: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(response) {
            if (response.code === 200) {
                const stats = response.data;
                
                // Update stat cards
                $('.student-stat-card.student-all-classes-card .student-stat-number').text(stats.totalClasses || 0);
                $('.student-stat-card.student-private-classes-card .student-stat-number').text(stats.privateClasses || 0);
                $('.student-stat-card.student-public-classes-card .student-stat-number').text(stats.publicClasses || 0);
                
                // Update legend
                $('.student-legend-item:first .student-legend-number').text(stats.totalClasses || 0);
                $('.student-legend-item:nth-child(2) .student-legend-number').text(stats.privateClasses || 0);
                $('.student-legend-item:last .student-legend-number').text(stats.publicClasses || 0);
                
                // Update pie chart
                if (pieChart) {
                    const chartData = [
                        stats.totalClasses || 0,
                        stats.privateClasses || 0,
                        stats.publicClasses || 0
                    ];
                    pieChart.animateUpdate(chartData);
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching statistics:', error);
            // Use default values if API fails
            if (pieChart) {
                pieChart.animateUpdate([0, 0, 0]);
            }
        }
    });
}

// Function to load student's enrolled classes
function loadStudentClasses(studentId) {
    const token = sessionStorage.getItem("token");
    
    // Show loading state
    const $classesGrid = $('.classes-grid, .student-classes-grid');
    $classesGrid.html(`
        <div class="class-item student-class-item loading">
            <div class="class-item-icon student-class-icon">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="class-item-name student-class-name">Loading classes...</div>
        </div>
    `);

    $.ajax({
        url: `http://localhost:8080/api/classes/student/${studentId}`,
        type: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(response) {
            if (response.code === 200) {
                console.log(response);

                const classes = response.data;
                const $classesGrid = $('.classes-grid, .student-classes-grid');
                
                $classesGrid.empty();
                
                if (classes.length === 0) {
                    $classesGrid.html(`
                        <div class="class-item student-class-item" style="grid-column: 1 / -1;">
                            <div class="class-item-icon student-class-icon">
                                <i class="fas fa-book"></i>
                            </div>
                            <div class="class-item-name student-class-name">No classes found. Join your first class!</div>
                        </div>
                    `);
                    return;
                }

                classes.forEach(function(classData) {
                    // const avatarUrl = classData.avatarUrl || null;
                    const avatarUrl = classData.createdByAvatarUrl || classData.imageUrl || null;

                    const classHtml = `
                        <div class="class-item student-class-item" data-class-id="${classData.classId}">
                            <div class="class-item-icon student-class-icon">
                                ${avatarUrl ? 
                                    `<img src="${avatarUrl}" alt="${classData.name}" class="class-dp-image student-class-image">` : 
                                    `<i class="fas fa-book"></i>`
                                }
                            </div>
                            <div class="class-item-name student-class-name">${classData.name}</div>
                        </div>
                    `;
                    
                    $classesGrid.append(classHtml);
                });
                
                // Add click handlers for classes
                $('.class-item, .student-class-item').on('click', function() {
                    const classId = $(this).data('class-id');
                    const className = $(this).find('.class-item-name, .student-class-name').text();
                    console.log(`Clicked on class: ${className} (ID: ${classId})`);
                    // Navigate to class details or classroom
                });
            } else {
                showToast('Failed to load classes', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading classes:', error);
            showToast('Failed to load classess', 'error');
        }
    });
}

// PIE CHART FUNCTIONS
function initializePieChart() {
    const pieChartContainer = document.querySelector('.distribution-inner, .student-distribution-inner');
    if (!pieChartContainer) {
        console.error('Pie chart container not found');
        return;
    }

    pieChart = new FlexiblePieChart('.distribution-inner, .student-distribution-inner', {
        size: 120,
        innerSize: 65,
        colors: ['#1164a3', '#f59e0b', '#2eb67d'],
        labels: ['All Classes', 'Private Classes', 'Public Classes'],
        animationDuration: 800,
        onSegmentClick: (segment) => {
            showToast(`${segment.label}: ${segment.value} classes (${segment.percentage.toFixed(1)}%)`, 'info');
        }
    });

    loadPieChartData();
}

function loadPieChartData() {
    const currentUser = JSON.parse(localStorage.getItem("current User"));
    if (!currentUser || !currentUser.userId) {
        pieChart.updateData([0, 0, 0]);
        return;
    }

    const token = sessionStorage.getItem("token");
    
    $.ajax({
        url: `http://localhost:8080/api/classes/student-statistics/${currentUser.userId}`,
        type: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(response) {
            if (response.code === 200) {
                const stats = response.data;
                const chartData = [
                    stats.totalClasses || 0,
                    stats.privateClasses || 0,
                    stats.publicClasses || 0
                ];
                
                pieChart.animateUpdate(chartData);
            } else {
                pieChart.updateData([0, 0, 0]);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching pie chart data:', error);
            pieChart.updateData([0, 0, 0]);
        }
    });
}

function updatePieChartData() {
    if (pieChart) {
        loadPieChartData();
    }
}

function startPieChartAutoRefresh() {
    setInterval(() => {
        if (pieChart) {
            loadPieChartData();
        }
    }, 30000);
}

// TOAST ALERT FUNCTIONALITY
function showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    const toastId = ++toastCount;
    toast.className = `toast toast-${type}`;
    toast.setAttribute('data-toast-id', toastId);
    
    const config = {
        info: { 
            icon: 'ℹ️', 
            title: 'Information',
            gradient: 'linear-gradient(135deg, #4ecdc4, #44a08d)'
        },
        success: { 
            icon: '✅', 
            title: 'Success',
            gradient: 'linear-gradient(135deg, #4ade80, #22c55e)'
        },
        error: { 
            icon: '❌', 
            title: 'Error',
            gradient: 'linear-gradient(135deg, #f87171, #ef4444)'
        },
        warning: { 
            icon: '⚠️', 
            title: 'Warning',
            gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)'
        }
    };

    const currentConfig = config[type];
    
    toast.innerHTML = `
        <div class="toast-icon">${currentConfig.icon}</div>
        <div class="toast-content">
            <div class="toast-title">${currentConfig.title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="closeToast(${toastId})">&times;</button>
        <div class="toast-progress"></div>
    `;

    const existingToasts = document.querySelectorAll('.toast');
    let topOffset = 20;
    existingToasts.forEach(existingToast => {
        topOffset += existingToast.offsetHeight + 15;
    });
    toast.style.top = `${topOffset}px`;

    document.body.appendChild(toast);
    activeToasts.add(toastId);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        closeToast(toastId);
    }, duration);

    return toastId;
}

function closeToast(toastId) {
    const toast = document.querySelector(`[data-toast-id="${toastId}"]`);
    if (!toast || !activeToasts.has(toastId)) return;

    toast.classList.add('hide');
    toast.classList.remove('show');
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
            activeToasts.delete(toastId);
            repositionToasts();
        }
    }, 400);
}

function repositionToasts() {
    const toasts = document.querySelectorAll('.toast.show');
    let topOffset = 20;
    
    toasts.forEach(toast => {
        toast.style.top = `${topOffset}px`;
        topOffset += toast.offsetHeight + 15;
    });
}

// ========================== SAFETY MEASURES ==========================

// Prevent any accidental form submissions globally
$(document).on('submit', 'form', function(e) {
    // Only log for our main forms
    if ($(this).is('#editProfileForm')) {
        console.log('Form submission intercepted:', $(this).attr('id'));
        // The specific handlers above will handle the actual submission
    }
});

// Alternative event binding using document delegation (backup)
$(document).on('submit', '#editProfileForm', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit profile form submitted via delegation (backup)');
});

// Debug function to check event handlers
function checkEventHandlers() {
    console.log('Edit Profile Form Events:', $._data($('#editProfileForm')[0], 'events'));
}