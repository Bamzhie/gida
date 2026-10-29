package ng.gida.shared;

import org.springframework.http.HttpStatus;

public record Paging(int page, int size) {

    public static Paging of(Integer page, Integer size) {
        int resolvedPage = page == null ? 1 : page;
        int resolvedSize = size == null ? 20 : size;
        if (resolvedPage < 1 || resolvedSize < 1 || resolvedSize > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_paging",
                    "page must be at least 1 and size between 1 and 100");
        }
        return new Paging(resolvedPage, resolvedSize);
    }

    public int offset() {
        return (page - 1) * size;
    }
}
