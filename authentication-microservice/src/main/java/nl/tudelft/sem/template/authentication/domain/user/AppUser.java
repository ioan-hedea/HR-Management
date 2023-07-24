package nl.tudelft.sem.template.authentication.domain.user;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import javax.persistence.Column;
import javax.persistence.Convert;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;
import lombok.NoArgsConstructor;
import nl.tudelft.sem.template.authentication.authentication.AuthoritiesApi;
import nl.tudelft.sem.template.authentication.authentication.Authority;
import nl.tudelft.sem.template.authentication.domain.HasEvents;
import org.hibernate.Hibernate;
import org.hibernate.annotations.GenericGenerator;



/**
 * A DDD entity representing an application user in our domain.
 */
@Entity
@Table(name = "users")
@NoArgsConstructor
public class AppUser extends HasEvents {
    /**
     * Identifier for the application user.
     */
    @Id
    @GeneratedValue(strategy = javax.persistence.GenerationType.AUTO, generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;
    @Column(name = "net_id", nullable = false, unique = true)
    @Convert(converter = NetIdAttributeConverter.class)
    private NetId netId;
    @Column(name = "password_hash", nullable = false)
    @Convert(converter = HashedPasswordAttributeConverter.class)
    private HashedPassword password;
    @Column(name = "role", nullable = false)
    private Role role = Role.EMPLOYEE;


    /**
     * Create new application user.
     *
     * @param netId    The NetId for the new user
     * @param password The password for the new user
     */
    public AppUser(NetId netId, HashedPassword password) {
        this.netId = netId;
        this.password = password;
        this.recordThat(new UserWasCreatedEvent(netId));
    }

    public void changePassword(HashedPassword password) {
        this.password = password;
        this.recordThat(new PasswordWasChangedEvent(this));
    }

    public NetId getNetId() {
        return netId;
    }

    public HashedPassword getPassword() {
        return password;
    }

    /**
     * Equality is only based on the identifier.
     */
    @Override
    public boolean equals(Object o) {
        if (o == null || id == null || Hibernate.getClass(this) != Hibernate.getClass(o)) {
            return false;
        }
        return this == o || Objects.equals(id, ((AppUser) o).id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(netId);
    }

    public List<Authority> getAuthorityList() {
        return AuthoritiesApi.getAuthoritiesUser(this);
    }


    public Role getRole() {
        return role;
    }

    public void modifyRole(Role newRole) {
        this.role = newRole;
    }


}
