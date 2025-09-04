        document.addEventListener('DOMContentLoaded', function() {
            
            // Get DOM elements
            const sidebarItems = document.querySelectorAll('.section-item');
            const navMenuItems = document.querySelectorAll('.nav-menu-item');
            const messageInput = document.getElementById('messageInput');
            const sendBtn = document.getElementById('sendBtn');
            const searchInput = document.getElementById('searchInput');
            const membersHeader = document.getElementById('membersHeader');
            const membersList = document.getElementById('membersList');
            const chatTitle = document.querySelector('.chat-title');
            const welcomeName = document.querySelector('.welcome-name');
            const toolbarBtns = document.querySelectorAll('.toolbar-btn');
            const toolBtns = document.querySelectorAll('.tool-btn');

            // Track active formatting states
            let activeFormats = new Set();

            // Handle toolbar formatting buttons
            toolbarBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const format = this.getAttribute('data-format');
                    const isCurrentlyActive = this.classList.contains('active');
                    
                    // Toggle active state
                    this.classList.toggle('active');
                    
                    if (this.classList.contains('active')) {
                        activeFormats.add(format);
                        // Apply formatting
                        document.execCommand(format, false, null);
                    } else {
                        activeFormats.delete(format);
                        // Remove formatting
                        document.execCommand(format, false, null);
                    }
                    
                    // Focus back to input
                    messageInput.focus();
                });
            });

            // Function to apply formatting
            function applyFormatting(format) {
                // This function is now handled directly in the click event
                // but kept for backward compatibility if needed
                document.execCommand(format, false, null);
            }

            // Handle input in the contenteditable div
            messageInput.addEventListener('input', function() {
                // Update send button state
                const hasContent = this.textContent.trim().length > 0;
                sendBtn.disabled = !hasContent;
                sendBtn.style.opacity = hasContent ? '1' : '0.5';
                
                // Apply active formatting to new text
                applyActiveFormatting();
            });

            // Apply active formatting to newly typed text
            function applyActiveFormatting() {
                // Check current formatting state and sync with active buttons
                setTimeout(() => {
                    updateFormattingButtons();
                }, 10);
            }

            // Handle key events for formatting shortcuts
            messageInput.addEventListener('keydown', function(e) {
                // Ctrl+B for bold
                if (e.ctrlKey && e.key === 'b') {
                    e.preventDefault();
                    const boldBtn = document.querySelector('[data-format="bold"]');
                    boldBtn.click();
                }
                
                // Ctrl+I for italic
                if (e.ctrlKey && e.key === 'i') {
                    e.preventDefault();
                    const italicBtn = document.querySelector('[data-format="italic"]');
                    italicBtn.click();
                }
                
                // Ctrl+U for underline
                if (e.ctrlKey && e.key === 'u') {
                    e.preventDefault();
                    const underlineBtn = document.querySelector('[data-format="underline"]');
                    underlineBtn.click();
                }
                
                // Enter key to send message
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // Update formatting buttons based on cursor position
            messageInput.addEventListener('selectionchange', updateFormattingButtons);
            messageInput.addEventListener('keyup', updateFormattingButtons);
            messageInput.addEventListener('mouseup', updateFormattingButtons);

            function updateFormattingButtons() {
                toolbarBtns.forEach(btn => {
                    const format = btn.getAttribute('data-format');
                    const isActive = document.queryCommandState(format);
                    
                    if (isActive) {
                        btn.classList.add('active');
                        activeFormats.add(format);
                    } else {
                        btn.classList.remove('active');
                        activeFormats.delete(format);
                    }
                });
            }

            // Handle sidebar member item clicks
            sidebarItems.forEach(item => {
                item.addEventListener('click', function() {
                    // Remove active class from all items
                    sidebarItems.forEach(i => i.classList.remove('active'));
                    // Add active class to clicked item
                    this.classList.add('active');
                    
                    // Update chat header and welcome message
                    const userName = this.querySelector('.user-name');
                    if (userName) {
                        const name = userName.textContent.trim();
                        chatTitle.textContent = name;
                        welcomeName.textContent = name;
                        messageInput.setAttribute('data-placeholder', `Message ${name}`);
                        
                        // Update welcome message mention
                        const welcomeMessage = document.querySelector('.welcome-message');
                        welcomeMessage.innerHTML = `This conversation is just between <span class="mention">@${name}</span> and you.`;
                    }
                    
                    // Remove notification badge when user is selected
                    const badge = this.querySelector('.notification-badge');
                    if (badge) {
                        badge.style.display = 'none';
                    }
                });
            });

            // Handle left navigation menu clicks
            navMenuItems.forEach(item => {
                item.addEventListener('click', function() {
                    navMenuItems.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Get the menu text to show different content
                    const menuText = this.querySelector('.nav-menu-text').textContent;
                    console.log(`Navigated to: ${menuText}`);
                });
            });

            // Handle search functionality
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                
                sidebarItems.forEach(item => {
                    const userName = item.querySelector('.user-name');
                    if (userName) {
                        const name = userName.textContent.toLowerCase();
                        if (name.includes(searchTerm)) {
                            item.style.display = 'flex';
                        } else {
                            item.style.display = 'none';
                        }
                    }
                });
                
                // Show all items if search is empty
                if (searchTerm === '') {
                    sidebarItems.forEach(item => {
                        item.style.display = 'flex';
                    });
                }
            });

            // Handle members section collapse/expand
            membersHeader.addEventListener('click', function() {
                this.classList.toggle('collapsed');
                
                if (this.classList.contains('collapsed')) {
                    membersList.style.display = 'none';
                } else {
                    membersList.style.display = 'block';
                }
            });

            // Handle message input and send
            function sendMessage() {
                const message = messageInput.innerHTML.trim();
                const textContent = messageInput.textContent.trim();
                
                if (textContent) {
                    console.log(`Sending formatted message: "${message}" to ${chatTitle.textContent}`);
                    console.log(`Plain text: "${textContent}"`);
                    
                    // Here you would typically send the message to a server
                    // For now, we'll just clear the input and show a console message
                    messageInput.innerHTML = '';
                    
                    // Clear active formats
                    activeFormats.clear();
                    toolbarBtns.forEach(btn => btn.classList.remove('active'));
                    
                    // Update send button state
                    sendBtn.disabled = true;
                    sendBtn.style.opacity = '0.5';
                    
                    // You could add the message to the chat area here
                    // addMessageToChat(message, 'You');
                }
            }

            // Send message on button click
            sendBtn.addEventListener('click', sendMessage);

            // Handle tool buttons (emoji, mention, file, etc.)
            toolBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const tool = this.getAttribute('data-tool');
                    console.log(`Tool clicked: ${tool}`);
                    
                    // Add visual feedback with scale animation
                    this.style.transform = 'scale(0.95)';
                    this.style.background = '#404449';
                    this.style.color = '#ffffff';
                    
                    setTimeout(() => {
                        this.style.transform = '';
                        this.style.background = '';
                        this.style.color = '';
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
                                messageInput.appendChild(atNode);
                                range.setStartAfter(atNode);
                                range.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(range);
                            }
                            
                            messageInput.focus();
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
            });

            // Initialize send button state
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.5';

            // Handle navigation items clicks
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', function() {
                    // Add visual feedback
                    this.style.background = 'rgba(255, 255, 255, 0.1)';
                    this.style.color = '#ffffff';
                    
                    setTimeout(() => {
                        this.style.background = '';
                        this.style.color = '';
                    }, 200);
                    
                    const itemText = this.textContent.trim();
                    console.log(`Navigation item clicked: ${itemText}`);
                });
            });

            // Add hover effects for better UX
            function addHoverEffect(elements, hoverStyle, normalStyle) {
                elements.forEach(element => {
                    element.addEventListener('mouseenter', function() {
                        Object.assign(this.style, hoverStyle);
                    });
                    
                    element.addEventListener('mouseleave', function() {
                        Object.assign(this.style, normalStyle);
                    });
                });
            }


            // Add click feedback to user avatar
            document.querySelector('.user-avatar-nav').addEventListener('click', function() {
                console.log('User profile clicked');
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
            });

            // Simulate real-time notifications (for demo purposes)
            function simulateNotification() {
                const items = document.querySelectorAll('.section-item:not(.active)');
                if (items.length > 0) {
                    const randomItem = items[Math.floor(Math.random() * items.length)];
                    const badge = randomItem.querySelector('.notification-badge');
                    
                    if (badge && badge.style.display !== 'none') {
                        const currentCount = parseInt(badge.textContent) || 1;
                        badge.textContent = currentCount + 1;
                    }
                }
            }

            // Simulate notifications every 30 seconds (for demo)
            setInterval(simulateNotification, 30000);

            console.log('IJSE Slack Interface with Rich Text Formatting initialized successfully!');
        });