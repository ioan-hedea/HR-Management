package nl.tudelft.sem.template.authentication.domain.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * A DDD service for registering a new user.
 */
@Service
public class RegistrationService {
    private final transient UserRepository userRepository;
    private final transient PasswordHashingService passwordHashingService;

    /**
     * Instantiates a new UserService.
     *
     * @param userRepository  the user repository
     * @param passwordHashingService the password encoder
     */
    public RegistrationService(UserRepository userRepository, PasswordHashingService passwordHashingService) {
        this.userRepository = userRepository;
        this.passwordHashingService = passwordHashingService;
    }

    /**
     * Register a new user.
     *
     * @param netId    The NetID of the user
     * @param password The password of the user
     * @throws NetIdAlreadyInUseException if the user already exists
     */
    @Transactional
    public AppUser registerUser(NetId netId, Password password) throws NetIdAlreadyInUseException {
        if (!checkNetIdIsUnique(netId)) {
            throw new NetIdAlreadyInUseException(netId);
        }

        HashedPassword hashedPassword = passwordHashingService.hash(password);
        AppUser user = new AppUser(netId, hashedPassword);
        return userRepository.save(user);
    }

    /**
     * Deletes the user when registration in a downstream service fails.
     *
     * @param netId user to rollback
     */
    @Transactional
    public void rollbackRegistration(NetId netId) {
        if (userRepository.existsByNetId(netId)) {
            userRepository.deleteByNetId(netId);
        }
    }

    private boolean checkNetIdIsUnique(NetId netId) {
        return !userRepository.existsByNetId(netId);
    }
}
