package ng.gida.users;

import java.util.UUID;
import ng.gida.shared.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountProfileService {

    private final UserRepository users;
    private final AdvertiserProfileRepository advertiserProfiles;

    public AccountProfileService(UserRepository users, AdvertiserProfileRepository advertiserProfiles) {
        this.users = users;
        this.advertiserProfiles = advertiserProfiles;
    }

    @Transactional(readOnly = true)
    public AccountProfileDto get(UUID userId) {
        UserRow user = users.findById(userId).orElseThrow(AccountProfileService::userNotFound);
        AdvertiserProfileDto advertiser = advertiserProfiles.find(userId)
                .orElse(new AdvertiserProfileDto(null, null, null));
        return new AccountProfileDto(user.name(), user.email(), user.phone(), advertiser.agencyName(), advertiser.bio());
    }

    @Transactional
    public AccountProfileDto update(UUID userId, AccountProfileRequest request) {
        String name = request.name().trim();
        String phone = blankToNull(request.phone());
        String agencyName = blankToNull(request.agencyName());
        String bio = blankToNull(request.bio());
        users.updateAccountProfile(userId, name, phone);
        advertiserProfiles.upsert(userId, new AdvertiserProfileRequest(agencyName, bio, phone));
        return get(userId);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static ApiException userNotFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "user_not_found", "User no longer exists");
    }
}
