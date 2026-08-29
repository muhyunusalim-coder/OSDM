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
      <div className="absolute top-0 w-full h-[40vh] bg-gradient-to-b from-[#0a3a70] to-[#125ba3] z-0"></div>
      <div className="absolute top-0 w-full h-[40vh] opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logos & Headings */}
        <div className="flex flex-col items-center mb-6 text-center">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-md p-3">
             {/* BKN Garuda approximation / Shield for placeholder */}
             <Shield size={40} className="text-[#e2a829]" strokeWidth={1.5} />
           </div>
           <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-md">
             Selamat Datang di ASN DIGITAL
           </h1>
           <p className="text-[13px] text-blue-100 font-medium">
             Platform Digital Manajemen ASN Terpadu
           </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="p-8 md:p-10">
            <h2 className="text-[16px] font-bold text-gray-800 mb-6 text-center">
              Masuk ke Akun Anda
            </h2>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-gray-700 block">
                  Username (NIP)
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-[46px] px-4 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#125ba3] focus:border-[#125ba3] outline-none transition-all text-gray-800 text-[14px]"
                  placeholder="Masukkan 18 digit NIP"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-gray-700 block">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[46px] px-4 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#125ba3] focus:border-[#125ba3] outline-none transition-all text-gray-800 text-[14px]"
                  placeholder="Masukkan kata sandi"
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 bg-red-50 rounded-lg p-3 text-[13px] text-center border border-red-100">
                  {error}
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[46px] bg-[#0a58ca] hover:bg-[#084298] text-white font-bold rounded-lg transition-colors cursor-pointer text-[14px] shadow-sm flex items-center justify-center gap-2"
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
          <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
             <p className="text-[12px] text-gray-500">
                Gunakan otentikasi MFA untuk keamanan akun Anda.
             </p>
          </div>
        </div>
        
        <div className="text-center mt-8">
           <p className="text-[11px] text-gray-500 font-medium">
             &copy; {new Date().getFullYear()} Badan Kepegawaian Negara
           </p>
        </div>
      </div>
    </div>
  );
});

export default LoginPage;
