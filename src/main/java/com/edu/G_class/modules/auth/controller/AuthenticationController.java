package com.edu.G_class.modules.auth.controller;

import com.edu.G_class.common.dto.ApiResponse;
import com.edu.G_class.modules.auth.dto.request.AuthenticationRequest;
import com.edu.G_class.modules.auth.dto.request.IntrospectRequest;
import com.edu.G_class.modules.auth.dto.request.OtpRequest;
import com.edu.G_class.modules.auth.dto.request.ResetPasswordRequest;
import com.edu.G_class.modules.auth.dto.response.AuthenticationResponse;
import com.edu.G_class.modules.auth.dto.response.IntrospectResponse;
import com.edu.G_class.modules.auth.service.AuthenticationService;
import com.edu.G_class.modules.auth.service.OtpService;
import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class AuthenticationController {
    AuthenticationService authenticationService;
    OtpService otpService;

    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authenticate(
            @RequestBody @Valid AuthenticationRequest request, HttpServletResponse response){
        return ApiResponse.<AuthenticationResponse>builder()
                .result(authenticationService.authenticate(request, response))
                .build();
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
            throws JOSEException, ParseException {
        return ApiResponse.<IntrospectResponse>builder()
                .result(authenticationService.introspect(request))
                .build();
    }

    @PostMapping("/refresh-token")
    ApiResponse<AuthenticationResponse> refreshToken(@RequestBody HttpServletRequest request)
            throws JOSEException, ParseException {
        return ApiResponse.<AuthenticationResponse>builder()
                .result(authenticationService.refreshToken(request))
                .build();
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authenticationService.logout(request, response);
        return ApiResponse.<Void>builder()
                .message("Logout successfully")
                .build();
    }

    @PostMapping("/send-otp")
    public ApiResponse<Void> sendOtp(@RequestBody @Valid OtpRequest request) {
        otpService.sendOtp(request.email());
        return ApiResponse.<Void>builder()
                .message("The OTP code has been sent, check your email now!")
                .build();
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        otpService.resetPassword(request);
        return ApiResponse.<Void>builder()
                .message("Your password has been reset, please log in again!")
                .build();
    }

    @GetMapping("/outbound/authentication")
    public ApiResponse<AuthenticationResponse> outboundAuthenticate(
            @RequestParam("code") String code,
            @RequestParam(value = "redirectUri", required = false) String redirectUri,
            HttpServletResponse response
    ){
        return ApiResponse.<AuthenticationResponse>builder()
                .result(authenticationService.outboundAuthenticate(code, redirectUri, response))
                .build();
    }
}
