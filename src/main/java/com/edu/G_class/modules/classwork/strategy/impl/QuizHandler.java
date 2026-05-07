package com.edu.G_class.modules.classwork.strategy.impl;

import com.edu.G_class.entity.Classwork;
import com.edu.G_class.enums.ClassworkType;
import com.edu.G_class.modules.classwork.dto.request.ClassworkRequest;
import com.edu.G_class.modules.classwork.strategy.ClassworkHandler;
import org.springframework.stereotype.Component;

@Component

public class QuizHandler implements ClassworkHandler {
    @Override
    public ClassworkType getType() {
        return ClassworkType.QUIZ;
    }

    @Override
    public void handle(Classwork classwork, ClassworkRequest request) {
        //classwork.setDueDate(request.dueDate());
        validateDueDate(request.dueDate());
        classwork.setMaxPoints(request.maxPoints() != null ? request.maxPoints() : 100);
        classwork.setExternalLink(request.externalLink());
    }
}
