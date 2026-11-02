package ng.gida;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

/**
 * Persistence coexistence contract: Spring Data JPA runs beside the existing
 * JdbcClient repositories, and Hibernate validates the Flyway-owned schema
 * rather than generating one.
 */
class JpaBootstrapTest extends IntegrationTest {

    @Autowired
    EntityManagerFactory entityManagerFactory;

    @Value("${spring.jpa.hibernate.ddl-auto}")
    String ddlAuto;

    @Test
    void hibernateValidatesTheFlywaySchema() {
        assertThat(entityManagerFactory).isNotNull();
        assertThat(ddlAuto).isEqualTo("validate");
    }
}
