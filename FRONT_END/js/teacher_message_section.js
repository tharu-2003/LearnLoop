$(document).ready(function() {

    const token = sessionStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("current User"));
    const classId = localStorage.getItem("classId");
    
    // Chat variables (following first file pattern)
    let stompClient = null;
    let currentChatUserId = null;
    
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
    const $chatMessages = $('#chatMessages');
    
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

                    avatarDiv.append(`<img src="${classData.imageUrl}" alt="${classData.name}" class="class-avatar-img" style="border-radius:8px;width:100%;height:100%;object-fit:cover;">`);
                    welcomeAvatarDiv.append(`<img src="${classData.imageUrl}" alt="${classData.name}" class="class-avatar-img" style="border-radius:12px;width:100%;height:100%;object-fit:cover;">`);
                
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

    // =============== CHAT FUNCTIONALITY (Fixed following first file pattern) ===============
    
    // WebSocket Connection Management (from first file)
    function connectWebSocket(callback) {
        if (stompClient?.connected) {
            callback?.();
            return;
        }

        const socket = new SockJS("http://localhost:8080/ws-chat");
        stompClient = Stomp.over(socket);

        stompClient.connect({}, (frame) => {
            console.log("WebSocket Connected:", frame);
            
            // Subscribe to personal messages
            stompClient.subscribe(
                "/user/topic/messages",
                (message) => {
                    const msg = JSON.parse(message.body);
                    displayMessage(msg, "received");
                    scrollToBottom();
                }
            );

            callback?.();
        }, (error) => {
            console.error("WebSocket error:", error);
            showError("Connection failed. Please refresh the page.");
        });
    }

    // Load chat messages (from first file pattern)
    async function loadChatMessages(receiverId) {
        try {
            const messages = await $.ajax({
                url: `http://localhost:8080/api/chats/${currentUser.userId}/${receiverId}`,
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            $chatMessages.empty();
            messages.forEach(msg => {
                const type = msg.senderId == currentUser.userId ? "sent" : "received";
                displayMessage(msg, type);
            });
            
            scrollToBottom();
        } catch (error) {
            console.error("Failed to load chat messages:", error);
            showError("Failed to load chat history");
        }
    }

    // Send message function (from first file pattern)
    function sendMessage() {
        const msgContent = $messageInput.text().trim();
        const receiverId = localStorage.getItem("reciverId");
        const classId = localStorage.getItem("classId");

        if (!msgContent || !receiverId) return;

        const chatMessage = {
            senderId: currentUser.userId,
            receiverId: receiverId,
            classId: classId,
            message: msgContent,
            createdAt: new Date()
        };

        // Send via WebSocket
        if (stompClient?.connected) {
            stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        }

        // Display message immediately
        displayMessage(chatMessage, "sent");
        
        // Clear input
        clearMessageInput();
        scrollToBottom();
    }

    // Display message function (from first file pattern)
    function displayMessage(msg, type) {
        const time = new Date(msg.createdAt).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });

        const messageHtml = createMessageHTML(msg, type, time);
        $chatMessages.append(messageHtml);
    }

    // Create message HTML (from first file pattern)
    function createMessageHTML(msg, type, time) {
        const isReceived = type === "received";
        const avatarHtml = isReceived ? createAvatarHTML() : '';
        const senderHtml = isReceived ? `
            <div class="message-header">
                <span class="message-sender"></span>
            </div>
        ` : '';
        const checkMark = !isReceived ? '<span class="message-check">✓</span>' : '';

        return `
            <div class="message-item ${type}">
                ${avatarHtml}
                <div class="message-bubble">
                    ${senderHtml}
                    <div class="message-text">${msg.message}</div>
                    <div class="message-time">
                        ${time}
                        ${checkMark}
                    </div>
                </div>
            </div>
        `;
    }

    function createAvatarHTML() {
        return ``;
    }

    // Clear message input (from first file pattern)
    function clearMessageInput() {
        $messageInput.html('');
        activeFormats.clear();
        $toolbarBtns.removeClass('active');
        $sendBtn.prop('disabled', true).css('opacity', '0.5');
    }

    // Member selection handler (Fixed to follow first file pattern)
    $('#membersList').on('click', '.section-item', function () {
        // Update UI
        $('.section-item').removeClass('active');
        $('.nav-item').removeClass('active');
        $(this).addClass('active');

        // Show discussions content
        $discussionsContent.css('display', 'flex');
        $assignmentContent.hide();

        // Get member info
        const userName = $(this).find('.user-name').text().trim();
        const avatarUrl = $(this).find('.user-avatarUrl').text().trim();
        const receiverId = $(this).find('.user-id').text().trim();

        // Update chat UI
        updateChatHeader(userName, avatarUrl);
        updateMessageInput('direct', `Message ${userName}`);
        updateContextIndicator('direct', userName);
        showMessageInput();

        // Store receiver ID and load messages
        localStorage.setItem("reciverId", receiverId);
        currentChatUserId = receiverId;

        // Hide notification badge
        $(this).find('.notification-badge').hide();

        // Connect and load messages
        connectWebSocket(() => {
            loadChatMessages(receiverId);
        });
    });

    // Update chat header (from first file pattern)
    function updateChatHeader(userName, avatarUrl) {
        $chatTitle.text(userName);
        $welcomeName.text(userName);

        const avatarImg = `<img src="${avatarUrl}" alt="${userName}" 
                          style="border-radius: 20%; width: 100%; height: 100%; object-fit: cover;">`;
        
        $('.chat-avatar').html(avatarImg);
        $('.welcome-avatar').html(avatarImg);
    }

    // Send message event handlers (Fixed)
    $sendBtn.on('click', () => sendMessage());
    
    $messageInput.on('keydown', (e) => {
        // Send on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Message input change handler (from first file pattern)
    $messageInput.on('input', function() {
        const hasContent = $(this).text().trim().length > 0;
        
        // Update send button state
        $sendBtn.prop('disabled', !hasContent)
                .css('opacity', hasContent ? '1' : '0.5');
        
        // Update empty state
        $(this).toggleClass('empty', !hasContent);
    });

    // Scroll to bottom function (from first file pattern)
    function scrollToBottom() {
        const chatContent = $discussionsContent[0];
        if (chatContent) {
            chatContent.scrollTop = chatContent.scrollHeight;
        }
    }

    // Error notification function
    function showError(message) {
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }

    // Initialize send button state
    $sendBtn.prop('disabled', true).css('opacity', '0.5');

    // =============== END CHAT FUNCTIONALITY ===============
    
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
    
    // window.logout = function(){
    //     Swal.fire({
    //         title: "Confirm Logout",
    //         showCancelButton: true,
    //         confirmButtonText: 'Logout',
    //         cancelButtonText: 'Cancel'
    //     }).then((result) => {
    //         if(result.isConfirmed){
    //             localStorage.removeItem("user");
    //             sessionStorage.removeItem("token");
    //             window.location.href = "../index.html";
    //         }
    //     });
    // }
    
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
        // Detect the resource type
        let resourceType = "auto";
        if (file.type === "application/pdf" || 
            file.type === "application/msword" || 
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.type === "text/plain") {
            resourceType = "raw";   // 👈 use raw for documents
        }

        const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

        // Decide folder by type
        let folderPath = "learnloop/classes/others";
        if (file.type === "application/pdf") {
            folderPath = "learnloop/classes/pdfs";
        } else if (file.type.startsWith("image/")) {
            folderPath = "learnloop/classes/images";
        } else if (file.type.startsWith("video/")) {
            folderPath = "learnloop/classes/videos";
        } else if (file.type.includes("word")) {
            folderPath = "learnloop/classes/docs";
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("folder", folderPath);

        try {
            const response = await fetch(url, {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            console.log("Cloudinary response:", data);

            if (data.secure_url) {
                return data.secure_url;  // ✅ this URL will now open PDFs correctly
            }
            throw new Error("Upload failed: " + JSON.stringify(data));
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

});