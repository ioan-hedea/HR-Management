package nl.tudelft.sem.template.authentication.config;

import javax.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.template.authentication.domain.user.AppUser;
import nl.tudelft.sem.template.authentication.domain.user.NetId;
import nl.tudelft.sem.template.authentication.domain.user.Password;
import nl.tudelft.sem.template.authentication.domain.user.PasswordHashingService;
import nl.tudelft.sem.template.authentication.domain.user.Role;
import nl.tudelft.sem.template.authentication.domain.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class PostConstructBean {

    private final transient UserRepository userRepository;
    private final transient PasswordHashingService passwordHashingService;
    private final transient boolean bootstrapAdminEnabled;
    private final transient String bootstrapAdminNetId;
    private final transient String bootstrapAdminPassword;

    /**
     * Instantiates a new UsersController.
     *
     * @param userRepository   the registration service
     */
    @Autowired
    public PostConstructBean(UserRepository userRepository,
                             PasswordHashingService passwordHashingService,
                             @Value("${bootstrap.admin.enabled:true}") boolean bootstrapAdminEnabled,
                             @Value("${bootstrap.admin.net-id:ADMIN}") String bootstrapAdminNetId,
                             @Value("${bootstrap.admin.password:ChangeMe123!}") String bootstrapAdminPassword) {

        this.userRepository = userRepository;
        this.passwordHashingService = passwordHashingService;
        this.bootstrapAdminEnabled = bootstrapAdminEnabled;
        this.bootstrapAdminNetId = bootstrapAdminNetId;
        this.bootstrapAdminPassword = bootstrapAdminPassword;
    }

    /**
     * Initialization of ADMIN.
     */
    @PostConstruct
    public void initializeAdmin() {
        if (!bootstrapAdminEnabled) {
            log.info("Bootstrap admin user creation is disabled");
            return;
        }

        try {
            NetId adminNetId = new NetId(bootstrapAdminNetId);
            if (userRepository.existsByNetId(adminNetId)) {
                log.info("Bootstrap admin user '{}' already exists", adminNetId);
                return;
            }

            AppUser adminUser = new AppUser(
                    adminNetId,
                    passwordHashingService.hash(new Password(bootstrapAdminPassword))
            );
            adminUser.modifyRole(Role.ADMIN);
            userRepository.save(adminUser);
            log.warn("Bootstrapped admin user '{}'. Disable BOOTSTRAP_ADMIN_ENABLED after first run.", adminNetId);
        } catch (IllegalArgumentException e) {
            log.error("Invalid bootstrap admin configuration: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Failed to initialize bootstrap admin user", e);
        }
    }
}
