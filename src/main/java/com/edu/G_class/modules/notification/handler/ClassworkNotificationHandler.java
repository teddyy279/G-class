package com.edu.G_class.modules.notification.handler;

import com.edu.G_class.enums.ClassworkType;
import com.edu.G_class.modules.notification.dto.ClassworkNotificationEvent;
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

public class ClassworkNotificationHandler implements NotificationHandler{
    NotificationClassMemberRepository classMemberRepository;
    JavaMailSender mailSender;
    TemplateEngine templateEngine;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    @lombok.experimental.NonFinal
    String frontendUrl;

    @Override
    public boolean supports(NotificationType type) {
        return type.equals(NotificationType.CLASSWORK);
    }

    @Override
    public void handle(Object payload) {
        ClassworkNotificationEvent event = (ClassworkNotificationEvent) payload;

        var members = classMemberRepository.findNotificationTargets(event.classId(), event.targetStudentIds());

        members.forEach(member -> {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");

                Context context = new Context();
                context.setVariable("authorName", event.authorName());
                context.setVariable("title", event.title());
                context.setVariable("typeLabel", getVietnameseLabel(event.type()));
                context.setVariable("detailUrl", frontendUrl + "/classes/" + event.classId() + "/classworks/" + event.classworkId());

                String htmlContent = templateEngine.process("classwork-notification", context);

                helper.setFrom("G-class Support <phambaokhue2792004@gmail.com>");
                helper.setTo(member.getUser().getEmail());
                helper.setSubject("[" + event.authorName() + "] lớp học");
                helper.setText(htmlContent, true);

                mailSender.send(mimeMessage);
            } catch (Exception exception) {
                log.error(">>> [MAIL-ERROR] Classwork mail failed: {}", exception.getMessage());
            }
        });
    }

    private String getVietnameseLabel(ClassworkType type) {
        return switch (type) {
            case ASSIGNMENT -> "bài tập";
            case MATERIAL -> "tài liệu";
            case QUESTION -> "câu hỏi";
            case QUIZ -> "bài kiểm tra";
        };
    }
}
