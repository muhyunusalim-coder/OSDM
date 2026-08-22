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
