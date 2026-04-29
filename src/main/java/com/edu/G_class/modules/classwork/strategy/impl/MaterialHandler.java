package com.edu.G_class.modules.classwork.strategy.impl;


import com.edu.G_class.entity.Classwork;
import com.edu.G_class.enums.ClassworkType;
import com.edu.G_class.modules.classwork.dto.request.ClassworkRequest;
import com.edu.G_class.modules.classwork.strategy.ClassworkHandler;
import org.springframework.stereotype.Component;

@Component
public class MaterialHandler implements ClassworkHandler {
    @Override
    public ClassworkType getType() {
        return ClassworkType.MATERIAL;
    }

    @Override
    public void handle(Classwork classwork, ClassworkRequest request) {
        classwork.setMaxPoints(null);
        classwork.setDueDate(null);
        classwork.setExternalLink(null);

        classwork.setCanReply(false);
        classwork.setCanEditAnswer(false);
    }
}
