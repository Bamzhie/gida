package ng.gida.locations;

import java.util.List;
import ng.gida.shared.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ReferenceController {

    private final LocationRepository locations;

    public ReferenceController(LocationRepository locations) {
        this.locations = locations;
    }

    @GetMapping("/locations")
    public List<LocationDto> locations() {
        return locations.findAll();
    }

    @GetMapping("/amenities")
    public List<AmenityDto> amenities() {
        return locations.findAmenities();
    }

    @GetMapping("/areas")
    public List<AreaDto> areas(@RequestParam(name = "limit", defaultValue = "6") int limit) {
        if (limit < 1 || limit > 20) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_limit", "limit must be between 1 and 20");
        }
        return locations.findAreas(limit);
    }
}
