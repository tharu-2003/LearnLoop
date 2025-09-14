$(document).ready(function() {

    const token = sessionStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("current User"));
    const classId = localStorage.getItem("classId");
    
    loadClassDetails(classId);
    loadUsers();

    $('.user-avatar-nav').text(currentUser.username[0]);

    // Cache frequently used elements
    const $navMenuItems = $('.nav-menu-item');
    const $messageInput = $('#messageInput');
    const $sendBtn = $('#sendBtn');
    const $searchInput = $('#searchInput');
    const $membersHeader = $('#membersHeader');
    const $membersList = $('#membersList');
    const $chatTitle = $('.chat-title');
    const $welcomeName = $('.welcome-name');
    const $toolbarBtns = $('.toolbar-btn');
    const $toolBtns = $('.tool-btn');
    const $discussionsContent = $('#discussionsContent');
    const $assignmentContent = $('#assignmentContent');
    
    // Assignment modal elements
    const $createAssignmentModal = $('#createAssignmentModal');
    const $addAssignmentBtn = $('#addAssignmentBtn');
    const $closeCreateModal = $('#closeCreateModal');
    const $createAssignmentForm = $('#createAssignmentForm');
    
    // Track active formatting states
    let activeFormats = new Set();
    let selectedAssignmentFiles = [];
    let selectedSubmissionFiles = [];
    let isNavClickProcessing = false; // Add flag to prevent recursion
    
    // FIXED: Handle nav item clicks (Discussions vs Assignment) - Added recursion prevention
    $('.nav-item').off('click').on('click', function() {
        // Prevent recursion
        if (isNavClickProcessing) return;
        isNavClickProcessing = true;
        
        // Remove active class from all nav items
        $('.nav-item').removeClass('active');
        // Remove active class from all member items
        $('.section-item').removeClass('active');
        // Add active class to clicked item
        $(this).addClass('active');
        
        const section = $(this).data('section');
        
        if (section === 'discussions') {
            // Show discussions content, hide assignment content
            $discussionsContent.css('display', 'flex');
            $assignmentContent.hide();
            $chatTitle.text('IJSE Group');
            
            // Update message input for group discussion
            updateMessageInput('group', 'Message #general');
            updateContextIndicator('group');
            showMessageInput();
            
            // Update welcome message for discussions
            $welcomeName.text('IJSE Group');
            $('.welcome-message').html(`
                This is the beginning of the <span class="mention">#general</span> channel for IJSE Internet Technologies B72.
            `);
            
        } else if (section === 'assignment') {
            // Show assignment content, hide discussions content
            $discussionsContent.hide();
            $assignmentContent.css('display', 'flex');
            $chatTitle.text('Assignments');

            const classId = localStorage.getItem("classId");
            loadClassDetails(classId);
            
            // Hide message input for assignments view
            hideMessageInput();
        }
        
        // Reset flag after processing
        setTimeout(() => {
            isNavClickProcessing = false;
        }, 100);
    });

    function loadClassDetails(classId) {
        $.ajax({
            url: `http://localhost:8080/api/classes/${classId}`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function (response) {
                if (response && response.data) {
                    const classData = response.data;

                    $('.workspace-title').text(classData.name || 'Unnamed Class');
                    $('.for-class-name').text(classData.name || 'Unnamed Class');
                    $('.chat-title').text(classData.name || 'Unnamed Class');
                    $('.welcome-name').text(classData.name || 'Unnamed Class');
                    $('.mention').text(classData.createdByName || 'Unnamed Teacher');

                    const avatarDiv = $('.chat-avatar');
                    const welcomeAvatarDiv = $('.welcome-avatar');
                    avatarDiv.empty();
                    welcomeAvatarDiv.empty();

                    avatarDiv.append(`<img src="${classData.imageUrl}" alt="${classData.name}" class="class-avatar-img" style="border-radius:20%;width:100%;height:100%;object-fit:cover;">`);
                    welcomeAvatarDiv.append(`<img src="${classData.imageUrl}" alt="${classData.name}" class="class-avatar-img" style="border-radius:10%;width:100%;height:100%;object-fit:cover;">`);
                
                }
            },
            error: function (xhr, status, error) {
                console.error('Failed to fetch class details:', error);
            }
        });
    }

    function loadUsers() {
        $.ajax({
            url: `http://localhost:8080/api/classes/${classId}/users`,
            method: 'GET',
            dataType: 'json',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function (response) {
                if (response && response.data) {
                    const users = response.data;
                    let html = '';

                    users.forEach(user => {
                        if (user.userId === currentUser.userId) {
                            return; // skip current logged-in user
                        }

                        const initial = user.username ? user.username.charAt(0).toUpperCase() : '?';
                        const colors = ['#2eb67d', '#36c5f0', '#e01e5a', '#f2c744', '#b6502e'];
                        const color = colors[user.userId % colors.length];

                        html += `
                            <li class="section-item">
                                <div class="user-name">
                                    <div class="user-avatar" style="background:${color};">                                    
                                        <img src="${user.avatarUrl}" alt="${user.username}" style="border-radius:20%;width:100%;height:100%;object-fit:cover;">
                                    </div>
                                    ${user.username}
                                </div>
                                <span class="user-id" style="display: none;">${user.userId}</span>
                                <span class="user-avatarUrl" style="display: none;">${user.avatarUrl}</span>
                                <span class="notification-badge">1</span>
                            </li>
                        `;
                    });

                    $('#membersList').html(html);
                } else {
                    $('#membersList').html('<li class="section-item">No members found</li>');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error fetching users:', error);
                $('#membersList').html('<li class="section-item">Failed to load members</li>');
            }
        });
    }

    
    // Assignment Modal Functions
    function openCreateAssignmentModal() {
        $createAssignmentModal.show();
        $('body').css('overflow', 'hidden');
    }
    
    function closeCreateAssignmentModal() {
        $createAssignmentModal.hide();
        $('body').css('overflow', 'auto');
        $createAssignmentForm[0].reset();
        selectedAssignmentFiles = [];
        updateSelectedFiles('assignment');
    }
    
    window.logout = function(){
        Swal.fire({
            title: "Confirm Logout",
            showCancelButton: true,
            confirmButtonText: 'Logout',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if(result.isConfirmed){
                localStorage.removeItem("user");
                sessionStorage.removeItem("token");
                window.location.href = "../index.html";
            }
        });
    }
    
    // Event listeners for modals
    $addAssignmentBtn.off('click').on('click', openCreateAssignmentModal);
    $closeCreateModal.off('click').on('click', closeCreateAssignmentModal);
    $('#cancelCreateAssignment').off('click').on('click', closeCreateAssignmentModal);
    
    // Close modals when clicking outside
    $(window).off('click.modal').on('click.modal', function(event) {
        if (event.target === $createAssignmentModal[0]) {
            closeCreateAssignmentModal();
        }
    });
    
    // FIXED: File upload handling - Prevent multiple event bindings
    function setupFileUpload(uploadAreaId, inputId, type) {
        const $uploadArea = $(`#${uploadAreaId}`);
        const $fileInput = $(`#${inputId}`);
        
        // Remove existing event listeners first
        $uploadArea.off('click dragover dragleave drop');
        $fileInput.off('change');
        
        $uploadArea.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $fileInput.click();
        });
        
        $uploadArea.on('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).css({
                'background': '#222529',
                'border-color': '#1164a3'
            });
        });
        
        $uploadArea.on('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).css({
                'background': '#1a1d29',
                'border-color': '#404449'
            });
        });
        
        $uploadArea.on('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).css({
                'background': '#1a1d29',
                'border-color': '#404449'
            });
            
            const files = Array.from(e.originalEvent.dataTransfer.files);
            handleFileSelection(files, type);
        });
        
        $fileInput.on('change', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const files = Array.from(this.files);
            handleFileSelection(files, type);
        });
    }
    
    function handleFileSelection(files, type) {
        if (type === 'assignment') {
            selectedAssignmentFiles = [...selectedAssignmentFiles, ...files];
        } else {
            selectedSubmissionFiles = [...selectedSubmissionFiles, ...files];
        }
        updateSelectedFiles(type);
    }
    
    function updateSelectedFiles(type) {
        const files = type === 'assignment' ? selectedAssignmentFiles : selectedSubmissionFiles;
        const $container = $(`#${type}SelectedFiles`);
        
        if (files.length === 0) {
            $container.hide();
            return;
        }
        
        $container.show();
        $container.html(files.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <i class="fas fa-file file-icon"></i>
                    <span>${file.name}</span>
                    <span style="color: #8d8d8d; font-size: 12px;">(${formatFileSize(file.size)})</span>
                </div>
                <button type="button" class="remove-file" data-index="${index}" data-type="${type}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join(''));
        
        // Add event listeners to remove buttons
        $container.find('.remove-file').off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const index = $(this).data('index');
            const type = $(this).data('type');
            
            if (type === 'assignment') {
                selectedAssignmentFiles.splice(index, 1);
            } else {
                selectedSubmissionFiles.splice(index, 1);
            }
            updateSelectedFiles(type);
        });
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Setup file uploads
    setupFileUpload('assignmentFileUpload', 'assignmentFiles', 'assignment');
    
    // CLOUDINARY CONFIG
    const CLOUD_NAME = "dodxgayab"; 
    const UPLOAD_PRESET = "learnloop_unsigned"; 

    async function uploadFileToCloudinary(file) {
        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("folder", "learnloop/classes");

        try {
            const response = await fetch(url, { method: "POST", body: formData });
            const data = await response.json();
            if (data.secure_url) return data.secure_url;
            throw new Error("Cloudinary upload failed");
        } catch (error) {
            console.error("Cloudinary upload failed:", error);
            Swal.fire("Error", "File upload failed!", "error");
            return null;
        }
    }

    // FIXED: Form submission - Prevent multiple submissions and handle file upload properly
    $createAssignmentForm.off('submit').on('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Check if files are selected
        if (selectedAssignmentFiles.length === 0) {
            Swal.fire("Error", "Please select at least one file", "error");
            return;
        }

        // Show loading
        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we create your assignment',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            // Upload first file to Cloudinary
            const file = selectedAssignmentFiles[0];
            const fileUrl = await uploadFileToCloudinary(file);
            if (!fileUrl) return;

            // Prepare assignment data
            const assignmentData = {
                title: $('#assignmentTitle').val(),
                description: $('#assignmentDescription').val(),
                endDate: $('#assignmentDueDate').val(),
                points: parseInt($('#assignmentPoints').val()),
                documentUrl: fileUrl,
                classId: parseInt(localStorage.getItem('classId'))
            };

            // Send to backend
            $.ajax({
                url: 'http://localhost:8080/auth/assignments/create',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(assignmentData),
                headers: { 'Authorization': 'Bearer ' + token },
                success: function(response) {
                    Swal.fire('Success', 'Assignment created successfully!', 'success');
                    closeCreateAssignmentModal();
                    addAssignmentToList(response.data || assignmentData);
                },
                error: function(xhr) {
                    Swal.fire('Error', xhr.responseJSON?.message || 'Failed to create assignment', 'error');
                }
            });
        } catch (error) {
            console.error('Error creating assignment:', error);
            Swal.fire('Error', 'An error occurred while creating the assignment', 'error');
        }
    });

    // Add Assignment to UI
    function addAssignmentToList(assignment) {
        const dueDate = new Date(assignment.endDate);
        const formattedDate = dueDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });

        const $assignmentsList = $('#assignmentsList');
        const assignmentCard = $(`
            <div class="assignment-card">
                <div class="assignment-card-header">
                    <div>
                        <div class="assignment-card-title">${assignment.title}</div>
                        <div class="assignment-card-meta">
                            <span><i class="fas fa-calendar"></i> Due: ${formattedDate}</span>
                            <span><i class="fas fa-star"></i> ${assignment.points} points</span>
                        </div>
                    </div>
                    <div class="assignment-status active">Active</div>
                </div>
                <div class="assignment-card-description">
                    ${assignment.description}
                </div>
                <div class="assignment-card-footer">
                    <div class="assignment-actions">
                        <button class="assignment-action-btn">View Details</button>
                    </div>
                </div>
            </div>
        `);
        $assignmentsList.prepend(assignmentCard);
    }

    // Rest of your code remains the same...
    // (I'm keeping the rest unchanged to avoid making the artifact too long)
    
    // Handle toolbar formatting buttons
    $toolbarBtns.on('click', function(e) {
        e.preventDefault();
        const format = $(this).data('format');
        
        // Toggle active state
        $(this).toggleClass('active');
        
        if ($(this).hasClass('active')) {
            activeFormats.add(format);
            // Apply formatting
            document.execCommand(format, false, null);
        } else {
            activeFormats.delete(format);
            // Remove formatting
            document.execCommand(format, false, null);
        }
        
        // Focus back to input
        $messageInput.focus();
    });
    
    // Apply active formatting to newly typed text
    function applyActiveFormatting() {
        // Check current formatting state and sync with active buttons
        setTimeout(updateFormattingButtons, 10);
    }
    
    // Handle key events for formatting shortcuts
    $messageInput.on('keydown', function(e) {
        // Ctrl+B for bold
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            $('[data-format="bold"]').click();
        }
        
        // Ctrl+I for italic
        if (e.ctrlKey && e.key === 'i') {
            e.preventDefault();
            $('[data-format="italic"]').click();
        }
        
        // Ctrl+U for underline
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            $('[data-format="underline"]').click();
        }
        
        // Enter key to send message
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Update formatting buttons based on cursor position
    $messageInput.on('selectionchange keyup mouseup', updateFormattingButtons);
    
    function updateFormattingButtons() {
        $toolbarBtns.each(function() {
            const format = $(this).data('format');
            const isActive = document.queryCommandState(format);
            
            if (isActive) {
                $(this).addClass('active');
                activeFormats.add(format);
            } else {
                $(this).removeClass('active');
                activeFormats.delete(format);
            }
        });
    }

    // Event delegation for dynamically added members
    $('#membersList').on('click', '.section-item', function () {
        // Remove active class from all items
        $('.section-item').removeClass('active');
        $('.nav-item').removeClass('active');
        $(this).addClass('active');

        // Show discussions content for direct messages
        $('#discussionsContent').css('display', 'flex');
        $('#assignmentContent').hide();

        // Update chat header and welcome message
        const userName = $(this).find('.user-name');
        const url = $(this).find('.user-avatarUrl');

        if (userName.length) {

            const avatarUrl = url.text().trim();
            const name = userName.text().trim();

            $('.chat-title').text(name);
            $('.welcome-name').text(name);

            const avatarDiv = $('.chat-avatar');
            const welcomeAvatarDiv = $('.welcome-avatar');

            avatarDiv.empty();
            welcomeAvatarDiv.empty();

            avatarDiv.append(`<img src="${avatarUrl}" alt="${name}" class="class-avatar-img" style="border-radius:20%;width:100%;height:100%;object-fit:cover;">`);
            welcomeAvatarDiv.append(`<img src="${avatarUrl}" alt="${name}" class="class-avatar-img" style="border-radius:10%;width:100%;height:100%;object-fit:cover;">`);
                

            updateMessageInput('direct', `Message ${name}`);
            updateContextIndicator('direct', name);
            showMessageInput();

            $('.welcome-message').html(
                `This conversation is just between <span class="mention">@${name}</span> and you.`
            );
        }

        // Remove notification badge when user is selected
        const badge = $(this).find('.notification-badge');
        if (badge.length) {
            badge.hide();
        }

        // Scroll chat to bottom
        setTimeout(scrollToBottom, 300);
    });

    
    // Handle left navigation menu clicks
    $navMenuItems.on('click', function() {
        $navMenuItems.removeClass('active');
        $(this).addClass('active');
        
        // Get the menu text to show different content
        const menuText = $(this).find('.nav-menu-text').text();
            if (menuText === 'Classes') {
                localStorage.removeItem("classId");
                navigateToClasses();
            }else if(menuText === 'Document'){
                localStorage.removeItem("classId");
                navigateToDocument();
            }else if(menuText === 'Dashboard'){
                localStorage.removeItem("classId");
                navigateToDashboard();
            }else if(menuText === 'LogOut'){
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

    function navigateToClasses() {
        window.location.href = '/pages/teacher_classess.html';
        
    }

    function navigateToDashboard() {
        window.location.href = '/pages/teacher_dashboard.html';
        
    }

    function navigateToDocument() {
        window.location.href = '/pages/document_templates.html';
        
    }

    // Handle search functionality
    $searchInput.on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        
        // Dynamically get the current list of members
        $('#membersList .section-item').each(function() {
            const userName = $(this).find('.user-name');
            if (userName.length) {
                const name = userName.text().toLowerCase();
                $(this).toggle(name.includes(searchTerm));
            }
        });
    });
    
    // Handle members section collapse/expand
    $membersHeader.on('click', function() {
        $(this).toggleClass('collapsed');
        $membersList.slideToggle();
    });
    
    function sendMessage() {
        const message = $messageInput.html().trim();
        const textContent = $messageInput.text().trim();

        if (!textContent) return; // Do nothing if input is empty

        console.log(`Sending formatted message: "${message}" to ${$chatTitle.text()}`);
        console.log(`Plain text: "${textContent}"`);

        // Add the message to chat as a sent message
        addWhatsAppMessage(textContent, true);

        // Clear the input
        $messageInput.html('');

        // Clear active formats
        activeFormats.clear();
        $toolbarBtns.removeClass('active');

        // Update send button state
        $sendBtn.prop('disabled', true).css('opacity', '0.5');

        // Optional: simulate a response after 2 seconds
        setTimeout(() => {
            const responses = [
                "Thanks for sharing!",
                "Got it!",
                "That's helpful!",
                "Understood!",
                "Great question!"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addWhatsAppMessage(randomResponse, false, "Teacher John", "#e01e5a", "T");
        }, 2000);
    }

    
    // Send message on button click
    $sendBtn.on('click', sendMessage);
    
    // Handle tool buttons (emoji, mention, file, etc.)
    $toolBtns.on('click', function() {
        const tool = $(this).data('tool');
        console.log(`Tool clicked: ${tool}`);
        
        // Add visual feedback with scale animation
        $(this).css({
            'transform': 'scale(0.95)',
            'background': '#404449',
            'color': '#ffffff'
        });
        
        setTimeout(() => {
            $(this).css({
                'transform': '',
                'background': '',
                'color': ''
            });
        }, 150);
        
        // Handle different tools
        switch(tool) {
            case 'text':
                console.log('Opening text formatting options...');
                break;
            case 'emoji':
                console.log('Opening emoji picker...');
                // You could show an emoji popup here
                break;
            case 'mention':
                // Insert @ symbol and focus
                const selection = window.getSelection();
                const range = document.createRange();
                
                // Insert @ at cursor position
                const atNode = document.createTextNode('@');
                if (selection.rangeCount > 0) {
                    const currentRange = selection.getRangeAt(0);
                    currentRange.deleteContents();
                    currentRange.insertNode(atNode);
                    range.setStartAfter(atNode);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else {
                    $messageInput[0].appendChild(atNode);
                    range.setStartAfter(atNode);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                
                $messageInput.focus();
                break;
            case 'file':
                console.log('Opening file picker...');
                // Create hidden file input and trigger click
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.multiple = true;
                fileInput.style.display = 'none';
                fileInput.addEventListener('change', function() {
                    console.log('Files selected:', this.files);
                });
                document.body.appendChild(fileInput);
                fileInput.click();
                document.body.removeChild(fileInput);
                break;
            default:
                console.log(`${tool} tool functionality not implemented yet`);
        }
    });
    
    // Initialize send button state
    $sendBtn.prop('disabled', true).css('opacity', '0.5');
    
    // Simulate real-time notifications (for demo purposes)
    function simulateNotification() {
        const items = $('.section-item:not(.active)');
        if (items.length > 0) {
            const randomItem = items.eq(Math.floor(Math.random() * items.length));
            const badge = randomItem.find('.notification-badge');
            
            if (badge.length && badge.css('display') !== 'none') {
                const currentCount = parseInt(badge.text()) || 1;
                badge.text(currentCount + 1);
            }
        }
    }
    
    // Simulate notifications every 30 seconds (for demo)
    setInterval(simulateNotification, 30000);
    
    // Message input management functions
    function updateMessageInput(type, placeholder) {
        const $messageInputContainer = $('.message-input-container');
        const $messageToolbar = $('.message-toolbar');
        const $messageControls = $('.message-controls');
        
        if (type === 'direct') {
            // Direct message style - more personal
            $messageInput.attr('data-placeholder', placeholder);
            $messageInput.css('min-height', '20px');
            
            // Update placeholder dynamically
            updatePlaceholderText(placeholder);
            
            // Show all formatting tools for direct messages
            $messageToolbar.show();
            $messageControls.show();
            
        } else if (type === 'group') {
            // Group discussion style
            $messageInput.attr('data-placeholder', placeholder);
            $messageInput.css('min-height', '20px');
            
            // Update placeholder dynamically
            updatePlaceholderText(placeholder);
            
            // Show all formatting tools for group discussions
            $messageToolbar.show();
            $messageControls.show();
        }
    }
    
    function updatePlaceholderText(text) {
        // Clear existing content if empty
        if ($messageInput.text().trim() === '') {
            $messageInput.html('');
        }
        
        // Update the placeholder attribute
        $messageInput.attr('data-placeholder', text);
        
        // Add CSS to show placeholder when empty
        if ($messageInput.text().trim() === '') {
            $messageInput.addClass('empty');
        } else {
            $messageInput.removeClass('empty');
        }
    }
    
    function showMessageInput() {
        $('.message-input-area').show();
    }
    
    function hideMessageInput() {
        $('.message-input-area').hide();
    }
    
    // Enhanced message input styling and context management
    $messageInput.on('focus', function() {
        $(this).removeClass('empty');
    });
    
    $messageInput.on('blur', function() {
        if ($(this).text().trim() === '') {
            $(this).addClass('empty');
        }
    });
    
    $messageInput.on('input', function() {
        if ($(this).text().trim() === '') {
            $(this).addClass('empty');
        } else {
            $(this).removeClass('empty');
        }
        
        // Update send button state
        const hasContent = $(this).text().trim().length > 0;
        $sendBtn.prop('disabled', !hasContent).css('opacity', hasContent ? '1' : '0.5');
        
        // Apply active formatting to new text
        applyActiveFormatting();
    });
    
    // Update context indicators when switching between sections
    function updateContextIndicator(type, name = '') {
        const $welcomeMessage = $('.welcome-message');
        let contextHtml = '';
        
        if (type === 'direct') {
            contextHtml = `<div class="context-indicator direct">Direct Message</div>`;
            $welcomeMessage.html(`This conversation is just between <span class="mention">@${name}</span> and you.`);
        } else if (type === 'group') {
            contextHtml = `<div class="context-indicator group">Group Discussion</div>`;
            $welcomeMessage.html(`This is the beginning of the <span class="mention">#general</span> channel for <span class="for-class-name">IJSE</span>.`);
        }
        
        // Update context indicator
        const $existingIndicator = $('.context-indicator');
        if ($existingIndicator.length) {
            $existingIndicator.replaceWith(contextHtml);
        } else {
            $welcomeMessage.before(contextHtml);
        }
    }
    
    // Initial setup - start with discussions active
    updateMessageInput('group', 'Message #general');
    updateContextIndicator('group');
    showMessageInput();
    
    // Set default due date to next week
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59);
    $('#assignmentDueDate').val(nextWeek.toISOString().slice(0, 16));
    
    console.log('IJSE Interface with jQuery and Assignment System initialized successfully!');

    // Enhanced scroll function for chat content
    function scrollToBottom() {
        const chatContent = document.getElementById('discussionsContent');
        if (chatContent) {
            chatContent.scrollTop = chatContent.scrollHeight;
        }
    }

    // Auto-scroll when new messages are added
    function addWhatsAppMessage(text, isSent = true, sender = '', avatarColor = '', avatarInitial = '') {
        const chatMessages = document.getElementById('chatMessages');
        const time = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        const messageClass = isSent ? 'sent' : 'received';
        const avatarHtml = !isSent ? `<div class="message-avatar" style="background: ${avatarColor};">${avatarInitial}</div>` : '';
        const senderHtml = !isSent ? `
            <div class="message-header">
                <span class="message-sender">${sender}</span>
            </div>
        ` : '';
        const checkMark = isSent ? '<span class="message-check">✓</span>' : '';
        
        const messageHtml = `
            <div class="message-item ${messageClass}">
                ${avatarHtml}
                <div class="message-bubble">
                    ${senderHtml}
                    <div class="message-text">${text}</div>
                    <div class="message-time">
                        ${time}
                        ${checkMark}
                    </div>
                </div>
            </div>
        `;
        
        chatMessages.insertAdjacentHTML('beforeend', messageHtml);
        
        // Smooth scroll to bottom
        setTimeout(scrollToBottom, 100);
    }

});