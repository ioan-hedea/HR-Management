package nl.tudelft.sem.template.authentication.models;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.Data;

/**
 * Model representing a registration request.
 */
@Data
public class RegistrationRequestModel {
    @NotBlank
    @Size(max = 20)
    private String netId;

    @NotBlank
    @Size(min = 8, max = 128)
    private String password;
}
