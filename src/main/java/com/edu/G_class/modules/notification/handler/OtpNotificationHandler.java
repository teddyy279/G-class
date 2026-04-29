package com.edu.G_class.modules.notification.handler;


import com.edu.G_class.modules.notification.dto.NotificationRequest;
import com.edu.G_class.modules.notification.dto.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j


public class OtpNotificationHandler implements NotificationHandler{
    private final JavaMailSender mailSender;

    @Override
    public void handle(Object payload) {
        NotificationRequest request = (NotificationRequest) payload;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("G-class Support <phambaokhue2792004@gmail.com>");
        message.setTo(request.to());
        message.setSubject(request.subject());
        message.setText(request.body());
        mailSender.send(message);
        log.info(">>> The OTP email has been successfully sent!");
    }

    @Override
    public boolean supports(NotificationType type) {
        return type.equals(NotificationType.OTP);
    }
}
