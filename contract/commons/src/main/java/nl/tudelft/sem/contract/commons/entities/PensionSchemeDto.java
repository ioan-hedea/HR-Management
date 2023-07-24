package nl.tudelft.sem.contract.commons.entities;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import java.util.Set;
import java.util.UUID;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import nl.tudelft.sem.contract.commons.entities.utils.Dto;
import nl.tudelft.sem.contract.commons.entities.utils.Views;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
@JsonView(Views.Public.class)
public class PensionSchemeDto implements Dto {
    protected UUID id;

    @NotBlank
    protected String name;

    protected Set<@NotNull ContractDto> contracts;

    public static PensionSchemeDtoBuilder builder() {
        return new PensionSchemeDtoBuilder();
    }

    public static class PensionSchemeDtoBuilder {
        private transient UUID idField;
        private transient @NotBlank String nameField;
        private transient Set<@NotNull ContractDto> contractsField;

        private PensionSchemeDtoBuilder() {
        }

        public PensionSchemeDtoBuilder id(UUID id) {
            this.idField = id;
            return this;
        }

        public PensionSchemeDtoBuilder name(@NotBlank String name) {
            this.nameField = name;
            return this;
        }

        public PensionSchemeDtoBuilder contracts(Set<@NotNull ContractDto> contracts) {
            this.contractsField = contracts;
            return this;
        }

        public PensionSchemeDto build() {
            return new PensionSchemeDto(idField, nameField, contractsField);
        }
    }
}
