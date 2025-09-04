document.addEventListener('DOMContentLoaded', function() {
    // ===============================
    // DOM සම්පූර්ණයෙන් load වුනාට පස්සේ මේ block එක chạy වෙයි
    // ===============================

    // Get DOM elements
    // මේවයි HTML වලින් ගෙන ඇත්තේ — ඉන්පසු event handlers වලට භාවිතා කරන්න.
    const navMenuItems = document.querySelectorAll('.nav-menu-item'); // left small nav menu items (Dashboard, Classes, ...)
    const searchInput = document.getElementById('searchInput'); // search field on sidebar
    
    const membersHeader = document.getElementById('membersHeader'); // "Members" header (collapse/expand)
    const membersList = document.getElementById('membersList'); // members <ul> list
    const sidebarItems = document.querySelectorAll('.section-item'); // members list items
    
    const sendBtn = document.getElementById('sendBtn'); // send button (paper plane)
    
    const chatTitle = document.querySelector('.chat-title'); // top chat title showing selected user
    
    const welcomeName = document.querySelector('.welcome-name'); // welcome area name
    const toolbarBtns = document.querySelectorAll('.toolbar-btn'); // formatting toolbar buttons (bold, italic, ...)
    const toolBtns = document.querySelectorAll('.tool-btn'); // small tools (emoji, mention, file, ...)

    // Track active formatting states
    // මෙතනින් ඕනෑම විකල්පයක් active වෙලා තියෙන කිසිවක් track කරන්න Set එකක් භාවිතා කරනවා
    let activeFormats = new Set();

    // ===============================
    // Toolbar formatting buttons වල event handlers
    // ===============================
    toolbarBtns.forEach(btn => {
        // මෙය toolbar button එකකට click කළ විට ක්‍රියා කරන handler එක
        btn.addEventListener('click', function(e) {
            e.preventDefault(); // button default behavior වැළකීම් (form submit වැනි)
            
            const format = this.getAttribute('data-format'); // button එකේ data-format value එක ගන්නවා
            const isCurrentlyActive = this.classList.contains('active'); // මෙය active ද කියලා check කරලා ගන්නවා
            
            // Toggle active state — UI හට 'active' class එක add/remove කරනවා
            this.classList.toggle('active');
            
            if (this.classList.contains('active')) {
                // Button active කරන සිදුවීම — activeFormats set එකට add කරනවා
                activeFormats.add(format);
                // Apply formatting — browser built-in execCommand භාවිතයෙන්
                document.execCommand(format, false, null);
            } else {
                // Button deactivate කරන සිදුවීම — set එකෙන් remove කරනවා
                activeFormats.delete(format);
                // Remove formatting — execCommand එකක් තවමත් same command call කරනවා (toggle behaviour)
                document.execCommand(format, false, null);
            }
            
            // Formatting කරන කොට cursor නැවත message input එකේ තියෙන්න focus කරනවා
            messageInput.focus();
        });
    });

    // ===============================
    // contenteditable div එකේ input event handler
    // ===============================
    messageInput.addEventListener('input', function() {
        // Send button enable/disable කිරීම — empty නොවුණොත් enabled කරනවා
        const hasContent = this.textContent.trim().length > 0;
        sendBtn.disabled = !hasContent;
        sendBtn.style.opacity = hasContent ? '1' : '0.5';
        
        // New text එකට active formatting apply කර ගැනීමට helper function call කරනවා
        applyActiveFormatting();
    });

    // Apply active formatting to newly typed text (sync toolbar state)
    function applyActiveFormatting() {
        // selection / cursor change වෙනකම් කෙටියෙන් setTimeout එකක් දාලා updateFormattingButtons() කැඳවන්නේ
        // (බොහෝ වෙලාවකට DOM update වෙනවද කියලා ඉඩ දීමට)
        setTimeout(() => {
            updateFormattingButtons();
        }, 10);
    }

    // ===============================
    // Shortcut key handling (Ctrl+B / Ctrl+I / Ctrl+U / Enter)
    // ===============================
    messageInput.addEventListener('keydown', function(e) {
        // Ctrl+B for bold
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            const boldBtn = document.querySelector('[data-format="bold"]');
            boldBtn.click(); // reuse the toolbar click logic
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
        
        // Enter key to send message (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // ===============================
    // Formatting buttons update based on cursor/selection position
    // ===============================
    // NOTE: selectionchange is added to the messageInput element here in original code.
    // Some browsers fire selectionchange on document — but this code keeps the original handlers.
    messageInput.addEventListener('selectionchange', updateFormattingButtons);
    messageInput.addEventListener('keyup', updateFormattingButtons);
    messageInput.addEventListener('mouseup', updateFormattingButtons);

    function updateFormattingButtons() {
        // toolbarBtns හි each button එකට 대해 document.queryCommandState() call කරලා check කරයි
        // queryCommandState(format) true වුවහොත් button එක active class එක් කරයි.
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

    // ===============================
    // Sidebar member item click handlers
    // ===============================
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            // සියලු items වලින් active class ඉවත් කරලා
            sidebarItems.forEach(i => i.classList.remove('active'));
            // click කළ item එකට active class එක add කරනවා
            this.classList.add('active');
            
            // chat header සහ welcome message update කරනවා (user name අනුව)
            const userName = this.querySelector('.user-name');
            if (userName) {
                const name = userName.textContent.trim();
                chatTitle.textContent = name; // chat title update
                welcomeName.textContent = name; // welcome name update
                messageInput.setAttribute('data-placeholder', `Message ${name}`); // placeholder update
                
                // welcome message එකේ mention update කරනවා
                const welcomeMessage = document.querySelector('.welcome-message');
                welcomeMessage.innerHTML = `This conversation is just between <span class="mention">@${name}</span> and you.`;
            }
            
            // notification badge hide කිරීම (user select වුණාම)
            const badge = this.querySelector('.notification-badge');
            if (badge) {
                badge.style.display = 'none';
            }
        });
    });

    // ===============================
    // Left navigation small menu clicks (Dashboard, Classes, Document)
    // ===============================
    navMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            navMenuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // menu text console log කරනවා (උදාහරණයක් විදියට)
            const menuText = this.querySelector('.nav-menu-text').textContent;
            console.log(`Navigated to: ${menuText}`);
        });
    });

    // ===============================
    // Search functionality — members filter
    // ===============================
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        sidebarItems.forEach(item => {
            const userName = item.querySelector('.user-name');
            if (userName) {
                const name = userName.textContent.toLowerCase();
                if (name.includes(searchTerm)) {
                    item.style.display = 'flex'; // match වුනොත් show කරන්න
                } else {
                    item.style.display = 'none'; // නොmatch වුනොත් hide කරන්න
                }
            }
        });
        
        // search box empty වුනොත් සියල්ල show කරන්න
        if (searchTerm === '') {
            sidebarItems.forEach(item => {
                item.style.display = 'flex';
            });
        }
    });

    // ===============================
    // Members section collapse / expand
    // ===============================
    membersHeader.addEventListener('click', function() {
        this.classList.toggle('collapsed');
        
        if (this.classList.contains('collapsed')) {
            membersList.style.display = 'none';
        } else {
            membersList.style.display = 'block';
        }
    });

    // ===============================
    // Send message logic
    // ===============================
    function sendMessage() {
        // message variable = formatted HTML (e.g. <b>bold</b>)
        const message = messageInput.innerHTML.trim();
        // textContent variable = plain text (no HTML tags)
        const textContent = messageInput.textContent.trim();
        
        if (textContent) {
            // Demo log — real app එකක් නම් මෙතනින් server එකට POST කරන්න
            console.log(`Sending formatted message: "${message}" to ${chatTitle.textContent}`);
            console.log(`Plain text: "${textContent}"`);
            
            // For demo: clear the input after send
            messageInput.innerHTML = '';
            
            // Clear activeFormats set and toolbar active classes (UI reset)
            activeFormats.clear();
            toolbarBtns.forEach(btn => btn.classList.remove('active'));
            
            // Disable send button back again
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.5';
            
            // (Optional) chat area එකට message add කරන්න addMessageToChat() වැනි function එකක් භාවිතා කළ හැක
            // addMessageToChat(message, 'You');
        }
    }

    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);

    // ===============================
    // Tool buttons (emoji, mention, file, etc.) handlers
    // ===============================
    toolBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tool = this.getAttribute('data-tool');
            console.log(`Tool clicked: ${tool}`);
            
            // Visual feedback animation (short scale/color change)
            this.style.transform = 'scale(0.95)';
            this.style.background = '#404449';
            this.style.color = '#ffffff';
            
            setTimeout(() => {
                this.style.transform = '';
                this.style.background = '';
                this.style.color = '';
            }, 150);
            
            // Handle different tools using switch
            switch(tool) {
                case 'text':
                    console.log('Opening text formatting options...');
                    break;
                case 'emoji':
                    console.log('Opening emoji picker...');
                    // You could implement an emoji popup here
                    break;
                case 'mention':
                    // Insert @ symbol at current cursor position in messageInput
                    const selection = window.getSelection();
                    const range = document.createRange();
                    
                    // Create a text node with '@' and insert it
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
                    
                    // Focus message input again
                    messageInput.focus();
                    break;
                case 'file':
                    console.log('Opening file picker...');
                    // Create hidden file input element and trigger click
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

    // ===============================
    // Initialize send button state (page load time)
    // ===============================
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.5';

    // ===============================
    // Other navigation item click feedback (not sidebar members)
    // ===============================
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Quick visual feedback on click
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

    // ===============================
    // Helper to add hover effects (optional reusable function)
    // ===============================
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

    // ===============================
    // Click feedback for user avatar in left nav
    // ===============================
    document.querySelector('.user-avatar-nav').addEventListener('click', function() {
        console.log('User profile clicked');
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 100);
    });

    // ===============================
    // Simulate real-time notifications (demo only)
    // ===============================
    function simulateNotification() {
        // pick random section-item that is not active
        const items = document.querySelectorAll('.section-item:not(.active)');
        if (items.length > 0) {
            const randomItem = items[Math.floor(Math.random() * items.length)];
            const badge = randomItem.querySelector('.notification-badge');
            
            // increase badge count only if badge exists and is visible
            if (badge && badge.style.display !== 'none') {
                const currentCount = parseInt(badge.textContent) || 1;
                badge.textContent = currentCount + 1;
            }
        }
    }

    // run simulateNotification every 30 seconds (demo)
    setInterval(simulateNotification, 30000);

    console.log('IJSE Slack Interface with Rich Text Formatting initialized successfully!');
});
