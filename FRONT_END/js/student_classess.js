let activeToasts = new Set();
let toastCount = 0;

$(document).ready(function() {
    const currentUser = JSON.parse(localStorage.getItem("current User"));
    if (!currentUser) return;

    $('.user-avatar-nav').text(currentUser.username[0]);
    let allCards = $(); // store original cards for search/filter

    loadAllClasses();

    // ---------------- LOAD CLASSES ----------------
    function loadAllClasses() {
        const token = sessionStorage.getItem("token");
        const cardsGrid = $('#cardsGrid');

        cardsGrid.html(`<div class="class-card loading">
            <div class="card-image placeholder"><i class="fas fa-spinner fa-spin"></i></div>
            <div class="card-content">
                <h3 class="class-name">Loading classes...</h3>
                <div class="student-count"><i class="fas fa-users"></i> <span>Please wait...</span></div>
            </div>
        </div>`);

        $.ajax({
            url: 'http://localhost:8080/api/classes',
            type: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function(response) {
                cardsGrid.empty();

                if (response.code !== 200 || !response.data.length) {
                    cardsGrid.html(`<div class="class-card" style="grid-column:1/-1;text-align:center;">
                        <div class="card-image placeholder">📚</div>
                        <div class="card-content">
                            <h3 class="class-name">No classes found</h3>
                        </div>
                    </div>`);
                    return;
                }

                response.data.forEach(cls => {
                    const studentCount = cls.users ? cls.users.length : 0;
                    const isPublic = cls.priority === 'PUBLIC';
                    const statusBadge = isPublic ? 'status-public' : 'status-private';
                    const statusText = isPublic ? 'Public' : 'Private';

                    const cardHtml = `
                    <div class="class-card" data-class-id="${cls.classId}" data-priority="${cls.priority}" data-passcode="${cls.passcode || ''}">
                        <div class="card-image">
                            <img src="${cls.imageUrl || ''}" alt="${cls.name}" 
                                onerror="$(this).parent().addClass('placeholder').html('📚');">
                            <div class="class-dp">
                                <img src="${cls.createdByAvatarUrl || ''}" alt="Course DP" 
                                    onerror="$(this).parent().html('JS');">
                            </div>
                            <span class="status-badge ${statusBadge}">${statusText}</span>
                        </div>
                        <div class="card-content">
                            <h3 class="class-name">${cls.name}</h3>
                            <div class="teacher-info">
                                <div class="teacher-avatar">
                                    <img src="${cls.createdByAvatarUrl || ''}" alt="Teacher" 
                                        onerror="$(this).parent().html('EM');">
                                </div>
                                <span class="teacher-name">by ${cls.createdByName || 'Unknown'}</span>
                            </div>
                            <div class="class-description">${cls.description || ''}</div>
                            <div class="card-footer">
                                <div class="student-count">
                                    <i class="fas fa-users"></i> 
                                    <span>${studentCount} students</span>
                                </div>
                                <button class="join-btn">
                                    <i class="fas ${isPublic ? 'fa-door-open':'fa-lock'}"></i> Join Class
                                </button>
                            </div>
                        </div>
                    </div>`;

                    cardsGrid.append(cardHtml);
                });

                allCards = $('.class-card').clone(true);
                attachCardEventListeners();
            },

            error: function() {
                cardsGrid.html(`<div class="class-card" style="grid-column:1/-1;text-align:center;">
                    <div class="card-image placeholder">❌</div>
                    <div class="card-content">
                        <h3 class="class-name">Error loading classes</h3>
                    </div>
                </div>`);
            }
        });
    }

    // ---------------- NAVIGATION ----------------
    initializeNavigation();
    function initializeNavigation() {
        const $navItems = $('.nav-menu-item');
        $navItems.on('click', function() {
            $navItems.removeClass('active');
            $(this).addClass('active');
            
            const navText = $(this).find('.nav-menu-text').text();
            if (navText === 'Dashboard') {
                navigateToDashboard();
            } else if(navText === 'Document'){
                // document nav
            } else if(navText === 'LogOut'){
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
        });
    }

    function navigateToDashboard() {
        // localStorage.removeItem("classId");
        window.location.href = '/pages/student_dashboard.html';
    }

    // ---------------- SEARCH FUNCTIONALITY ----------------
    $('#searchInput').on('input', function() {
        const searchTerm = $(this).val().toLowerCase().trim();
        $('#clearSearch').toggle(searchTerm.length > 0);

        if (!searchTerm) {
            $('#cardsGrid').empty().append(allCards.clone(true));
            attachCardEventListeners();
            $('#searchResults').hide();
            $('#noResults').hide();
            return;
        }

        const filtered = allCards.filter(function() {
            const $card = $(this);
            return $card.find('.class-name').text().toLowerCase().includes(searchTerm) ||
                   $card.find('.teacher-name').text().toLowerCase().includes(searchTerm) ||
                   $card.find('.class-description').text().toLowerCase().includes(searchTerm);
        });

        $('#cardsGrid').empty().append(filtered);
        attachCardEventListeners();

        if (!filtered.length) {
            $('#noResults').show();
            $('#searchResults').hide();
        } else {
            $('#searchResults').text(`Found ${filtered.length} class${filtered.length>1?'es':''} for "${searchTerm}"`).show();
            $('#noResults').hide();
        }
    });

    $('#clearSearch').on('click', function() {
        $('#searchInput').val('');
        $('#clearSearch').hide();
        $('#cardsGrid').empty().append(allCards.clone(true));
        attachCardEventListeners();
        $('#searchResults').hide();
        $('#noResults').hide();
    });

    // ---------------- CARD EVENTS ----------------
    function attachCardEventListeners() {
        $('.join-btn').off('click').on('click', function(e) {
            e.stopPropagation();
            const card = $(this).closest('.class-card');
            const classId = card.data('class-id');
            const priority = card.data('priority');
            const className = card.find('.class-name').text();
            const passcode = card.data('passcode');
            const currentUser = JSON.parse(localStorage.getItem("current User"));
            if (!currentUser) return;

            if (priority === 'PUBLIC') {
                // Join public class directly
                $.ajax({
                    url: 'http://localhost:8080/api/classes/join',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ userId: currentUser.userId, classId: classId }),
                    success: function() {
                        showToast(`Joined ${className}`, 'success');
                        setTimeout(() => { navigateToDashboard(); }, 1000);
                    },
                    error: function(xhr) {
                        showToast(xhr.responseJSON?.message || 'Failed to join class', 'error');
                    }
                });
            } else {
                // Show passcode modal first for PRIVATE class
                showModal(className, passcode, classId, currentUser.userId);
            }
        });
    }

    // ---------------- MODAL & PASSCODE ----------------
    function showModal(className, correctPasscode, classId, userId) {
        const modal = $('#passcodeModal');
        const passInput = $('#passcode');
        const errorMsg = $('#errorMessage');

        modal.data('passcode', correctPasscode);
        modal.data('className', className);

        passInput.val('');
        errorMsg.hide();
        modal.addClass('active');
        setTimeout(() => passInput.focus(), 300);

        $('.btn-cancel, .close-btn').off('click').on('click', function() {
            modal.removeClass('active');
        });

        $('.btn-enter').off('click').on('click', function() {
            const entered = passInput.val().trim();
            if (!entered) {
                showError('Please enter a passcode');
                return;
            }
            if (entered === modal.data('passcode')) {
                // Join class after correct passcode
                $.ajax({
                    url: 'http://localhost:8080/api/classes/join',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ userId: userId, classId: classId }),
                    success: function() {
                        showToast(`Joined ${modal.data('className')}`, 'success');
                        modal.removeClass('active');
                        setTimeout(() => { navigateToDashboard(); }, 500);
                    },
                    error: function(xhr) {
                        showToast(xhr.responseJSON?.message || 'Failed to join class', 'error');
                    }
                });
            } else {
                showError('Incorrect passcode. Please try again.');
            }
        });
    }

    function showError(msg) {
        const passInput = $('#passcode');
        const errorMsg = $('#errorMessage');
        errorMsg.text(msg).show();
        passInput.css('border-color', '#ff6b6b');
        passInput.css('animation','shake 0.5s ease-in-out');
        setTimeout(()=>passInput.css('animation',''),500);
    }

    // ---------------- TOAST FUNCTION ----------------
    function showToast(message, type='info', duration=2000) {
        const toast = document.createElement('div');
        const toastId = ++toastCount;
        toast.className = `toast toast-${type}`;
        toast.setAttribute('data-toast-id', toastId);

        const icons = { info:'ℹ️', success:'✅', error:'❌', warning:'⚠️' };
        toast.innerHTML = `<div class="toast-icon">${icons[type]}</div>
            <div class="toast-content"><div class="toast-message">${message}</div></div>
        `;
        document.body.appendChild(toast);
        setTimeout(()=>toast.classList.add('show'),10);
        setTimeout(()=>{ toast.remove(); }, duration);
    }
});
