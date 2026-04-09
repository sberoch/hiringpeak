export const normalizeString = (str: string) => {
  return str
    .normalize("NFKD") // Decompose characters (e.g., "á" → "a\u0301")
    .replace(/[\u0300-\u036f]/g, "") // Remove combining diacritical marks
    .toLowerCase(); // Optional: Case-insensitive comparison
};

const tailwindColors = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "zinc",
  "stone",
];

const colorRGBMap: Record<string, string> = {
  red: "rgb(254, 202, 202)",
  orange: "rgb(253, 186, 116)",
  amber: "rgb(253, 230, 138)",
  yellow: "rgb(254, 240, 138)",
  lime: "rgb(217, 249, 157)",
  green: "rgb(187, 247, 208)",
  emerald: "rgb(167, 243, 208)",
  teal: "rgb(153, 246, 228)",
  cyan: "rgb(165, 243, 252)",
  sky: "rgb(186, 230, 253)",
  blue: "rgb(191, 219, 254)",
  indigo: "rgb(199, 210, 254)",
  violet: "rgb(221, 214, 254)",
  purple: "rgb(233, 213, 255)",
  fuchsia: "rgb(250, 232, 255)",
  pink: "rgb(251, 207, 232)",
  rose: "rgb(254, 205, 211)",
  zinc: "rgb(228, 228, 231)",
  stone: "rgb(231, 229, 228)",
};

export function stringToColor(str: string): string {
  if (!str) return "gray";
  const hash = str.split("").reduce((acc, char, index) => {
    return char.charCodeAt(0) + ((acc << 5) - acc) + index * str.length;
  }, 0);

  const colorIndex = Math.abs(hash) % tailwindColors.length;
  const color = tailwindColors[colorIndex] ?? "stone";

  return colorRGBMap[color] ?? "rgb(231, 229, 228)";
}
