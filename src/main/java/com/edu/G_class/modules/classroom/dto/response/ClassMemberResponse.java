package com.edu.G_class.modules.classroom.dto.response;


import java.util.List;

public record ClassMemberResponse(
        List<MemberResponse> teachers,
        List<MemberResponse> students
) {}
