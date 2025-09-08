const CLOUD_NAME = "dodxgayab"; // your Cloudinary cloud name
const UPLOAD_PRESET = "learnloop_unsigned"; // your unsigned preset

// Toast functionality variables
let toastCount = 0;
const activeToasts = new Set();

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
        showToast("Image upload failed!", "error");
        return null;
    }
}

$(document).ready(function() {

    const currentUser = JSON.parse(localStorage.getItem("current User"));
    console.log("User : " + currentUser.userId);

    const userName = currentUser.username;
    const firstChar = userName.substring(0, 1);
    $('.user-avatar-nav').text(firstChar);

    // Search elements
    const $searchInput = $('#searchInput');
    const $clearButton = $('#clearSearch');
    const $searchResults = $('#searchResults');
    const $noResults = $('#noResults');
    const $cardsGrid = $('#cardsGrid');

    // Load initial data
    if (currentUser && currentUser.userId) {
        loadTeacherClasses(currentUser.userId);
    }

    function loadTeacherClasses(teacherId) {
        const token = sessionStorage.getItem("token");
        
        // Show loading state
        const cardsGrid = document.getElementById('cardsGrid');
        cardsGrid.innerHTML = `
            <div class="class-card loading">
                <div class="card-image placeholder">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="card-content">
                    <h3 class="class-name">Loading classes...</h3>
                    <div class="student-count">
                        <i class="fas fa-users"></i>
                        <span>Please wait...</span>
                    </div>
                </div>
            </div>
        `;

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
                    const cardsGrid = document.getElementById('cardsGrid');
                    
                    cardsGrid.innerHTML = '';
                    
                    if (classes.length === 0) {
                        cardsGrid.innerHTML = `
                            <div class="class-card" style="grid-column: 1 / -1; text-align: center;">
                                <div class="card-image placeholder">
                                    📚
                                </div>
                                <div class="card-content">
                                    <h3 class="class-name">No classes found</h3>
                                    <div class="student-count">
                                        <i class="fas fa-plus"></i>
                                        <span>Create your first class!</span>
                                    </div>
                                </div>
                            </div>
                        `;
                        return;
                    }

                    classes.forEach(function(classData) {
                        const imageUrl = classData.imageUrl || null;
                        const studentCount = classData.studentCount || 0;
                        const isPublic = classData.priority === 'PUBLIC';
                        const statusBadge = isPublic ? 'status-public' : 'status-private';
                        const statusText = isPublic ? 'Public' : 'Private';
                        
                        const classCardHtml = `
                            <div class="class-card" data-class-id="${classData.classId}">
                                <div class="card-image">
                                    ${imageUrl ? 
                                        `<img src="${imageUrl}" alt="${classData.name}" onerror="this.parentElement.classList.add('placeholder'); this.parentElement.innerHTML='📚';">` :
                                        `<div class="placeholder">📚</div>`
                                    }
                                    <span class="status-badge ${statusBadge}">${statusText}</span>
                                    <div class="settings-icon">
                                        <i class="fas fa-cog"></i>
                                    </div>
                                </div>
                                <div class="card-content">
                                    <h3 class="class-name">${classData.name}</h3>
                                    <div class="student-count">
                                        <i class="fas fa-users"></i>
                                        <span>${studentCount.toLocaleString()} students</span>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        cardsGrid.insertAdjacentHTML('beforeend', classCardHtml);
                    });

                    // IMPORTANT: Initialize all event listeners AFTER classes are loaded
                    initializeSearch();
                    initializeHoverEffects();
                    attachCardEventListeners();
                    attachSettingsEventListeners();

                } else {
                    showToast('Failed to load classes', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading classes:', error);
                showToast('Failed to load classes', 'error');
                
                // Show error state
                const cardsGrid = document.getElementById('cardsGrid');
                cardsGrid.innerHTML = `
                    <div class="class-card" style="grid-column: 1 / -1; text-align: center;">
                        <div class="card-image placeholder">
                            ❌
                        </div>
                        <div class="card-content">
                            <h3 class="class-name">Error loading classes</h3>
                            <div class="student-count">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>Please try again later</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    }

    // Initialize search functionality - called AFTER classes are loaded
    function initializeSearch() {
        console.log('Initializing search functionality...');
        
        // Remove any existing event handlers first
        $searchInput.off('input keyup paste');
        $clearButton.off('click');
        
        // Real-time search - immediate response
        $searchInput.on('input', function() {
            console.log('Search input changed:', $(this).val());
            performSearch();
        });
        
        $searchInput.on('keyup', function(e) {
            if (e.key === 'Escape') {
                clearSearch();
            } else {
                performSearch();
            }
        });
        
        $searchInput.on('paste', function() {
            setTimeout(performSearch, 10); // Small delay for paste to complete
        });
        
        $clearButton.on('click', clearSearch);
        
        console.log('Search initialization complete');
    }

    // Perform the actual search
    function performSearch() {
        const searchTerm = $searchInput.val().toLowerCase().trim();
        console.log('Performing search for:', searchTerm);
        
        // Show/hide clear button
        if (searchTerm.length > 0) {
            $clearButton.show();
        } else {
            $clearButton.hide();
        }
        
        // Get all class cards (excluding loading and error cards)
        const $allCards = $('.class-card').not('.loading');
        let visibleCount = 0;
        
        if (searchTerm === '') {
            // Show all cards when search is empty
            $allCards.show();
            $searchResults.hide();
            $noResults.hide();
            console.log('Search cleared - showing all cards');
            return;
        }
        
        // Filter and show/hide cards based on search term
        $allCards.each(function() {
            const $card = $(this);
            const className = $card.find('.class-name').text().toLowerCase();
            
            if (className.includes(searchTerm)) {
                $card.show();
                visibleCount++;
                console.log('Showing card:', className);
            } else {
                $card.hide();
                console.log('Hiding card:', className);
            }
        });

        // Update search results display
        if (visibleCount === 0) {
            // No results found
            $searchResults.hide();
            $noResults.show();
            console.log('No results found');
        } else {
            // Show search results info
            $searchResults.text(`Found ${visibleCount} class${visibleCount !== 1 ? 'es' : ''} for "${searchTerm}"`);
            $searchResults.show();
            $noResults.hide();
            console.log(`Found ${visibleCount} results`);
        }
    }

    // Clear search function
    function clearSearch() {
        console.log('Clearing search');
        $searchInput.val('');
        $clearButton.hide();
        $searchInput.focus();
        
        // Show all cards
        $('.class-card').not('.loading').show();
        $searchResults.hide();
        $noResults.hide();
    }

    let currentClass = null;
    let currentClassId = null;
    let currentVisibility = 'public';

    // Navigation menu functionality
    initializeNavigation();

    function initializeNavigation() {
        const $navItems = $('.nav-menu-item');
        
        $navItems.on('click', function() {
            // Remove active class from all items
            $navItems.removeClass('active');
            
            // Add active class to clicked item
            $(this).addClass('active');
            
            // Get the navigation text
            const navText = $(this).find('.nav-menu-text').text();
            if (navText === 'Dashboard') {
                navigateToDashboard();
            } else if(navText === 'Document'){
                // Handle document navigation
            }else if(navText === 'LogOut'){
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
            console.log(`Navigated to: ${navText}`);
        });
    }

    // Navigation functionality
    function navigateToDashboard() {
        window.location.href = '/pages/teacher_dashboard.html';
    }

    function attachCardEventListeners() {
        // Add click functionality to cards
        $('.class-card').off('click').on('click', function(e) {
            // Don't trigger if clicking the settings icon
            if ($(e.target).hasClass('settings-icon') || $(e.target).closest('.settings-icon').length) {
                return;
            }
            
            const classId = $(this).data('class-id');
            const className = $(this).find('.class-name').text();
            console.log(`Clicked on class: ${className} (ID: ${classId})`);

            // Local Storage id
            localStorage.setItem("classId", `${classId}`);
            const localStorageclassId = localStorage.getItem("classId");
            console.log("Class ID saved to localStorage:", localStorageclassId);
            window.location.href = '/pages/teacher_message_section.html';

            // Add a subtle animation to show interaction
            $(this).css('transform', 'scale(0.98)');
            setTimeout(() => {
                $(this).css('transform', 'translateY(-4px)');
            }, 100);
        });
    }

    // Attach settings event listeners using event delegation
    function attachSettingsEventListeners() {
        console.log('Attaching settings event listeners...');
        
        // Remove any existing event handlers first
        $(document).off('click', '.settings-icon');
        
        // Use event delegation for settings icon clicks
        $(document).on('click', '.settings-icon', function(event) {
            event.stopPropagation();
            
            const $card = $(this).closest('.class-card');
            const classId = $card.data('class-id');
            const className = $card.find('.class-name').text();
            
            console.log(`Settings clicked for class: ${className} (ID: ${classId})`);
            
            // Save class ID to localStorage
            if (classId) {
                localStorage.setItem("classId", classId);
                console.log(`Class ID ${classId} saved to localStorage`);
            }
            
            // Set current class data
            currentClass = className;
            currentClassId = classId;
            
            // Open settings modal
            $('#settingsModalTitle').text(`${className} Settings`);
            $('#settingsModal').addClass('active');
        });
        
        console.log('Settings event listeners attached successfully');
    }

    function initializeHoverEffects() {
        // Remove existing hover handlers and add new ones
        $('.class-card').off('mouseenter mouseleave').hover(
            function() {
                $(this).css({
                    'transform': 'translateY(-4px)',
                    'box-shadow': '0 8px 25px rgba(0, 0, 0, 0.3)',
                    'border-color': '#3ea6ff'
                });
            },
            function() {
                if (!$(this).is(':active')) {
                    $(this).css({
                        'transform': '',
                        'box-shadow': '',
                        'border-color': 'transparent'
                    });
                }
            }
        );
    }

    // Settings modal functionality
    const $classDpInput = $('#classDpInput');
    const $settingsModal = $('#settingsModal');
    const $editClassModal = $('#editClassModal');

    // Handle edit form submission - FIXED VERSION
    $('#editClassForm').on('submit', async function(e) {
        e.preventDefault();
        
        const classId = localStorage.getItem("classId");
        
        if (!classId) {
            showToast('Error: Class ID not found', 'error');
            return;
        }
        
        // Get the current user for createdBy field
        const currentUser = JSON.parse(localStorage.getItem("current User"));
        
        // Handle image upload first if there's a new image
        let uploadedImageUrl = null;
        const imageFile = $classDpInput[0].files[0];
        if (imageFile) {
            showToast('Uploading image...', 'info');
            uploadedImageUrl = await uploadImageToCloudinary(imageFile);
            if (!uploadedImageUrl) {
                return; // Stop if upload fails
            }
        }
        
        // Prepare form data according to CreateClassDTO structure
        const formData = {
            name: $('#className').val().trim(),
            description: $('#classDescription').val().trim(),
            passcode: $('#classPasscode').val().trim() || null,
            priority: currentVisibility.toUpperCase(), // Convert to uppercase to match Priority enum
            createdBy: currentUser.userId, // Required field from DTO
            imageUrl: uploadedImageUrl // Will be null if no new image was uploaded
        };
        
        console.log('Updating class data:', formData);
        
        // Validate required fields
        if (!formData.name) {
            showToast('Class name is required', 'error');
            $('#className').focus();
            return;
        }
        
        const token = sessionStorage.getItem("token");
        
        if (!token) {
            showToast('Authentication token not found. Please login again.', 'error');
            return;
        }
        
        // Show loading state
        showToast('Updating class...', 'info');
        
        // Disable form elements during submission
        $('#editClassForm input, #editClassForm textarea, #editClassForm button').prop('disabled', true);
        
        $.ajax({
            url: `http://localhost:8080/api/classes/${classId}`,
            type: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Update response:', response);
                
                if (response.code === 200 && response.data) {
                    const updatedClass = response.data;
                    
                    showToast(`Class "${updatedClass.name}" has been updated successfully!`, 'success');
                    
                    // Update the class card in the UI
                    const $classCard = $(`.class-card[data-class-id="${classId}"]`);
                    if ($classCard.length) {
                        // Update class name
                        $classCard.find('.class-name').text(updatedClass.name);
                        
                        // Update priority badge
                        const isPublic = updatedClass.priority === 'PUBLIC';
                        const $statusBadge = $classCard.find('.status-badge');
                        $statusBadge.removeClass('status-public status-private');
                        $statusBadge.addClass(isPublic ? 'status-public' : 'status-private');
                        $statusBadge.text(isPublic ? 'Public' : 'Private');
                        
                        // Update image if provided
                        if (updatedClass.imageUrl) {
                            const $cardImage = $classCard.find('.card-image');
                            $cardImage.html(`
                                <img src="${updatedClass.imageUrl}" alt="${updatedClass.name}" 
                                    onerror="this.parentElement.classList.add('placeholder'); this.parentElement.innerHTML='📚';">
                                <span class="status-badge ${isPublic ? 'status-public' : 'status-private'}">${isPublic ? 'Public' : 'Private'}</span>
                                <div class="settings-icon">
                                    <i class="fas fa-cog"></i>
                                </div>
                            `);
                        }
                    }
                    
                    // Update global variables
                    currentClass = updatedClass.name;
                    
                    // Close the modal
                    setTimeout(() => {
                        closeEditModal();
                    }, 1000);
                    
                    // Re-initialize event listeners for updated elements
                    attachCardEventListeners();
                    attachSettingsEventListeners();
                } else {
                    showToast(response.message || 'Failed to update class. Please try again.', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error updating class:', {
                    status: status,
                    error: error,
                    response: xhr.responseText,
                    classId: classId
                });
                
                let errorMessage = 'Failed to update class. Please try again.';
                
                // Handle specific HTTP status codes
                if (xhr.status === 400) {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        errorMessage = errorResponse.message || 'Invalid data provided. Please check your input.';
                    } catch (e) {
                        errorMessage = 'Invalid data provided. Please check your input.';
                    }
                } else if (xhr.status === 401) {
                    errorMessage = 'Authentication failed. Please login again.';
                } else if (xhr.status === 403) {
                    errorMessage = 'You do not have permission to update this class.';
                } else if (xhr.status === 404) {
                    errorMessage = 'Class not found. It may have been deleted.';
                } else if (xhr.status === 500) {
                    errorMessage = 'Server error occurred. Please try again later.';
                }
                
                showToast(errorMessage, 'error');
            },
            complete: function() {
                // Re-enable form elements
                $('#editClassForm input, #editClassForm textarea, #editClassForm button').prop('disabled', false);
            }
        });
    });
        
    // Settings actions
    $('.settings-item').on('click', function() {
        const action = $(this).data('action') || $(this).attr('onclick')?.match(/'([^']+)'/)?.[1];
        if (action) {
            handleSettingsAction(action);
        }
    });

    function handleSettingsAction(action) {
        // console.log(`Action: ${action} for class: ${currentClass} (ID: ${currentClassId})`);

        
        // Handle different settings actions
        switch(action) {
            case 'edit':
                // Close settings modal and open edit modal
                closeModal();
                openEditModal();
                break;
            case 'delete':
                // Use SweetAlert2 for beautiful confirmation dialog
                Swal.fire({
                    title: 'Are you absolutely sure?',
                    text: 'This action cannot be undone!',
                    icon: 'warning',
                    showCancelButton: true,
                    buttonsStyling: false,
                    confirmButtonText: '<i class="fa fa-trash-alt"></i> Delete',
                    cancelButtonText: '<i class="fa fa-times"></i> Cancel',
                    customClass: {
                        popup: 'my-popup-custom-class',
                        confirmButton: 'btn btn-danger btn-lg',
                        cancelButton: 'btn btn-secondary btn-lg'
                    },
                    showClass: {
                        popup: 'animate__animated animate__tada'
                    },
                    hideClass: {
                        popup: 'animate__animated animate__fadeOutDown'
                    },
                    reverseButtons: true,
                    focusConfirm: false
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Perform the delete action here
                        deleteClass();
                        
                        // Show success message
                        // Swal.fire({
                        //     title: 'Deleted!',
                        //     text: `${currentClass} has been deleted successfully.`,
                        //     icon: 'success',
                        //     timer: 2000,
                        //     showConfirmButton: false,
                        //     toast: true,
                        //     position: 'top-end',
                        //     customClass: {
                        //         popup: 'animated fadeInRight'
                        //     }
                        // });
                        
                        // Alternative: Use your existing toast function
                        showToast(`Class has been deleted successfully.`, 'success');
                    }
                });
                break;
        }
        
        if (action !== 'edit') {
            closeModal();
        }
    }

    function deleteClass() {
        const currentClassId = localStorage.getItem("classId");
        
        if (!currentClassId) {
            showToast('Error: Class ID not found', 'error');
            return;
        }
        
        const token = sessionStorage.getItem("token");
        
        if (!token) {
            showToast('Authentication token not found. Please login again.', 'error');
            return;
        }
        
        // Show loading state
        showToast('Deleting class...', 'info');
        
        $.ajax({
            url: `http://localhost:8080/api/classes/${currentClassId}`,
            type: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            success: function(response) {
                console.log('Delete response:', response);
                
                if (response.code === 200) {
                    // Remove the class card from the UI
                    const $classCard = $(`.class-card[data-class-id="${currentClassId}"]`);
                    if ($classCard.length) {
                        // Add fade-out animation
                        $classCard.css({
                            'animation': 'fadeOut 0.5s ease-out forwards',
                            'pointer-events': 'none'
                        });
                        
                        // Remove the card after animation
                        setTimeout(() => {
                            $classCard.remove();
                            
                            // Check if any cards are left
                            const remainingCards = $('.class-card').not('.loading').length;
                            if (remainingCards === 0) {
                                // Show "no classes" message
                                const cardsGrid = document.getElementById('cardsGrid');
                                cardsGrid.innerHTML = `
                                    <div class="class-card" style="grid-column: 1 / -1; text-align: center;">
                                        <div class="card-image placeholder">
                                            📚
                                        </div>
                                        <div class="card-content">
                                            <h3 class="class-name">No classes found</h3>
                                            <div class="student-count">
                                                <i class="fas fa-plus"></i>
                                                <span>Create your first class!</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }
                        }, 500);
                    }
                    
                    // Clear the stored class ID
                    localStorage.removeItem("classId");
                    
                    // Reset current class variables
                    currentClass = null;
                    currentClassId = null;
                    
                    // Close any open modals
                    closeModal();
                    
                    console.log(`Class ${currentClassId} deleted successfully`);
                    
                } else {
                    showToast(response.message || 'Failed to delete class. Please try again.', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error deleting class:', {
                    status: status,
                    error: error,
                    response: xhr.responseText,
                    classId: currentClassId
                });
                
                let errorMessage = 'Failed to delete class. Please try again.';
                
                // Handle specific HTTP status codes
                if (xhr.status === 400) {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        errorMessage = errorResponse.message || 'Invalid request. Cannot delete this class.';
                    } catch (e) {
                        errorMessage = 'Invalid request. Cannot delete this class.';
                    }
                } else if (xhr.status === 401) {
                    errorMessage = 'Authentication failed. Please login again.';
                } else if (xhr.status === 403) {
                    errorMessage = 'You do not have permission to delete this class.';
                } else if (xhr.status === 404) {
                    errorMessage = 'Class not found. It may have already been deleted.';
                } else if (xhr.status === 500) {
                    errorMessage = 'Server error occurred. Please try again later.';
                }
                
                showToast(errorMessage, 'error');
            }
        });
    }
        

    function openEditModal() {
        const classId = localStorage.getItem("classId");

        const token = sessionStorage.getItem("token");
        $.ajax({
            url: `http://localhost:8080/api/classes/${classId}`,
            type: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            success: function(response) {
                console.log('Class details response:', response);
                
                if (response.code === 200 && response.data) {
                    const classData = response.data;
                    
                    // Update modal title with class name
                    $('#editModalTitle').text(`Edit ${classData.name}`);
                    
                    // Populate form fields
                    $('#className').val(classData.name || '');
                    $('#classDescription').val(classData.description || '');
                    $('#classPasscode').val(classData.passcode || '');
                    
                    // Set visibility toggle based on priority
                    if (classData.priority) {
                        const isPublic = classData.priority.toLowerCase() === 'public';
                        setToggleState(isPublic ? 'public' : 'private');
                    }
                    
                    // Handle class image if available
                    if (classData.imageUrl) {
                        $('#classDpPreview').html(`<img src="${classData.imageUrl}" alt="Class Avatar">`);
                    } else {
                        $('#classDpPreview').html('<i class="fas fa-book"></i>');
                    }
                    
                    // Enable form elements
                    $('#editClassForm input, #editClassForm textarea, #editClassForm button').prop('disabled', false);
                    
                    console.log('Form populated with class data:', classData);
                    
                    // Show the edit modal
                    $editClassModal.addClass('active');
                    
                } else {
                    console.error('Invalid response format:', response);
                    showToast('Failed to load class details', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error fetching class details:', {
                    status: status,
                    error: error,
                    response: xhr.responseText
                });
                
                let errorMessage = 'Failed to load class details';
                
                if (xhr.status === 404) {
                    errorMessage = 'Class not found';
                } else if (xhr.status === 403) {
                    errorMessage = 'Access denied';
                } else if (xhr.status === 401) {
                    errorMessage = 'Authentication required';
                }
                
                showToast(errorMessage, 'error');
            }
        });
    }

    function setToggleState(state) {
        const $container = $('#toggleContainer');
        const $buttons = $('.toggle-button');
        
        // Remove active class from all buttons
        $buttons.removeClass('active');
        
        // Set active state based on the parameter
        if (state === 'private') {
            $buttons.filter('[data-state="private"]').addClass('active');
            $container.addClass('private-active');
            currentVisibility = 'private';
        } else {
            $buttons.filter('[data-state="public"]').addClass('active');
            $container.removeClass('private-active');
            currentVisibility = 'public';
        }
        
        console.log('Toggle state set to:', state);
    }

    // Toggle functionality for visibility
    $('.toggle-button').on('click', function(e) {
        e.preventDefault();
        
        const state = $(this).data('state');
        const $container = $('#toggleContainer');
        const $buttons = $('.toggle-button');
        
        // Update active states
        $buttons.removeClass('active');
        $(this).addClass('active');
        
        // Update container state
        if (state === 'private') {
            $container.addClass('private-active');
        } else {
            $container.removeClass('private-active');
        }
        
        currentVisibility = state;
        console.log('Visibility changed to:', state);
    });

    function resetToggle() {
        const $container = $('#toggleContainer');
        const $buttons = $('.toggle-button');
        
        $buttons.removeClass('active');
        $buttons.filter('[data-state="public"]').addClass('active');
        $container.removeClass('private-active');
        currentVisibility = 'public';
    }

    // Avatar upload functionality
    $('#uploadClassDp').on('click', function() {
        $('#classDpInput').click();
    });

    $('#classDpInput').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#classDpPreview').html(`<img src="${e.target.result}" alt="Class Avatar">`);
            };
            reader.readAsDataURL(file);
        }
    });

    // Close modal events
    $('.close-btn').on('click', function() {
        if ($(this).closest('#editClassModal').length) {
            closeEditModal();
        } else {
            closeModal();
        }
    });
    
    // Close modal when clicking outside
    $settingsModal.on('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    $editClassModal.on('click', function(e) {
        if (e.target === this) {
            closeEditModal();
        }
    });

    // Keyboard navigation support
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            if ($editClassModal.hasClass('active')) {
                closeEditModal();
            } else if ($settingsModal.hasClass('active')) {
                closeModal();
            }
        }
    });

    // Global functions for backward compatibility
    window.openSettingsModal = function(event, className, classId) {
        event.stopPropagation();
        
        console.log(`Settings opened for class: ${className} (ID: ${classId})`);
        
        // Save class ID to localStorage
        if (classId) {
            localStorage.setItem("classId", classId);
            console.log(`Class ID ${classId} saved to localStorage`);
        }
        
        currentClass = className;
        currentClassId = classId;
        
        $('#settingsModalTitle').text(`${className} Settings`);
        $('#settingsModal').addClass('active');
    };

    window.closeModal = function() {
        $('#settingsModal').removeClass('active');
        currentClass = null;
        currentClassId = null;
    };

    window.closeEditModal = function() {
        $('#editClassModal').removeClass('active');
    };

    window.handleSettingsAction = function(action) {
        handleSettingsAction(action);
    };

    window.clearSearch = function() {
        clearSearch();
    };
});

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