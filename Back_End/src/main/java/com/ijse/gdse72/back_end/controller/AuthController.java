package com.ijse.gdse72.back_end.controller;

import com.ijse.gdse72.back_end.dto.ApiResponse;
import com.ijse.gdse72.back_end.dto.AuthDTO;
import com.ijse.gdse72.back_end.dto.RegisterDTO;
import com.ijse.gdse72.back_end.dto.UpdateUserDTO;
import com.ijse.gdse72.back_end.entity.User;
import com.ijse.gdse72.back_end.service.AuthService;
import com.ijse.gdse72.back_end.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PutMapping("/update/{userId}")
    public ResponseEntity<ApiResponse> updateUser(
            @PathVariable Long userId,
            @RequestBody UpdateUserDTO dto) {

        User updatedUser = authService.updateUser(userId, dto);

        // generate a new token with the updated username
        String newToken = jwtUtil.generateToken(updatedUser.getUsername());

        // return both user and token in the response data
        Map<String, Object> payload = new HashMap<>();
        payload.put("user", updatedUser);
        payload.put("token", newToken);

        return ResponseEntity.ok(new ApiResponse(
                200,
                "Profile Updated Successfully",
                payload
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> registerUser(@RequestBody RegisterDTO registerDTO){
        return ResponseEntity.ok(new ApiResponse(
                200,
                "OK",
                authService.register(registerDTO)
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody AuthDTO authDTO){
        return ResponseEntity.ok(new ApiResponse(
                200,
                "OK",
                authService.authenticate(authDTO)
        ));
    }

//    @PutMapping("/update/{userId}")
//    public ResponseEntity<ApiResponse> updateUser(
//            @PathVariable Long userId,
//            @RequestBody UpdateUserDTO dto) {
//
//        User updatedUser = authService.updateUser(userId, dto);
//        return ResponseEntity.ok(new ApiResponse(
//                200,
//                "Profile Updated Successfully",
//                updatedUser
//        ));
//    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse> getUserById(@PathVariable Long userId) {
        User user = authService.getUserById(userId);

        return ResponseEntity.ok(new ApiResponse(
                200,
                "Get data Successfully",
                user
        ));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@RequestBody Map<String, String> requestBody) {
        String email = requestBody.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(400, "Email is required", null));
        }

        try {
            String result = authService.forgotPassword(email);
            return ResponseEntity.ok(new ApiResponse(200, result, null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404)
                    .body(new ApiResponse(404, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, "Server Error", e.getMessage()));
        }
    }

    @PutMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@RequestBody Map<String, String> requestBody) {
        String email = requestBody.get("email");
        String newPassword = requestBody.get("newPassword");

        if (email == null || email.isEmpty() || newPassword == null || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(new ApiResponse(400, "Email and new password are required", null));
        }

        try {
            authService.resetPasswordByEmail(email, newPassword);
            return ResponseEntity.ok(new ApiResponse(200, "Password updated successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(new ApiResponse(404, e.getMessage(), null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse(500, "Server Error", e.getMessage()));
        }
    }


}
