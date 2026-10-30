package ng.gida.enquiries;

import java.util.Set;
import java.util.UUID;
import ng.gida.shared.ApiException;
import ng.gida.shared.Contacts;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class EnquiryService {

    private static final Set<String> ACTIONS = Set.of("CONTACT", "VIEWING");

    private final EnquiryRepository enquiries;

    public EnquiryService(EnquiryRepository enquiries) {
        this.enquiries = enquiries;
    }

    public EnquiryCreated create(UUID userId, EnquiryRequest request) {
        if (request.website() != null && !request.website().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "honeypot_rejected", "This form was rejected.");
        }

        boolean hasListing = request.listingId() != null;
        boolean hasAdvertiser = request.advertiserId() != null;
        if (hasListing == hasAdvertiser) {
            throw ApiException.validation("contact", "An enquiry addresses one listing or one advertiser.");
        }

        String action = request.action() == null ? "" : request.action().trim().toUpperCase();
        if (!ACTIONS.contains(action)) {
            throw ApiException.validation("action", "Choose either an enquiry or a viewing request.");
        }
        String name = request.name() == null ? "" : request.name().trim();
        if (name.isEmpty() || name.length() > 120) {
            throw ApiException.validation("name", "Add your name.");
        }
        String contact = request.contact() == null ? "" : request.contact().trim();
        if (!Contacts.isValid(contact) || contact.length() > 320) {
            throw ApiException.validation("contact", "Enter a valid email address or phone number.");
        }
        String message = request.message() == null || request.message().isBlank()
                ? null : request.message().trim();
        if (message != null && message.length() > 5000) {
            throw ApiException.validation("message", "Keep the message under 5000 characters.");
        }

        UUID subject;
        if (hasListing) {
            if (!enquiries.listingExists(request.listingId())) {
                throw new ApiException(HttpStatus.NOT_FOUND, "listing_not_found", "This property is no longer available.");
            }
            subject = request.listingId();
        } else {
            if (!enquiries.advertiserExists(request.advertiserId())) {
                throw new ApiException(HttpStatus.NOT_FOUND, "advertiser_not_found", "That advertiser is not listed.");
            }
            subject = request.advertiserId();
        }

        if (enquiries.recentlySeen(contact, subject)) {
            throw new ApiException(HttpStatus.CONFLICT, "duplicate_enquiry", "You have already sent this.");
        }

        return hasListing
                ? enquiries.insert(userId, subject, null, action, name, contact, message)
                : enquiries.insert(userId, null, subject, action, name, contact, message);
    }

    public PageResponse<EnquiryDto> inbox(UUID advertiserId, Paging paging) {
        return enquiries.inbox(advertiserId, paging);
    }
}
