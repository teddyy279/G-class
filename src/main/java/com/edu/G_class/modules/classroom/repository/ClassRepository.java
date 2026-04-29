package com.edu.G_class.modules.classroom.repository;

import com.edu.G_class.entity.Classes;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClassRepository extends JpaRepository<Classes, UUID> {
    Optional<Classes> findByClassCode(String classCode);
}
