package nl.tudelft.sem.user.commons.entities.utils;

import com.fasterxml.jackson.annotation.JsonView;
import java.util.Objects;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * User Data transfer object for updating user information.
 */
@NoArgsConstructor
@AllArgsConstructor
@JsonView(Views.Public.class)
public class UserModify implements Dto {
    private String netId;
    private Role role;
    private String address;
    private String description;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;

    public static UserModifyBuilder builder() {
        return new UserModifyBuilder();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        UserModify that = (UserModify) o;
        return Objects.equals(netId, that.netId)
                && role == that.role
                && Objects.equals(address, that.address)
                && Objects.equals(description, that.description)
                && Objects.equals(firstName, that.firstName)
                && Objects.equals(lastName, that.lastName)
                && Objects.equals(email, that.email)
                && Objects.equals(phoneNumber, that.phoneNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(netId, role, address, description, firstName, lastName, email, phoneNumber);
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

    public static class UserModifyBuilder {
        private transient String netIdField;
        private transient Role roleField;
        private transient String addressField;
        private transient String descriptionField;
        private transient String firstNameField;
        private transient String lastNameField;
        private transient String emailField;
        private transient String phoneNumberField;



        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (o == null || getClass() != o.getClass()) {
                return false;
            }
            UserModifyBuilder that = (UserModifyBuilder) o;
            return Objects.equals(netIdField, that.netIdField)
                    && roleField == that.roleField
                    && Objects.equals(addressField, that.addressField)
                    && Objects.equals(descriptionField, that.descriptionField)
                    && Objects.equals(firstNameField, that.firstNameField)
                    && Objects.equals(lastNameField, that.lastNameField)
                    && Objects.equals(emailField, that.emailField)
                    && Objects.equals(phoneNumberField, that.phoneNumberField);
        }

        public String getPhoneNumberField() {
            return phoneNumberField;
        }

        public void setPhoneNumberField(String phoneNumberField) {
            this.phoneNumberField = phoneNumberField;
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

        UserModifyBuilder() {
        }

        public UserModifyBuilder netId(String netId) {
            this.netIdField = netId;
            return this;
        }

        public UserModifyBuilder role(Role role) {
            this.roleField = role;
            return this;
        }

        public UserModifyBuilder address(String address) {
            this.addressField = address;
            return this;
        }

        public UserModifyBuilder description(String description) {
            this.descriptionField = description;
            return this;
        }

        public UserModifyBuilder firstName(String firstName) {
            this.firstNameField = firstName;
            return this;
        }

        public UserModifyBuilder lastName(String lastName) {
            this.lastNameField = lastName;
            return this;
        }

        public UserModifyBuilder email(String email) {
            this.emailField = email;
            return this;
        }

        public UserModifyBuilder phoneNumber(String phoneNumber) {
            this.phoneNumberField = phoneNumber;
            return this;
        }

        /**
         * Builds a UserModify object with the fields set in the builder.
         *
         * @return a new {@code UserModify} based on this builder's settings
         */
        public UserModify build() {
            return new UserModify(netIdField, roleField,
                    addressField, descriptionField,
                    firstNameField, lastNameField,
                    emailField, phoneNumberField);
        }


        /**
         * To string method for User DTO.
         *
         * @return a string representation of the DTO.
         */
        public String toString() {
            return "UserModify.UserModifyBuilder(netId=" + this.netIdField + ", role=" + this.roleField + ", address="
                    + this.addressField + ", description=" + this.descriptionField
                    + ", firstName=" + this.firstNameField + ", lastName="
                    + this.lastNameField + ", email=" + this.emailField
                    + ", phoneNumber=" + this.phoneNumberField + ")";
        }
    }
}
