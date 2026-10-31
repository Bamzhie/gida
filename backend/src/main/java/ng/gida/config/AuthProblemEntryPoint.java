package ng.gida.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import tools.jackson.databind.json.JsonMapper;

/**
 * Writes the API's RFC 7807 error shape for requests rejected at the security
 * filter level with no usable bearer token, where ProblemAdvice cannot run
 * because the DispatcherServlet is never reached.
 */
public class AuthProblemEntryPoint implements AuthenticationEntryPoint {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException exception) throws java.io.IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setHeader("WWW-Authenticate", "Bearer");
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        Map<String, Object> problem = new LinkedHashMap<>();
        problem.put("type", URI.create("https://gida.ng/errors/signed_out"));
        problem.put("title", HttpStatus.UNAUTHORIZED.getReasonPhrase());
        problem.put("status", HttpStatus.UNAUTHORIZED.value());
        problem.put("detail", "Sign in to access this resource.");
        problem.put("instance", URI.create(request.getRequestURI()));
        response.getOutputStream().print(JSON.writeValueAsString(problem));
    }
}
