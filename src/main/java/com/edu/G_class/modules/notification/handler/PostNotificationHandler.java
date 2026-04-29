package com.edu.G_class.modules.notification.handler;


import com.edu.G_class.modules.notification.dto.NotificationRequest;
import com.edu.G_class.modules.notification.dto.NotificationType;
import com.edu.G_class.modules.notification.repository.NotificationClassMemberRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j

public class PostNotificationHandler implements NotificationHandler{
    private final NotificationClassMemberRepository classMemberRepository;
    private final JavaMailSender mailSender;
    private final org.thymeleaf.TemplateEngine templateEngine;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void handle(Object payload) {
        NotificationRequest request = (NotificationRequest) payload;
        var members = classMemberRepository.findNotificationTargets(request.classId(), request.recipientIds());

        members.stream()
                .filter(member -> !member.getUser().getId().equals(request.authorId()))
                .forEach(member -> {
                    try {
                        MimeMessage mimeMessage = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");

                        org.thymeleaf.context.Context context = new org.thymeleaf.context.Context();
                        context.setVariable("className", "Lớp học của bạn");
                        context.setVariable("content", request.body());
                        context.setVariable("postUrl", frontendUrl + "/classes/" + request.classId());

                        // 2. Render HTML
                        String htmlContent = templateEngine.process("post-notification", context);

                        // 3. Cấu hình Mail
                        helper.setFrom("G-class Support <phambaokhue2792004@gmail.com>");
                        helper.setTo(member.getUser().getEmail());
                        helper.setSubject("[G-Class] Thông báo mới từ lớp học");
                        helper.setText(htmlContent, true); // true để xác nhận đây là HTML

                        mailSender.send(mimeMessage);
                        log.info(">>> [MAIL-SUCCESS] Sent HTML mail to: {}", member.getUser().getEmail());
                    } catch (Exception exception) {
                        log.error(">>> [MAIL-ERROR]: {}", exception.getMessage());
                    }
                });
    }

    @Override
    public boolean supports(NotificationType type) {
        return type.equals(NotificationType.POST);
    }
}
