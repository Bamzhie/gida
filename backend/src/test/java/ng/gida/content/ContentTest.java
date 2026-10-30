package ng.gida.content;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;

class ContentTest extends IntegrationTest {

    @Test
    void returnsOrderedItemsWithTheirPayload() throws Exception {
        UUID block = jdbc.sql("""
                INSERT INTO content_blocks (key, title, blurb, payload, sort_order)
                VALUES ('trust_points', 'Built for trust', 'What you can see before you call',
                        '{"layout":"grid"}', 1)
                RETURNING id
                """).query(UUID.class).single();
        for (var item : new String[][] { { "Visible costs", "2" }, { "Clear status", "1" } }) {
            jdbc.sql("""
                    INSERT INTO content_items (block_id, label, body, icon_name, href, payload, sort_order)
                    VALUES (:block, :label, 'Body text', 'receipt', '/trust', '{"connected":true}', :sorted)
                    """).param("block", block).param("label", item[0])
                    .param("sorted", Short.valueOf(item[1])).update();
        }

        mvc.perform(get("/api/v1/content/trust_points"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.key").value("trust_points"))
                .andExpect(jsonPath("$.title").value("Built for trust"))
                .andExpect(jsonPath("$.payload.layout").value("grid"))
                .andExpect(jsonPath("$.items[0].label").value("Clear status"))
                .andExpect(jsonPath("$.items[0].iconName").value("receipt"))
                .andExpect(jsonPath("$.items[0].href").value("/trust"))
                .andExpect(jsonPath("$.items[0].payload.connected").value(true))
                .andExpect(jsonPath("$.items[1].label").value("Visible costs"));
    }

    @Test
    void ordersByLabelWithinEqualSortOrders() throws Exception {
        UUID block = jdbc.sql("INSERT INTO content_blocks (key) VALUES ('cost_guide_parts') RETURNING id")
                .query(UUID.class).single();
        for (String label : new String[] { "Zeta", "Alpha" }) {
            jdbc.sql("INSERT INTO content_items (block_id, label, sort_order) VALUES (:b, :l, 0)")
                    .param("b", block).param("l", label).update();
        }
        mvc.perform(get("/api/v1/content/cost_guide_parts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].label").value("Alpha"))
                .andExpect(jsonPath("$.items[1].label").value("Zeta"));
    }

    @Test
    void unknownKeyIsNotFound() throws Exception {
        mvc.perform(get("/api/v1/content/hero_slides"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/content_not_found"));
    }

    @Test
    void needsNoSession() throws Exception {
        jdbc.sql("INSERT INTO content_blocks (key) VALUES ('audience_paths')").update();
        mvc.perform(get("/api/v1/content/audience_paths")).andExpect(status().isOk());
    }
}
