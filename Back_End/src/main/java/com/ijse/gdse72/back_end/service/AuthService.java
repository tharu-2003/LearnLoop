package com.ijse.gdse72.back_end.service;

import com.ijse.gdse72.back_end.dto.AuthDTO;
import com.ijse.gdse72.back_end.dto.AuthResponseDTO;
import com.ijse.gdse72.back_end.dto.RegisterDTO;
import com.ijse.gdse72.back_end.dto.UpdateUserDTO;
import com.ijse.gdse72.back_end.entity.User;

public interface AuthService {

    AuthResponseDTO authenticate(AuthDTO authDTO);
    String register(RegisterDTO registerDTO);
    User updateUser(Long userId, UpdateUserDTO dto);
    User getUserById(Long userId);
}
