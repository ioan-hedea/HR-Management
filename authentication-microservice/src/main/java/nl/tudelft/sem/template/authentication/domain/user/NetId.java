package nl.tudelft.sem.template.authentication.domain.user;

import lombok.EqualsAndHashCode;

/**
 * A DDD value object representing a NetID in our domain.
 */
@EqualsAndHashCode
public class NetId {
    private final transient String netIdValue;
    private static final int MAX_LENGTH = 20;

    /**
     * Builds a validated NetID value object.
     *
     * @param netId raw NetID input
     */
    public NetId(String netId) {
        if (netId == null) {
            throw new IllegalArgumentException("NetID cannot be null");
        }

        String normalizedNetId = netId.trim();
        if (normalizedNetId.isEmpty()) {
            throw new IllegalArgumentException("NetID cannot be empty");
        }

        if (normalizedNetId.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("NetID cannot exceed 20 characters");
        }

        this.netIdValue = normalizedNetId;
    }

    @Override
    public String toString() {
        return netIdValue;
    }
}
