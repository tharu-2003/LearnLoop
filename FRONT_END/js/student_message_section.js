// Global variables to store app state
let token = null;
let currentUser = null;
let stompClient = null;
let currentChatUserId = null;
let activeFormats = new Set();
let selectedFiles = [];
let elements = {};

// Initialize the application
function init() {
    if (!validateUser()) return;
    
    cacheElements();
    setupEventListeners();
    loadInitialData();
    connectWebSocket();
}

// Validate user authentication
function validateUser() {
    token = sessionStorage.getItem("token");
    currentUser = JSON.parse(localStorage.getItem("current User"));
    
    if (!token || !currentUser?.userId) {
        console.error("No user found, redirecting to login");
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// Cache frequently used DOM elements
function cacheElements() {
    elements = {
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
function setupEventListeners() {
    setupNavigationEvents();
    setupChatEvents();
    setupMemberEvents();
    setupModalEvents();
    setupFormattingEvents();
    setupFileEvents();
    setupSearchEvents();
}

// Navigation event handlers
function setupNavigationEvents() {
    // Left navigation menu
    elements.navMenuItems.on('click', (e) => {
        const menuText = $(e.currentTarget).find('.nav-menu-text').text();
        handleNavigation(menuText);
    });

    // Main navigation items (Discussions/Assignment)
    elements.navItems.on('click', (e) => {
        handleSectionSwitch($(e.currentTarget));
    });
}

// Chat-related event handlers
function setupChatEvents() {
    // Send message button
    elements.sendBtn.on('click', () => sendMessage());
    
    // Message input events
    elements.messageInput
        .on('keydown', (e) => handleInputKeydown(e))
        .on('input', () => handleInputChange())
        .on('focus', () => handleInputFocus())
        .on('blur', () => handleInputBlur());
}

// Member selection events
function setupMemberEvents() {
    elements.membersList.on('click', '.section-item', (e) => {
        handleMemberSelection($(e.currentTarget));
    });
    
    elements.membersHeader.on('click', () => {
        elements.membersHeader.toggleClass('collapsed');
        elements.membersList.slideToggle();
    });
}

// Modal event handlers
function setupModalEvents() {
    elements.closeSubmitModal.on('click', () => closeModal());
    $('#cancelSubmitAssignment').on('click', () => closeModal());
    
    $(window).on('click', (e) => {
        if (e.target === elements.submitModal[0]) {
            closeModal();
        }
    });
    
    elements.submitForm.on('submit', (e) => handleAssignmentSubmit(e));
}

// Text formatting events
function setupFormattingEvents() {
    elements.toolbarBtns.on('click', (e) => handleFormatting(e));
    elements.toolBtns.on('click', (e) => handleToolAction(e));
}

// File upload events
function setupFileEvents() {
    setupFileUpload('submissionFileUpload', 'submissionFiles');
}

// Search functionality
function setupSearchEvents() {
    elements.searchInput.on('input', (e) => {
        const searchTerm = $(e.target).val().toLowerCase();
        filterMembers(searchTerm);
    });
}

// WebSocket Connection Management
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

// Load initial data
function loadInitialData() {
    const classId = localStorage.getItem("classId");
    if (classId) {
        loadClassDetails(classId);
        loadUsers();
    }
    
    // Set user avatar
    $('.user-avatar-nav').text(currentUser.username[0]);
}

// API Calls
async function loadClassDetails(classId) {
    try {
        const response = await $.ajax({
            url: `http://localhost:8080/api/classes/${classId}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response?.data) {
            updateClassUI(response.data);
        }
    } catch (error) {
        console.error('Failed to fetch class details:', error);
        showError('Failed to load class information');
    }
}

async function loadUsers() {
    const classId = localStorage.getItem("classId");
    if (!classId) return;

    try {
        // Load class details for teacher info
        const classResponse = await $.ajax({
            url: `http://localhost:8080/api/classes/${classId}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Load students
        const usersResponse = await $.ajax({
            url: `http://localhost:8080/api/classes/${classId}/users`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        renderUsersList(classResponse.data, usersResponse.data);
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load class members');
    }
}

async function loadChatMessages(receiverId) {
    try {
        const messages = await $.ajax({
            url: `http://localhost:8080/api/chats/${currentUser.userId}/${receiverId}`,
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        elements.chatMessages.empty();
        messages.forEach(msg => {
            console.log("SENDER", msg.senderId);
            console.log("Current", currentUser.userId);
            const type = msg.senderId == currentUser.userId ? "sent" : "received";
            console.log(type);
            displayMessage(msg, type);
        });
        
        scrollToBottom();
    } catch (error) {
        console.error("Failed to load chat messages:", error);
        showError("Failed to load chat history");
    }
}

// UI Update Methods
function updateClassUI(classData) {
    const selectors = [
        '.workspace-title',
        '.chat-title', 
        '.welcome-name',
        '.for-class-name'
    ];
    
    selectors.forEach(selector => {
        $(selector).text(classData.name || 'Unnamed Class');
    });

    $('.mention').text(classData.createdByName || 'Teacher');

    // Update avatars
    const avatarImg = `<img src="${classData.imageUrl}" alt="${classData.name}" 
                      style="border-radius: 8px; width: 100%; height: 100%; object-fit: cover;">`;
    
    elements.chatAvatar.html(avatarImg);
    elements.welcomeAvatar.html(avatarImg);
}

function renderUsersList(classData, users) {
    const colors = ['#2eb67d', '#36c5f0', '#e01e5a', '#f2c744', '#b6502e'];
    let html = '';

    // Add teacher first
    const teacherColor = colors[classData.createdById % colors.length];
    html += createUserListItem({
        userId: classData.createdById,
        username: `${classData.createdByName} (Teacher)`,
        avatarUrl: classData.createdByAvatarUrl,
        color: teacherColor,
        isTeacher: true
    });

    // Add students
    users.forEach(user => {
        if (user.userId !== currentUser.userId && user.userId !== classData.createdById) {
            const color = colors[user.userId % colors.length];
            html += createUserListItem({
                userId: user.userId,
                username: user.username,
                avatarUrl: user.avatarUrl,
                color: color,
                showBadge: true
            });
        }
    });

    elements.membersList.html(html);
}

function createUserListItem({ userId, username, avatarUrl, color, isTeacher = false, showBadge = false }) {
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
function handleNavigation(menuText) {
    const navigationMap = {
        'Classes': () => navigateTo('/pages/student_classess.html'),
        'Document': () => navigateTo('/pages/document_templates.html'),
        'Dashboard': () => navigateTo('/pages/student_dashboard.html'),
        'LogOut': () => handleLogout()
    };

    const action = navigationMap[menuText];
    if (action) {
        action();
    }
}

function handleSectionSwitch($element) {
    elements.navItems.removeClass('active');
    elements.sidebarItems.removeClass('active');
    $element.addClass('active');

    const section = $element.data('section');
    
    if (section === 'discussions') {
        showDiscussions();
    } else if (section === 'assignment') {
        showAssignments();
    }
}

function handleMemberSelection($element) {
    // Update UI
    $('.section-item').removeClass('active');
    $('.nav-item').removeClass('active');
    $element.addClass('active');

    // Show discussions content
    elements.discussionsContent.css('display', 'flex');
    elements.assignmentContent.hide();

    // Get member info
    const userName = $element.find('.user-name').text().trim();
    const avatarUrl = $element.find('.user-avatarUrl').text().trim();
    const receiverId = $element.find('.user-id').text().trim();

    // Update chat UI
    updateChatHeader(userName, avatarUrl);
    updateMessageInput('direct', `Message ${userName}`);
    updateContextIndicator('direct', userName);
    showMessageInput();

    // Store receiver ID and load messages
    localStorage.setItem("reciverId", receiverId);
    currentChatUserId = receiverId;

    // Hide notification badge
    $element.find('.notification-badge').hide();

    // Connect and load messages
    connectWebSocket(() => {
        loadChatMessages(receiverId);
    });
}

function handleInputKeydown(e) {
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
        sendMessage();
    }
}

function handleInputChange() {
    const hasContent = elements.messageInput.text().trim().length > 0;
    
    // Update send button state
    elements.sendBtn.prop('disabled', !hasContent)
                   .css('opacity', hasContent ? '1' : '0.5');
    
    // Update empty state
    elements.messageInput.toggleClass('empty', !hasContent);
}

function handleInputFocus() {
    elements.messageInput.removeClass('empty');
}

function handleInputBlur() {
    if (elements.messageInput.text().trim() === '') {
        elements.messageInput.addClass('empty');
    }
}

function handleFormatting(e) {
    e.preventDefault();
    const format = $(e.currentTarget).data('format');
    
    $(e.currentTarget).toggleClass('active');
    
    if ($(e.currentTarget).hasClass('active')) {
        activeFormats.add(format);
    } else {
        activeFormats.delete(format);
    }
    
    document.execCommand(format, false, null);
    elements.messageInput.focus();
}

function handleToolAction(e) {
    const tool = $(e.currentTarget).data('tool');
    
    // Visual feedback
    animateButton($(e.currentTarget));
    
    const toolActions = {
        'text': () => console.log('Text formatting options...'),
        'emoji': () => console.log('Emoji picker...'),
        'mention': () => insertMention(),
        'file': () => openFilePicker()
    };
    
    const action = toolActions[tool];
    if (action) action();
}

function handleAssignmentSubmit(e) {
    e.preventDefault();
    
    const formData = {
        comments: $('#submissionText').val(),
        files: selectedFiles,
        assignmentTitle: $('#submitModalTitle').text().replace('Submit: ', '')
    };
    
    console.log('Submitting assignment:', formData);
    
    closeModal();
    showSuccess('Assignment submitted successfully!');
}

function handleLogout() {

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

// Message Management
function sendMessage() {
    const msgContent = elements.messageInput.text().trim();
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

function displayMessage(msg, type) {
    console.log(type);
    const time = new Date(msg.createdAt).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });

    const messageHtml = createMessageHTML(msg, type, time);
    elements.chatMessages.append(messageHtml);
}

function createMessageHTML(msg, type, time) {
    console.log(type);
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

function clearMessageInput() {
    elements.messageInput.html('');
    activeFormats.clear();
    elements.toolbarBtns.removeClass('active');
    elements.sendBtn.prop('disabled', true).css('opacity', '0.5');
}

// UI State Management
function showDiscussions() {
    elements.discussionsContent.css('display', 'flex');
    elements.assignmentContent.hide();
    elements.chatTitle.text('IJSE Group');
    
    updateMessageInput('group', 'Message #general');
    updateContextIndicator('group');
    showMessageInput();
    
    // Load class details
    const classId = localStorage.getItem("classId");
    if (classId) loadClassDetails(classId);
    
    setTimeout(() => scrollToBottom(), 300);
}

function showAssignments() {
    elements.discussionsContent.hide();
    elements.assignmentContent.css('display', 'flex');
    elements.chatTitle.text('Assignments');
    hideMessageInput();
    
    // Load class details
    const classId = localStorage.getItem("classId");
    if (classId) loadClassDetails(classId);
}

function updateChatHeader(userName, avatarUrl) {
    elements.chatTitle.text(userName);
    elements.welcomeName.text(userName);

    const avatarImg = `<img src="${avatarUrl}" alt="${userName}" 
                      style="border-radius: 20%; width: 100%; height: 100%; object-fit: cover;">`;
    
    elements.chatAvatar.html(avatarImg);
    elements.welcomeAvatar.html(avatarImg);
}

function updateMessageInput(type, placeholder) {
    elements.messageInput.attr('data-placeholder', placeholder);
    updatePlaceholderText(placeholder);
    
    $('.message-toolbar, .message-controls').show();
}

function updatePlaceholderText(text) {
    elements.messageInput.attr('data-placeholder', text);
    
    if (elements.messageInput.text().trim() === '') {
        elements.messageInput.addClass('empty');
    } else {
        elements.messageInput.removeClass('empty');
    }
}

function updateContextIndicator(type, name = '') {
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

function showMessageInput() {
    $('.message-input-area').show();
}

function hideMessageInput() {
    $('.message-input-area').hide();
}

// Utility Methods
function scrollToBottom() {
    const chatContent = elements.discussionsContent[0];
    if (chatContent) {
        chatContent.scrollTop = chatContent.scrollHeight;
    }
}

function filterMembers(searchTerm) {
    elements.membersList.find('.section-item').each(function() {
        const name = $(this).find('.user-name').text().toLowerCase();
        $(this).toggle(name.includes(searchTerm));
    });
}

function animateButton($button) {
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

function insertMention() {
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
    
    elements.messageInput.focus();
}

function openFilePicker() {
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

function setupFileUpload(uploadAreaId, inputId) {
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
        handleFileSelection(files);
    });
    
    $fileInput.on('change', (e) => {
        const files = Array.from(e.target.files);
        handleFileSelection(files);
    });
}

function handleFileSelection(files) {
    selectedFiles = [...selectedFiles, ...files];
    updateSelectedFiles();
}

function updateSelectedFiles() {
    // Implementation for updating file display
    console.log('Selected files:', selectedFiles);
}

function closeModal() {
    elements.submitModal.hide();
    $('body').css('overflow', 'auto');
    elements.submitForm[0].reset();
    selectedFiles = [];
}

// Navigation
function navigateTo(url) {
    localStorage.removeItem("classId");
    window.location.href = url;
}

function performLogout() {
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
function showError(message) {
    Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        confirmButtonText: 'OK'
    });
}

function showSuccess(message) {
    Swal.fire({
        title: 'Success!',
        text: message,
        icon: 'success',
        confirmButtonText: 'OK'
    });
}

window.openSubmissionModal = function(assignmentTitle) {
    const submitAssignmentModal = document.getElementById('submitAssignmentModal');
    document.getElementById('submitModalTitle').textContent = `Submit: ${assignmentTitle}`;
    submitAssignmentModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

window.logout = function() {
    handleLogout();
};

// Initialize the app when DOM is ready
$(document).ready(function() {
    // External script dependencies check
    if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
        console.error('Required libraries (SockJS, StompJS) not loaded');
        return;
    }
    
    // Initialize the chat application
    init();
    
    console.log('Chat application initialized successfully');
});