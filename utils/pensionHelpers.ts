export const getBirthDateFromNIP = (nip: string): Date | null => {
  const cleanNip = nip.replace(/[^0-9]/g, '');
  if (cleanNip.length < 8) return null;
  
  const year = parseInt(cleanNip.substring(0, 4));
  const month = parseInt(cleanNip.substring(4, 6)) - 1;
  const day = parseInt(cleanNip.substring(6, 8));
  
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
};

export const getRetirementAge = (jabatan: string): number => {
  const lower = jabatan.toLowerCase();

  // 70: Pejabat Fungsional Peneliti Ahli Utama dan Perekayasa Ahli Utama
  if (lower.includes('peneliti ahli utama') || lower.includes('perekayasa ahli utama')) {
    return 70;
  }

  // 65: Pejabat Fungsional Ahli Utama (Peneliti, Perekayasa, Dosen)
  if (lower.includes('ahli utama') || lower.includes('dosen')) {
    return 65;
  }

  // 60: Pejabat Pimpinan Tinggi, Eselon 2 (Kepala Pusat, Sekretaris), Pejabat Fungsional Madya, Guru
  if (
    lower.includes('pimpinan tinggi') || 
    lower.includes('madya') || 
    lower.includes('guru') ||
    lower.includes('kepala pusat') ||
    lower.includes('sekretaris') ||
    lower.includes('eselon ii') ||
    lower.includes('eselon 2')
  ) {
    return 60;
  }

  // 58: Pejabat Administrasi, Pejabat Fungsional Ahli Pertama, Ahli Muda, dan Keterampilan
  return 58;
};

export const calculateTmtPensiun = (birthDate: Date, bup: number): Date => {
  // Pensiun starts on the 1st day of the month AFTER their birthday + BUP years
  const tmt = new Date(birthDate);
  tmt.setFullYear(tmt.getFullYear() + bup);
  tmt.setMonth(tmt.getMonth() + 1);
  tmt.setDate(1);
  return tmt;
};

export const getPensiunStatus = (tmtPensiun: Date): { status: 'Aktif' | 'Mendekati' | 'Pensiun', monthsRemaining: number } => {
  const now = new Date();
  
  // Calculate months difference
  const monthsRemaining = (tmtPensiun.getFullYear() - now.getFullYear()) * 12 + (tmtPensiun.getMonth() - now.getMonth());
  
  if (monthsRemaining < 0) {
    return { status: 'Pensiun', monthsRemaining };
  } else if (monthsRemaining <= 12) {
    return { status: 'Mendekati', monthsRemaining }; // 1 year before
  } else {
    return { status: 'Aktif', monthsRemaining };
  }
};
