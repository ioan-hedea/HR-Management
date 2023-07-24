package nl.tudelft.sem.request.microservice.authentication;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Authentication Manager.
 */
@Component
public class AuthManager {
    /**
     * Interfaces with spring security to get the name of the user in the current context.
     *
     * @return The name of the user.
     */
    public String getNetId() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            return "anonymous";
        }

        String netId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (netId == null || netId.trim().isEmpty()) {
            return "anonymous";
        }
        return netId;
    }
}
