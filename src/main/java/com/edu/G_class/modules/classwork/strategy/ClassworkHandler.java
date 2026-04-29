package com.edu.G_class.modules.classwork.strategy;

import com.edu.G_class.entity.Classwork;
import com.edu.G_class.enums.ClassworkType;
import com.edu.G_class.modules.classwork.dto.request.ClassworkRequest;

public interface ClassworkHandler {
    ClassworkType getType();

    void handle(Classwork classwork, ClassworkRequest request);
}
