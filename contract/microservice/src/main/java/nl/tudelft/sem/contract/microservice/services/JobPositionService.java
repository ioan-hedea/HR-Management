package nl.tudelft.sem.contract.microservice.services;


import nl.tudelft.sem.contract.commons.entities.SalaryScaleDto;
import nl.tudelft.sem.contract.commons.entities.utils.StringDto;
import nl.tudelft.sem.contract.microservice.database.entities.JobPosition;
import nl.tudelft.sem.contract.microservice.database.entities.SalaryScale;
import nl.tudelft.sem.contract.microservice.database.repositories.JobPositionRepository;
import nl.tudelft.sem.contract.microservice.database.repositories.SalaryScaleRepository;
import nl.tudelft.sem.contract.microservice.exceptions.SalaryScaleNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class JobPositionService {
    private final transient JobPositionRepository jobPositionRepository;
    private final transient SalaryScaleRepository salaryScaleRepository;

    /**
     * JobPositionService Constructor.
     *
     * @param jobPositionRepository repository for job position
     * @param salaryScaleRepository repository for salary scale
     */
    public JobPositionService(JobPositionRepository jobPositionRepository, SalaryScaleRepository salaryScaleRepository) {
        this.jobPositionRepository = jobPositionRepository;
        this.salaryScaleRepository = salaryScaleRepository;
    }

    /**
     * Change name of job position.
     *
     * @param jobPosition job position to be modified
     * @param name new name
     * @return changed job position
     */
    public JobPosition editName(JobPosition jobPosition, StringDto name) {
        jobPosition.setName(name.getData());
        jobPositionRepository.save(jobPosition);
        return jobPosition;
    }

    /**
     * Change salary scale of job position.
     *
     * @param jobPosition job position to be modified
     * @param salaryScaleDto new salary scale
     * @return changed job position
     */
    public JobPosition editSalaryScale(JobPosition jobPosition, SalaryScaleDto salaryScaleDto) {
        SalaryScale salaryScale = salaryScaleRepository.findById(salaryScaleDto.getId())
                .orElseThrow(SalaryScaleNotFoundException::new);
        jobPosition.setSalaryScale(salaryScale);
        jobPositionRepository.save(jobPosition);
        return jobPosition;
    }
}
