package ng.gida.locations;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
