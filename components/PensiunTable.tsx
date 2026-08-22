import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import {
  Search,
  Briefcase,
  Clock,
  BadgeCheck,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Activity,
  Loader2,
  FileDown,
  FileSpreadsheet,
  SlidersHorizontal,
} from "lucide-react";
import { Employee } from "../types";
import { Language } from "../utils/translationHelper";
import { createPortal } from "react-dom";
import {
  getBirthDateFromNIP,
  getRetirementAge,
  calculateTmtPensiun,
  getPensiunStatus,
} from "../utils/pensionHelpers";
import { useDebounce } from "../hooks/useDebounce";
import { DeferredView } from "./DeferredView";
import { getMasaKerjaYears } from "../utils/employeeUtils";
const PensiunVisualization = lazy(() =>
  import("./PensiunVisualization").then((m) => ({
    default: m.PensiunVisualization,
  })),
);
interface Props {
  employees: Employee[];
  language?: Language;
}
const PensiunTable = React.memo(({ employees }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [golFilter, setGolFilter] = useState<string>("All");
  const [masaKerjaFilter, setMasaKerjaFilter] = useState<string>("All");
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] =
    useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>({ key: "tmtPensiun", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCompact, setIsCompact] = useState<boolean>(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    unitFilter,
    statusFilter,
    golFilter,
    masaKerjaFilter,
    itemsPerPage,
  ]);
  const employeesWithPensionData = useMemo(() => {
    return employees.map((emp) => {
      const birthDate = getBirthDateFromNIP(emp.nip);
      let bup = 58;
      let tmtPensiun = new Date(0);
      let pStatus: {
        status: "Mendekati" | "Aktif" | "Pensiun";
        monthsRemaining: number;
      } = { status: "Aktif", monthsRemaining: 999 };
      let age = 0;
      if (birthDate) {
        bup = getRetirementAge(emp.jabatan);
        tmtPensiun = calculateTmtPensiun(birthDate, bup);
        pStatus = getPensiunStatus(tmtPensiun);
        age = new Date().getFullYear() - birthDate.getFullYear();
        if (
          new Date().getMonth() < birthDate.getMonth() ||
          (new Date().getMonth() === birthDate.getMonth() &&
            new Date().getDate() < birthDate.getDate())
        ) {
          age--;
        }
      }
      return {
        ...emp,
        birthDate,
        bup,
        tmtPensiun,
        pStatus,
        age,
      };
    });
  }, [employees]);
  const uniqueUnits = useMemo(() => {
    const units = new Set(
      employeesWithPensionData.map((e) => e.unitKerja).filter(Boolean),
    );
    return Array.from(units).sort();
  }, [employeesWithPensionData]);
  const uniquePangkat = useMemo(() => {
    const pangkat = new Set(
      employeesWithPensionData.map((e) => e.pangkat).filter(Boolean),
    );
    return Array.from(pangkat).sort();
  }, [employeesWithPensionData]);
  const filtered = useMemo(() => {
    return employeesWithPensionData.filter((emp) => {
      const matchesSearch =
        emp.nama.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        emp.nip.includes(debouncedSearchTerm) ||
        emp.jabatan.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesUnit = unitFilter === "All" || emp.unitKerja === unitFilter;
      const matchesStatus =
        statusFilter === "All" || emp.pStatus.status === statusFilter;
      const matchesGol = golFilter === "All" || emp.pangkat === golFilter;
      let matchesMasaKerja = true;
      if (masaKerjaFilter !== "All") {
        const years = getMasaKerjaYears(emp.masaKerja);
        if (masaKerjaFilter === "0-5")
          matchesMasaKerja = years >= 0 && years <= 5;
        else if (masaKerjaFilter === "6-10")
          matchesMasaKerja = years >= 6 && years <= 10;
        else if (masaKerjaFilter === "11-15")
          matchesMasaKerja = years >= 11 && years <= 15;
        else if (masaKerjaFilter === "16-20")
          matchesMasaKerja = years >= 16 && years <= 20;
        else if (masaKerjaFilter === "21+") matchesMasaKerja = years >= 21;
      }
      return (
        matchesSearch &&
        matchesUnit &&
        matchesStatus &&
        matchesGol &&
        matchesMasaKerja
      );
    });
  }, [
    employeesWithPensionData,
    debouncedSearchTerm,
    unitFilter,
    statusFilter,
    golFilter,
    masaKerjaFilter,
  ]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    unitFilter,
    statusFilter,
    golFilter,
    masaKerjaFilter,
  ]);
  const sortedFiltered = useMemo(() => {
    let sortableItems = [...filtered];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal: any = a[sortConfig.key as keyof typeof a];
        let bVal: any = b[sortConfig.key as keyof typeof b];

        // nested object handling for sorting
        if (sortConfig.key === "statusPensiun") {
          aVal = a.pStatus.monthsRemaining;
          bVal = b.pStatus.monthsRemaining;
        } else if (sortConfig.key === "tmtPensiun") {
          aVal = a.tmtPensiun.getTime();
          bVal = b.tmtPensiun.getTime();
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filtered, sortConfig]);
  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedFiltered.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedFiltered, currentPage, itemsPerPage]);
  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const handleExportExcel = async () => {
    if (filtered.length === 0) return;
    setIsExportingExcel(true);
    try {
      const XLSX = await import("xlsx");
      const exportData = filtered.map((emp, i) => [
        i + 1,
        emp.nama,
        emp.nip,
        emp.pangkat,
        emp.jabatan,
        emp.unitKerja,
        emp.age,
        emp.bup,
        emp.tmtPensiun.toLocaleDateString("id-ID"),
        emp.pStatus.status,
        emp.pStatus.monthsRemaining === 999 ? "-" : emp.pStatus.monthsRemaining,
      ]);
      const ws = XLSX.utils.aoa_to_sheet([
        ["DATA PROYEKSI PENSIUN PEGAWAI"],
        [],
        [
          "No",
          "Nama",
          "NIP",
          "Pangkat/Gol",
          "Jabatan",
          "Unit Kerja",
          "Usia",
          "BUP",
          "TMT Pensiun",
          "Status",
          "Sisa Waktu (Bulan)",
        ],
        ...exportData,
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Proyeksi Pensiun");
      XLSX.writeFile(
        wb,
        `Data_Pensiun_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingExcel(false);
    }
  };
  const handleExportPdf = async () => {
    if (filtered.length === 0) return;
    setIsExportingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF("l", "mm", "a4");
      doc.setFontSize(16);
      doc.text("DAFTAR NOMINATIF PROYEKSI PENSIUN", 148.5, 15, {
        align: "center",
      });
      doc.setFontSize(10);
      doc.text(
        `Dicetak pada: ${new Date().toLocaleDateString("id-ID")}`,
        148.5,
        22,
        { align: "center" },
      );
      const tableColumn = [
        "No",
        "Nama Pegawai",
        "NIP",
        "Unit Kerja",
        "Usia",
        "BUP",
        "TMT Pensiun",
        "Status",
      ];
      const tableRows = filtered.map((emp, i) => [
        i + 1,
        emp.nama,
        emp.nip,
        emp.unitKerja,
        `${emp.age} thn`,
        emp.bup,
        emp.tmtPensiun.toLocaleDateString("id-ID"),
        emp.pStatus.status,
      ]);
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          2: { halign: "center", cellWidth: 35 },
          4: { halign: "center", cellWidth: 20 },
          5: { halign: "center", cellWidth: 15 },
          6: { halign: "center", cellWidth: 25 },
          7: { halign: "center", cellWidth: 20 },
        },
      });
      doc.save(`Data_Pensiun_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPdf(false);
    }
  };
  return (
    <>
      {/* Visualisasi Proyeksi & Regenerasi SDM */}
      <DeferredView
        minHeight="112px"
        placeholder={
          <div className="h-28 bg-gray-100 dark:bg-gray-800/50 rounded-xl mb-6 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
            Memuat visualisasi...
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="h-28 bg-gray-100 dark:bg-gray-800/50 rounded-xl mb-6 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
              Memuat visualisasi...
            </div>
          }
        >
          <PensiunVisualization employees={employees} />
        </Suspense>
      </DeferredView>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-800 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Activity
                className="text-rose-500 dark:text-rose-400"
                size={16}
              />{" "}
              Daftar Proyeksi Pensiun
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mt-0.5">
              Pemantauan Batas Usia Pensiun (BUP) Pegawai.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-2.5 flex-wrap">
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel || filtered.length === 0}
              className="flex items-center justify-center gap-2 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-semibold text-xs transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {isExportingExcel ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={14} />
              )}
              {isExportingExcel ? "Memproses..." : "Ekspor Excel"}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf || filtered.length === 0}
              className="flex items-center justify-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-semibold text-xs transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {isExportingPdf ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileDown size={14} />
              )}
              {isExportingPdf ? "Memproses..." : "Cetak PDF"}
            </button>
            <button
              onClick={() => setIsCompact(!isCompact)}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 border rounded-lg font-semibold text-xs transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer ${
                isCompact
                  ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-500/20"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              }`}
              title="Aktifkan Mode Ringkas untuk menampilkan lebih banyak baris"
            >
              <SlidersHorizontal
                size={14}
                className={
                  isCompact
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-gray-500 dark:text-gray-400"
                }
              />
              <span>{isCompact ? "Mode Normal" : "Mode Ringkas"}</span>
            </button>

            <button
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 border rounded-lg font-semibold text-xs transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer ${
                isAdvancedFilterOpen
                  ? "bg-rose-600 border-rose-600 text-white hover:bg-rose-700"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              }`}
            >
              <SlidersHorizontal
                size={14}
                className={
                  isAdvancedFilterOpen
                    ? "text-white"
                    : "text-gray-500 dark:text-gray-400"
                }
              />
              <span>Filter Lanjutan</span>
              {(unitFilter !== "All" ||
                golFilter !== "All" ||
                masaKerjaFilter !== "All") && (
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-extrabold ${isAdvancedFilterOpen ? "bg-white dark:bg-gray-900 text-rose-600" : "bg-rose-600 text-white"}`}
                >
                  {(unitFilter !== "All" ? 1 : 0) +
                    (golFilter !== "All" ? 1 : 0) +
                    (masaKerjaFilter !== "All" ? 1 : 0)}
                </span>
              )}
            </button>

            <div
              className={`relative flex-grow md:flex-grow-0 group w-full md:w-auto transition-all ${searchTerm !== "" ? "ring-1 ring-rose-500 rounded-lg" : ""}`}
            >
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${searchTerm !== "" ? "text-rose-600 dark:text-rose-400" : "text-gray-500 dark:text-gray-400"} group-focus-within:text-rose-500 dark:group-focus-within:text-rose-400`}
                size={16}
              />
              <input
                type="text"
                placeholder="Cari Nama, NIP..."
                className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 dark:focus:border-rose-400 text-xs w-full md:w-56 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              <select
                className="px-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 dark:focus:border-rose-400 text-xs bg-gray-50 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-200 cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Mendekati">Mendekati (&lt; 1 thn)</option>
                <option value="Pensiun">Sudah Pensiun</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {isAdvancedFilterOpen && (
          <div className="px-5 py-4 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 ">
            {/* Unit Kerja */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700 dark:text-gray-300 font-extrabold text-[10px] uppercase r flex items-center gap-1">
                <Briefcase
                  size={12}
                  className="text-rose-500 dark:text-rose-400"
                />
                <span>Unit Kerja</span>
              </label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 dark:focus:border-rose-400 cursor-pointer shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
              >
                <option value="All">Semua Unit Kerja</option>
                {uniqueUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Golongan */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700 dark:text-gray-300 font-extrabold text-[10px] uppercase r flex items-center gap-1">
                <BadgeCheck
                  size={12}
                  className="text-rose-500 dark:text-rose-400"
                />
                <span>Golongan / Pangkat</span>
              </label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 dark:focus:border-rose-400 cursor-pointer shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                value={golFilter}
                onChange={(e) => setGolFilter(e.target.value)}
              >
                <option value="All">Semua Golongan</option>
                {uniquePangkat.map((pangkat) => (
                  <option key={pangkat} value={pangkat}>
                    {pangkat}
                  </option>
                ))}
              </select>
            </div>

            {/* Masa Kerja */}
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-700 dark:text-gray-300 font-extrabold text-[10px] uppercase r flex items-center gap-1">
                <Clock size={12} className="text-rose-500 dark:text-rose-400" />
                <span>Masa Kerja</span>
              </label>
              <div className="flex gap-2">
                <select
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 dark:focus:border-rose-400 cursor-pointer shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  value={masaKerjaFilter}
                  onChange={(e) => setMasaKerjaFilter(e.target.value)}
                >
                  <option value="All">Semua Masa Kerja</option>
                  <option value="0-5">0 - 5 Tahun</option>
                  <option value="6-10">6 - 10 Tahun</option>
                  <option value="11-15">11 - 15 Tahun</option>
                  <option value="16-20">16 - 20 Tahun</option>
                  <option value="21+">21+ Tahun</option>
                </select>
                {(unitFilter !== "All" ||
                  golFilter !== "All" ||
                  masaKerjaFilter !== "All") && (
                  <button
                    onClick={() => {
                      setUnitFilter("All");
                      setGolFilter("All");
                      setMasaKerjaFilter("All");
                    }}
                    className="px-2.5 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-gray-100 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm active:scale-95"
                    title="Reset Filter Lanjutan"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto custom-scrollbar touch-pan-x overscroll-x-contain">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 z-10 shadow-sm">
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 text-[10px] uppercase font-bold st border-b border-gray-200 dark:border-gray-700">
                <th
                  className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}`}
                  onClick={() => requestSort("nama")}
                >
                  Pegawai <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th className={isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}>
                  Pangkat/Jabatan
                </th>
                <th
                  className={`text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}`}
                  onClick={() => requestSort("age")}
                >
                  Usia <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th
                  className={`text-center ${isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}`}
                >
                  BUP
                </th>
                <th
                  className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}`}
                  onClick={() => requestSort("tmtPensiun")}
                >
                  TMT Pensiun <ArrowUpDown size={10} className="inline ml-1" />
                </th>
                <th
                  className={`text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}`}
                  onClick={() => requestSort("statusPensiun")}
                >
                  Status <ArrowUpDown size={10} className="inline ml-1" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 text-sm print:hidden">
              {paginatedData.length > 0 ? (
                paginatedData.map((emp) => (
                  <tr
                    key={emp.id}
                    className={`transition-all duration-150 group cursor-pointer border-l-4 even:bg-gray-50/50 dark:even:bg-gray-800/20 odd:bg-white dark:odd:bg-gray-900 ${
                      selectedEmployee?.id === emp.id
                        ? "!bg-primary-50/80 dark:!bg-primary-950/40 border-l-primary-500 shadow-sm"
                        : "border-l-transparent hover:!bg-primary-50/60 dark:hover:!bg-gray-800/70 hover:border-l-primary-400 dark:hover:border-l-primary-500"
                    }`}
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <td className={isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}>
                      <div className="flex items-center gap-2">
                        <div>
                          <div
                            className={` font-bold text-gray-800 dark:text-gray-100 mb-0.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ${isCompact ? "text-[11px] md:text-xs" : "text-xs md:text-sm"}`}
                          >
                            {emp.nama}
                          </div>
                          <div
                            className={`text-gray-500 dark:text-gray-400 font-mono font-medium ${isCompact ? "text-[9px]" : "text-[10px]"}`}
                          >
                            {emp.nip}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}>
                      <div
                        className={`font-bold text-gray-700 dark:text-gray-200 ${isCompact ? "text-[11px]" : "text-xs"}`}
                      >
                        {emp.jabatan}
                      </div>
                      <div
                        className={`text-gray-500 dark:text-gray-400 ${isCompact ? "text-[9px]" : "text-[10px]"}`}
                      >
                        {emp.pangkat}
                      </div>
                    </td>
                    <td
                      className={`text-center font-bold text-gray-700 dark:text-gray-200 ${isCompact ? "px-3 py-1.5 text-xs" : "px-3 py-2.5"}`}
                    >
                      {emp.age} thn
                    </td>
                    <td
                      className={`text-center text-gray-500 dark:text-gray-400 font-bold ${isCompact ? "px-3 py-1.5 text-[10px]" : "px-3 py-2.5 text-xs"}`}
                    >
                      {emp.bup} thn
                    </td>
                    <td
                      className={`font-mono font-bold text-gray-700 dark:text-gray-200 ${isCompact ? "px-3 py-1.5 text-xs" : "px-3 py-2.5"}`}
                    >
                      {emp.tmtPensiun.toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td
                      className={`text-center ${isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}`}
                    >
                      {emp.pStatus.status === "Aktif" && (
                        <span
                          className={`bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg font-bold border border-primary-100 dark:border-primary-800 ${isCompact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"}`}
                        >
                          {emp.pStatus.monthsRemaining} bulan lagi
                        </span>
                      )}
                      {emp.pStatus.status === "Mendekati" && (
                        <span
                          className={`bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg font-bold border border-amber-100 dark:border-amber-800 ${isCompact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"}`}
                        >
                          Mendekati ({emp.pStatus.monthsRemaining} bln)
                        </span>
                      )}
                      {emp.pStatus.status === "Pensiun" && (
                        <span
                          className={`bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg font-bold border border-rose-100 dark:border-rose-800 ${isCompact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"}`}
                        >
                          Pensiun
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-500 gap-4">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-700">
                        <Search size={32} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-500 dark:text-gray-400 text-lg">
                          Tidak ada data ditemukan
                        </p>
                        <p className="text-sm">
                          Coba sesuaikan filter atau kata kunci pencarian Anda.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
<tbody className="divide-y divide-gray-200 hidden print:table-row-group print:text-black">
              {paginatedData.length > 0 ? (
                paginatedData.map((emp) => (
                  <tr
                    key={emp.id}
                    className={`transition-all duration-150 group cursor-pointer border-l-4 even:bg-gray-50/50 dark:even:bg-gray-800/20 odd:bg-white dark:odd:bg-gray-900 ${
                      selectedEmployee?.id === emp.id
                        ? "!bg-primary-50/80 dark:!bg-primary-950/40 border-l-primary-500 shadow-sm"
                        : "border-l-transparent hover:!bg-primary-50/60 dark:hover:!bg-gray-800/70 hover:border-l-primary-400 dark:hover:border-l-primary-500"
                    }`}
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <td className={isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}>
                      <div className="flex items-center gap-2">
                        <div>
                          <div
                            className={` font-bold text-gray-800 dark:text-gray-100 mb-0.5 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors ${isCompact ? "text-[11px] md:text-xs" : "text-xs md:text-sm"}`}
                          >
                            {emp.nama}
                          </div>
                          <div
                            className={`text-gray-500 dark:text-gray-400 font-mono font-medium ${isCompact ? "text-[9px]" : "text-[10px]"}`}
                          >
                            {emp.nip}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}>
                      <div
                        className={`font-bold text-gray-700 dark:text-gray-200 ${isCompact ? "text-[11px]" : "text-xs"}`}
                      >
                        {emp.jabatan}
                      </div>
                      <div
                        className={`text-gray-500 dark:text-gray-400 ${isCompact ? "text-[9px]" : "text-[10px]"}`}
                      >
                        {emp.pangkat}
                      </div>
                    </td>
                    <td
                      className={`text-center font-bold text-gray-700 dark:text-gray-200 ${isCompact ? "px-3 py-1.5 text-xs" : "px-3 py-2.5"}`}
                    >
                      {emp.age} thn
                    </td>
                    <td
                      className={`text-center text-gray-500 dark:text-gray-400 font-bold ${isCompact ? "px-3 py-1.5 text-[10px]" : "px-3 py-2.5 text-xs"}`}
                    >
                      {emp.bup} thn
                    </td>
                    <td
                      className={`font-mono font-bold text-gray-700 dark:text-gray-200 ${isCompact ? "px-3 py-1.5 text-xs" : "px-3 py-2.5"}`}
                    >
                      {emp.tmtPensiun.toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td
                      className={`text-center ${isCompact ? "px-3 py-1.5" : "px-3 py-2.5"}`}
                    >
                      {emp.pStatus.status === "Aktif" && (
                        <span
                          className={`bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg font-bold border border-primary-100 dark:border-primary-800 ${isCompact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"}`}
                        >
                          {emp.pStatus.monthsRemaining} bulan lagi
                        </span>
                      )}
                      {emp.pStatus.status === "Mendekati" && (
                        <span
                          className={`bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg font-bold border border-amber-100 dark:border-amber-800 ${isCompact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"}`}
                        >
                          Mendekati ({emp.pStatus.monthsRemaining} bln)
                        </span>
                      )}
                      {emp.pStatus.status === "Pensiun" && (
                        <span
                          className={`bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg font-bold border border-rose-100 dark:border-rose-800 ${isCompact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"}`}
                        >
                          Pensiun
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-500 gap-4">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-700">
                        <Search size={32} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-500 dark:text-gray-400 text-lg">
                          Tidak ada data ditemukan
                        </p>
                        <p className="text-sm">
                          Coba sesuaikan filter atau kata kunci pencarian Anda.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between px-6 gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase r">
              Total: {filtered.length} Pegawai
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase">
                Tampilkan:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold px-2 py-1 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-700 dark:text-gray-200"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
<option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Halaman Pertama"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                  Hal
                </span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => handlePageChange(Number(e.target.value))}
                  className="w-10 text-center py-0.5 border border-gray-200 dark:border-gray-700 rounded-md text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                  / {totalPages}
                </span>
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Halaman Berikutnya"
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Halaman Terakhir"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEmployee &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 "
              onClick={() => setSelectedEmployee(null)}
            ></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl p-6 z-10 border border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-800 border-2 border-rose-500 text-white font-bold text-lg shadow-lg shadow-rose-500/20 flex-shrink-0">
                  {selectedEmployee.nama.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className=" font-bold text-xl text-gray-800 dark:text-gray-100">
                    {selectedEmployee.nama}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 font-mono text-xs font-bold">
                    {selectedEmployee.nip}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-6 border-t border-gray-100 dark:border-gray-800 pt-4">
                {(() => {
                  const bd = getBirthDateFromNIP(selectedEmployee.nip);
                  const bup = getRetirementAge(selectedEmployee.jabatan);
                  const tmt = bd ? calculateTmtPensiun(bd, bup) : new Date(0);
                  return (
                    <>
                      <div className="flex justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase">
                          Tanggal Lahir
                        </span>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                          {bd
                            ? bd.toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase">
                          BUP (Batas Usia)
                        </span>
                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                          {bup} Tahun
                        </span>
                      </div>
                      <div className="flex justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <span className="text-xs text-gray-600 dark:text-gray-300 font-bold uppercase">
                          TMT Pensiun
                        </span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          {tmt.toLocaleDateString("id-ID", {
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <button
                onClick={() => setSelectedEmployee(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800"
              >
                Tutup Detail
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
});
export default PensiunTable;
