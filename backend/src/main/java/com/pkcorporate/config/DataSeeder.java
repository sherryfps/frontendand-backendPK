package com.pkcorporate.config;

import com.pkcorporate.entity.User;
import com.pkcorporate.enums.Role;
import com.pkcorporate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile({"dev", "demo"})
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
    }

    private void seedUsers() {
        createUserIfNotExists("Admin User", "admin@pkcorporate.com", "Admin@123", Role.ADMIN, null);
        createUserIfNotExists("Ravi Kumar", "agent@pkcorporate.com", "Agent@123", Role.AGENT, "AGT-001");
        createUserIfNotExists("Priya Shah", "accountant@pkcorporate.com", "Acc@123", Role.ACCOUNTANT, null);
        createUserIfNotExists("Arjun Mehta", "designer@pkcorporate.com", "Design@123", Role.DESIGNER, null);
        // NOTE: Backdoor account 'sherry/sherry' removed for security
        log.info("✅ PK Corporate ERP — Demo users seeded successfully (dev/demo profile only)");
    }

    private void createUserIfNotExists(String name, String email, String password, Role role, String agentCode) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .role(role)
                    .active(true)
                    .emailVerified(true)
                    .agentCode(agentCode)
                    .commissionRate(role == Role.AGENT ? 4.0 : null)
                    .build();
            userRepository.save(user);
            log.info("Created {} user: {}", role, email);
        }
    }
}
