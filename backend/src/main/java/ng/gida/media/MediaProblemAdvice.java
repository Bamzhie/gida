package ng.gida.media;

import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * Maps multipart size rejections from the servlet container (which happen
 * before any controller code runs) to the API's RFC 7807 shape instead of a
 * 500. The per-kind size caps inside {@code MediaStorageService} raise the
 * same code for files below the container limit.
 */
@RestControllerAdvice
public class MediaProblemAdvice {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ProblemDetail onTooLarge(MaxUploadSizeExceededException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "The uploaded file is too large.");
        problem.setType(URI.create("https://gida.ng/errors/unsupported_media"));
        problem.setTitle(HttpStatus.BAD_REQUEST.getReasonPhrase());
        return problem;
    }
}
