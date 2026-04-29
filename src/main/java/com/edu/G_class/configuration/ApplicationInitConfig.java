package com.edu.G_class.configuration;


import com.edu.G_class.common.constant.PredefinedRole;
import com.edu.G_class.entity.Role;
import com.edu.G_class.modules.auth.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class ApplicationInitConfig {
    PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner applicationRunner(RoleRepository roleRepository) {
        return args -> {
            log.info("Starting System Initialization");

            initRoleIfNotExist(roleRepository, PredefinedRole.USER_ROLE, "User role");

            initRoleIfNotExist(roleRepository, PredefinedRole.ADMIN_ROLE, "Admin role");

            //initRoleIfNotExist(roleRepository, PredefinedRole.TEACHER_ROLE, "Teacher role");

            //initRoleIfNotExist(roleRepository, PredefinedRole.CO_TEACHER_ROLE, "CO Teacher role");

        };
    }

    private void initRoleIfNotExist(RoleRepository roleRepository, String roleName, String description) {
        if (!roleRepository.existsById(roleName)) {
            Role role = Role.builder()
                    .name(roleName)
                    .description(description)
                    .build();
            roleRepository.save(role);
        } else {
            log.debug("Role {} already exist", roleName);
        }
    }
}
