package com.edu.G_class.modules.notification.repository;

import com.edu.G_class.entity.ClassMember;
import com.edu.G_class.entity.ClassMemberKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificationClassMemberRepository extends JpaRepository<ClassMember, ClassMemberKey> {
    // Lấy tất cả thành viên (gửi cho tất cả khi không chỉ định recipients)
    @Query("SELECT cm FROM ClassMember cm " +
           "JOIN FETCH cm.user " +
           "WHERE cm.id.classId = :classId " +
           "AND (cm.memberRole = 'TEACHER' OR cm.id.userId IN :recipients)")
    List<ClassMember> findNotificationTargetsWithList(@Param("classId") UUID classId, @Param("recipients") List<UUID> recipients);

    // Lấy tất cả thành viên khi recipients là null (gửi cho tất cả)
    @Query("SELECT cm FROM ClassMember cm " +
           "JOIN FETCH cm.user " +
           "WHERE cm.id.classId = :classId")
    List<ClassMember> findAllMembersInClass(@Param("classId") UUID classId);

    default List<ClassMember> findNotificationTargets(UUID classId, List<UUID> recipients) {
        if (recipients == null || recipients.isEmpty()) {
            return findAllMembersInClass(classId);
        }
        return findNotificationTargetsWithList(classId, recipients);
    }
}
