package ng.gida.locations;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class LocationRepository {

    private final JdbcClient jdbc;

    public LocationRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<LocationDto> findAll() {
        return jdbc.sql("""
                        SELECT l.id, l.slug, l.name, l.kind, p.slug AS parent_slug
                        FROM locations l
                        LEFT JOIN locations p ON p.id = l.parent_id
                        ORDER BY l.kind, l.name
                        """)
                .query((rs, index) -> new LocationDto(
                        rs.getObject("id", UUID.class),
                        rs.getString("slug"),
                        rs.getString("name"),
                        rs.getString("kind"),
                        rs.getString("parent_slug")))
                .list();
    }

    public List<AmenityDto> findAmenities() {
        return jdbc.sql("SELECT slug, label FROM amenities ORDER BY label")
                .query((rs, index) -> new AmenityDto(rs.getString("slug"), rs.getString("label")))
                .list();
    }

    public Optional<UUID> findIdBySlug(String slug) {
        return jdbc.sql("SELECT id FROM locations WHERE slug = :slug")
                .param("slug", slug)
                .query(UUID.class)
                .optional();
    }

    public Map<String, UUID> findAmenityIds(List<String> slugs) {
        if (slugs.isEmpty()) {
            return Map.of();
        }
        record Row(String slug, UUID id) {
        }
        return jdbc.sql("SELECT slug, id FROM amenities WHERE slug IN (:slugs)")
                .param("slugs", slugs)
                .query((rs, index) -> new Row(rs.getString("slug"), rs.getObject("id", UUID.class)))
                .list()
                .stream()
                .collect(Collectors.toMap(Row::slug, Row::id));
    }
}
