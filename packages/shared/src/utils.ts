export const normalizeString = (str: string) => {
  return str
    .normalize("NFKD") // Decompose characters (e.g., "á" → "a\u0301")
    .replace(/[\u0300-\u036f]/g, "") // Remove combining diacritical marks
    .toLowerCase(); // Optional: Case-insensitive comparison
};
