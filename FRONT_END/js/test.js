class ChatApp {
    constructor() {
        // Core properties
        this.token = sessionStorage.getItem("token");
        this.currentUser = JSON.parse(localStorage.getItem("current User"));
        this.stompClient = null;
        this.currentChatUserId = null;
        this.activeFormats = new Set();
        this.selectedFiles = [];
        
        // DOM element cache
        this.elements = {};
        
        // Initialize the app
        this.init();
    }

    // Initialize the application
    init() {
        if (!this.validateUser()) return;
        
        this.cacheElements();
        this.setupEventListeners();
        this.loadInitialData();
        this.connectWebSocket();
    }

    // Validate user authentication
    validateUser() {
        if (!this.token || !this.currentUser?.userId) {
            console.error("No user found, redirecting to login");
            window.location.href = '../index.html';
            return false;
        }
        return true;
    }

    // Cache frequently used DOM elements
    cacheElements() {
        this.elements = {
            // Navigation elements
            navMenuItems: $('.nav-menu-item'),
            navItems: $('.nav-item'),
            sidebarItems: $('.section-item'),
            
            // Chat elements
            messageInput: $('#messageInput'),
            sendBtn: $('#sendBtn'),
            chatMessages: $('#chatMessages'),
            chatTitle: $('.chat-title'),
            
            // Content areas
            discussionsContent: $('#discussionsContent'),
            assignmentContent: $('#assignmentContent'),
            
            // Search and members
            searchInput: $('#searchInput'),
            membersList: $('#membersList'),
            membersHeader: $('#membersHeader'),
            
            // UI elements
            welcomeName: $('.welcome-name'),
            chatAvatar: $('.chat-avatar'),
            welcomeAvatar: $('.welcome-avatar'),
            workspaceTitle: $('.workspace-title'),
            
            // Toolbar and formatting
            toolbarBtns: $('.toolbar-btn'),
            toolBtns: $('.tool-btn'),
            
            // Modal elements
            submitModal: $('#submitAssignmentModal'),
            closeSubmitModal: $('#closeSubmitModal'),
            submitForm: $('#submitAssignmentForm')
        };
    }

    // Setup all event listeners
    setupEventListeners() {
        this.setupNavigationEvents();
        this.setupChatEvents();
        this.setupMemberEvents();
        this.setupModalEvents();
        this.setupFormattingEvents();
        this.setupFileEvents();
        this.setupSearchEvents();
    }

    // Navigation event handlers
    setupNavigationEvents() {
        // Left navigation menu
        this.elements.navMenuItems.on('click', (e) => {
            const menuText = $(e.currentTarget).find('.nav-menu-text').text();
            this.handleNavigation(menuText);
        });

        // Main navigation items (Discussions/Assignment)
        this.elements.navItems.on('click', (e) => {
            this.handleSectionSwitch($(e.currentTarget));
        });
    }

    // Chat-related event handlers
    setupChatEvents() {
        // Send message button
        this.elements.sendBtn.on('click', () => this.sendMessage());
        
        // Message input events
        this.elements.messageInput
            .on('keydown', (e) => this.handleInputKeydown(e))
            .on('input', () => this.handleInputChange())
            .on('focus', () => this.handleInputFocus())
            .on('blur', () => this.handleInputBlur());
    }

    // Member selection events
    setupMemberEvents() {
        this.elements.membersList.on('click', '.section-item', (e) => {
            this.handleMemberSelection($(e.currentTarget));
        });
        
        this.elements.membersHeader.on('click', () => {
            this.elements.membersHeader.toggleClass('collapsed');
            this.elements.membersList.slideToggle();
        });
    }

    // Modal event handlers
    setupModalEvents() {
        this.elements.closeSubmitModal.on('click', () => this.closeModal());
        $('#cancelSubmitAssignment').on('click', () => this.closeModal());
        
        $(window).on('click', (e) => {
            if (e.target === this.elements.submitModal[0]) {
                this.closeModal();
            }
        });
        
        this.elements.submitForm.on('submit', (e) => this.handleAssignmentSubmit(e));
    }

    // Text formatting events
    setupFormattingEvents() {
        this.elements.toolbarBtns.on('click', (e) => this.handleFormatting(e));
        this.elements.toolBtns.on('click', (e) => this.handleToolAction(e));
    }

    // File upload events
    setupFileEvents() {
        this.setupFileUpload('submissionFileUpload', 'submissionFiles');
    }

    // Search functionality
    setupSearchEvents() {
        this.elements.searchInput.on('input', (e) => {
            const searchTerm = $(e.target).val().toLowerCase();
            this.filterMembers(searchTerm);
        });
    }

    // WebSocket Connection Management
    connectWebSocket(callback) {
        if (this.stompClient?.connected) {
            callback?.();
            return;
        }

        const socket = new SockJS("http://localhost:8080/ws-chat");
        this.stompClient = Stomp.over(socket);

        this.stompClient.connect({}, (frame) => {
            console.log("WebSocket Connected:", frame);
            
            // Subscribe to personal messages
            this.stompClient.subscribe(
                "/user/topic/messages",
                (message) => {
                    const msg = JSON.parse(message.body);
                    this.displayMessage(msg, "received");
                    this.scrollToBottom();
                }
            );

            
            callback?.();
        }, (error) => {
            console.error("WebSocket error:", error);
            this.showError("Connection failed. Please refresh the page.");
        });
    }

    // Load initial data
    loadInitialData() {
        const classId = localStorage.getItem("classId");
        if (classId) {
            this.loadClassDetails(classId);
            this.loadUsers();
        }
        
        // Set user avatar
        $('.user-avatar-nav').text(this.currentUser.username[0]);
    }

    // API Calls
    async loadClassDetails(classId) {
        try {
            const response = await $.ajax({
                url: `http://localhost:8080/api/classes/${classId}`,
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response?.data) {
                this.updateClassUI(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch class details:', error);
            this.showError('Failed to load class information');
        }
    }

    async loadUsers() {
        const classId = localStorage.getItem("classId");
        if (!classId) return;

        try {
            // Load class details for teacher info
            const classResponse = await $.ajax({
                url: `http://localhost:8080/api/classes/${classId}`,
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            // Load students
            const usersResponse = await $.ajax({
                url: `http://localhost:8080/api/classes/${classId}/users`,
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            this.renderUsersList(classResponse.data, usersResponse.data);
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Failed to load class members');
        }
    }

    async loadChatMessages(receiverId) {
        try {
            const messages = await $.ajax({
                url: `http://localhost:8080/api/chats/${this.currentUser.userId}/${receiverId}`,
                method: "GET",
                headers: { "Authorization": `Bearer ${this.token}` }
            });

            this.elements.chatMessages.empty();
            messages.forEach(msg => {
                console.log("SENDER",msg.senderId)
                console.log("Current",this.currentUser.userId)
                const type = msg.senderId == this.currentUser.userId ? "sent" : "received";
                console.log(type)
                this.displayMessage(msg, type);
            });
            
            this.scrollToBottom();
        } catch (error) {
            console.error("Failed to load chat messages:", error);
            this.showError("Failed to load chat history");
        }
    }

    // UI Update Methods
    updateClassUI(classData) {
        const elements = [
            '.workspace-title',
            '.chat-title', 
            '.welcome-name',
            '.for-class-name'
        ];
        
        elements.forEach(selector => {
            $(selector).text(classData.name || 'Unnamed Class');
        });

        $('.mention').text(classData.createdByName || 'Teacher');

        // Update avatars
        const avatarImg = `<img src="${classData.imageUrl}" alt="${classData.name}" 
                          style="border-radius: 20%; width: 100%; height: 100%; object-fit: cover;">`;
        
        this.elements.chatAvatar.html(avatarImg);
        this.elements.welcomeAvatar.html(avatarImg);
    }

    renderUsersList(classData, users) {
        const colors = ['#2eb67d', '#36c5f0', '#e01e5a', '#f2c744', '#b6502e'];
        let html = '';

        // Add teacher first
        const teacherColor = colors[classData.createdById % colors.length];
        html += this.createUserListItem({
            userId: classData.createdById,
            username: `${classData.createdByName} (Teacher)`,
            avatarUrl: classData.createdByAvatarUrl,
            color: teacherColor,
            isTeacher: true
        });

        // Add students
        users.forEach(user => {
            if (user.userId !== this.currentUser.userId && user.userId !== classData.createdById) {
                const color = colors[user.userId % colors.length];
                html += this.createUserListItem({
                    userId: user.userId,
                    username: user.username,
                    avatarUrl: user.avatarUrl,
                    color: color,
                    showBadge: true
                });
            }
        });

        this.elements.membersList.html(html);
    }

    createUserListItem({ userId, username, avatarUrl, color, isTeacher = false, showBadge = false }) {
        const badge = showBadge ? '<span class="notification-badge">1</span>' : '';
        const strongTag = isTeacher ? '<strong>' : '';
        const strongEndTag = isTeacher ? '</strong>' : '';
        
        return `
            <li class="section-item ${isTeacher ? 'teacher-item' : ''}">
                <div class="user-name">
                    <div class="user-avatar" style="background: ${color};">
                        <img src="${avatarUrl}" alt="${username}" 
                             style="border-radius:20%;width:100%;height:100%;object-fit:cover;">
                    </div>
                    ${strongTag}${username}${strongEndTag}
                </div>
                <span class="user-id" style="display:none;">${userId}</span>
                <span class="user-avatarUrl" style="display:none;">${avatarUrl}</span>
                ${badge}
            </li>
        `;
    }

    // Event Handlers
    handleNavigation(menuText) {
        const navigationMap = {
            'Classes': () => this.navigateTo('/pages/student_classess.html'),
            'Document': () => this.navigateTo('/pages/document_templates.html'),
            'Dashboard': () => this.navigateTo('/pages/student_dashboard.html'),
            'LogOut': () => this.handleLogout()
        };

        const action = navigationMap[menuText];
        if (action) {
            action();
        }
    }

    handleSectionSwitch($element) {
        this.elements.navItems.removeClass('active');
        this.elements.sidebarItems.removeClass('active');
        $element.addClass('active');

        const section = $element.data('section');
        
        if (section === 'discussions') {
            this.showDiscussions();
        } else if (section === 'assignment') {
            this.showAssignments();
        }
    }

    handleMemberSelection($element) {
        // Update UI
        $('.section-item').removeClass('active');
        $('.nav-item').removeClass('active');
        $element.addClass('active');

        // Show discussions content
        this.elements.discussionsContent.css('display', 'flex');
        this.elements.assignmentContent.hide();

        // Get member info
        const userName = $element.find('.user-name').text().trim();
        const avatarUrl = $element.find('.user-avatarUrl').text().trim();
        const receiverId = $element.find('.user-id').text().trim();

        // Update chat UI
        this.updateChatHeader(userName, avatarUrl);
        this.updateMessageInput('direct', `Message ${userName}`);
        this.updateContextIndicator('direct', userName);
        this.showMessageInput();

        // Store receiver ID and load messages
        localStorage.setItem("reciverId", receiverId);
        this.currentChatUserId = receiverId;

        // Hide notification badge
        $element.find('.notification-badge').hide();

        // Connect and load messages
        this.connectWebSocket(() => {
            this.loadChatMessages(receiverId);
        });
    }

    handleInputKeydown(e) {
        // Formatting shortcuts
        if (e.ctrlKey) {
            const shortcuts = {
                'b': 'bold',
                'i': 'italic',
                'u': 'underline'
            };
            
            const format = shortcuts[e.key];
            if (format) {
                e.preventDefault();
                $(`[data-format="${format}"]`).click();
            }
        }

        // Send on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    handleInputChange() {
        const hasContent = this.elements.messageInput.text().trim().length > 0;
        
        // Update send button state
        this.elements.sendBtn.prop('disabled', !hasContent)
                           .css('opacity', hasContent ? '1' : '0.5');
        
        // Update empty state
        this.elements.messageInput.toggleClass('empty', !hasContent);
    }

    handleInputFocus() {
        this.elements.messageInput.removeClass('empty');
    }

    handleInputBlur() {
        if (this.elements.messageInput.text().trim() === '') {
            this.elements.messageInput.addClass('empty');
        }
    }

    handleFormatting(e) {
        e.preventDefault();
        const format = $(e.currentTarget).data('format');
        
        $(e.currentTarget).toggleClass('active');
        
        if ($(e.currentTarget).hasClass('active')) {
            this.activeFormats.add(format);
        } else {
            this.activeFormats.delete(format);
        }
        
        document.execCommand(format, false, null);
        this.elements.messageInput.focus();
    }

    handleToolAction(e) {
        const tool = $(e.currentTarget).data('tool');
        
        // Visual feedback
        this.animateButton($(e.currentTarget));
        
        const toolActions = {
            'text': () => console.log('Text formatting options...'),
            'emoji': () => console.log('Emoji picker...'),
            'mention': () => this.insertMention(),
            'file': () => this.openFilePicker()
        };
        
        const action = toolActions[tool];
        if (action) action();
    }

    handleAssignmentSubmit(e) {
        e.preventDefault();
        
        const formData = {
            comments: $('#submissionText').val(),
            files: this.selectedFiles,
            assignmentTitle: $('#submitModalTitle').text().replace('Submit: ', '')
        };
        
        console.log('Submitting assignment:', formData);
        
        this.closeModal();
        this.showSuccess('Assignment submitted successfully!');
    }

    handleLogout() {
        Swal.fire({
            title: "Confirm Logout",
            showCancelButton: true,
            confirmButtonText: 'Logout',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.performLogout();
            }
        });
    }

    // Message Management
    sendMessage() {
        const msgContent = this.elements.messageInput.text().trim();
        const receiverId = localStorage.getItem("reciverId");
        const classId = localStorage.getItem("classId");

        if (!msgContent || !receiverId) return;

        const chatMessage = {
            senderId: this.currentUser.userId,
            receiverId: receiverId,
            classId: classId,
            message: msgContent,
            createdAt: new Date()
        };

        // Send via WebSocket
        if (this.stompClient?.connected) {
            this.stompClient.send("/app/sendMessage", {}, JSON.stringify(chatMessage));
        }

        // Display message immediately
        this.displayMessage(chatMessage, "sent");
        
        // Clear input
        this.clearMessageInput();
        this.scrollToBottom();
    }

    displayMessage(msg, type) {
        console.log(type)
        const time = new Date(msg.createdAt).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });

        const messageHtml = this.createMessageHTML(msg, type, time);
        this.elements.chatMessages.append(messageHtml);
    }

    createMessageHTML(msg, type, time) {
        console.log(type)
        const isReceived = type === "received";
        const avatarHtml = isReceived ? this.createAvatarHTML() : '';
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

    createAvatarHTML() {
        return `<div class="message-avatar" style="background: #e01e5a;">T</div>`;
    }

    clearMessageInput() {
        this.elements.messageInput.html('');
        this.activeFormats.clear();
        this.elements.toolbarBtns.removeClass('active');
        this.elements.sendBtn.prop('disabled', true).css('opacity', '0.5');
    }

    // UI State Management
    showDiscussions() {
        this.elements.discussionsContent.css('display', 'flex');
        this.elements.assignmentContent.hide();
        this.elements.chatTitle.text('IJSE Group');
        
        this.updateMessageInput('group', 'Message #general');
        this.updateContextIndicator('group');
        this.showMessageInput();
        
        // Load class details
        const classId = localStorage.getItem("classId");
        if (classId) this.loadClassDetails(classId);
        
        setTimeout(() => this.scrollToBottom(), 300);
    }

    showAssignments() {
        this.elements.discussionsContent.hide();
        this.elements.assignmentContent.css('display', 'flex');
        this.elements.chatTitle.text('Assignments');
        this.hideMessageInput();
        
        // Load class details
        const classId = localStorage.getItem("classId");
        if (classId) this.loadClassDetails(classId);
    }

    updateChatHeader(userName, avatarUrl) {
        this.elements.chatTitle.text(userName);
        this.elements.welcomeName.text(userName);

        const avatarImg = `<img src="${avatarUrl}" alt="${userName}" 
                          style="border-radius: 20%; width: 100%; height: 100%; object-fit: cover;">`;
        
        this.elements.chatAvatar.html(avatarImg);
        this.elements.welcomeAvatar.html(avatarImg);
    }

    updateMessageInput(type, placeholder) {
        this.elements.messageInput.attr('data-placeholder', placeholder);
        this.updatePlaceholderText(placeholder);
        
        $('.message-toolbar, .message-controls').show();
    }

    updatePlaceholderText(text) {
        this.elements.messageInput.attr('data-placeholder', text);
        
        if (this.elements.messageInput.text().trim() === '') {
            this.elements.messageInput.addClass('empty');
        } else {
            this.elements.messageInput.removeClass('empty');
        }
    }

    updateContextIndicator(type, name = '') {
        const contextMap = {
            'direct': {
                class: 'direct',
                text: 'Direct Message',
                message: `This conversation is just between <span class="mention">@${name}</span> and you.`
            },
            'group': {
                class: 'group', 
                text: 'Group Discussion',
                message: `This is the beginning of the <span class="mention">#general</span> channel for <span class="for-class-name">IJSE</span>.`
            }
        };

        const config = contextMap[type];
        if (!config) return;

        const contextHtml = `<div class="context-indicator ${config.class}">${config.text}</div>`;
        const $existingIndicator = $('.context-indicator');
        
        if ($existingIndicator.length) {
            $existingIndicator.replaceWith(contextHtml);
        } else {
            $('.welcome-message').before(contextHtml);
        }
        
        $('.welcome-message').html(config.message);
    }

    showMessageInput() {
        $('.message-input-area').show();
    }

    hideMessageInput() {
        $('.message-input-area').hide();
    }

    // Utility Methods
    scrollToBottom() {
        const chatContent = this.elements.discussionsContent[0];
        if (chatContent) {
            chatContent.scrollTop = chatContent.scrollHeight;
        }
    }

    filterMembers(searchTerm) {
        this.elements.membersList.find('.section-item').each(function() {
            const name = $(this).find('.user-name').text().toLowerCase();
            $(this).toggle(name.includes(searchTerm));
        });
    }

    animateButton($button) {
        $button.css({
            'transform': 'scale(0.95)',
            'background': '#404449',
            'color': '#ffffff'
        });
        
        setTimeout(() => {
            $button.css({
                'transform': '',
                'background': '',
                'color': ''
            });
        }, 150);
    }

    insertMention() {
        const selection = window.getSelection();
        const atNode = document.createTextNode('@');
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(atNode);
            range.setStartAfter(atNode);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        this.elements.messageInput.focus();
    }

    openFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.style.display = 'none';
        
        input.addEventListener('change', (e) => {
            console.log('Files selected:', e.target.files);
        });
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    setupFileUpload(uploadAreaId, inputId) {
        const $uploadArea = $(`#${uploadAreaId}`);
        const $fileInput = $(`#${inputId}`);
        
        $uploadArea.on('click', () => $fileInput.click());
        
        $uploadArea.on('dragover', (e) => {
            e.preventDefault();
            $uploadArea.css({
                'background': '#222529',
                'border-color': '#1164a3'
            });
        });
        
        $uploadArea.on('dragleave', () => {
            $uploadArea.css({
                'background': '#1a1d29',
                'border-color': '#404449'
            });
        });
        
        $uploadArea.on('drop', (e) => {
            e.preventDefault();
            $uploadArea.css({
                'background': '#1a1d29',
                'border-color': '#404449'
            });
            
            const files = Array.from(e.originalEvent.dataTransfer.files);
            this.handleFileSelection(files);
        });
        
        $fileInput.on('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFileSelection(files);
        });
    }

    handleFileSelection(files) {
        this.selectedFiles = [...this.selectedFiles, ...files];
        this.updateSelectedFiles();
    }

    updateSelectedFiles() {
        // Implementation for updating file display
        console.log('Selected files:', this.selectedFiles);
    }

    // Modal Management
    openSubmissionModal(assignmentTitle) {
        $('#submitModalTitle').text(`Submit: ${assignmentTitle}`);
        this.elements.submitModal.show();
        $('body').css('overflow', 'hidden');
    }

    closeModal() {
        this.elements.submitModal.hide();
        $('body').css('overflow', 'auto');
        this.elements.submitForm[0].reset();
        this.selectedFiles = [];
    }

    // Navigation
    navigateTo(url) {
        localStorage.removeItem("classId");
        window.location.href = url;
    }

    performLogout() {
        sessionStorage.clear();
        localStorage.clear();
        
        Swal.fire({
            title: "Logout",
            text: "Successfully logged out",
            timer: 1500
        }).then(() => {
            window.location.href = '../index.html';
        });
    }

    // Notifications
    showError(message) {
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }

    showSuccess(message) {
        Swal.fire({
            title: 'Success!',
            text: message,
            icon: 'success',
            confirmButtonText: 'OK'
        });
    }
}

// Global functions for modal (called from HTML)
window.openSubmissionModal = function(assignmentTitle) {
    if (window.chatApp) {
        window.chatApp.openSubmissionModal(assignmentTitle);
    }
};

window.logout = function() {
    if (window.chatApp) {
        window.chatApp.handleLogout();
    }
};

// Initialize the app when DOM is ready
$(document).ready(function() {
    // External script dependencies check
    if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
        console.error('Required libraries (SockJS, StompJS) not loaded');
        return;
    }
    
    // Initialize the chat application
    window.chatApp = new ChatApp();
    
    console.log('Chat application initialized successfully');
});