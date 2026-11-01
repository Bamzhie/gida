package ng.gida.media;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Iterator;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import ng.gida.shared.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * PHOTO processing: decodes the upload with ImageIO, then re-encodes it as
 * metadata-free RGB JPEG once at full size (the stored original) and twice
 * scaled for the {@code thumb} (400 px wide) and {@code display} (1280 px
 * wide) variants. Nothing is upscaled — a source narrower than the target
 * width keeps its size. Alpha is flattened onto white because JPEG has none.
 */
@Component
public class ImageVariants {

    static final int THUMB_WIDTH = 400;
    static final int DISPLAY_WIDTH = 1280;
    static final int MAX_DIMENSION = 8000;
    static final float JPEG_QUALITY = 0.8f;

    public record Variants(byte[] original, byte[] thumb, byte[] display) {
    }

    public Variants process(byte[] content) {
        rejectDecompressionBombs(content);
        BufferedImage source;
        try {
            source = ImageIO.read(new ByteArrayInputStream(content));
        } catch (IOException unreadable) {
            source = null;
        }
        if (source == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_image",
                    "The uploaded photo could not be decoded as an image");
        }
        return new Variants(render(source, source.getWidth()), render(source, THUMB_WIDTH),
                render(source, DISPLAY_WIDTH));
    }

    /**
     * Reads only the declared dimensions before any decode: a few bytes can
     * declare a 30000×30000 image whose decode would exhaust the heap.
     */
    private static void rejectDecompressionBombs(byte[] content) {
        ApiException invalid = new ApiException(HttpStatus.BAD_REQUEST, "invalid_image",
                "The uploaded photo could not be decoded as an image");
        try (var stream = ImageIO.createImageInputStream(new ByteArrayInputStream(content))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(stream);
            if (!readers.hasNext()) {
                throw invalid;
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(stream);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_image",
                            "Photos are limited to " + MAX_DIMENSION + " px per side");
                }
            } finally {
                reader.dispose();
            }
        } catch (IOException e) {
            throw invalid;
        }
    }

    private static byte[] render(BufferedImage source, int maxWidth) {
        int width = Math.min(maxWidth, source.getWidth());
        int height = Math.max(1, Math.round(source.getHeight() * (width / (float) source.getWidth())));
        BufferedImage target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = target.createGraphics();
        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, width, height);
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.drawImage(source, 0, 0, width, height, null);
        } finally {
            graphics.dispose();
        }
        return encodeJpeg(target);
    }

    private static byte[] encodeJpeg(BufferedImage image) {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            throw new IllegalStateException("No JPEG image writer available");
        }
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        param.setCompressionQuality(JPEG_QUALITY);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ImageOutputStream stream = new MemoryCacheImageOutputStream(out)) {
            writer.setOutput(stream);
            writer.write(null, new IIOImage(image, null, null), param);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot encode the image variant", e);
        } finally {
            writer.dispose();
        }
        return out.toByteArray();
    }
}
