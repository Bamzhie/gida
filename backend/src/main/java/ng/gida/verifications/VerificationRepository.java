package ng.gida.verifications;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VerificationRepository extends JpaRepository<Verification, UUID> {
    Optional<Verification> findBySubjectTypeAndSubjectIdAndDimension(
            String subjectType, UUID subjectId, String dimension);
    List<Verification> findBySubjectTypeAndSubjectId(String subjectType, UUID subjectId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Verification v where v.subjectType = :type and v.subjectId = :id "
            + "and v.dimension = :dimension")
    Optional<Verification> findForUpdate(@Param("type") String type, @Param("id") UUID id,
                                         @Param("dimension") String dimension);

    @Query(nativeQuery = true, value = "SELECT id FROM listings WHERE id = :id FOR UPDATE")
    Optional<UUID> lockListing(@Param("id") UUID id);

    @Query(nativeQuery = true, value = """
            SELECT id FROM users WHERE id = :id AND role IN ('AGENT', 'ADMIN') FOR UPDATE
            """)
    Optional<UUID> lockAdvertiser(@Param("id") UUID id);

    @Query(nativeQuery = true, value = """
            SELECT EXISTS (SELECT 1 FROM listings WHERE id = :id
            AND lifecycle = 'PUBLISHED' AND (expires_at IS NULL OR expires_at > now()))
            """)
    boolean publishedListingExists(@Param("id") UUID id);

    @Query(nativeQuery = true, value = """
            SELECT EXISTS (SELECT 1 FROM listings WHERE id = :id)
            """)
    boolean listingExists(@Param("id") UUID id);

    @Query(nativeQuery = true, value = """
            SELECT EXISTS (SELECT 1 FROM users WHERE id = :id AND role IN ('AGENT', 'ADMIN'))
            """)
    boolean advertiserExists(@Param("id") UUID id);

    @Query(nativeQuery = true, value = """
        SELECT v.dimension AS dimension, v.subject_type AS "subjectType"
        FROM verifications v WHERE v.state='VERIFIED' AND (
          (v.subject_type='LISTING' AND v.subject_id=:id) OR
          (v.subject_type='ADVERTISER' AND v.subject_id=(SELECT advertiser_id FROM listings WHERE id=:id)))
        """)
    List<VerifiedRow> publicRows(@Param("id") UUID id);

    @Query(nativeQuery = true, value = """
            SELECT EXISTS (SELECT 1 FROM verifications
            WHERE subject_type = 'ADVERTISER' AND subject_id = :id
              AND dimension IN ('IDENTITY', 'BUSINESS') AND state = 'VERIFIED')
            """)
    boolean verifiedAdvertiser(@Param("id") UUID id);

    interface VerifiedRow {
        String getDimension();
        String getSubjectType();
    }
}
