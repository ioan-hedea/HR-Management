package nl.tudelft.sem.user.commons.entities.utils;

import com.fasterxml.jackson.annotation.JsonView;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * User Data transfer object.
 */
@NoArgsConstructor
@AllArgsConstructor
@JsonView(Views.Public.class)
public class UserDto implements Dto {
    private UUID id;
    private String netId;
    private Role role;
    private String address;
    private String description;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getNetId() {
        return netId;
    }

    public void setNetId(String netId) {
        this.netId = netId;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public static UserDtoBuilder builder() {
        return new UserDtoBuilder();
    }


    public static class UserDtoBuilder {
        private transient UUID id;
        private transient String netIdField;
        private transient Role roleField;
        private transient String addressField;
        private transient String descriptionField;
        private transient String firstNameField;
        private transient String lastNameField;
        private transient String emailField;
        private transient String phoneNumberField;

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getNetIdField() {
            return netIdField;
        }

        public void setNetIdField(String netIdField) {
            this.netIdField = netIdField;
        }

        public Role getRoleField() {
            return roleField;
        }

        public void setRoleField(Role roleField) {
            this.roleField = roleField;
        }

        public String getAddressField() {
            return addressField;
        }

        public void setAddressField(String addressField) {
            this.addressField = addressField;
        }

        public String getDescriptionField() {
            return descriptionField;
        }

        public void setDescriptionField(String descriptionField) {
            this.descriptionField = descriptionField;
        }

        public String getFirstNameField() {
            return firstNameField;
        }

        public void setFirstNameField(String firstNameField) {
            this.firstNameField = firstNameField;
        }

        public String getLastNameField() {
            return lastNameField;
        }

        public void setLastNameField(String lastNameField) {
            this.lastNameField = lastNameField;
        }

        public String getEmailField() {
            return emailField;
        }

        public void setEmailField(String emailField) {
            this.emailField = emailField;
        }

        public String getPhoneNumberField() {
            return phoneNumberField;
        }

        public void setPhoneNumberField(String phoneNumberField) {
            this.phoneNumberField = phoneNumberField;
        }

        private UserDtoBuilder() {
        }

        public UserDtoBuilder uuid(UUID id) {
            this.id = id;
            return this;
        }

        public UserDtoBuilder netId(String netId) {
            this.netIdField = netId;
            return this;
        }

        public UserDtoBuilder role(Role role) {
            this.roleField = role;
            return this;
        }

        public UserDtoBuilder address(String address) {
            this.addressField = address;
            return this;
        }

        public UserDtoBuilder description(String description) {
            this.descriptionField = description;
            return this;
        }

        public UserDtoBuilder firstName(String firstName) {
            this.firstNameField = firstName;
            return this;
        }

        public UserDtoBuilder lastName(String lastName) {
            this.lastNameField = lastName;
            return this;
        }

        public UserDtoBuilder email(String email) {
            this.emailField = email;
            return this;
        }

        public UserDtoBuilder phoneNumber(String phoneNumber) {
            this.phoneNumberField = phoneNumber;
            return this;
        }

        /**
         * Build the DTO.
         *
         * @return Generated DTO.
         */
        public UserDto build() {
            return new UserDto(id,
                    netIdField,
                    roleField,
                    addressField,
                    descriptionField,
                    firstNameField,
                    lastNameField,
                    emailField,
                    phoneNumberField);
        }
    }
}
