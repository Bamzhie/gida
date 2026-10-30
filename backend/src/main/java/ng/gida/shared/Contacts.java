package ng.gida.shared;

import java.util.regex.Pattern;

public final class Contacts {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE = Pattern.compile("^[+()\\d\\s-]{7,}$");

    private Contacts() {
    }

    public static boolean isValid(String value) {
        if (value == null) return false;
        String contact = value.trim();
        return !contact.isEmpty() && (EMAIL.matcher(contact).matches() || PHONE.matcher(contact).matches());
    }
}
