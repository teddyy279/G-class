package com.edu.G_class.modules.comment.repository;

import com.edu.G_class.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    @Query("SELECT DISTINCT c.author.id FROM Comment c " +
            "WHERE c.classwork.id = :classworkId " +
            "AND c.isPrivate = false")
    List<UUID> findParticipantIdsByClassworkId(@Param("classworkId") UUID classworkId);

    List<Comment> findByPostIdOrderByCreatedAtAsc(UUID postId);

    List<Comment> findByClassworkIdOrderByCreatedAtAsc(UUID classworkId);

    List<Comment> findByClassworkIdAndIsPrivateOrderByCreatedAtAsc(UUID classworkId, boolean isPrivate);
}
