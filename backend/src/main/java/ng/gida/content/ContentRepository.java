package ng.gida.content;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

@Repository
public class ContentRepository {

    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final TypeReference<Map<String, Object>> MAP = new TypeReference<>() {
    };

    private final JdbcClient jdbc;

    public ContentRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<ContentBlockDto> find(String key) {
        List<Row> rows = jdbc.sql("""
                SELECT key, title, blurb, payload::text AS payload
                FROM content_blocks WHERE key = :key
                """).param("key", key).query(ContentRepository::mapRow).list();
        if (rows.isEmpty()) return Optional.empty();

        Row block = rows.get(0);
        List<ContentItemDto> items = jdbc.sql("""
                SELECT i.label, i.body, i.icon_name, i.href, i.payload::text AS payload
                FROM content_items i
                JOIN content_blocks b ON b.id = i.block_id
                WHERE b.key = :key
                ORDER BY i.sort_order, i.label
                """).param("key", key).query(ContentRepository::mapItem).list();

        return Optional.of(new ContentBlockDto(block.key(), block.title(), block.blurb(), block.payload(), items));
    }

    private record Row(String key, String title, String blurb, Map<String, Object> payload) {
    }

    private static Row mapRow(ResultSet rs, int row) throws SQLException {
        return new Row(rs.getString("key"), rs.getString("title"), rs.getString("blurb"), read(rs));
    }

    private static ContentItemDto mapItem(ResultSet rs, int row) throws SQLException {
        return new ContentItemDto(rs.getString("label"), rs.getString("body"),
                rs.getString("icon_name"), rs.getString("href"), read(rs));
    }

    private static Map<String, Object> read(ResultSet rs) throws SQLException {
        String raw = rs.getString("payload");
        return raw == null || raw.isBlank() ? Map.of() : JSON.readValue(raw, MAP);
    }
}
