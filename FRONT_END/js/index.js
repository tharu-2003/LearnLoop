// Configuration
const API_BASE_URL = 'http://localhost:8080';
const API_ENDPOINTS = {
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`
};

// jQuery Document Ready Function
$(document).ready(function() {
 
  console.log("Page loaded successfully");
  
  // Check if user is already logged in on page load
  if(isLoggedIn()) {
    const userRole = getCurrentUserRole();
    redirectToDashboard(userRole);
  }
});

// Container and form switching functionality
const container = $(".container");

// Sign up button click
$("#sign-up-btn").click(function(){
  container.addClass("sign-up-mode");
  clearMessages();
  console.log("Switched to sign-up mode");
});

// Sign in button click
$("#sign-in-btn").click(function(){
  container.removeClass("sign-up-mode");
  clearMessages();
  console.log("Switched to sign-in mode");
});

// Toggle password visibility functionality
$(".password-toggle").click(function(){
  const target = $("#" + $(this).data("target"));
  const type = target.attr("type") === "password" ? "text" : "password";
  target.attr("type", type);
  $(this).html(type === "password" ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>');
  console.log("Password visibility toggled for:", $(this).data("target"));
});

// Password strength indicator
$("#signup-password").on("input", function(){
  const val = $(this).val();
  const fill = $("#strength-fill");
  const text = $("#strength-text");
  let strength = 0;
  
  // Check various password criteria
  if(val.length >= 6) strength++; // Length check
  if(/[A-Z]/.test(val)) strength++; // Uppercase letter
  if(/[0-9]/.test(val)) strength++; // Number
  if(/[\W]/.test(val)) strength++; // Special character
  
  // Update strength indicator
  fill.removeClass().addClass("strength-fill");
  
  if(strength === 0 || val.length === 0) {
    fill.addClass("strength-weak");
    text.text("Weak");
  } else if(strength === 1) {
    fill.addClass("strength-fair");
    text.text("Fair");
  } else if(strength === 2 || strength === 3) {
    fill.addClass("strength-good");
    text.text("Good");
  } else if(strength === 4) {
    fill.addClass("strength-strong");
    text.text("Strong");
  }
});

$("#signup-confirm-password").on("input", function() {
          // hideErrorMessages();
          validatePasswordMatch();
});

function validatePasswordMatch() {
  const password = $("#signup-password").val();
  const confirmPassword = $("#signup-confirm-password").val();
  
  // Show error if passwords don't match
  if (confirmPassword.length > 0 && password !== confirmPassword) {
    showPaswordError($("#confirm-password-error"), "Passwords do not match");
  }else if(password == confirmPassword){
    $(" #confirm-password-error").hide();
  }
  
}

function showPaswordError(errorElement, message) {
          errorElement.text(message);
          errorElement.show();
}

// Role toggle functionality (Teacher/Student)
$("#toggleContainer .toggle-button").click(function(e){
  e.preventDefault();
  $("#toggleContainer").toggleClass("on-active");
  const role = $("#toggleContainer").hasClass("on-active") ? "STUDENT" : "TEACHER";
  console.log("Role selected:", role);
});

// Validation helper functions
function validatePhoneNumber(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 9 && cleanPhone.length <= 15;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

function showError(message, formType = 'general') {
  console.error("Error:", message);
  
  if (formType === 'login') {
    $("#login-error").text(message).show();
  } else if (formType === 'signup') {
    $("#signup-error").text(message).show();
  } else {
    // Show general alert for connection errors
    alert(message);
  }
}

function showSuccess(message) {
  $("#success-message").text(message).show();
  console.log("Success:", message);
}

function clearMessages() {
  $("#login-error, #signup-error, #success-message").hide();
}

// Sign Up functionality
$("#signup-btn").click(function(e){
  e.preventDefault();
  
  // Clear previous messages
  clearMessages();
  
  // Get form data
  const username = $("#signup-username").val().trim();
  const email = $("#signup-email").val().trim();
  const phone = $("#signup-phone").val().trim();
  const password = $("#signup-password").val();
  const confirmPassword = $("#signup-confirm-password").val();
  
  console.log("Attempting registration for:", username, email);
  
  // Validation checks
  if(!username || !email || !phone || !password || !confirmPassword){
    showError("Please fill all fields", 'signup');
    return;
  }
  
  if(!validateEmail(email)){
    showError("Please enter a valid email address", 'signup');
    return;
  }
  
  if(!validatePhoneNumber(phone)){
    showError("Please enter a valid phone number (9-15 digits)", 'signup');
    return;
  }
  
  if(!validatePassword(password)){
    showError("Password must be at least 6 characters long", 'signup');
    return;
  }
  
  if(password !== confirmPassword){
    showError("Passwords do not match", 'signup');
    return;
  }
  
  // Get selected role
  const role = $("#toggleContainer").hasClass("on-active") ? "STUDENT" : "TEACHER";
  
  // Button state management
  const btn = $(this);
  const originalText = btn.val();
  btn.val("Signing up...").prop("disabled", true);
  
  // Prepare data - convert phone to string as it might be safer
  const registrationData = {
    username: username,
    email: email,
    phoneNumber: phone, // Send as string to avoid parsing issues
    password: password,
    role: role
  };
  
  console.log("Sending registration data:", registrationData);
  
  // AJAX registration request
  $.ajax({
    url: API_ENDPOINTS.register,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(registrationData),
    timeout: 10000, // 10 second timeout
    success: function(response) {
      console.log("Registration successful:", response);
      
      // Show success message
      showSuccess("Registration successful! You can now sign in.");
      
      // Clear form fields
      $("#signup-username, #signup-email, #signup-phone, #signup-password, #signup-confirm-password").val("");
      $("#strength-indicator").hide();
      
      // Reset role toggle to default (Teacher)
      $("#toggleContainer").removeClass("on-active");
      
      // Auto-switch to sign-in form after 2 seconds
      setTimeout(() => {
        container.removeClass("sign-up-mode");
        $("#success-message").hide();
      }, 2000);
    },
    error: function(xhr, status, error) {
      console.error("Registration failed:", xhr, status, error);
      
      let errorMessage = "Registration failed. Please try again.";
      
      // Handle different error scenarios
      if (status === "timeout") {
        errorMessage = "Request timeout. Please check your connection and try again.";
      } else if (xhr.status === 0) {
        errorMessage = "Cannot connect to server. Please ensure the backend is running.";
      } else if (xhr.responseJSON && xhr.responseJSON.message) {
        errorMessage = xhr.responseJSON.message;
      } else if (xhr.status === 400) {
        errorMessage = "Invalid registration data. Please check your information.";
      } else if (xhr.status === 409) {
        errorMessage = "Email or phone number already exists.";
      } else if (xhr.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      showError(errorMessage, 'signup');
    },
    complete: function() {
      // Reset button state
      btn.val(originalText).prop("disabled", false);
    }
  });
});

// Login functionality
$("#login-btn").click(function(e){
  e.preventDefault();
  
  // Clear previous messages
  clearMessages();
  // Get login data
  const email = $("#email").val().trim();
  const password = $("#login-password").val();
  
  console.log("Attempting login for:", email);
  
  // Validation
  if(!email || !password) {
    showError("Please fill all fields", 'login');
    return;
  }
  
  if(!validateEmail(email)) {
    showError("Please enter a valid email address", 'login');
    return;
  }
  
  // Button state management
  const btn = $(this);
  const originalText = btn.val();
  btn.val("Signing in...").prop("disabled", true);
  
  const loginData = {
    email: email,
    password: password
  };
  
  console.log("Sending login data:", loginData);
  
  // AJAX login request
  $.ajax({
    url: API_ENDPOINTS.login,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(loginData),
    timeout: 10000, // 10 second timeout
    success: function(response) {
      console.log("Login successful:", response);
      
      // Handle different response structures
      let userData;
      if(response.data) {
        userData = response.data; // If wrapped in ApiResponse
      } else if(response.accessToken) {
        userData = response; // Direct response
      } else {
        console.error("Unexpected response structure:", response);
        showError("Login successful but unexpected response format.", 'login');
        return;
      }
      
      // Verify required fields
      if(!userData.accessToken || !userData.role) {
        console.error("Missing required fields in response:", userData);
        showError("Login response missing required information.", 'login');
        return;
      }
      
      // Store user data securely (using variables instead of localStorage)
      window.currentUser = {
       
        userId: userData.userId,
        email: userData.email || email,
        username: userData.username || '',
        role: userData.role,
        phoneNumber: userData.phoneNumber,
        loginTime: new Date().toISOString(),
        avatarUrl: userData.avatarUrl
      };
      
      console.log("User data stored:", window.currentUser);
      localStorage.setItem("current User" , JSON.stringify(currentUser));
      sessionStorage.setItem("token" , userData.accessToken,)
      // Success message
      // alert("Login successful! Redirecting to dashboard...");
      
      // Navigate based on user role
      setTimeout(() => {
        redirectToDashboard(userData.role);
      }, 1000);
    },
    error: function(xhr, status, error) {
      console.error("Login failed:", xhr, status, error);
      
      let errorMessage = "Login failed. Please try again.";
      
      // Handle different error scenarios
      if (status === "timeout") {
        errorMessage = "Request timeout. Please check your connection and try again.";
      } else if (xhr.status === 0) {
        errorMessage = "Cannot connect to server. Please ensure the backend is running.";
      } else if (xhr.responseJSON && xhr.responseJSON.message) {
        errorMessage = xhr.responseJSON.message;
      } else if (xhr.status === 401) {
        errorMessage = "Invalid email or password.";
      } else if (xhr.status === 404) {
        errorMessage = "User not found. Please check your email address.";
      } else if (xhr.status === 403) {
        errorMessage = "Access denied. Your account may be disabled.";
      } else if (xhr.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      showError(errorMessage, 'login');
    },
    complete: function() {
      // Reset button state
      btn.val(originalText).prop("disabled", false);
    }
  });
});

// Utility Functions

// Check if user is logged in
function isLoggedIn() {
  return window.currentUser && window.currentUser.token;
}

// Get current user role
function getCurrentUserRole() {
  return window.currentUser ? window.currentUser.role : null;
}

// Get current user data
function getCurrentUser() {
  return window.currentUser || null;
}

// Redirect to appropriate dashboard
function redirectToDashboard(role) {
  if(role === 'TEACHER') {
    console.log("Redirecting to teacher dashboard");
    window.location.href = '/pages/teacher_dashboard.html';
  } else if(role === 'STUDENT') {
    console.log("Redirecting to student dashboard");
    window.location.href = '/pages/student_dashboard.html';
  } else {
    console.error("Unknown user role:", role);
    showError("Unknown user role: " + role + ". Please contact administrator.");
  }
}

// Logout function
function logout() {
  console.log("Logging out user");
  
  // Clear user data
  window.currentUser = null;
  
  // Redirect to login page
  window.location.href = '/';
}

// Make authenticated AJAX requests
function makeAuthenticatedRequest(url, options = {}) {
  const user = getCurrentUser();
  
  if(!user) {
    console.error("No user logged in");
    alert("Please log in first.");
    window.location.href = '/';
    return;
  }
  
  // Set default options
  options.headers = options.headers || {};
  options.headers['Authorization'] = 'Bearer ' + user.token;
  options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
  
  console.log("Making authenticated request to:", url);
  
  return $.ajax(url, options).fail(function(xhr) {
    // Handle authentication errors
    if(xhr.status === 401 || xhr.status === 403) {
      console.error("Authentication failed, redirecting to login");
      alert("Your session has expired. Please log in again.");
      logout();
    }
  });
}

// Form reset functions
function resetSignUpForm() {
  $("#signup-username, #signup-email, #signup-phone, #signup-password, #signup-confirm-password").val("");
  $("#strength-indicator").hide();
  $("#success-message").hide();
  $("#toggleContainer").removeClass("on-active");
  clearMessages();
}

function resetSignInForm() {
  $("#email, #login-password").val("");
  clearMessages();
}

// Handle browser back button
window.addEventListener('popstate', function(event) {
  if(isLoggedIn()) {
    const userRole = getCurrentUserRole();
    redirectToDashboard(userRole);
  }
});

// Prevent form submission on Enter key (optional)
$("form").on("submit", function(e) {
  e.preventDefault();
  return false;
});

// Handle Enter key press in input fields
$("input").on("keypress", function(e) {
  if(e.which === 13) { // Enter key
    if($(this).closest("form").hasClass("sign-in-form")) {
      $("#login-btn").click();
    } else if($(this).closest("form").hasClass("sign-up-form")) {
      $("#signup-btn").click();
    }
  }
});


// Add retry button click handler
$(document).on('click', '#connection-status.disconnected', function() {
  retryConnection();
});

// Debug function to check current state
function debugCurrentState() {
  console.log("Current State:", {
    isLoggedIn: isLoggedIn(),
    currentUser: getCurrentUser(),
    apiEndpoints: API_ENDPOINTS
  });
}

// Make debug function available globally
window.debugCurrentState = debugCurrentState;

// Console log for debugging
console.log("Authentication script loaded successfully");
console.log("API Endpoints:", API_ENDPOINTS);