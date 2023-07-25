package nl.tudelft.sem.request.microservice.controllers;

import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.request.commons.ApiError;
import nl.tudelft.sem.request.microservice.exceptions.BadRequestBody;
import nl.tudelft.sem.request.microservice.exceptions.NotFoundException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice
public class GlobalApiExceptionManager {
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ResponseBody
    @ExceptionHandler({NotFoundException.class})
    public ApiError handleNotFoundException(NotFoundException ex) {
        log.warn("Not found exception: ({}) {}", ex.getClass().getSimpleName(), ex.getMessage());
        return new ApiError(HttpStatus.NOT_FOUND.value(), ex.getMessage());
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    @ExceptionHandler({BadRequestBody.class})
    public ApiError handleBadRequestException(BadRequestBody ex) {
        log.warn("Bad request exception: ({}) {}", ex.getClass().getSimpleName(), ex.getMessage());
        return new ApiError(HttpStatus.BAD_REQUEST.value(), ex.getMessage());
    }

    /**
     * Handles malformed JSON payloads and returns a user-friendly validation message.
     *
     * @param ex source parsing exception
     * @return normalized API error response
     */
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ResponseBody
    @ExceptionHandler({HttpMessageNotReadableException.class})
    public ApiError handleMessageNotReadableException(HttpMessageNotReadableException ex) {
        log.warn("Invalid JSON payload: {}", ex.getMessage());
        return new ApiError(HttpStatus.BAD_REQUEST.value(),
                "Invalid request payload. Check UUID and date formats.");
    }
}
