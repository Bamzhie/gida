package ng.gida.properties;

import java.sql.Types;
import java.util.Collection;
import java.util.UUID;
import ng.gida.listings.CreateListingRequest.PropertyInput;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class PropertyRepository {

    private final JdbcClient jdbc;

    public PropertyRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public UUID insert(PropertyInput property, UUID locationId) {
        String wkt = property.latitude() == null
                ? null
                : "POINT(%s %s)".formatted(property.longitude(), property.latitude());
        return jdbc.sql("""
                        INSERT INTO properties
                            (location_id, address_line, property_type, bedrooms, bathrooms,
                             size_sqm, lot_size_sqm, year_built, parking, furnished, geom)
                        VALUES (:locationId, :addressLine, :propertyType, :bedrooms, :bathrooms,
                                :sizeSqm, :lotSizeSqm, :yearBuilt, :parking, :furnished,
                                CASE WHEN :wkt IS NULL THEN NULL ELSE ST_GeomFromText(:wkt, 4326) END)
                        RETURNING id
                        """)
                .param("locationId", locationId)
                .param("addressLine", property.addressLine(), Types.VARCHAR)
                .param("propertyType", property.propertyType().name())
                .param("bedrooms", property.bedrooms(), Types.INTEGER)
                .param("bathrooms", property.bathrooms(), Types.INTEGER)
                .param("sizeSqm", property.sizeSqm(), Types.NUMERIC)
                .param("lotSizeSqm", property.lotSizeSqm(), Types.NUMERIC)
                .param("yearBuilt", property.yearBuilt(), Types.INTEGER)
                .param("parking", property.parking(), Types.INTEGER)
                .param("furnished", Boolean.TRUE.equals(property.furnished()))
                .param("wkt", wkt, Types.VARCHAR)
                .query(UUID.class)
                .single();
    }

    public void linkAmenities(UUID propertyId, Collection<UUID> amenityIds) {
        for (UUID amenityId : amenityIds) {
            jdbc.sql("INSERT INTO property_amenities (property_id, amenity_id) VALUES (:propertyId, :amenityId)")
                    .param("propertyId", propertyId)
                    .param("amenityId", amenityId)
                    .update();
        }
    }

    public void replaceAmenities(UUID propertyId, Collection<UUID> amenityIds) {
        jdbc.sql("DELETE FROM property_amenities WHERE property_id = :propertyId")
                .param("propertyId", propertyId)
                .update();
        linkAmenities(propertyId, amenityIds);
    }

    public void update(UUID propertyId, PropertyInput property, UUID locationId) {
        String wkt = property.latitude() == null
                ? null
                : "POINT(%s %s)".formatted(property.longitude(), property.latitude());
        jdbc.sql("""
                        UPDATE properties
                        SET location_id = :locationId,
                            address_line = :addressLine,
                            property_type = :propertyType,
                            bedrooms = :bedrooms,
                            bathrooms = :bathrooms,
                            size_sqm = :sizeSqm,
                            lot_size_sqm = :lotSizeSqm,
                            year_built = :yearBuilt,
                            parking = :parking,
                            furnished = :furnished,
                            geom = CASE WHEN :wkt IS NULL THEN geom ELSE ST_GeomFromText(:wkt, 4326) END,
                            updated_at = now()
                        WHERE id = :id
                        """)
                .param("id", propertyId)
                .param("locationId", locationId)
                .param("addressLine", property.addressLine(), Types.VARCHAR)
                .param("propertyType", property.propertyType().name())
                .param("bedrooms", property.bedrooms(), Types.INTEGER)
                .param("bathrooms", property.bathrooms(), Types.INTEGER)
                .param("sizeSqm", property.sizeSqm(), Types.NUMERIC)
                .param("lotSizeSqm", property.lotSizeSqm(), Types.NUMERIC)
                .param("yearBuilt", property.yearBuilt(), Types.INTEGER)
                .param("parking", property.parking(), Types.INTEGER)
                .param("furnished", Boolean.TRUE.equals(property.furnished()))
                .param("wkt", wkt, Types.VARCHAR)
                .update();
    }
}
