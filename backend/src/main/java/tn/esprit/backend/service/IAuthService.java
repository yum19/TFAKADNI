package tn.esprit.backend.service;

import tn.esprit.backend.dto.request.*;
import tn.esprit.backend.dto.response.*;

public interface IAuthService {
    AuthResponse    register(RegisterRequest request, String deviceInfo, String ip);
    AuthResponse    login(LoginRequest request, String deviceInfo, String ip);
    void            logout(String tokenHash);
    AuthResponse    refresh(RefreshTokenRequest request, String deviceInfo, String ip);
    void            forgotPassword(ForgotPasswordRequest request);
    void            resetPassword(ResetPasswordRequest request);
}