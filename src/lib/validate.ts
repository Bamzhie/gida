export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidContact(value: string): boolean {
  const contact = value.trim();
  if (!contact) return false;
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phone = /^[+()\d\s-]{7,}$/;
  return email.test(contact) || phone.test(contact);
}

export function isValidBudgetRange(min: string, max: string): boolean {
  const minimum = min.trim() === "" ? 0 : Number(min);
  const maximum = max.trim() === "" ? Number.POSITIVE_INFINITY : Number(max);
  return (
    Number.isFinite(minimum) &&
    !Number.isNaN(maximum) &&
    minimum >= 0 &&
    maximum >= 0 &&
    minimum <= maximum
  );
}
