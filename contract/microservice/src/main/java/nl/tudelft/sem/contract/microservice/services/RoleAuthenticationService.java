package nl.tudelft.sem.contract.microservice.services;

import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.contract.microservice.authentication.AuthManager;
import nl.tudelft.sem.user.client.UserClient;
import nl.tudelft.sem.user.commons.entities.utils.Role;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class RoleAuthenticationService {
    private final transient AuthManager authManager;
    private final transient UserClient userClient;


    public RoleAuthenticationService(AuthManager authManager, UserClient userClient) {
        this.authManager = authManager;
        this.userClient = userClient;
    }

    /**
     * Get the role of the user.
     *
     * @param neededRole the role needed to access the resource
     * @return true if the user has the needed role
     */
    public boolean hasAtLeastRole(Role neededRole) {
        try {
            String userId = authManager.getNetId();
            Role userRole = userClient.user().getUserRoleNetId(userId).join().getRole();
            return userRole != null && neededRole != null && userRole.getValue() <= neededRole.getValue();
        } catch (Exception e) {
            log.error("Error while authenticating user", e);
            return false;
        }
    }

    public String getNetId() {
        return authManager.getNetId();
    }

    public UUID getUserId() {
        return userClient.user().getUuid(getNetId()).join().getUuid();
    }
}
