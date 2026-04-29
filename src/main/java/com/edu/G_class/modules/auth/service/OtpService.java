package com.edu.G_class.modules.auth.service;

import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.User;
import com.edu.G_class.modules.auth.dto.request.ResetPasswordRequest;
import com.edu.G_class.modules.identity.repository.UserRepository;
import com.edu.G_class.modules.notification.dto.NotificationRequest;
import com.edu.G_class.modules.notification.producer.NotificationProducer;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class OtpService {
    StringRedisTemplate redisTemplate;
    JavaMailSender mailSender;
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    NotificationProducer notificationProducer;

    public void sendOtp(String email) {
        String lockKey = "otp_lock:" + email;

        if(!userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        if (Boolean.TRUE.equals(redisTemplate.hasKey(lockKey))) {
            throw new AppException(ErrorCode.OTP_TOO_MANY_REQUESTS);
        }
        String otp = String.format("%06d", new Random().nextInt(1000000));

        String redisKey = "otp:" + email; //Lưu vào Redis: Key là "otp:email"
        redisTemplate.opsForValue().set(redisKey, otp, 2, TimeUnit.MINUTES);

        redisTemplate.opsForValue().set(lockKey, "true", 60, TimeUnit.SECONDS);

        var notificationRequest = NotificationRequest.builder()
                .to(email)
                .subject("Mã xác thực OTP - G-class")
                .body("Mã OTP để đặt lại mật khẩu của bạn là: " + otp + "\nMã này có hiệu lực trong 2 phút.")
                .build();

        notificationProducer.sendOtpMessage(notificationRequest);
    }

    public void resetPassword(ResetPasswordRequest request) {
        String redisKey = "otp:" + request.email();

        String savedOtp = redisTemplate.opsForValue().get(redisKey);
        if(savedOtp == null) {
            throw new AppException(ErrorCode.EXPIRED_OTP);
        }

        if(!savedOtp.equals(request.otp())) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        redisTemplate.delete(redisKey);
    }
}
