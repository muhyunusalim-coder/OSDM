import * as XLSX from 'xlsx';
import { getAuthToken } from '../services/dataService';

export interface DailyAttendance {
  raw: string;
  checkIn: string | null;
  checkOut: string | null;
  actualWorked: number; // in minutes (our calculation)
  deficiency: number; // in minutes
  note: string; // "Hadir", "Tidak Hadir", "Cuti Tahunan (CT)", "Cuti (C)", "Dinas Luar (DL)", "Sakit (S)", "Izin (I)", "Akhir Pekan", "Hari Libur", etc.
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  isRequiredDay: boolean;
}

export interface JamKerjaRecord {
  no: string;
  nip: string;
  nama: string;
  gol: string;
  unitKerja: string;
  bulan: string;
  attendance: { [day: number]: DailyAttendance };
  totalHadir: number;
  totalLeave: number;
  totalAbsen: number; // Unexcused absences
  totalActualWorked: number; // in minutes
  totalDeficiency: number; // in minutes
  averageDeficiencyPerDay: number; // in minutes
}

// Helper to convert "HH:MM" string to minutes
export function parseTimeToMinutes(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim();
  if (!cleaned || cleaned === '-' || cleaned === 'CT' || cleaned === 'C' || cleaned === 'DL' || cleaned === 'S' || cleaned === 'I') return null;
  
  const match = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h * 60 + m;
}

// Helper to convert minutes back to "HH:MM"
export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Helper to convert minutes to friendly string like "7j 30m"
export function formatMinutesFriendly(minutes: number): string {
  const roundedMins = Math.round(minutes);
  if (roundedMins === 0) return "0m";
  const h = Math.floor(roundedMins / 60);
  const m = roundedMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}

// Get day of the week for dynamic month
export function getMonthIndex(monthStr: string): number {
  const m = monthStr.trim().toLowerCase();
  if (m.startsWith("jan")) return 0;
  if (m.startsWith("peb") || m.startsWith("feb")) return 1;
  if (m.startsWith("mar")) return 2;
  if (m.startsWith("apr")) return 3;
  if (m.startsWith("mei") || m.startsWith("may")) return 4;
  if (m.startsWith("jun")) return 5;
  if (m.startsWith("jul")) return 6;
  if (m.startsWith("agu") || m.startsWith("aug")) return 7;
  if (m.startsWith("sep")) return 8;
  if (m.startsWith("okt") || m.startsWith("oct")) return 9;
  if (m.startsWith("nop") || m.startsWith("nov")) return 10;
  if (m.startsWith("des") || m.startsWith("dec")) return 11;
  return 5; // default to June (5)
}

export function getDayOfWeekForMonth(monthStr: string, day: number): number {
  const monthIdx = getMonthIndex(monthStr);
  return new Date(2026, monthIdx, day).getDay();
}

export function isWeekendForMonth(monthStr: string, day: number): boolean {
  const dow = getDayOfWeekForMonth(monthStr, day);
  return dow === 0 || dow === 6;
}

// Keep old helpers for backward compatibility
export function getDayOfWeekForJune2026(day: number): number {
  return new Date(2026, 5, day).getDay();
}

export function isWeekendJune2026(day: number): boolean {
  const dow = getDayOfWeekForJune2026(day);
  return dow === 0 || dow === 6;
}

// Friendly day name in Indonesian
export function getDayNameIndonesian(dow: number): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[dow];
}

// Friendly month name in Indonesian
export function getMonthNameIndonesian(monthStr: string): string {
  const mapping: { [key: string]: string } = {
    "Juni": "Juni",
    "June": "Juni",
    "juni": "Juni",
    "Mei": "Mei",
    "May": "Mei",
    "mei": "Mei",
    "Maret": "Maret",
    "March": "Maret",
    "maret": "Maret",
    "Februari": "Februari",
    "February": "Februari",
    "februari": "Februari"
  };
  return mapping[monthStr] || monthStr;
}

// Get Indonesian National Holiday Name dynamically for 2026
export function getIndonesianHolidayName(monthStr: string, day: number): string | null {
  const m = monthStr.trim().toLowerCase();
  
  if (m.startsWith("jan")) {
    if (day === 1) return "Tahun Baru Masehi";
    if (day === 25) return "Israk Mikraj Nabi Muhammad SAW";
  }
  if (m.startsWith("feb")) {
    if (day === 15) return "Isra Mi'raj Nabi Muhammad SAW";
    if (day === 17) return "Tahun Baru Imlek 2577 Kongzili";
    if (day === 18) return "Cuti Bersama Tahun Baru Imlek";
  }
  if (m.startsWith("mar")) {
    if (day === 18) return "Cuti Bersama Hari Raya Nyepi";
    if (day === 19) return "Hari Raya Nyepi (Tahun Baru Saka 1948)";
    if (day === 20) return "Cuti Bersama Hari Raya Nyepi";
    if (day === 21) return "Hari Raya Idul Fitri 1447 H"; // Saturday
    if (day === 23) return "Hari Raya Idul Fitri 1447 H / Cuti Bersama"; // Monday
    if (day === 24) return "Cuti Bersama Hari Raya Idul Fitri";
    if (day === 25) return "Cuti Bersama Hari Raya Idul Fitri";
    if (day === 26) return "Cuti Bersama Hari Raya Idul Fitri";
  }
  if (m.startsWith("apr")) {
    if (day === 3) return "Wafat Yesus Kristus";
    if (day === 5) return "Hari Paskah";
  }
  if (m.startsWith("mei") || m.startsWith("may")) {
    if (day === 1) return "Hari Buruh Internasional / Hari Raya Waisak 2570 BE";
    if (day === 14) return "Kenaikan Yesus Kristus";
    if (day === 15) return "Cuti Bersama Kenaikan Yesus Kristus";
    if (day === 27) return "Hari Raya Idul Adha 1447 H";
    if (day === 28) return "Cuti Bersama Hari Raya Idul Adha";
  }
  if (m.startsWith("jun")) {
    if (day === 1) return "Hari Lahir Pancasila";
    if (day === 15) return "Tahun Baru Islam 1448 Hijriah";
    if (day === 16) return "Cuti Bersama Tahun Baru Islam";
    if (day === 17) return "Cuti Bersama Tahun Baru Islam";
  }
  if (m.startsWith("agu") || m.startsWith("aug")) {
    if (day === 17) return "Hari Kemerdekaan Republik Indonesia";
  }
  if (m.startsWith("sep")) {
    if (day === 24) return "Maulid Nabi Muhammad SAW";
  }
  if (m.startsWith("des") || m.startsWith("dec")) {
    if (day === 25) return "Hari Raya Natal";
    if (day === 26) return "Cuti Bersama Hari Raya Natal";
  }

  return null;
}

export function parseJamKerjaRows(rows: any[][], sheetName: string): JamKerjaRecord[] {
  if (rows.length < 3) return [];

  // 1. Determine dynamic month name
  let monthName = "Juni";
  if (rows[2] && rows[2][3]) {
    monthName = String(rows[2][3]).trim();
  } else {
    const sheetLower = sheetName.toLowerCase();
    if (sheetLower.includes("mei")) monthName = "Mei";
    else if (sheetLower.includes("juni")) monthName = "Juni";
    else if (sheetLower.includes("juli")) monthName = "Juli";
    else if (sheetLower.includes("maret") || sheetLower.includes("march")) monthName = "Maret";
    else if (sheetLower.includes("februari") || sheetLower.includes("february") || sheetLower.includes("feb")) monthName = "Februari";
  }

  // 2. Determine date headers
  const dateColumns: { colIndex: number; day: number }[] = [];
  const dateRow = rows[1];
  if (!dateRow) return [];

  for (let col = 7; col < dateRow.length; col++) {
    const dayNum = parseInt(String(dateRow[col] || ''), 10);
    if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
      dateColumns.push({ colIndex: col, day: dayNum });
    }
  }

  // 3. Pre-calculate holiday or automatic leave detection
  const totalEmployeesCount = rows.length - 2;
  const holidayDays: { [day: number]: boolean } = {};
  
  // Use dynamic holiday detection
  dateColumns.forEach(({ day }) => {
    if (getIndonesianHolidayName(monthName, day) !== null) {
      holidayDays[day] = true;
    }
  });

  dateColumns.forEach(({ colIndex, day }) => {
    if (isWeekendForMonth(monthName, day) || holidayDays[day]) return;
    
    let absentCount = 0;
    for (let r = 2; r < rows.length; r++) {
      const val = String(rows[r]?.[colIndex] || '').trim().toUpperCase();
      if (!val || val === '-' || ['CT', 'C', 'DL', 'D', 'S', 'I', 'T', 'DK', 'TL'].includes(val)) {
        absentCount++;
      }
    }
    
    const absenceRate = absentCount / totalEmployeesCount;
    if (absenceRate > 0.8) {
      holidayDays[day] = true;
    }
  });

  const records: JamKerjaRecord[] = [];

  for (let r = 2; r < rows.length; r++) {
    const rowData = rows[r];
    if (!rowData || rowData.length < 7 || !rowData[1]) continue;

    const no = String(rowData[0] || '');
    const nip = String(rowData[1] || '');
    const unitKerja = String(rowData[2] || '');
    const bulan = String(rowData[3] || monthName);
    const gol = String(rowData[4] || '');
    const nama = String(rowData[5] || '');

    const attendance: { [day: number]: DailyAttendance } = {};
    let totalHadir = 0;
    let totalLeave = 0;
    let totalAbsen = 0;
    let totalActualWorked = 0;
    let totalDeficiency = 0;

    dateColumns.forEach(({ colIndex, day }) => {
      const cellVal = String(rowData[colIndex] || '');
      const dayOfWeek = getDayOfWeekForMonth(monthName, day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayDays[day] || false;
      const isFriday = dayOfWeek === 5;
      const isRequiredDay = !isWeekend && !isHoliday;

      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let actualWorked = 0;
      let deficiency = 0;
      let note = "";

      // Check for Ramadan/Fasting month rules (Maret 1-17 & Februari 19-28)
      const isRamadanPeriod = 
        ((monthName.match(/maret/i) || monthName.match(/march/i)) && day >= 1 && day <= 17) ||
        ((monthName.match(/februari/i) || monthName.match(/february/i) || monthName.match(/feb/i)) && day >= 19 && day <= 28);
      const targetMins = isRamadanPeriod ? 390 : 450;

      // Parse cell contents
      const lines = cellVal.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean);

      const isLeaveCode = (code: string) => {
        const c = code.trim().toUpperCase();
        return ['C', 'CT', 'DL', 'D', 'S', 'I', 'T', 'DK', 'TL'].includes(c);
      };

      const getLeaveName = (code: string) => {
        const c = code.trim().toUpperCase();
        if (c === 'CT') return "Cuti Tahunan";
        if (c === 'C') return "Cuti";
        if (c === 'DL' || c === 'D') return "Dinas";
        if (c === 'S') return "Sakit";
        if (c === 'I') return "Izin";
        if (c === 'T') return "Tugas Belajar";
        if (c === 'DK') return "Dinas Khusus (DK)";
        if (c === 'TL') return "Tugas Luar (TL)";
        return "Cuti/Izin/Dinas";
      };

      if (isWeekend) {
        note = "Akhir Pekan";
      } else if (isHoliday) {
        const hName = getIndonesianHolidayName(monthName, day);
        note = hName ? `Hari Libur (${hName})` : "Hari Libur";
      } else if (lines.length > 0 && isLeaveCode(lines[0])) {
        note = getLeaveName(lines[0]);
        totalLeave++;
      } else if (!cellVal || cellVal === '-') {
        note = "Tidak Hadir";
        deficiency = targetMins;
        totalAbsen++;
        totalDeficiency += deficiency;
      } else {
        if (lines.length >= 2) {
          checkIn = lines[0];
          checkOut = lines[1];
          
          const tInMins = parseTimeToMinutes(checkIn);
          const tOutMins = parseTimeToMinutes(checkOut);

          if (tInMins !== null && tOutMins !== null) {
            totalHadir++;
            note = "Hadir";

            // Determine earliest check-in limit
            const flexiLimitIn = isRamadanPeriod ? (parseTimeToMinutes("08:00") ?? 480) : (parseTimeToMinutes("07:30") ?? 450);
            const effIn = Math.max(tInMins, flexiLimitIn);

            // Determine max check-out limit based on day type
            const maxOut = isRamadanPeriod
              ? (isFriday ? (parseTimeToMinutes("16:30") ?? 990) : (parseTimeToMinutes("16:00") ?? 960))
              : (isFriday ? (parseTimeToMinutes("17:30") ?? 1050) : (parseTimeToMinutes("17:00") ?? 1020));
            const effOut = Math.min(tOutMins, maxOut);

            // Determine break time duration
            const breakMins = isRamadanPeriod ? (isFriday ? 60 : 30) : (isFriday ? 90 : 60);

            if (effOut > effIn) {
              const elapsed = effOut - effIn;
              actualWorked = Math.max(0, elapsed - breakMins);
            } else {
              actualWorked = 0;
            }

            deficiency = Math.max(0, targetMins - actualWorked);
            
            totalActualWorked += actualWorked;
            totalDeficiency += deficiency;
          } else {
            note = "Absen (Data Tidak Valid)";
            deficiency = targetMins;
            totalAbsen++;
            totalDeficiency += deficiency;
          }
        } else {
          if (isLeaveCode(cellVal)) {
            note = getLeaveName(cellVal);
            totalLeave++;
          } else {
            note = "Tidak Hadir / Alfa";
            deficiency = targetMins;
            totalAbsen++;
            totalDeficiency += deficiency;
          }
        }
      }

      attendance[day] = {
        raw: cellVal,
        checkIn,
        checkOut,
        actualWorked,
        deficiency,
        note,
        dayOfWeek,
        isRequiredDay
      };
    });

    const activeDaysCount = dateColumns.filter(({ day }) => !isWeekendForMonth(monthName, day) && !holidayDays[day]).length;
    const averageDeficiencyPerDay = activeDaysCount > 0 ? totalDeficiency / activeDaysCount : 0;

    records.push({
      no,
      nip,
      nama,
      gol,
      unitKerja,
      bulan,
      attendance,
      totalHadir,
      totalLeave,
      totalAbsen,
      totalActualWorked,
      totalDeficiency,
      averageDeficiencyPerDay
    });
  }

  return records;
}

export function parseJamKerjaCSV(csvText: string): JamKerjaRecord[] {
  // Parsing CSV with quote boundaries
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuote = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuote) {
      if (char === '\r' && csvText[i + 1] === '\n') i++;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return parseJamKerjaRows(rows, "Jam Kerja Juni");
}

export function generateMockJamKerjaRecords(): JamKerjaRecord[] {
  const mockNames = [
    { nama: "Aan Diana", nip: "197312262007011002", gol: "III/b", unit: "Sekretariat BSKJI" },
    { nama: "Aditya Andika Wicaksono", nip: "198608202010121002", gol: "III/d", unit: "BBSPJPPI" },
    { nama: "Agus Surya Mulyawan", nip: "198308132010121002", gol: "III/c", unit: "BBSPJIT" },
    { nama: "Ahmad Mursid Widodo", nip: "198804032010121001", gol: "III/b", unit: "BBSPJIKKP" },
    { nama: "Siti Aminah", nip: "198805052011012005", gol: "III/b", unit: "BSPJI Banjarbaru" }
  ];

  const months = ["Februari", "Maret", "Mei", "Juni"];
  let allRecords: JamKerjaRecord[] = [];
  let recordIndex = 1;

  months.forEach(month => {
    const daysInMonth = month === "Mei" || month === "Maret" ? 31 : (month === "Februari" ? 28 : 30);
    const recordsForMonth = mockNames.map((emp) => {
      const attendance: { [day: number]: DailyAttendance } = {};
      let totalHadir = 0;
      let totalLeave = 0;
      let totalAbsen = 0;
      let totalActualWorked = 0;
      let totalDeficiency = 0;

      let activeDaysCount = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = getDayOfWeekForMonth(month, day);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isFriday = dayOfWeek === 5;
        const holidayName = getIndonesianHolidayName(month, day);
        const isHoliday = holidayName !== null;
        const isRequiredDay = !isWeekend && !isHoliday;

        let checkIn: string | null = null;
        let checkOut: string | null = null;
        let actualWorked = 0;
        let deficiency = 0;
        let note = "";
        let raw = "";

        const isRamadanPeriod = 
          ((month === "Maret" || month === "March") && day >= 1 && day <= 17) ||
          ((month === "Februari" || month === "February") && day >= 19 && day <= 28);
        const targetMins = isRamadanPeriod ? 390 : 450;

        if (isWeekend) {
          note = "Akhir Pekan";
        } else if (isHoliday) {
          note = `Hari Libur (${holidayName})`;
        } else {
          activeDaysCount++;
          const rand = Math.random();
          if (rand < 0.85) {
            let checkInStr = "";
            let checkOutStr = "";
            
            if (isRamadanPeriod) {
              const entryMin = Math.floor(Math.random() * 45) - 15; // 07:45 to 08:30
              const hr = entryMin < 0 ? 7 : 8;
              const mn = entryMin < 0 ? 60 + entryMin : entryMin;
              checkInStr = `${hr.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`;

              const exitHour = 15;
              const exitMin = isFriday ? Math.floor(Math.random() * 30) + 30 : Math.floor(Math.random() * 30);
              checkOutStr = `${exitHour.toString().padStart(2, '0')}:${exitMin.toString().padStart(2, '0')}`;
            } else {
              const entryHour = rand < 0.15 ? 8 : 7;
              const entryMin = rand < 0.15 ? Math.floor(Math.random() * 20) + 15 : Math.floor(Math.random() * 30) + 15;
              checkInStr = `${entryHour.toString().padStart(2, '0')}:${entryMin.toString().padStart(2, '0')}`;
              
              const exitHour = 16;
              const exitMin = isFriday ? Math.floor(Math.random() * 30) + 30 : Math.floor(Math.random() * 30) + 10;
              checkOutStr = `${exitHour.toString().padStart(2, '0')}:${exitMin.toString().padStart(2, '0')}`;
            }

            checkIn = checkInStr;
            checkOut = checkOutStr;
            raw = `${checkInStr}\n${checkOutStr}`;
            totalHadir++;
            note = "Hadir";

            const tInMins = parseTimeToMinutes(checkIn) ?? 0;
            const tOutMins = parseTimeToMinutes(checkOut) ?? 0;

            const flexiLimit = isRamadanPeriod ? (parseTimeToMinutes("08:00") ?? 480) : (parseTimeToMinutes("07:30") ?? 450);
            const effIn = Math.max(tInMins, flexiLimit);

            const maxOut = isRamadanPeriod 
              ? (isFriday ? (parseTimeToMinutes("16:30") ?? 990) : (parseTimeToMinutes("16:00") ?? 960))
              : (isFriday ? (parseTimeToMinutes("17:30") ?? 1050) : (parseTimeToMinutes("17:00") ?? 1020));
            const effOut = Math.min(tOutMins, maxOut);

            const breakMins = isRamadanPeriod ? (isFriday ? 60 : 30) : (isFriday ? 90 : 60);

            if (effOut > effIn) {
              actualWorked = Math.max(0, effOut - effIn - breakMins);
            }
            
            deficiency = Math.max(0, targetMins - actualWorked);
            
            totalActualWorked += actualWorked;
            totalDeficiency += deficiency;
          } else if (rand < 0.95) {
            note = "Cuti Tahunan (CT)";
            raw = "CT";
            totalLeave++;
          } else {
            note = "Tidak Hadir / Alfa";
            raw = "A";
            deficiency = targetMins;
            totalAbsen++;
            totalDeficiency += deficiency;
          }
        }

        attendance[day] = {
          raw,
          checkIn,
          checkOut,
          actualWorked,
          deficiency,
          note,
          dayOfWeek,
          isRequiredDay
        };
      }

      const activeDaysCountFinal = activeDaysCount > 0 ? activeDaysCount : 1;
      const averageDeficiencyPerDay = totalDeficiency / activeDaysCountFinal;

      return {
        no: String(recordIndex++),
        nip: emp.nip,
        nama: emp.nama,
        gol: emp.gol,
        unitKerja: emp.unit,
        bulan: month,
        attendance,
        totalHadir,
        totalLeave,
        totalAbsen,
        totalActualWorked,
        totalDeficiency,
        averageDeficiencyPerDay
      };
    });
    allRecords = allRecords.concat(recordsForMonth);
  });

  return allRecords;
}

export const fetchJamKerjaData = async (): Promise<JamKerjaRecord[]> => {
  try {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/data/jam-kerja', { headers });
    if (!response.ok) {
      throw new Error('Gagal mengambil data jam kerja dari server.');
    }
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    
    let allRecords: JamKerjaRecord[] = [];
    
    for (const sheetName of workbook.SheetNames) {
      if (sheetName.toLowerCase().startsWith("jam kerja")) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        const parsed = parseJamKerjaRows(rows, sheetName);
        if (parsed.length > 0) {
          allRecords = allRecords.concat(parsed);
        }
      }
    }
    
    if (allRecords.length === 0) {
      throw new Error("No Jam Kerja sheets found or empty");
    }
    
    return allRecords;
  } catch (error) {
    console.warn("Backend Jam Kerja fetch fallback to mock records:", error);
    return generateMockJamKerjaRecords();
  }
};
