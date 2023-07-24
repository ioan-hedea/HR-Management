package nl.tudelft.sem.contract.commons.entities;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import javax.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import nl.tudelft.sem.contract.commons.entities.utils.Dto;
import nl.tudelft.sem.contract.commons.entities.utils.Views;


/**
 * Contract data transfer object.
 */
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@JsonView(Views.Public.class)
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
public class ContractDto implements Dto {
    /**
     * The ID of the contract.
     */
    protected UUID id;

    protected ContractPartiesDto contractParties;

    protected ContractInfoDto contractInfo;

    protected JobPositionDto jobPosition;

    protected PensionSchemeDto pensionScheme;

    protected List<@NotBlank String> benefits;

    protected ContractTermsDto contractTerms;

    public static ContractDtoBuilder builder() {
        return new ContractDtoBuilder();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ContractDto that = (ContractDto) o;
        return Objects.equals(getId(), that.getId()) && Objects.equals(contractParties, that.getContractParties())
                && Objects.equals(getContractInfo(), that.getContractInfo())
                && Objects.equals(getJobPosition(), that.getJobPosition())
                && Objects.equals(getPensionScheme(), that.getPensionScheme())
                && Objects.equals(getBenefits(), that.getBenefits())
                && Objects.equals(getContractTerms(), that.getContractTerms());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId());
    }

    public static class ContractDtoBuilder {
        private transient UUID idForm;
        private transient ContractPartiesDto contractPartiesField;
        private transient ContractInfoDto contractInfoForm;
        private transient JobPositionDto jobPositionForm;
        private transient PensionSchemeDto pensionSchemeForm;
        private transient List<@NotBlank String> benefitsForm;
        private transient ContractTermsDto contractTermsDtoForm;

        ContractDtoBuilder() {
        }

        public ContractDtoBuilder id(UUID id) {
            this.idForm = id;
            return this;
        }

        public ContractDtoBuilder contractParties(ContractPartiesDto contractParties) {
            this.contractPartiesField = contractParties;
            return this;
        }

        public ContractDtoBuilder contractInfo(ContractInfoDto contractInfo) {
            this.contractInfoForm = contractInfo;
            return this;
        }

        public ContractDtoBuilder jobPosition(JobPositionDto jobPosition) {
            this.jobPositionForm = jobPosition;
            return this;
        }

        public ContractDtoBuilder pensionScheme(PensionSchemeDto pensionScheme) {
            this.pensionSchemeForm = pensionScheme;
            return this;
        }

        public ContractDtoBuilder benefits(List<@NotBlank String> benefits) {
            this.benefitsForm = benefits;
            return this;
        }

        public ContractDtoBuilder contractTerms(ContractTermsDto contractTermsDto) {
            this.contractTermsDtoForm = contractTermsDto;
            return this;
        }

        public ContractDto build() {
            return new ContractDto(idForm, contractPartiesField, contractInfoForm,
                    jobPositionForm, pensionSchemeForm, benefitsForm, contractTermsDtoForm);
        }
    }
}
