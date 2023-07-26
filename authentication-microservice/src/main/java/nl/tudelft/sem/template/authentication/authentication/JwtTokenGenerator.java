package nl.tudelft.sem.template.authentication.authentication;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import nl.tudelft.sem.template.authentication.domain.providers.TimeProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * Generator for JWT tokens.
 */
@Component
public class JwtTokenGenerator {
    private static final int MIN_HS512_SECRET_BYTES = 64;

    /**
     * Time in milliseconds the JWT token is valid for.
     */
    public static final long JWT_TOKEN_VALIDITY = 24 * 60 * 60 * 1000;

    private final transient Key jwtKey;

    /**
     * Time provider to make testing easier.
     */
    private final transient TimeProvider timeProvider;

    /**
     * Construct token generator using Base64 secret from configuration.
     *
     * @param timeProvider Time provider used for issuing and expiring tokens
     * @param jwtSecret Base64-encoded JWT signing secret
     */
    @Autowired
    public JwtTokenGenerator(TimeProvider timeProvider, @Value("${jwt.secret}") String jwtSecret) {
        this.timeProvider = timeProvider;
        byte[] decodedSecret;
        try {
            decodedSecret = Base64.getDecoder().decode(jwtSecret);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("JWT_SECRET must be valid Base64.", e);
        }

        if (decodedSecret.length < MIN_HS512_SECRET_BYTES) {
            throw new IllegalStateException("JWT_SECRET is too short for HS512. "
                    + "Decoded size must be at least 64 bytes.");
        }

        this.jwtKey = Keys.hmacShaKeyFor(decodedSecret);
    }

    /**
     * Generate a JWT token for the provided user.
     *
     * @param userDetails The user details
     * @return the JWT token
     */
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", userDetails.getAuthorities());
        return Jwts.builder().setClaims(claims).setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(timeProvider.getCurrentTime().toEpochMilli()))
                .setExpiration(new Date(timeProvider.getCurrentTime().toEpochMilli() + JWT_TOKEN_VALIDITY))
                .signWith(jwtKey, SignatureAlgorithm.HS512).compact();
    }
}
