package com.edu.G_class.modules.auth.repository;

import com.edu.G_class.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, String> {
}
