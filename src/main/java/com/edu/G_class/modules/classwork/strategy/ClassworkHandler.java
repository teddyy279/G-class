package com.edu.G_class.modules.classwork.strategy;

import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.Classwork;
import com.edu.G_class.enums.ClassworkType;
import com.edu.G_class.modules.classwork.dto.request.ClassworkRequest;

import java.time.LocalDateTime;
import java.time.ZoneId;

public interface ClassworkHandler {
    ClassworkType getType();

    void handle(Classwork classwork, ClassworkRequest request);

    default void validateDueDate(LocalDateTime dueDate) {
        // Dùng cố định timezone Việt Nam — tránh sai khi server chạy UTC (Docker)
        if (dueDate != null && dueDate.isBefore(LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")))) {
            throw new AppException(ErrorCode.INVALID_DUE_DATE);
        }
    }
}
