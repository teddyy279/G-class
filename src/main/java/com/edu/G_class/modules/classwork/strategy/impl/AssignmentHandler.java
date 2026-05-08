package com.edu.G_class.modules.classwork.strategy.impl;


import com.edu.G_class.entity.Classwork;
import com.edu.G_class.enums.ClassworkType;
import com.edu.G_class.modules.classwork.dto.request.ClassworkRequest;
import com.edu.G_class.modules.classwork.strategy.ClassworkHandler;
import org.springframework.stereotype.Component;

@Component
public class AssignmentHandler implements ClassworkHandler {
    @Override
    public ClassworkType getType() {
        return ClassworkType.ASSIGNMENT;
    }

    @Override
    public void handle(Classwork classwork, ClassworkRequest request) {
        classwork.setMaxPoints(request.maxPoints() != null ? request.maxPoints() : 100);
        validateDueDate(request.dueDate());
        classwork.setDueDate(request.dueDate());
    }
}
