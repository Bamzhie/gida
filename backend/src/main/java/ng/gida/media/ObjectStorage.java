package ng.gida.media;

/**
 * Port for binary object storage. Implementations keep the bytes for a key and
 * hand them back unchanged; keys are slash-separated paths scoped by the
 * caller, e.g. {@code listings/{listingId}/{uuid}-display.jpg}. Reading a key
 * that is not stored throws {@link UncheckedStorageException}.
 */
public interface ObjectStorage {

    /** Stores the content under the key and returns the key. */
    String put(String key, byte[] content, String contentType);

    byte[] get(String key);

    void delete(String key);

    boolean exists(String key);
}
