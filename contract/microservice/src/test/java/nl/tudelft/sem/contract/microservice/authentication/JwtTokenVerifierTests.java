package nl.tudelft.sem.contract.microservice.authentication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import org.assertj.core.api.ThrowableAssert;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class JwtTokenVerifierTests {
    private transient JwtTokenVerifier jwtTokenVerifier;

    // Secret needs to be at least 512 bits long and base64 encoded
    // In this case: TEST_SECRET_TEST_SECRET_TEST_SECRET_TEST_SECRET_TEST_SECRET12345 -> base64
    private final String secret = "VEVTVF9TRUNSRVRfVEVTVF9TRUNSRVRfVEVTVF9TRUNSRVRfVEVTVF9TRUNSRVRfVEVTVF9TRUNSRVQxMjM0NQ==";

    @BeforeEach
    public void setup() throws NoSuchFieldException, IllegalAccessException {
        jwtTokenVerifier = new JwtTokenVerifier(secret);
    }

    @Test
    public void validateNonExpiredToken() {
        // Arrange
        String token = generateToken(secret, "user123", -10_000_000, 10_000_000);

        // Act
        boolean actual = jwtTokenVerifier.validateToken(token);

        // Assert
        assertThat(actual).isTrue();
    }

    @Test
    public void validateExpiredToken() {
        // Arrange
        String token = generateToken(secret, "user123", -10_000_000, -5_000_000);

        // Act
        ThrowableAssert.ThrowingCallable action = () -> jwtTokenVerifier.validateToken(token);

        // Assert
        assertThatExceptionOfType(ExpiredJwtException.class)
                .isThrownBy(action);
    }

    @Test
    public void validateTokenIncorrectSignature() {
        // Arrange
        // INCORRECT_SECRET_INCORRECT_SECRET_INCORRECT_SECRET_INCORRECT1234 -> base64
        String incorrectSecret = "SU5DT1JSRUNUX1NFQ1JFVF9JTkNPUlJFQ1RfU0VDUkVUX0lOQ09SUkVDVF9TRUNSRVRfSU5DT1JSRUNUMTIzNA==";
        String token = generateToken(incorrectSecret, "user123", -10_000_000, 10_000_000);

        // Act
        ThrowableAssert.ThrowingCallable action = () -> jwtTokenVerifier.validateToken(token);

        // Assert
        assertThatExceptionOfType(SecurityException.class).isThrownBy(action);
    }

    @Test
    public void validateMalformedToken() {
        // Arrange
        String token = "malformedtoken";

        // Act
        ThrowableAssert.ThrowingCallable action = () -> jwtTokenVerifier.validateToken(token);

        // Assert
        assertThatExceptionOfType(MalformedJwtException.class)
                .isThrownBy(action);
    }

    @Test
    public void parseNetid() {
        // Arrange
        String expected = "user123";
        String token = generateToken(secret, expected, -10_000_000, 10_000_000);

        // Act
        String actual = jwtTokenVerifier.getNetIdFromToken(token);

        // Assert
        assertThat(actual).isEqualTo(expected);
    }

    private String generateToken(String jwtSecret, String netid, long issuanceOffset, long expirationOffset) {
        Map<String, Object> claims = new HashMap<>();
        Key jwtKey = Keys.hmacShaKeyFor(Base64.getDecoder().decode(jwtSecret));
        return Jwts.builder().setClaims(claims).setSubject(netid)
                .setIssuedAt(new Date(System.currentTimeMillis() + issuanceOffset))
                .setExpiration(new Date(System.currentTimeMillis() + expirationOffset))
                .signWith(jwtKey, SignatureAlgorithm.HS512).compact();
    }
}
