package nl.tudelft.sem.user.microservice.controllers;

import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.user.microservice.authentication.AuthManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
public class DefaultController {

    private final transient AuthManager authManager;
    /**
     * Instantiates a new controller.
     *
     * @param authManager Spring Security component used to authenticate and authorize the user
     */
    @Autowired
    public DefaultController(AuthManager authManager) {
        this.authManager = authManager;
    }



}
