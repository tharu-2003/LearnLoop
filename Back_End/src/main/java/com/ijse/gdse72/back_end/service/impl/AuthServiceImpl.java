package com.ijse.gdse72.back_end.service.impl;

import com.ijse.gdse72.back_end.dto.AuthDTO;
import com.ijse.gdse72.back_end.dto.AuthResponseDTO;
import com.ijse.gdse72.back_end.dto.RegisterDTO;
import com.ijse.gdse72.back_end.dto.UpdateUserDTO;
import com.ijse.gdse72.back_end.entity.User;
import com.ijse.gdse72.back_end.repository.UserRepository;
import com.ijse.gdse72.back_end.service.AuthService;
import com.ijse.gdse72.back_end.service.EmailService;
import com.ijse.gdse72.back_end.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Override
    public AuthResponseDTO authenticate(AuthDTO authDTO) {
        User user = userRepository.findByEmail(authDTO.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Email not found"));

        if (!passwordEncoder.matches(authDTO.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Incorrect password");
        }

        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponseDTO(
                token,
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getPhoneNumber(),
                user.getAvatarUrl()
        );
    }

    @Override
    public String register(RegisterDTO registerDTO) {
        if (userRepository.findByEmail(registerDTO.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .username(registerDTO.getUsername())
                .email(registerDTO.getEmail())
                .phoneNumber(registerDTO.getPhoneNumber())
                .password(passwordEncoder.encode(registerDTO.getPassword()))
                .role(registerDTO.getRole())
                .build();

        userRepository.save(user);
        return "User Registration Success";
    }

    @Override
    public User updateUser(Long userId, UpdateUserDTO dto) {
        User user = userRepository.findById(Math.toIntExact(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getUsername() != null) user.setUsername(dto.getUsername());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getPhoneNumber() != null) user.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getAvatarUrl() != null) user.setAvatarUrl(dto.getAvatarUrl());

        return userRepository.save(user);
    }

    @Override
    public User getUserById(Long userId) {
        return userRepository.findById(Math.toIntExact(userId)).orElse(null);
    }

    @Override
    public String forgotPassword(String email) {
        // Clean quotes if present
        if (email != null && email.startsWith("\"") && email.endsWith("\"")) {
            email = email.substring(1, email.length() - 1);
        }

        System.out.println("🔑 Forgot password request for: " + email);

        String finalEmail = email;
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + finalEmail));

        // Generate reset link
//        String resetLink = "http://127.0.0.1:5501/pages/forget_password_page_3.html?email=" +
//                URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8);

        // Generate expiration timestamp (example: 15 minutes from now)
        long expiresAt = System.currentTimeMillis() + 2 * 60 * 1000; // 2 minutes in ms

        // Add expires parameter to reset link
        String resetLink = "http://127.0.0.1:5501/pages/forget_password_page_3.html?email=" +
                        URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8) + "&expires=" + expiresAt;


        // Build HTML email
        String htmlContent = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset - LearnLoop.lk</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        min-height: 100vh;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .email-card {
                        background: white;
                        border-radius: 20px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                        overflow: hidden;
                        margin: 40px 0;
                    }
                    .header {
                        background: linear-gradient(135deg, #4a67d8 0%%, #6c5ce7 100%%);
                        padding: 40px 30px;
                        text-align: center;
                        color: white;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    .header .icon {
                        font-size: 48px;
                        margin-bottom: 20px;
                        display: block;
                    }
                    .content {
                        padding: 40px 30px;
                        line-height: 1.6;
                        color: #333;
                    }
                    .greeting {
                        font-size: 18px;
                        color: #4a67d8;
                        font-weight: 600;
                        margin-bottom: 20px;
                    }
                    .message {
                        font-size: 16px;
                        margin-bottom: 30px;
                        color: #555;
                    }
                    .reset-button {
                        display: inline-block;
                        background: linear-gradient(135deg, #4a67d8 0%%, #6c5ce7 100%%);
                        color: white !important;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 50px;
                        font-weight: 600;
                        font-size: 16px;
                        text-align: center;
                        box-shadow: 0 8px 25px rgba(74, 103, 216, 0.3);
                        transition: all 0.3s ease;
                        border: none;
                        cursor: pointer;
                    }
                    .reset-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 12px 35px rgba(74, 103, 216, 0.4);
                    }
                    .button-container {
                        text-align: center;
                        margin: 30px 0;
                    }
                    .link-fallback {
                        background: #f8f9fa;
                        border-radius: 12px;
                        padding: 20px;
                        margin: 30px 0;
                        border-left: 4px solid #4a67d8;
                    }
                    .link-fallback p {
                        margin: 0 0 10px 0;
                        font-size: 14px;
                        color: #666;
                    }
                    .link-text {
                        word-break: break-all;
                        color: #4a67d8;
                        font-family: 'Courier New', monospace;
                        font-size: 13px;
                        background: #f0f2ff;
                        padding: 8px;
                        border-radius: 6px;
                    }
                    .footer {
                        background: #f8f9fa;
                        padding: 30px;
                        text-align: center;
                        border-top: 1px solid #eee;
                    }
                    .footer p {
                        margin: 0;
                        font-size: 14px;
                        color: #888;
                    }
                    .security-note {
                        background: linear-gradient(135deg, #fff3cd 0%%, #ffeaa7 100%%);
                        border-radius: 12px;
                        padding: 20px;
                        margin: 30px 0;
                        border-left: 4px solid #f39c12;
                    }
                    .security-note .icon {
                        display: inline-block;
                        margin-right: 8px;
                    }
                    @media (max-width: 600px) {
                        .container {
                            padding: 10px;
                        }
                        .content {
                            padding: 30px 20px;
                        }
                        .header {
                            padding: 30px 20px;
                        }
                        .header h1 {
                            font-size: 24px;
                        }
                        .reset-button {
                            padding: 14px 28px;
                            font-size: 15px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="email-card">
                        <div class="header">
                            <span class="icon">🔐</span>
                            <h1>Password Reset Request</h1>
                        </div>
                        
                        <div class="content">
                            <div class="greeting">Hello there! 👋</div>
                            
                            <div class="message">
                                We received a request to reset your password for <strong style="color: #4a67d8;">%s</strong>.
                                <br><br>
                                Don't worry, it happens to the best of us! Click the button below to create a new password and get back to your learning journey.
                            </div>
                            
                            <div class="button-container">
                                <a href="%s" class="reset-button">
                                    🚀 Reset My Password
                                </a>
                            </div>
                            
                            <div class="link-fallback">
                                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                                <div class="link-text">%s</div>
                            </div>
                            
                            <div class="security-note">
                                <span class="icon">⚠️</span>
                                <strong>Security Note:</strong> This link will expire for your security. If you didn't request this password reset, please ignore this email - your account is safe.
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>
                                <strong>LearnLoop.lk</strong> - Your Gateway to Knowledge<br>
                                This is an automated email, please do not reply directly.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(user.getEmail(), resetLink, resetLink);

        // Send email
        try {
            emailService.sendHtmlEmail(
                    user.getEmail(),
                    "🔒 Password Reset Request - LearnLoop.lk",
                    htmlContent
            );
            System.out.println("✅ Password reset email sent to " + user.getEmail());
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to send reset email. Check SMTP config.");
        }

        return "Password reset email sent to " + user.getEmail();
    }

    @Override
    public void resetPasswordByEmail(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User with this email not found"));

        // Hash password before saving
        String hashedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(hashedPassword);

        userRepository.save(user);
    }
}