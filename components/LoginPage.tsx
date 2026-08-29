import React, { useState } from "react";
import { fetchEmployeeData } from "../services/dataService";
import { Shield } from 'lucide-react';

interface Props {
  onLogin: (nip: string) => void;
}

const LoginPage: React.FC<Props> = React.memo(({ onLogin }) => {
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (password !== "bskji") {
        throw new Error("Kata sandi akses tidak valid. (Gunakan: bskji)");
      }
      const employees = await fetchEmployeeData();
      const foundEmployee = employees.find((emp) => emp.nip === nip.trim());
      if (foundEmployee) {
        onLogin(foundEmployee.nip);
      } else {
        throw new Error("NIP tidak terdaftar dalam database.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#f4f7f9] overflow-hidden p-4 font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 w-full h-[60vh] bg-gradient-to-b from-[#0a3a70] via-[#125ba3] to-transparent z-0"></div>
      <div className="absolute top-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logos & Headings */}
        <div className="flex flex-col items-center mb-8 text-center">
           <div className="w-[84px] h-[84px] bg-white rounded-2xl flex items-center justify-center mb-5 shadow-lg p-3">
             <Shield size={46} className="text-[#e2a829]" strokeWidth={1.5} />
           </div>
           <h1 className="text-2xl md:text-[26px] font-bold text-white mb-2 drop-shadow-md">
             Selamat Datang di ASN DIGITAL
           </h1>
           <p className="text-[14px] text-blue-50 font-medium opacity-90">
             Platform Digital Manajemen ASN Terpadu
           </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden">
          <div className="p-8 md:p-10">
            <h2 className="text-[17px] font-bold text-gray-800 mb-8 text-center">
              Masuk ke Akun Anda
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-gray-700 block">
                  Username (NIP)
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#125ba3]/20 focus:border-[#125ba3] outline-none transition-all text-gray-800 text-[14px]"
                  placeholder="Masukkan 18 digit NIP"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-gray-700 block">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#125ba3]/20 focus:border-[#125ba3] outline-none transition-all text-gray-800 text-[14px] tracking-wide"
                  placeholder="Masukkan kata sandi"
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 bg-red-50 rounded-xl p-3 text-[13px] text-center border border-red-100 font-medium">
                  {error}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#0a58ca] hover:bg-[#084298] text-white font-bold rounded-xl transition-all cursor-pointer text-[14px] shadow-sm hover:shadow flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                       Memproses...
                    </span>
                  ) : "Masuk"}
                </button>
              </div>
            </form>
          </div>
          
          {/* Footer Info */}
          <div className="bg-gray-50/80 p-5 border-t border-gray-100 text-center">
             <p className="text-[12px] text-gray-500 font-medium">
                Gunakan otentikasi MFA untuk keamanan akun Anda.
             </p>
          </div>
        </div>
        
        <div className="text-center mt-10">
           <p className="text-[12px] text-[#0a3a70]/60 font-semibold tracking-wide">
             &copy; {new Date().getFullYear()} Badan Kepegawaian Negara
           </p>
        </div>
      </div>
    </div>
  );
});

export default LoginPage;
