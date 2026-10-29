package ng.gida.listings;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.Optional;
import java.util.UUID;
import ng.gida.listings.CreateListingRequest.MediaInput;
import ng.gida.shared.Vocabulary.CostType;
import ng.gida.shared.Vocabulary.ListingCategory;
import ng.gida.shared.Vocabulary.MediaKind;
import ng.gida.shared.Vocabulary.PricePeriod;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ListingRepository {

    private final JdbcClient jdbc;

    public ListingRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public UUID insert(UUID propertyId, UUID advertiserId, CreateListingRequest request, ListingCategory category) {
        return jdbc.sql("""
                        INSERT INTO listings
                            (property_id, advertiser_id, title, description, listing_type,
                             category, price, price_period)
                        VALUES (:propertyId, :advertiserId, :title, :description, :listingType,
                                :category, :price, :pricePeriod)
                        RETURNING id
                        """)
                .param("propertyId", propertyId)
                .param("advertiserId", advertiserId)
                .param("title", request.title())
                .param("description", request.description())
                .param("listingType", request.listingType().name())
                .param("category", category.name())
                .param("price", request.price())
                .param("pricePeriod", request.pricePeriod() == null ? null : request.pricePeriod().name(), Types.VARCHAR)
                .query(UUID.class)
                .single();
    }

    public void insertCost(UUID listingId, CostType type, BigDecimal amount, String note) {
        jdbc.sql("""
                        INSERT INTO listing_costs (listing_id, cost_type, amount, note)
                        VALUES (:listingId, :costType, :amount, :note)
                        """)
                .param("listingId", listingId)
                .param("costType", type.name())
                .param("amount", amount)
                .param("note", note, Types.VARCHAR)
                .update();
    }

    public void insertMedia(UUID listingId, MediaInput media, int fallbackSortOrder) {
        jdbc.sql("""
                        INSERT INTO listing_media (listing_id, url, caption, kind, sort_order)
                        VALUES (:listingId, :url, :caption, :kind, :sortOrder)
                        """)
                .param("listingId", listingId)
                .param("url", media.url())
                .param("caption", media.caption(), Types.VARCHAR)
                .param("kind", media.kind() == null ? MediaKind.PHOTO.name() : media.kind().name())
                .param("sortOrder", media.sortOrder() == null ? fallbackSortOrder : media.sortOrder())
                .update();
    }

    public void deleteCosts(UUID listingId) {
        jdbc.sql("DELETE FROM listing_costs WHERE listing_id = :listingId")
                .param("listingId", listingId)
                .update();
    }

    public void deleteMedia(UUID listingId) {
        jdbc.sql("DELETE FROM listing_media WHERE listing_id = :listingId")
                .param("listingId", listingId)
                .update();
    }

    public record ListingRow(UUID id, UUID propertyId, UUID advertiserId, String listingType,
                             String lifecycle, String availability, BigDecimal price,
                             PricePeriod pricePeriod) {
    }

    public Optional<ListingRow> findForUpdate(UUID listingId) {
        return jdbc.sql("""
                        SELECT id, property_id, advertiser_id, listing_type, lifecycle,
                               availability, price, price_period
                        FROM listings WHERE id = :id
                        FOR UPDATE
                        """)
                .param("id", listingId)
                .query((rs, index) -> new ListingRow(
                        rs.getObject("id", UUID.class),
                        rs.getObject("property_id", UUID.class),
                        rs.getObject("advertiser_id", UUID.class),
                        rs.getString("listing_type"),
                        rs.getString("lifecycle"),
                        rs.getString("availability"),
                        rs.getBigDecimal("price"),
                        rs.getString("price_period") == null
                                ? null
                                : PricePeriod.valueOf(rs.getString("price_period"))))
                .optional();
    }
}
