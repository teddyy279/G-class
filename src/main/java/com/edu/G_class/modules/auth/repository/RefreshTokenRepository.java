package com.edu.G_class.modules.auth.repository;

import com.edu.G_class.entity.RefreshToken;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    @Transactional
    void deleteByToken(String token);

    @Transactional
    Long removeByToken(String token);

    Optional<RefreshToken> findByToken(String token);
}
