package com.edu.G_class.modules.classwork.strategy.impl;

import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.Classwork;
import com.edu.G_class.enums.ClassworkType;
import com.edu.G_class.modules.classwork.dto.request.ClassworkRequest;
import com.edu.G_class.modules.classwork.dto.response.ClassworkResponse;
import com.edu.G_class.modules.classwork.strategy.ClassworkHandler;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor

public class QuestionHandler implements ClassworkHandler {
    private final ObjectMapper objectMapper;

    @Override
    public ClassworkType getType() {
        return ClassworkType.QUESTION;
    }

    @Override
    public void handle(Classwork classwork, ClassworkRequest request) {
        //classwork.setDueDate(request.dueDate());
        validateDueDate(request.dueDate());
        classwork.setQuestionType(request.questionType());
        classwork.setCanReply(request.canReply());
        classwork.setCanEditAnswer(request.canEditAnswer());

        if(request.options() != null) {
            try {
                classwork.setOptionsJson(objectMapper.writeValueAsString(request.options()));
            } catch (JsonProcessingException exception) {
                throw new AppException(ErrorCode.INVALID_DATA);
            }
        }
    }
}
