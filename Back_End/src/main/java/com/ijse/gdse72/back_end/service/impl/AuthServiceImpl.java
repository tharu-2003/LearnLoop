package com.ijse.gdse72.back_end.service.impl;

import com.ijse.gdse72.back_end.dto.AuthDTO;
import com.ijse.gdse72.back_end.dto.AuthResponseDTO;
import com.ijse.gdse72.back_end.dto.RegisterDTO;
import com.ijse.gdse72.back_end.entity.Role;
import com.ijse.gdse72.back_end.entity.User;
import com.ijse.gdse72.back_end.repository.UserRepository;
import com.ijse.gdse72.back_end.service.AuthService;
import com.ijse.gdse72.back_end.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponseDTO authenticate(AuthDTO authDTO) {
        User user = userRepository.findByEmail(authDTO.getEmail())
                .orElseThrow(
                        () -> new UsernameNotFoundException("Email not found")
                );

        if (!passwordEncoder.matches(
                authDTO.getPassword(),
                user.getPassword())) {

            throw new BadCredentialsException("Incorrect password");
        }
        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponseDTO(
                token,
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getPhoneNumber()
        );
    }

    @Override
    public String register(RegisterDTO registerDTO) {

        if(userRepository.findByEmail(registerDTO.getEmail()).isPresent()) {
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
}
