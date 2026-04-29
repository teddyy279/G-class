package com.edu.G_class.modules.notification.handler;

import com.edu.G_class.modules.identity.repository.UserRepository;
import com.edu.G_class.modules.notification.dto.NotificationRequest;
import com.edu.G_class.modules.notification.dto.NotificationType;
import com.edu.G_class.modules.notification.repository.NotificationClassMemberRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CommentNotificationHandler implements NotificationHandler {
    NotificationClassMemberRepository classMemberRepository;
    UserRepository userRepository;
    JavaMailSender mailSender;
    TemplateEngine templateEngine;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    @lombok.experimental.NonFinal
    String frontendUrl;

    @Override
    public boolean supports(NotificationType type) {
        return type.equals(NotificationType.COMMENT);
    }

    @Override
    public void handle(Object payload) {
        NotificationRequest request = (NotificationRequest) payload;

        var author = userRepository.findById(request.authorId())
                .orElseThrow(() -> new RuntimeException("Author not found"));

        var targets = classMemberRepository.findNotificationTargets(
                request.classId(),
                request.recipientIds()
        );

        targets.forEach(target -> {
            if (!target.getUser().getId().equals(request.authorId())) {
                sendEmail(target.getUser().getEmail(), author.getFullName(), request);
            }
        });
    }

    private void sendEmail(String toEmail, String authorName, NotificationRequest request) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");

            Context context = new Context();
            context.setVariable("authorName", authorName);
            context.setVariable("content", request.body());

            String detailUrl = buildDetailUrl(request);
            context.setVariable("detailUrl", detailUrl);

            String htmlContent = templateEngine.process("comment-notification", context);

            helper.setFrom("G-class Notification <phambaokhue2792004@gmail.com>");
            helper.setTo(toEmail);
            helper.setSubject("[" + authorName + "] đã thêm một nhận xét");
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
        } catch (Exception e) {
            log.error(">>> [MAIL-ERROR] Failed to send comment mail to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildDetailUrl(NotificationRequest request) {
        String baseUrl = frontendUrl + "/classes/" + request.classId();
        if (request.classworkId() != null) {
            return baseUrl + "/classworks/" + request.classworkId();
        }
        if (request.postId() != null) {
            return baseUrl + "/posts/" + request.postId();
        }
        return baseUrl;
    }
}