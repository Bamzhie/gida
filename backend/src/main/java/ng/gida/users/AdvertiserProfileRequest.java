package ng.gida.users;

import jakarta.validation.constraints.Size;

public record AdvertiserProfileRequest(
        @Size(max = 160) String agencyName,
        @Size(max = 2000) String bio,
        @Size(max = 40) String contactPhone) {
}
