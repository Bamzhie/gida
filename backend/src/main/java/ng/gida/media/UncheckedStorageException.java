package ng.gida.media;

/** Signals that an {@link ObjectStorage} operation failed, e.g. a missing object. */
public class UncheckedStorageException extends RuntimeException {

    public UncheckedStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
