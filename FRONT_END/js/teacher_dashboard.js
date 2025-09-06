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
    formData.append("folder", "learnloop/classes"); // optional: organize uploads

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
        const existingChart = this.container.querySelector('.pie-chart');
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
        const legendContainer = this.container.parentElement.querySelector('.legend');
        if (!legendContainer) return;

        const segments = this.calculateAngles();
        const legendItems = legendContainer.querySelectorAll('.legend-item');

        legendItems.forEach((item, index) => {
            const segment = segments[index];
            if (segment) {
                const colorElement = item.querySelector('.legend-color');
                const textElement = item.querySelector('.legend-text');
                const numberElement = item.querySelector('.legend-number');

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

// Initialize when document is ready
$(document).ready(function() {
    const token = sessionStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("current User"));

    console.log("Logged User Id " + currentUser.userId);
        
    $('.teacher-name').text(currentUser.username || "Teacher");

    // Get modal elements using jQuery
    const $editProfileModal = $('#editProfileModal');
    const $editProfileBtn = $('.profile-edit-btn');
    const $closeModalBtn = $('#closeModal');
    const $cancelEditBtn = $('#cancelEdit');
    const $editProfileForm = $('#editProfileForm');
    const $profileAvatarInput = $('#profileAvatarInput');
    const $uploadProfileAvatarBtn = $('#uploadProfileAvatar');
    const $profileAvatarPreview = $('#profileAvatarPreview');
    const $body = $('body');

    // Open modal
    $editProfileBtn.on('click', function() {
        $editProfileModal.addClass('active');
        $body.css('overflow', 'hidden');
    });

    // Close modal function
    function closeModal() {
        $editProfileModal.removeClass('active');
        $body.css('overflow', 'auto');
    }

    function navigateToClasses() {
        window.location.href = '/pages/teacher_classess.html';
    }

    // Add interactivity to navigation items using jQuery
    $('.nav-menu-item').each(function() {
        $(this).on('click', function() {
            
            $('.nav-menu-item').removeClass('active');
            $(this).addClass('active');
            
            // Check if this is the Classes navigation item
            const navText = $(this).find('.nav-menu-text').text();
            if (navText === 'Classes') {
                navigateToClasses();
            }else if(navText === 'Document'){

            }else if(navText === 'LogOut'){
                sessionStorage.clear();
                localStorage.clear();

                Swal.fire({
                    title:"logout",
                    text:"successfully logout",
                    timer:1500
                }).then(() => {
                    console.log("logout successful");
                    window.location.href = '../index.html'
                })
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
        if (e.key === 'Escape' && $editProfileModal.hasClass('active')) {
            closeModal();
        }
    });

    // Profile avatar upload functionality
    $uploadProfileAvatarBtn.on('click', function() {
        $profileAvatarInput.click();
    });

    $profileAvatarInput.on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $profileAvatarPreview.html(`<img 
                src="${e.target.result}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`);
            };
            reader.readAsDataURL(file);
        }
    });

    // Form submission
    $editProfileForm.on('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: $('#teacherName').val(),
            email: $('#teacherEmail').val(),
            phone: $('#teacherPhone').val()
        };

        $('.teacher-name').text(formData.name);
        console.log('Profile updated:', formData);
        
        showToast('Profile updated successfully!', 'success');
        closeModal();
    });

    // Load initial data
    if (currentUser && currentUser.userId) {
        loadTeacherClasses(currentUser.userId);
        updateClassStatistics(currentUser.userId);
    }

    // Initialize pie chart
    setTimeout(() => {
        initializePieChart();
        startPieChartAutoRefresh();
    }, 500);
});

// CLASS CREATION MODAL FUNCTIONALITY
const $addClassModal = $('#addClassModal');
const $addClassBtn = $('.add-class-btn');
const $closeClassModalBtn = $('#closeClassModal');
const $cancelAddClassBtn = $('#cancelAddClass');
const $addClassForm = $('#addClassForm');
const $classDpInput = $('#classDpInput');
const $uploadClassDpBtn = $('#uploadClassDp');
const $classDpPreview = $('#classDpPreview');
const $toggleButtons = $('.toggle-button');
const $body = $('body');

let classType = 'private';

// Open modal
$addClassBtn.on('click', function() {
    $addClassModal.addClass('active');
    $body.css('overflow', 'hidden');
});

// Close modal function
function closeClassModal() {
    $addClassModal.removeClass('active');
    $body.css('overflow', 'auto');
    $addClassForm[0].reset();
    $classDpPreview.html('<i class="fas fa-book"></i>');
    classType = 'private';
    updateToggleButtons();
    $('#classPasscode').css('border-color', '#404449');
}

// Close modal events
$closeClassModalBtn.on('click', closeClassModal);
$cancelAddClassBtn.on('click', closeClassModal);

// Close modal when clicking outside
$addClassModal.on('click', function(e) {
    if (e.target === this) {
        closeClassModal();
    }
});

// Close modal with Escape key
$(document).on('keydown', function(e) {
    if (e.key === 'Escape' && $addClassModal.hasClass('active')) {
        closeClassModal();
    }
});

// Class image upload functionality
$uploadClassDpBtn.on('click', function() {
    $classDpInput.click();
});

$classDpInput.on('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.match('image.*')) {
            showToast('Please select an image file', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be less than 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            $classDpPreview.html(`<img src="${e.target.result}" alt="Class Image" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10%;">`);
        };
        reader.readAsDataURL(file);
    }
});

// Toggle button functionality
function updateToggleButtons() {
    $toggleButtons.each(function() {
        const buttonState = $(this).data('state');
        if (buttonState === classType) {
            $(this).addClass('on').removeClass('off');
        } else {
            $(this).addClass('off').removeClass('on');
        }
    });
}

// Initialize toggle buttons
updateToggleButtons();

// Handle toggle button clicks
$toggleButtons.on('click', function() {
    classType = $(this).data('state');
    updateToggleButtons();
});

// Function to validate passcode uniqueness
function validatePasscode(passcode, callback) {
    if (!passcode || passcode.trim() === '') {
        callback(true);
        return;
    }
    
    const token = sessionStorage.getItem("token");
    
    $.ajax({
        url: 'http://localhost:8080/api/classes/check-passcode',
        type: 'GET',
        data: { passcode: passcode },
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(response) {
            if (response.code === 200) {
                callback(response.data.isUnique);
            } else {
                callback(false);
            }
        },
        error: function() {
            callback(false);
        }
    });
}

// Add passcode validation on input
$('#classPasscode').on('blur', function() {
    const passcode = $(this).val().trim();
    if (passcode) {
        validatePasscode(passcode, function(isUnique) {
            const $passcodeInput = $('#classPasscode');
            if (!isUnique) {
                $passcodeInput.css('border-color', '#f87171');
                showToast('Passcode already exists', 'warning');
            } else {
                $passcodeInput.css('border-color', '#2eb67d');
            }
        });
    }
});

// Form submission with AJAX
$addClassForm.on('submit',async function(e) {
    e.preventDefault();

    var button = $('.btn-primary');
    button.prop('disabled', true);
    
    // Re-enable after 3 seconds
    setTimeout(function() {
        button.prop('disabled', false);
    }, 3000);
    
    const className = $('#className').val().trim();
    if (!className) {
        showToast('Class name is required', 'error');
        $('#className').focus();
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem("current User"));
    if (!currentUser || !currentUser.userId) {
        showToast('User not found. Please login again.', 'error');
        return;
    }
    
    
    // Upload image to Cloudinary first
    const imageFile = $classDpInput[0].files[0];
    let imageUrl = null;
    if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
        if (!imageUrl) {
            return; // stop if upload fails
        }
    }

    // Prepare JSON payload
    const newClass = {
        name: className,
        description: $('#classDescription').val().trim(),
        passcode: $('#classPasscode').val().trim(),
        priority: classType.toUpperCase(),
        createdBy: currentUser.userId,
        imageUrl: imageUrl // Cloudinary URL
    };
    
    const token = sessionStorage.getItem("token");
    
    const $submitBtn = $addClassForm.find('button[type="submit"]');
    const originalText = $submitBtn.text();
    $submitBtn.text('Creating...').prop('disabled', true);
    
    $.ajax({
        url: 'http://localhost:8080/api/classes/create',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newClass),
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(response) {
            if (response.code === 200) {
                showToast('Class created successfully!', 'success');
                
                const classData = response.data;
                const imageUrl = classData.imageUrl || null;

                const newClassHtml = `
                    <div class="class-item" data-class-id="${classData.classId}">
                        <div class="class-item-icon">
                            ${imageUrl ? 
                                `<img src="${imageUrl}" alt="${classData.name}" class="class-dp-image">` : 
                                `<i class="fas fa-book"></i>`
                            }
                        </div>
                        <div class="class-item-name">${classData.name}</div>
                    </div>
                `;
                
                $('.classes-grid').append(newClassHtml);
                
                $('.classes-grid .class-item:last').on('click', function() {
                    const classId = $(this).data('class-id');
                    const className = $(this).find('.class-item-name').text();
                    console.log(`Clicked on class: ${className} (ID: ${classId})`);
                });
                
                updateClassStatistics(currentUser.userId);
                closeClassModal();
                
            } else {
                showToast(response.message || 'Failed to create class', 'error');
            }
        },
        error: function(xhr, status, error) {
            let errorMessage = 'Failed to create class';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.status === 401) {
                errorMessage = 'Unauthorized. Please login again.';
            } else if (xhr.status === 403) {
                errorMessage = 'Access denied.';
            } else if (xhr.status === 0) {
                errorMessage = 'Unable to connect to server.';
            }
            
            showToast(errorMessage, 'error');
            console.error('Error creating class:', error);
        },
        complete: function() {
            $submitBtn.text(originalText).prop('disabled', false);
        }
    });
});

// Function to update class statistics
function updateClassStatistics(teacherId) {
    const token = sessionStorage.getItem("token");
    
    $.ajax({
        url: `http://localhost:8080/api/classes/statistics/${teacherId}`,
        type: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(response) {
            if (response.code === 200) {
                const stats = response.data;
                
                $('.total-classes .stat-number').text(stats.totalClasses || 0);


                $('.stat-card.stats-1 .stat-number').text(stats.totalClasses || 0);
                $('.stat-card.stats-2 .stat-number').text(stats.privateClasses || 0);
                $('.stat-card.stats-3 .stat-number').text(stats.publicClasses || 0);
                
                $('.legend-item:first .legend-number').text(stats.totalClasses || 0);
                $('.legend-item:nth-child(2) .legend-number').text(stats.privateClasses || 0);
                $('.legend-item:last .legend-number').text(stats.publicClasses || 0);
                
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
        }
    });
}

// Function to load existing classes
function loadTeacherClasses(teacherId) {
    const token = sessionStorage.getItem("token");
    
    // Show loading state
    const $classesGrid = $('.classes-grid');
    $classesGrid.html(`
        <div class="class-item loading">
            <div class="class-item-icon">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="class-item-name">Loading classes...</div>
        </div>
    `);

    $.ajax({
        url: `http://localhost:8080/api/classes/teacher/${teacherId}`,
        type: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        success: function(response) {
            if (response.code === 200) {

                console.log(response);

                const classes = response.data;
                const $classesGrid = $('.classes-grid');
                
                $classesGrid.empty();
                
                if (classes.length === 0) {
                    $classesGrid.html(`G
                        <div class="class-item" style="grid-column: 1 / -1;">
                            <div class="class-item-icon">
                                <i class="fas fa-book"></i>
                            </div>
                            <div class="class-item-name">No classes found. Create your first class!</div>
                        </div>
                    `);
                    return;
                }

                classes.forEach(function(classData) {
                    const imageUrl = classData.imageUrl || null;

                    
                    const classHtml = `
                        <div class="class-item" data-class-id="${classData.classId}">
                            <div class="class-item-icon">
                                ${imageUrl ? 
                                    `<img src="${imageUrl}" alt="${classData.name}" class="class-dp-image">` : 
                                    `<i class="fas fa-book"></i>`
                                }
                            </div>
                            <div class="class-item-name">${classData.name}</div>
                        </div>
                    `;
                    
                    $classesGrid.append(classHtml);
                });
                
                $('.class-item').on('click', function() {
                    const classId = $(this).data('class-id');
                    const className = $(this).find('.class-item-name').text();
                    console.log(`Clicked on class: ${className} (ID: ${classId})`);
                });
            } else {
                showToast('Failed to load classes', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading classes:', error);
            showToast('Failed to load classes', 'error');
        }
    });
}

// PIE CHART FUNCTIONS
function initializePieChart() {
    const pieChartContainer = document.querySelector('.distribution-inner');
    if (!pieChartContainer) {
        console.error('Pie chart container not found');
        return;
    }

    pieChart = new FlexiblePieChart('.distribution-inner', {
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
        pieChart.updateData([5, 3, 2]);
        return;
    }

    const token = sessionStorage.getItem("token");
    
    $.ajax({
        url: `http://localhost:8080/api/classes/statistics/${currentUser.userId}`,
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