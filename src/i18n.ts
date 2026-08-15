import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// This is a minimal setup. In a real world app, these would be in separate JSON files.
const resources = {
  id: {
    translation: {
      "app.title": "Sistem Informasi Kepegawaian BSKJI",
      "app.subtitle": "Sistem ini menghitung secara akurat akumulasi jam kerja dan kekurangan waktu kerja (deficiency) Pegawai ASN BSKJI berdasarkan Peraturan Jam Kerja.",
      // More keys will be moved here incrementally
    }
  },
  en: {
    translation: {
      "app.title": "BSKJI Personnel Information System",
      "app.subtitle": "This system accurately calculates accumulated working hours and time deficiency of BSKJI ASN Employees based on Working Hour Regulations.",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'id', // default language
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
