package nl.tudelft.sem.template.authentication.domain.user;

import lombok.EqualsAndHashCode;

/**
 * A DDD value object representing a password in our domain.
 */
@EqualsAndHashCode
public class Password {
    private final transient String passwordValue;
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;

    /**
     * Builds a validated password value object.
     *
     * @param password raw password input
     */
    public Password(String password) {
        if (password == null) {
            throw new IllegalArgumentException("Password cannot be null");
        }

        if (password.isBlank()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }

        if (password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("Password must be between 8 and 128 characters");
        }

        this.passwordValue = password;
    }

    @Override
    public String toString() {
        return passwordValue;
    }
}
