package com.edu.G_class.modules.auth.repository;

import com.edu.G_class.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuthenticationRepository extends JpaRepository<InvalidatedToken, UUID> {
}
