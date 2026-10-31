package ng.gida.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.access.AccessDeniedHandler;
import tools.jackson.databind.json.JsonMapper;

/**
 * Writes the API's RFC 7807 error shape for authenticated requests denied at
 * the security filter level (insufficient scope or role), where ProblemAdvice
 * cannot run. Keeps the standard WWW-Authenticate challenge that explains the
 * missing privileges.
 */
public class AuthProblemAccessDeniedHandler implements AccessDeniedHandler {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    /** Spring's standard challenge, kept for the WWW-Authenticate header. */
    private final BearerTokenAccessDeniedHandler challenge =
            new BearerTokenAccessDeniedHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException exception) throws java.io.IOException {
        challenge.handle(request, response, exception);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        Map<String, Object> problem = new LinkedHashMap<>();
        problem.put("type", URI.create("https://gida.ng/errors/forbidden"));
        problem.put("title", HttpStatus.FORBIDDEN.getReasonPhrase());
        problem.put("status", HttpStatus.FORBIDDEN.value());
        problem.put("detail", "Your account does not have access to this resource.");
        problem.put("instance", URI.create(request.getRequestURI()));
        response.getOutputStream().print(JSON.writeValueAsString(problem));
    }
}
