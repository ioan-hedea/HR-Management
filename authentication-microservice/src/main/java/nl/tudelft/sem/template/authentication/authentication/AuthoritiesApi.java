package nl.tudelft.sem.template.authentication.authentication;

import java.util.ArrayList;
import java.util.List;
import nl.tudelft.sem.template.authentication.domain.user.AppUser;

public class AuthoritiesApi {
    /**
     * Returns the authorities for each user role.
     *
     * @return the authorities for each role
     */
    public static List<Authority> getAuthoritiesUser(AppUser user) {
        switch (user.getRole()) {
            case ADMIN: {
                List<Authority> result = new ArrayList<>();
                result.add(new Authority("ADMIN"));
                return result;
            }
            case HR : {
                List<Authority> result = new ArrayList<>();
                result.add(new Authority("HR"));
                return result;
            }
            case EMPLOYEE: {
                List<Authority> result = new ArrayList<>();
                result.add(new Authority("EMPLOYEE"));
                return result;
            }
            default: {
                List<Authority> result = new ArrayList<>();
                result.add(new Authority("REJECTED"));
                return result;
            }

        }
    }
}
