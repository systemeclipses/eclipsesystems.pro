export function centsToDollars(cents: number) {
  if (!Number.isInteger(cents)) throw new Error("cents must be an integer");
  const sign = cents < 0 ? "-" : "";
  const absolute = BigInt(Math.abs(cents));
  return sign + (absolute / 100n).toString() + "." + (absolute % 100n).toString().padStart(2, "0");
}

export function dollarsToCents(dollars: string) {
  if (!/^-?\d+(\.\d{1,2})?$/.test(dollars)) throw new Error("amount must have at most two decimal places");
  const negative = dollars.startsWith("-");
  const [majorRaw, minorRaw = ""] = dollars.replace("-", "").split(".");
  const cents = BigInt(majorRaw) * 100n + BigInt(minorRaw.padEnd(2, "0"));
  return Number(negative ? -cents : cents);
}
