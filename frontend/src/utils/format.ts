export function formatPrice(
  cents: number,
  currency: string
): string {
  return new Intl.NumberFormat(undefined, { 
    // Intl is JavaScript's built-in Internationalization API.
    // It formats numbers, currencies, dates, and times according to the user's locale.
    
    // Intl.NumberFormat formats numbers in a locale-aware way.
    // It can display values as currency, percentages, decimals, and more.
    style: "currency",
    // Tells NumberFormat to display the number as a currency value.
    // The currency code (e.g., USD, EUR) determines the symbol and formatting.
    currency: (currency ?? "usd").toUpperCase(),
    // ?? returns the value on the right only if the left side is null or undefined.
    // Unlike ||, it does not replace valid values like "", 0, or false.
  }).format(cents / 100);
}

interface FormatOrderWhenOptions {
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
}
export function formatOrderWhen(
  iso: string | null | undefined,
  opts: FormatOrderWhenOptions = {}
): string {
  const { dateStyle = "medium" } = opts;
  // Displays the date in a medium-length, locale-specific format.
  // Example: "Jul 18, 2026" or "18 Jul 2026", depending on the user's locale.
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    // Intl.DateTimeFormat formats Date objects according to the user's locale.
    // It controls how dates and times are displayed without manual formatting.
    dateStyle,
    timeStyle: "short",
    // Displays the time in a short, locale-specific format.
    // Example: "3:45 PM" or "15:45", depending on the user's locale.
  }).format(date);
}
