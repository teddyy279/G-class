package com.edu.G_class.modules.classroom.repository;

import com.edu.G_class.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

}
