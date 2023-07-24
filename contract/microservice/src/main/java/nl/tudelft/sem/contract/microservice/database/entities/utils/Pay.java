package nl.tudelft.sem.contract.microservice.database.entities.utils;

import java.math.BigDecimal;
import javax.persistence.Embeddable;
import javax.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 *Pay information for the salary scale.
 */
@Getter
@Setter
@NoArgsConstructor
@Embeddable
public class Pay {
    /**
     * minimum pay of salary scale.
     */
    @Min(0)
    private BigDecimal minimumPay;

    /**
     * Maximum pay of salary scale.
     */
    @Min(0)
    private BigDecimal maximumPay;

    public Pay(BigDecimal minimumPay, BigDecimal maximumPay) {
        this.minimumPay = minimumPay;
        this.maximumPay = maximumPay;
    }
}
