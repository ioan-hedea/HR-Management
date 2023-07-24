package nl.tudelft.sem.user.microservice.config;

import javax.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.user.commons.entities.utils.Role;
import nl.tudelft.sem.user.microservice.database.entities.UserEntity;
import nl.tudelft.sem.user.microservice.userapi.UserEntityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class PostConstructBean {
    private final transient UserEntityRepository userRepository;
    private final transient boolean bootstrapAdminEnabled;
    private final transient String bootstrapAdminNetId;

    /**
     * Instantiates a new UsersController.
     *
     * @param userRepository the registration service
     */
    @Autowired
    public PostConstructBean(UserEntityRepository userRepository,
                             @Value("${bootstrap.admin.enabled:true}") boolean bootstrapAdminEnabled,
                             @Value("${bootstrap.admin.net-id:ADMIN}") String bootstrapAdminNetId) {
        this.userRepository = userRepository;
        this.bootstrapAdminEnabled = bootstrapAdminEnabled;
        this.bootstrapAdminNetId = bootstrapAdminNetId;
    }

    /**
     * Initialization of ADMIN.
     *
     */
    @PostConstruct
    public void initializeAdmin() {
        if (!bootstrapAdminEnabled) {
            log.info("Bootstrap admin user creation is disabled");
            return;
        }

        String adminNetId = bootstrapAdminNetId == null ? "" : bootstrapAdminNetId.trim();
        if (adminNetId.isEmpty()) {
            log.error("Bootstrap admin netId is empty; skipping initialization");
            return;
        }

        if (userRepository.findByNetId(adminNetId).isPresent()) {
            log.info("Bootstrap admin user '{}' already exists", adminNetId);
            return;
        }

        UserEntity initUser = new UserEntity(adminNetId,
                Role.ADMIN,
                "",
                "IT guy",
                "Administration",
                "User",
                "",
                "");
        userRepository.save(initUser);
        log.warn("Bootstrapped admin user '{}'. Disable BOOTSTRAP_ADMIN_ENABLED after first run.", adminNetId);
    }
}
