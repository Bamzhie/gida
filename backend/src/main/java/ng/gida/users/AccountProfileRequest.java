package ng.gida.users;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AccountProfileRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 40) String phone,
        @Size(max = 160) String agencyName,
        @Size(max = 2000) String bio) {
}
