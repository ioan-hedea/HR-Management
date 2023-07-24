package nl.tudelft.sem.user.microservice.database.entities;

import java.util.UUID;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import nl.tudelft.sem.user.commons.entities.utils.Role;
import nl.tudelft.sem.user.commons.entities.utils.UserDto;
import nl.tudelft.sem.user.microservice.database.entities.utils.BaseEntity;
import org.modelmapper.ModelMapper;

@AllArgsConstructor
@Getter
@Setter
@Entity
@NoArgsConstructor
public class UserEntity extends BaseEntity<UserDto> {
    @Column(nullable = false, unique = true)
    private String netId;
    @Enumerated
    @Column(nullable = false)
    private Role role;
    @Column(nullable = false)
    private String address;
    private String description;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;

    @Override
    public UserDto getDto() {
        return new ModelMapper().map(this, UserDto.class);
    }

    public UUID getUuid() {
        return super.getId();
    }

    public Role getRole() {
        return role;
    }
}
