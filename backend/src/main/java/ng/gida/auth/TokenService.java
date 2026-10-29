package ng.gida.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    public static final Duration ACCESS_TTL = Duration.ofMinutes(15);

    private final JwtEncoder encoder;
    private final String issuer;
    private final String audience;
    private final Clock clock = Clock.systemUTC();

    public TokenService(JwtEncoder encoder,
                        @Value("${gida.jwt.issuer}") String issuer,
                        @Value("${gida.jwt.audience}") String audience) {
        this.encoder = encoder;
        this.issuer = issuer;
        this.audience = audience;
    }

    public String issueAccessToken(UUID userId, String role) {
        Instant now = clock.instant();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .audience(List.of(audience))
                .subject(userId.toString())
                .issuedAt(now)
                .expiresAt(now.plus(ACCESS_TTL))
                .claim("role", role)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
