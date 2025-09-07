$(document).ready(function() {

    const currentUser = JSON.parse(localStorage.getItem("current User"));
    console.log("User : "+ currentUser.userId);

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
        // updateClassStatistics(currentUser.userId);
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
            } else if(navText === 'LogOut'){
                sessionStorage.clear();
                localStorage.clear();

                Swal.fire({
                    title:"Logout",
                    text:"Successfully logged out",
                    timer:1500
                }).then(() => {
                    console.log("logout successful");
                    window.location.href = '../index.html'
                })
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

    // NEW: Attach settings event listeners using event delegation
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
    const $settingsModal = $('#settingsModal');
    const $editClassModal = $('#editClassModal');
    const $modalTitle = $('#settingsModalTitle');
    
    // Settings actions
    $('.settings-item').on('click', function() {
        const action = $(this).data('action') || $(this).attr('onclick')?.match(/'([^']+)'/)?.[1];
        if (action) {
            handleSettingsAction(action);
        }
    });

    function handleSettingsAction(action) {
        console.log(`Action: ${action} for class: ${currentClass} (ID: ${currentClassId})`);
        
        // Handle different settings actions
        switch(action) {
            case 'edit':
                // Close settings modal and open edit modal
                closeModal();
                openEditModal();
                break;
            case 'delete':
                if(confirm(`Are you sure you want to delete: ${currentClass}? This action cannot be undone.`)) {
                    Swal.fire({
                        title: 'Deleted!',
                        text: `${currentClass} has been deleted successfully.`,
                        icon: 'success',
                        timer: 2000
                    });
                }
                break;
        }
        
        if (action !== 'edit') {
            closeModal();
        }
    }

    function openEditModal() {
        // Pre-fill the form with current class data
        $('#className').val(currentClass || '');
        $('#classDescription').val('This is a sample description for the class.');
        $('#classPasscode').val('');
        
        // Reset toggle to public
        resetToggle();
        
        // Show the edit modal
        $editClassModal.addClass('active');
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

    // Handle edit form submission
    $('#editClassForm').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            className: $('#className').val(),
            description: $('#classDescription').val(),
            passcode: $('#classPasscode').val(),
            visibility: currentVisibility,
            classId: currentClassId
        };
        
        console.log('Saving class data:', formData);
        
        Swal.fire({
            title: 'Success!',
            text: `Class "${formData.className}" has been updated successfully!`,
            icon: 'success',
            timer: 2000
        });
        
        // Update the class name in the UI if changed
        if (formData.className !== currentClass) {
            // Find and update the class card
            $('.class-card').each(function() {
                const $card = $(this);
                if ($card.find('.class-name').text() === currentClass) {
                    $card.find('.class-name').text(formData.className);
                    currentClass = formData.className;
                }
            });
        }
        
        closeEditModal();
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

    // Global functions for backward compatibility (if needed elsewhere)
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

    // Helper function for toast notifications (if not already defined)
    window.showToast = function(message, type = 'info') {
        console.log(`Toast: ${message} (${type})`);
        // You can implement actual toast notifications here
        // For now, just using console.log
    };
});