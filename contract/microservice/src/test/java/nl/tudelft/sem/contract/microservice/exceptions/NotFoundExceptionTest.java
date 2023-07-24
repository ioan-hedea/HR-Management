package nl.tudelft.sem.contract.microservice.exceptions;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

class NotFoundExceptionTest {
    static class DummyNotFoundException extends NotFoundException {
        public DummyNotFoundException() {
            super();
        }

        public DummyNotFoundException(String message) {
            super(message);
        }

        public DummyNotFoundException(Exception e) {
            super(e);
        }
    }

    @Test
    void defaultConstructor() {
        NotFoundException exception = new DummyNotFoundException();
        assertNotNull(exception.getMessage());
    }

    @Test
    void causeConstructor() {
        Exception e = new Exception();
        NotFoundException exception = new DummyNotFoundException(e);
        assertEquals(e, exception.getCause());
    }

    @Test
    void messageConstructor() {
        String message = "message";
        NotFoundException exception = new DummyNotFoundException(message);
        assertEquals(message, exception.getMessage());
    }
}