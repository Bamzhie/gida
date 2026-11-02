package ng.gida;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

class DevSeedTest extends IntegrationTest {

    @Autowired
    DataSource dataSource;

    private void seed() {
        new ResourceDatabasePopulator(new ClassPathResource("db/seed/R__dev_seed.sql"))
                .execute(dataSource);
    }

    @Test
    void devSeedIncludesAnActiveAdminWithABcryptPassword() {
        seed();
        assertThat(jdbc.sql("""
                SELECT count(*) FROM users
                WHERE id = '20000000-0000-0000-0000-000000000099'
                  AND email = 'admin@gida.local' AND role = 'ADMIN' AND status = 'ACTIVE'
                  AND password_hash LIKE '$2%'
                """).query(Long.class).single()).isEqualTo(1);
    }

    @Test
    void devReseedClearsAuditAndTrustRowsBeforeReplacingTheirSubjects() {
        seed();
        jdbc.sql("""
                INSERT INTO moderation_actions (actor_id, action, target_type, target_id)
                VALUES ('20000000-0000-0000-0000-000000000001', 'APPROVE', 'LISTING',
                        '50000000-0000-0000-0000-000000000001')
                """).update();
        jdbc.sql("""
                INSERT INTO reports (listing_id, reporter_id, reason)
                VALUES ('50000000-0000-0000-0000-000000000001',
                        '20000000-0000-0000-0000-000000000002', 'OTHER')
                """).update();
        jdbc.sql("""
                INSERT INTO verifications (subject_type, subject_id, dimension, state)
                VALUES ('ADVERTISER', '20000000-0000-0000-0000-000000000001', 'IDENTITY', 'VERIFIED')
                """).update();
        seed();
        for (String table : new String[]{"moderation_actions", "reports", "verifications"}) {
            assertThat(jdbc.sql("SELECT count(*) FROM " + table).query(Long.class).single()).isZero();
        }
        assertThat(jdbc.sql("SELECT count(*) FROM listings").query(Long.class).single()).isEqualTo(9);
    }
}
