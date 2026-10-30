package ng.gida.enquiries;

import java.util.UUID;

public record EnquiryRequest(
        UUID listingId,
        UUID advertiserId,
        String action,
        String name,
        String contact,
        String message,
        String website) {
}
