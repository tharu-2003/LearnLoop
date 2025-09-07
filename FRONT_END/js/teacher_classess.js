        $(document).ready(function() {
            let currentClass = null;
            let allCards = [];
            let currentVisibility = 'public';

            // Store all cards for search functionality
            allCards = $('.class-card').toArray();
            
            // Search input event listener
            const $searchInput = $('#searchInput');
            const $clearButton = $('#clearSearch');
            const $searchResults = $('#searchResults');
            const $noResults = $('#noResults');
            const $cardsGrid = $('#cardsGrid');
            
            $searchInput.on('input', handleSearch);
            $searchInput.on('keyup', function(e) {
                if (e.key === 'Escape') {
                    clearSearch();
                }
            });

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

            function handleSearch() {
                const searchTerm = $searchInput.val().toLowerCase().trim();
                
                // Show/hide clear button
                if (searchTerm.length > 0) {
                    $clearButton.show();
                } else {
                    $clearButton.hide();
                }
                
                if (searchTerm === '') {
                    // Show all cards
                    showAllCards();
                    $searchResults.hide();
                    $noResults.hide();
                    return;
                }
                
                // Filter cards based on search term
                const filteredCards = allCards.filter(card => {
                    const className = $(card).find('.class-name').text().toLowerCase();
                    return className.includes(searchTerm);
                });
                
                // Clear grid and show filtered results
                $cardsGrid.empty();
                
                if (filteredCards.length === 0) {
                    // No results found
                    $searchResults.hide();
                    $noResults.show();
                } else {
                    // Show filtered results
                    filteredCards.forEach(card => {
                        $cardsGrid.append($(card).clone());
                    });
                    
                    // Re-attach event listeners to cloned cards
                    attachCardEventListeners();
                    
                    // Show search results info
                    $searchResults.text(`Found ${filteredCards.length} class${filteredCards.length !== 1 ? 'es' : ''} for "${$searchInput.val()}"`);
                    $searchResults.show();
                    $noResults.hide();
                }
            }

            function showAllCards() {
                // Clear grid and show all cards
                $cardsGrid.empty();
                allCards.forEach(card => {
                    $cardsGrid.append($(card).clone());
                });
                
                // Re-attach event listeners
                attachCardEventListeners();
                
                $searchResults.hide();
                $noResults.hide();
            }

            function attachCardEventListeners() {
                // Add click functionality to cards
                $('.class-card').on('click', function(e) {
                    // Don't trigger if clicking the settings icon
                    if ($(e.target).hasClass('settings-icon') || $(e.target).closest('.settings-icon').length) {
                        return;
                    }
                    
                    // Add a subtle animation to show interaction
                    $(this).css('transform', 'scale(0.98)');
                    setTimeout(() => {
                        $(this).css('transform', 'translateY(-4px)');
                    }, 100);
                });
            }

            // Initialize event listeners on page load
            attachCardEventListeners();

            // Settings modal functionality
            const $settingsModal = $('#settingsModal');
            const $editClassModal = $('#editClassModal');
            const $modalTitle = $('#settingsModalTitle');
            
            // Settings actions
            $('.settings-item').on('click', function() {
                const action = $(this).data('action') || $(this).attr('onclick').match(/'([^']+)'/)[1];
                handleSettingsAction(action);
            });

            function handleSettingsAction(action) {
                console.log(`Action: ${action} for class: ${currentClass}`);
                
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
                    visibility: currentVisibility
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

            // Add hover effects using jQuery
            $('.class-card').hover(
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

            // Add animation to cards on page load
            $('.class-card').each(function(index) {
                $(this).delay(100 * index).fadeTo(500, 1);
            }).css('opacity', 0);

            // Clear search functionality
            function clearSearchFunction() {
                $('#searchInput').val('');
                $('#clearSearch').hide();
                $('#searchInput').focus();
                showAllCards();
            }

            $('#clearSearch').on('click', clearSearchFunction);

            // Global functions for onclick handlers
            window.openSettingsModal = function(event, className) {
                event.stopPropagation();
                
                currentClass = className;
                
                $('#settingsModalTitle').text(`${className} Settings`);
                $('#settingsModal').addClass('active');
            };

            window.closeModal = function() {
                $('#settingsModal').removeClass('active');
                currentClass = null;
            };

            window.closeEditModal = function() {
                $('#editClassModal').removeClass('active');
            };

            window.handleSettingsAction = function(action) {
                handleSettingsAction(action);
            };

            window.clearSearch = function() {
                clearSearchFunction();
            };
        });