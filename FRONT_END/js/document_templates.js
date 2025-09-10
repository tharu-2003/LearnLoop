        // Toast notification variables
        let toastCount = 0;
        const activeToasts = new Set();

        // Mock data for demonstration - in real app, this would come from localStorage or database
        let savedTemplates = [
            {
                id: 1,
                type: 'notes',
                title: 'Computer Science - Data Structures',
                date: '2025-09-08',
                lastModified: '2 days ago'
            },
            {
                id: 2,
                type: 'exam',
                title: 'Final Examination - Programming',
                date: '2025-09-07',
                lastModified: '3 days ago'
            },
            {
                id: 3,
                type: 'notes',
                title: 'Machine Learning - Algorithms',
                date: '2025-09-06',
                lastModified: '4 days ago'
            },
            {
                id: 4,
                type: 'exam',
                title: 'Mid-term - Database Systems',
                date: '2025-09-05',
                lastModified: '5 days ago'
            }
        ];

        // jQuery document ready function
        $(document).ready(function() {

            const token = sessionStorage.getItem("token")
            const currentUser = JSON.parse(localStorage.getItem("current User"));
            
            if (!token || !currentUser.userId) {
                console.error("No user found, redirecting to login");
                window.location.href = '../index.html';
                return;
            }

            $('.user-avatar-nav').text(currentUser.username[0]);
            let allCards = $();

            loadSavedTemplatesFromAPI(token);

            // Initialize navigation
            initializeNavigation();
            
            // Load saved templates
            loadSavedTemplates();
            
            // Update stats
            updateStats();
            
            // Add animation delays to template cards
            $('.template-card').each(function(index) {
                $(this).css('animation-delay', `${index * 0.2}s`).addClass('fade-in');
            });
            
            // Add click handlers for template buttons
            $('#notes-template-btn').click(function() {
                createNotesTemplate();
            });
            
            $('#exam-template-btn').click(function() {
                createExamTemplate();
            });
            
            // Add hover effects to template cards using jQuery
            $('.template-card').hover(
                function() {
                    // Mouse enter
                    $(this).css('transform', 'translateY(-5px)');
                    $(this).find('.template-btn').css('opacity', '1');
                },
                function() {
                    // Mouse leave
                    $(this).css('transform', 'translateY(0)');
                    $(this).find('.template-btn').css('opacity', '0.9');
                }
            );
        });

        function loadSavedTemplatesFromAPI(token) {
            fetch("http://localhost:8080/auth/documents", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                credentials: "include"
            })
                .then(response => {
                    if (!response.ok) throw new Error("Failed to fetch documents");
                    return response.json();
                })
                .then(data => {
                    savedTemplates = data.map(doc => ({
                        id: doc.documentId,
                        type: doc.documentType.toLowerCase(),
                        title: doc.title,
                        date: doc.createdAt ? doc.createdAt.split("T")[0] : "Unknown",
                        lastModified: doc.updatedAt ? doc.updatedAt.split("T")[0] : "Unknown"
                    }));

                    loadSavedTemplates();
                    updateStats();
                })
                .catch(err => {
                    console.error("Error fetching documents:", err);
                    $("#savedTemplates").html("<div class='no-saved'>Error loading documents.</div>");
                });
        }

        // Left Navigation JavaScript Functions
        function initializeNavigation() {
            $('.nav-menu-item').on('click', function() {
                // Remove active class from all items
                $('.nav-menu-item').removeClass('active');
                
                // Add active class to clicked item
                $(this).addClass('active');
                
                // Get the navigation text
                const navText = $(this).find('.nav-menu-text').text();

                if (navText === 'Dashboard') {
                    navigateToDashboard();
                }else if(navText === 'Classes'){
                    navigateToClasses();
                }else if(navText === 'LogOut'){
                    LogOut();
                }
                
            });
        }

        // Navigation functions
        function navigateToDashboard() {

            const currentUser = JSON.parse(localStorage.getItem("current User"));

            if(currentUser.role == "STUDENT"){
               window.location.href = '/pages/student_dashboard.html'; 
            }else if(currentUser.role == "TEACHER"){
                window.location.href = '/pages/teacher_dashboard.html';
            }
            
        }

        function navigateToClasses() {

            const currentUser = JSON.parse(localStorage.getItem("current User"));
            
            if(currentUser.role == "STUDENT"){
                window.location.href = '/pages/student_classess.html';
            }else if (currentUser.role == "TEACHER"){
                window.location.href = '/pages/teacher_classess.html';
            }
             
             
        }

        function LogOut() {
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
        
        function createNotesTemplate() {
            // In real implementation, this would navigate to the notes template
            // Show a nice notification with toast
            showToast('Navigating to Notes Template...', 'success');

            window.location.href = '/pages/note_template.html';

        }
        
        function createExamTemplate() {
            // In real implementation, this would navigate to the exam template
            showToast('Navigating to Exam Paper Template...', 'success');
            window.location.href = '/pages/paper_template.html';

        }
        
        function openTemplate(id) {
            const template = savedTemplates.find(t => t.id === id);
            if (template) {
                showToast(`Opening: ${template.title}`, 'info');
                // In real implementation:
                // if (template.type === 'notes') {
                //     window.location.href = `notes-template.html?id=${id}`;
                // } else {
                //     window.location.href = `exam-template.html?id=${id}`;
                // }
            }
        }
        
        function deleteTemplate(id) {
            // Use jQuery for confirmation dialog
            const template = savedTemplates.find(t => t.id === id);
            
            if (confirm(`Are you sure you want to delete "${template.title}"?`)) {
                savedTemplates = savedTemplates.filter(t => t.id !== id);
                loadSavedTemplates();
                updateStats();
                showToast('Template deleted successfully!', 'success');
            }
        }
        
        function loadSavedTemplates() {
            const container = $('#savedTemplates');
            
            if (savedTemplates.length === 0) {
                container.html('<div class="no-saved">No saved templates yet. Create your first template above!</div>');
                return;
            }
            
            const templatesHtml = savedTemplates.map(template => `
                <div class="saved-item">
                    <h4>
                        <i class="fas fa-${template.type === 'notes' ? 'sticky-note' : 'file-text'}"></i>
                        ${template.title}
                    </h4>
                    <p>
                        <i class="fas fa-calendar"></i> Created: ${template.date} | 
                        <i class="fas fa-clock"></i> Modified: ${template.lastModified}
                    </p>
                    <div class="saved-actions">
                        <button class="action-btn btn-open" data-id="${template.id}">
                            <i class="fas fa-external-link-alt"></i> Open
                        </button>
                        <button class="action-btn btn-delete" data-id="${template.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
            
            container.html(templatesHtml);
            
            // Add event handlers using jQuery
            $('.btn-open').on('click', function() {
                const id = parseInt($(this).data('id'));
                openTemplate(id);
            });
            
            $('.btn-delete').on('click', function() {
                const id = parseInt($(this).data('id'));
                deleteTemplate(id);
            });
        }
        
        function updateStats() {
            const notesCount = savedTemplates.filter(t => t.type === 'notes').length;
            const examCount = savedTemplates.filter(t => t.type === 'exam').length;
            const totalCount = savedTemplates.length;
            
            // Update stats if elements exist
            const notesElement = $('#notesCount');
            const examElement = $('#examCount');
            const totalElement = $('#totalCount');
            
            if (notesElement.length) notesElement.text(notesCount);
            if (examElement.length) examElement.text(examCount);
            if (totalElement.length) totalElement.text(totalCount);
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
