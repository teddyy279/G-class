package com.edu.G_class.modules.classwork.strategy;

import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.Classwork;
import com.edu.G_class.enums.ClassworkType;
import com.edu.G_class.modules.classwork.dto.request.ClassworkRequest;

import java.time.LocalDateTime;

public interface ClassworkHandler {
    ClassworkType getType();

    void handle(Classwork classwork, ClassworkRequest request);

    default void validateDueDate(LocalDateTime dueDate) {
        if (dueDate != null && dueDate.isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.INVALID_DUE_DATE);
        }
    }
}
