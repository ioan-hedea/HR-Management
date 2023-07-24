package nl.tudelft.sem.template.authentication.application.user;

import lombok.extern.slf4j.Slf4j;
import nl.tudelft.sem.template.authentication.domain.user.UserWasCreatedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * This event listener is automatically called when a domain entity is saved
 * which has stored events of type: UserWasCreated.
 */
@Component
@Slf4j
public class UserWasCreatedListener {
    /**
     * The name of the function indicated which event is listened to.
     * The format is onEVENTNAME.
     *
     * @param event The event to react to
     */
    @EventListener
    public void onAccountWasCreated(UserWasCreatedEvent event) {
        log.info("Account '{}' was created", event.getNetId());
    }
}
