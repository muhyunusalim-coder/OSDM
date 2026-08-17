export const getTmtDate = (tmt: string) => {
    if (!tmt) return new Date(0);
    if (tmt.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(tmt);
    } else if (tmt.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
        const parts = tmt.split(/[-/]/);
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    
    // TMT format from CSV e.g "1 April 2026"
    const monthsIndo = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
    const tmtLower = tmt.toLowerCase();
    
    // Check if it contains an Indonesian month
    const parts = tmtLower.split(' ');
    if (parts.length >= 2) {
      let day = 1;
      let monthIndex = -1;
      let year = new Date().getFullYear();
      
      for (const part of parts) {
        if (/^\d{1,2}$/.test(part)) {
          day = parseInt(part);
        } else if (/^\d{4}$/.test(part)) {
          year = parseInt(part);
        } else {
          const mIndex = monthsIndo.findIndex(m => part.includes(m));
          if (mIndex !== -1) {
            monthIndex = mIndex;
          }
        }
      }
      
      if (monthIndex !== -1) {
        return new Date(year, monthIndex, day);
      }
    }
    
    return new Date(0);
};

export const getMasaKerjaYears = (masaKerjaStr: string) => {
    if (!masaKerjaStr) return 0;
    const match = masaKerjaStr.match(/(\d+)\s*(?:Tahun|th)/i);
    if (match) return parseInt(match[1], 10);
    const num = parseInt(masaKerjaStr, 10);
    return isNaN(num) ? 0 : num;
};

export const getDaysRemaining = (tmt: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const tmtDate = getTmtDate(tmt);
    if (!tmtDate || isNaN(tmtDate.getTime()) || tmtDate.getTime() === new Date(0).getTime()) return null;
    const diffTime = tmtDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusLabel = (tmt: string): { label: string; class: string } => {
    const days = getDaysRemaining(tmt);
    if (days === null) return { label: '-', class: 'text-slate-300 dark:text-slate-600' };
    if (days <= 0) return { label: 'Sudah Waktunya', class: 'bg-rose-100 text-rose-700 border-rose-200' };
    if (days <= 30) return { label: 'Mendekati', class: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'Aman', class: 'bg-primary-100 text-primary-700 border-primary-200' };
};

export const calculateCycleDates = (tmt: string) => {
    const tmtDate = getTmtDate(tmt);
    if (!tmtDate || isNaN(tmtDate.getTime()) || tmtDate.getTime() === new Date(0).getTime()) return { prev: '-', next: '-' };

    const prevDate = new Date(tmtDate);
    prevDate.setFullYear(tmtDate.getFullYear() - 2);

    const nextDate = new Date(tmtDate);
    nextDate.setFullYear(tmtDate.getFullYear() + 2);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return {
        prev: prevDate.toLocaleDateString('id-ID', options),
        next: nextDate.toLocaleDateString('id-ID', options)
    };
};

export const calculateKPCycleDates = (tmt: string) => {
    const tmtDate = getTmtDate(tmt);
    if (!tmtDate || isNaN(tmtDate.getTime()) || tmtDate.getTime() === new Date(0).getTime()) return { prev: '-', next: '-' };

    const prevDate = new Date(tmtDate);
    prevDate.setFullYear(tmtDate.getFullYear() - 4);
    
    const nextDate = new Date(tmtDate);
    nextDate.setFullYear(tmtDate.getFullYear() + 4);

    const formatter = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    return {
        prev: formatter.format(prevDate),
        next: formatter.format(nextDate)
    };
};

export const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
};

export const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
