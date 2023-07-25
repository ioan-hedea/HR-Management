package nl.tudelft.sem.template.authentication.controllers;

import java.util.UUID;
import javax.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.template.authentication.authentication.JwtTokenGenerator;
import nl.tudelft.sem.template.authentication.authentication.JwtUserDetailsService;
import nl.tudelft.sem.template.authentication.domain.providers.implementations.ClientProvider;
import nl.tudelft.sem.template.authentication.domain.user.NetId;
import nl.tudelft.sem.template.authentication.domain.user.NetIdAlreadyInUseException;
import nl.tudelft.sem.template.authentication.domain.user.Password;
import nl.tudelft.sem.template.authentication.domain.user.RegistrationService;
import nl.tudelft.sem.template.authentication.models.AuthenticationRequestModel;
import nl.tudelft.sem.template.authentication.models.AuthenticationResponseModel;
import nl.tudelft.sem.template.authentication.models.RegistrationRequestModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@Slf4j
public class AuthenticationController {

    private final transient AuthenticationManager authenticationManager;

    private final transient JwtTokenGenerator jwtTokenGenerator;

    private final transient JwtUserDetailsService jwtUserDetailsService;

    private final transient RegistrationService registrationService;

    private final transient ClientProvider clientProvider;

    /**
     * Instantiates a new UsersController.
     *
     * @param authenticationManager the authentication manager
     * @param jwtTokenGenerator     the token generator
     * @param jwtUserDetailsService the user service
     * @param registrationService   the registration service
     */
    @Autowired
    public AuthenticationController(AuthenticationManager authenticationManager,
                                    JwtTokenGenerator jwtTokenGenerator,
                                    JwtUserDetailsService jwtUserDetailsService,
                                    RegistrationService registrationService,
                                    ClientProvider clientProvider) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenGenerator = jwtTokenGenerator;
        this.jwtUserDetailsService = jwtUserDetailsService;
        this.registrationService = registrationService;
        this.clientProvider = clientProvider;
    }

    /**
     * Endpoint for authentication.
     *
     * @param request The login model
     * @return JWT token if the login is successful
     */
    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponseModel> authenticate(
            @Valid @RequestBody AuthenticationRequestModel request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getNetId(),
                            request.getPassword()));
        } catch (DisabledException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "USER_DISABLED", e);
        } catch (BadCredentialsException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", e);
        } catch (UsernameNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "USER_NOT_FOUND", e);
        } catch (AuthenticationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", e);
        }

        try {
            final UserDetails userDetails = jwtUserDetailsService.loadUserByUsername(request.getNetId());
            final String jwtToken = jwtTokenGenerator.generateToken(userDetails);
            return ResponseEntity.ok(new AuthenticationResponseModel(jwtToken));
        } catch (RuntimeException e) {
            log.error("Authentication pipeline failed for netId '{}'", request.getNetId(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Authentication service failure. Check AUTHENTICATION-SERVICE logs.", e);
        }
    }

    /**
     * Endpoint for registration.
     *
     * @param request The registration model
     * @return 200 OK if the registration is successful
     */
    @PostMapping("/register")
    public ResponseEntity<UUID> register(@Valid @RequestBody RegistrationRequestModel request) {
        NetId netId;
        try {
            netId = new NetId(request.getNetId());
            registrationService.registerUser(netId, new Password(request.getPassword()));
        } catch (NetIdAlreadyInUseException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with this NetID already exists", e);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }

        try {
            return ResponseEntity.ok(clientProvider.userClient().user().createUser(netId.toString()).join().getId());
        } catch (Exception e) {
            registrationService.rollbackRegistration(netId);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "User registration succeeded, but syncing with USER-SERVICE failed", e);
        }
    }
}
