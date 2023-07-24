package nl.tudelft.sem.user.microservice.service;

import java.util.Objects;
import javax.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.user.commons.entities.utils.Role;
import nl.tudelft.sem.user.commons.entities.utils.UserModify;
import nl.tudelft.sem.user.microservice.database.entities.UserEntity;
import nl.tudelft.sem.user.microservice.exceptions.UserNotFoundException;
import nl.tudelft.sem.user.microservice.userapi.UserEntityRepository;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class UserService {
    private final transient UserEntityRepository userEntityRepository;

    public UserService(UserEntityRepository userEntityRepository) {
        this.userEntityRepository = userEntityRepository;
    }

    public void addUser(String netId) {
        userEntityRepository.save(new UserEntity(netId, Role.EMPLOYEE, "", "", "", "", "", ""));
    }

    /**
     * Adds user to the repository.
     *
     * @param user that we want to store
     */
    public void addUser(UserEntity user) {
        userEntityRepository.save(user);
    }

    /**
     * Updates the User in the repository with new information about him.
     *
     * @param userDto New information that we want to pass on
     */
    public UserEntity updateUser(@Valid UserModify userDto) {
        var user = userEntityRepository.findByNetId(userDto.getNetId())
                .orElseThrow(UserNotFoundException::new);
        UserEntity updatedUser = createUpdatedUser(user, userDto);
        try {
            userEntityRepository.save(updatedUser);
        } catch (Exception e) {
            log.error("Could not save updated user", e);
            throw new IllegalStateException("Could not persist updated user");
        }
        log.debug("Updated user with netId: {}", userDto.getNetId());
        return updatedUser;
    }

    private UserEntity createUpdatedUser(UserEntity user, UserModify userDto) {
        UserEntity updatedUser = new UserEntity();
        updatedUser.setId(user.getId());
        updatedUser.setNetId(userDto.getNetId());
        updatedUser.setAddress(Objects.requireNonNullElseGet(userDto.getAddress(), user::getAddress));
        updatedUser.setDescription(Objects.requireNonNullElseGet(userDto.getDescription(), user::getDescription));
        updatedUser.setRole(Objects.requireNonNullElseGet(userDto.getRole(), user::getRole));
        updatedUser.setFirstName(Objects.requireNonNullElseGet(userDto.getFirstName(), user::getFirstName));
        updatedUser.setLastName(Objects.requireNonNullElseGet(userDto.getLastName(), user::getLastName));
        updatedUser.setEmail(Objects.requireNonNullElseGet(userDto.getEmail(), user::getEmail));
        updatedUser.setPhoneNumber(Objects.requireNonNullElseGet(userDto.getPhoneNumber(), user::getPhoneNumber));
        return updatedUser;
    }


}
