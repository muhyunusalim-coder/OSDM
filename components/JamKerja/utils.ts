export function getQuarterFromMonth(monthName: string): {
  key: string;
  label: string;
} {
  const m = monthName.toLowerCase();
  if (
    m.includes("januari") ||
    m.includes("februari") ||
    m.includes("maret") ||
    m.includes("jan") ||
    m.includes("feb") ||
    m.includes("mar")
  ) {
    return { key: "Q1", label: "Triwulan I" };
  }
  if (
    m.includes("april") ||
    m.includes("mei") ||
    m.includes("juni") ||
    m.includes("apr") ||
    m.includes("may") ||
    m.includes("jun")
  ) {
    return { key: "Q2", label: "Triwulan II" };
  }
  if (
    m.includes("juli") ||
    m.includes("agustus") ||
    m.includes("september") ||
    m.includes("jul") ||
    m.includes("aug") ||
    m.includes("sep")
  ) {
    return { key: "Q3", label: "Triwulan III" };
  }
  if (
    m.includes("oktober") ||
    m.includes("november") ||
    m.includes("desember") ||
    m.includes("oct") ||
    m.includes("nov") ||
    m.includes("dec")
  ) {
    return { key: "Q4", label: "Triwulan IV" };
  }
  return { key: "Lainnya", label: "Lainnya" };
}
export function translateMonthName(monthStr: string, lang: string) {
  if (lang !== "en") return monthStr;
  const monthMap: Record<string, string> = {
    Januari: "January",
    Februari: "February",
    Maret: "March",
    April: "April",
    Mei: "May",
    Juni: "June",
    Juli: "July",
    Agustus: "August",
    September: "September",
    Oktober: "October",
    November: "November",
    Desember: "December",
    Semua: "All",
  };
  return monthMap[monthStr] || monthStr;
}

const MONTH_ORDER_MAP: Record<string, number> = {
  januari: 1,
  january: 1,
  jan: 1,
  februari: 2,
  february: 2,
  feb: 2,
  maret: 3,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  mei: 5,
  may: 5,
  juni: 6,
  june: 6,
  jun: 6,
  juli: 7,
  july: 7,
  jul: 7,
  agustus: 8,
  august: 8,
  agu: 8,
  aug: 8,
  september: 9,
  sep: 9,
  oktober: 10,
  october: 10,
  okt: 10,
  oct: 10,
  november: 11,
  nov: 11,
  desember: 12,
  december: 12,
  des: 12,
  dec: 12,
};

export function getMonthOrderIndex(monthName: string): number {
  if (!monthName) return 99;
  const clean = monthName.toLowerCase().trim();
  return MONTH_ORDER_MAP[clean] ?? 99;
}

export function sortMonthsChronologically(months: string[]): string[] {
  return [...months].sort((a, b) => {
    const orderA = getMonthOrderIndex(a);
    const orderB = getMonthOrderIndex(b);
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.localeCompare(b);
  });
}

