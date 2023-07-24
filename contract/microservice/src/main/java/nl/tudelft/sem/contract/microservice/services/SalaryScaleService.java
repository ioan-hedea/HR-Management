package nl.tudelft.sem.contract.microservice.services;

import java.math.BigDecimal;
import nl.tudelft.sem.contract.commons.entities.utils.StringDto;
import nl.tudelft.sem.contract.microservice.database.entities.SalaryScale;
import nl.tudelft.sem.contract.microservice.database.repositories.SalaryScaleRepository;
import org.springframework.stereotype.Service;

@Service
public class SalaryScaleService {
    private final transient SalaryScaleRepository salaryScaleRepository;

    /**
     * Constructor for salary scale service.
     *
     * @param salaryScaleRepository repository for salary scales
     */
    public SalaryScaleService(SalaryScaleRepository salaryScaleRepository) {
        this.salaryScaleRepository = salaryScaleRepository;
    }

    /**
     * Edits the minimum pay of a salary scale.
     *
     * @param salaryScale salary scale to be edited
     * @param minimumPay new mimumum pay
     * @return edited salary scale
     */
    public SalaryScale editMinimumPay(SalaryScale salaryScale, StringDto minimumPay) {
        salaryScale.getPay().setMinimumPay(new BigDecimal(minimumPay.getData()));
        salaryScaleRepository.save(salaryScale);
        return salaryScale;
    }

    /**
     * Edits maximum pay of a salary scale.
     *
     * @param salaryScale salary scale to be edited
     * @param maximumPay new maximum pay
     * @return edited salary scale
     */
    public SalaryScale editMaximumPay(SalaryScale salaryScale, StringDto maximumPay) {
        salaryScale.getPay().setMaximumPay(new BigDecimal(maximumPay.getData()));
        salaryScaleRepository.save(salaryScale);
        return salaryScale;
    }
}
