package com.edu.G_class.modules.notification.handler;

import com.edu.G_class.modules.notification.dto.NotificationRequest;
import com.edu.G_class.modules.notification.dto.NotificationType;

public interface NotificationHandler {
    void handle(Object request);
    boolean supports(NotificationType type);
}
