package com.edu.G_class.modules.classwork.repository;

import com.edu.G_class.entity.Classwork;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClassworkRepository extends JpaRepository<Classwork, UUID> {
    Optional<Classwork> findByIdAndClazzId(UUID classworkId, UUID classId);
    java.util.List<Classwork> findAllByClazzId(UUID classId);
}
