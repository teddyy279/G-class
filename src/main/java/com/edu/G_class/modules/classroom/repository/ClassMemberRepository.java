package com.edu.G_class.modules.classroom.repository;

import com.edu.G_class.entity.ClassMember;
import com.edu.G_class.entity.ClassMemberKey;
import com.edu.G_class.entity.Classes;
import com.edu.G_class.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ClassMemberRepository extends JpaRepository<ClassMember, ClassMemberKey> {
    @Query("SELECT cm.clazz FROM ClassMember cm " +
            "JOIN FETCH cm.clazz.owner " +
            "WHERE cm.user.id = :userId " +
            "AND cm.clazz.status = com.edu.G_class.enums.ClassStatus.ACTIVE")
    List<Classes> findAllClassByUserId(@Param("userId") UUID userID);

    @Query("SELECT cm FROM ClassMember cm " +
            "JOIN FETCH cm.user " +
            "JOIN FETCH cm.clazz c " +
            "JOIN FETCH c.owner " +
            "WHERE cm.id.classId = :classId")
    List<ClassMember> findAllByClassIdWithUser(@Param("classId") UUID classId);

    boolean existsByIdClassIdAndIdUserIdAndMemberRole(UUID classId, UUID userId, Role role);

    @Query("SELECT cm.user.id FROM ClassMember cm " +
            "WHERE cm.clazz.id = :classId AND cm.memberRole = 'TEACHER'")
    List<UUID> findTeacherIdsByClassId(@Param("classId") UUID classId);

}
