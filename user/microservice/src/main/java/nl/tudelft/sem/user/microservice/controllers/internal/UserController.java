package nl.tudelft.sem.user.microservice.controllers.internal;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.user.commons.entities.utils.Role;
import nl.tudelft.sem.user.commons.entities.utils.RoleDto;
import nl.tudelft.sem.user.commons.entities.utils.UserDto;
import nl.tudelft.sem.user.commons.entities.utils.UserModify;
import nl.tudelft.sem.user.commons.entities.utils.UuidDto;
import nl.tudelft.sem.user.microservice.authentication.AuthManager;
import nl.tudelft.sem.user.microservice.database.entities.UserEntity;
import nl.tudelft.sem.user.microservice.exceptions.ActionNotAllowedException;
import nl.tudelft.sem.user.microservice.exceptions.UserNotFoundException;
import nl.tudelft.sem.user.microservice.service.UserService;
import nl.tudelft.sem.user.microservice.userapi.UserEntityRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/internal/user")
public class UserController {
    private final transient UserEntityRepository userEntityRepository;
    private final transient UserService userService;
    private final transient AuthManager authManager;

    /**
     * Constructor.
     *
     * @param userEntityRepository repo of User entities
     * @param userService for different operations
     * @param authManager to retrieve NetId of user
     */
    public UserController(UserEntityRepository userEntityRepository, UserService userService, AuthManager authManager) {
        this.userEntityRepository = userEntityRepository;
        this.userService = userService;
        this.authManager = authManager;
    }


    /**
     * Get a user by its id.
     *
     * @param id the id of the user
     * @return the user with the given id
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserDetail(@PathVariable String id) {
        UserEntity user = userEntityRepository.findById(UUID.fromString(id)).orElseThrow(UserNotFoundException::new);
        UserDto userDto = user.getDto();
        return new ResponseEntity<>(userDto, HttpStatus.OK);
    }

    /**
     * Get a role of the user by its id.
     *
     * @param id the id of the user
     * @return the role of the user with the given id
     */
    @GetMapping("/getRoleByUUID/{id}")
    public ResponseEntity<RoleDto> getRoleByUuid(@PathVariable String id) {
        return ResponseEntity.ok(userEntityRepository
                .findById(UUID.fromString(id)).orElseThrow(UserNotFoundException::new).getRole().getDto());
    }

    /**
     * Get a role of the user by its NetId.
     *
     * @param netId the id of the user
     * @return the role of the user with the given id
     */
    @GetMapping("/getRoleByNetId/{netId}")
    public ResponseEntity<RoleDto> getRoleByNetId(@PathVariable String netId) {
        return ResponseEntity.ok(userEntityRepository
                .findByNetId(netId).orElseThrow(UserNotFoundException::new).getRole().getDto());
    }

    /**
     * Returns UUID of the user based on netId.
     *
     * @param netId of User
     * @return UUID
     */
    @GetMapping("/getUUID/{netId}")
    public ResponseEntity<UuidDto> getUuid(@PathVariable String netId) {
        return ResponseEntity.ok(
                new UuidDto(userEntityRepository.findByNetId(netId).orElseThrow(UserNotFoundException::new).getId()));
    }

    /**
     * Returns the user's DTO object.
     *
     * @param netId of user
     * @return DTO object
     */
    @GetMapping("/getUserDto/{netId}")
    public ResponseEntity<UserDto> getUserDto(@PathVariable String netId) {
        return ResponseEntity.ok(
                userEntityRepository.findByNetId(netId).orElseThrow(UserNotFoundException::new).getDto());
    }

    /**
     * Gets example by id.
     *
     * @return the example found in the database with the given id
     */
    @GetMapping("/getUser/{netId}")
    public ResponseEntity<UserDto> getNetId(@PathVariable String netId) {
        UserEntity user = userEntityRepository.findByNetId(netId).orElseThrow(UserNotFoundException::new);
        UserDto userDto = user.getDto();
        return new ResponseEntity<>(userDto, HttpStatus.OK);
    }

    /**
     * API endpoint for retrieving NetIds.
     *
     * @return Returns all the NetIds in the database.
     */
    @GetMapping("/getAllNetIds")
    public ResponseEntity<List<String>> getAllNetIds() {

        List<UserEntity> netIds = userEntityRepository.findAll();
        return new ResponseEntity<>(netIds.stream().map(UserEntity::getNetId)
                .collect(Collectors.toList()), HttpStatus.OK);
    }

    /**
     * saves User as an empty entity with only the username.
     *
     * @return ok.
     */
    @PostMapping("/saveUser/{netId}")
    public ResponseEntity<UserDto> createUser(@PathVariable String netId) {
        UserEntity user = new UserEntity(netId, Role.CANDIDATE, "", "", "", "", "", "");
        userService.addUser(user);
        return new ResponseEntity<>(user.getDto(), HttpStatus.OK);
    }

    /**
     * updates User with all attributes through a JSON format of the UserDto.
     *
     * @return ok or throws exception if user was not found
     */
    @PostMapping("/updateUser")
    public ResponseEntity<UserDto> updateUser(@Valid @RequestBody UserModify update) {
        UserEntity user = userEntityRepository
                .findByNetId(authManager.getNetId())
                .orElseThrow(UserNotFoundException::new);
        Role role = user.getRole();

        if (!(role.equals(Role.ADMIN) || role.equals(Role.HR))) {
            throw new ActionNotAllowedException("Only HR or ADMIN users can update profiles") { };
        }

        UserEntity userUpdated = userService.updateUser(update);
        UserDto userDto = userUpdated.getDto();
        return new ResponseEntity<>(userDto, HttpStatus.OK);
    }
}
