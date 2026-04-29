package com.edu.G_class.modules.notification.handler;

import com.edu.G_class.modules.notification.dto.NotificationRequest;
import com.edu.G_class.modules.notification.dto.NotificationType;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j

public class InviteNotificationHandler implements NotificationHandler{
    private final JavaMailSender mailSender;

    @Override
    public void handle(Object payload) {
        NotificationRequest request = (NotificationRequest) payload;

        MimeMessage mimeMessage = mailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom("G-class Support <phambaokhue2792004@gmail.com>");
            helper.setSubject(request.subject());
            helper.setTo(request.to());

            String htmlContent = buildInviteHtml(request.body());

            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info(">>> Email HTML mời vào lớp đã gửi thành công!");
        } catch (Exception exception ) {
            log.error(">>> Lỗi gửi mail HTML: {}", exception.getMessage());
        }
    }

    @Override
    public boolean supports(NotificationType type) {
        return type.equals(NotificationType.INVITE);
    }

    private String buildInviteHtml(String body) {
        String inviteLink = body.contains(": ") ? body.split(": ")[1] : body;

        return "<html>" +
                "<body style='font-family: Arial, sans-serif; text-align: center;'>" +
                "<div style='border: 1px solid #ddd; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto;'>" +
                "<img src='https://static.thenounproject.com/png/3432655-200.png' width='50' />" +
                "<h2>Google Classroom</h2>" +
                "<p>Bạn đã được mời tham gia lớp học với vai trò <b>TEACHER</b></p>" +
                "<div style='margin: 30px 0;'>" +
                "<a href='" + inviteLink + "' " +
                "style='background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;'>" +
                "Tham gia lớp học</a>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }
}
