package com.edu.G_class.modules.stream.repository;

import com.edu.G_class.entity.Post;
import com.edu.G_class.enums.Role;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
    @Query("SELECT DISTINCT p FROM Post p " +
            "LEFT JOIN FETCH p.author " +
            "WHERE p.clazz.id = :classId " +
            "AND (:isTeacher = true OR p.isForAll = true OR EXISTS (" +
            "SELECT 1 FROM p.recipients r WHERE r.id = :userId" +
            "))")
    Slice<Post> findStream(
            @Param("classId") UUID classId,
            @Param("userId") UUID userId,
            @Param("isTeacher") boolean isTeacher,
            Pageable pageable
    );

    Optional<Post> findByIdAndClazzId(UUID postId, UUID classId);
}
