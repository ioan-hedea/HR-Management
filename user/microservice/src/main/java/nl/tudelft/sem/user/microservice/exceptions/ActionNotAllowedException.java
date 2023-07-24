package nl.tudelft.sem.user.microservice.exceptions;

public abstract class ActionNotAllowedException extends IllegalStateException {
    public static final long serialVersionUID = 1L;

    /**
     * Action not allowed constructor.
     *
     * @param message exception message
     */
    public ActionNotAllowedException(String message) {
        super(message);
    }

    /**
     * Action not allowed constructor with generic message.
     */
    public ActionNotAllowedException() {
        this("Action not allowed");
    }
}
