import React, { useState, useEffect } from "react";
import {
  Lock,
  AlertCircle,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Landmark,
  Building,
  FileCheck,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { loginWithBackend } from "../services/dataService";
import { TRANSLATIONS } from "../utils/translationHelper";
import { AuthUser } from "../types";

const GovtBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#020817]">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          backgroundPosition: "0 0, 30px 30px",
        }}
      ></div>
    </div>
  );
};
interface Props {
  onLogin: (user: AuthUser, token?: string) => void;
}
const LoginPage: React.FC<Props> = React.memo(({ onLogin }) => {
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = (key: string) => TRANSLATIONS["id"]?.[key] || key;
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaNum1(num1);
    setCaptchaNum2(num2);
    setCaptchaAnswer("");
    return { num1, num2 };
  };
  useEffect(() => {
    generateCaptcha();
  }, []);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!nip.trim()) {
        throw new Error("Nomor Induk Pegawai (NIP) wajib diisi.");
      }
      if (!password) {
        throw new Error("Kata sandi akses wajib diisi.");
      }
      if (
        !captchaAnswer.trim() ||
        parseInt(captchaAnswer.trim(), 10) !== captchaNum1 + captchaNum2
      ) {
        generateCaptcha();
        throw new Error(
          "Jawaban verifikasi keamanan (CAPTCHA) salah. Silakan coba lagi.",
        );
      }

      const res = await loginWithBackend(nip.trim(), password, {
        num1: captchaNum1,
        num2: captchaNum2,
        answer: captchaAnswer.trim(),
      });

      if (res.success && res.user) {
        onLogin(res.user, res.token);
      } else {
        throw new Error(res.message || "Autentikasi gagal.");
      }
    } catch (err: any) {
      setError(
        err.message ||
          "Gagal masuk. Silakan periksa koneksi atau data input Anda.",
      );
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gray-950 w-full py-8 md:py-0 overflow-y-auto md:overflow-hidden">
      <GovtBackground />

      <div className="relative z-10 w-full flex flex-col md:flex-row min-h-screen md:h-screen">
        {/* Left Side: Brand & Info */}
        <div className="hidden md:flex flex-col justify-between w-1/2 p-12 lg:p-20 text-white relative">
          <div className="relative z-10 my-auto">
            <div className="flex items-center gap-4 mb-8 group cursor-default">
              <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-2xl group-hover:bg-primary-500/20 group-hover:scale-105 transition-all duration-300 shadow-sm">
                <Landmark size={32} className="text-primary-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary-400 uppercase tracking-[0.2em] mb-0.5">
                  {t("brand_ministry")}
                </p>
                <p className="text-[10px] text-gray-300 font-medium ">
                  {t("brand_country")}
                </p>
              </div>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold leading-[1.15] mb-6 text-white ">
              {t("login_left_title")}
            </h1>

            <div className="flex items-center gap-3 mb-8">
              <div className="h-[2px] w-12 bg-primary-500"></div>
              <div className="h-[2px] w-2 bg-amber-500"></div>
              <div className="h-[2px] w-2 bg-primary-500"></div>
            </div>

            <p className="text-gray-200 text-sm lg:text-base leading-relaxed max-w-lg font-normal mb-10">
              {t("login_left_desc")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-lg">
              <div className="p-5 bg-gray-900/[0.4] hover:bg-gray-900/[0.7] border border-gray-700/60 hover:border-primary-500/40 rounded-2xl transition-all duration-300 group">
                <div className="p-2.5 bg-gray-900/60 rounded-xl inline-block mb-3 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                  <Building size={18} className="text-amber-400" />
                </div>
                <h4 className="text-xs font-bold uppercase r text-gray-100 mb-1.5">
                  {t("login_feature_kgb")}
                </h4>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  {t("login_feature_kgb_desc")}
                </p>
              </div>

              <div className="p-5 bg-gray-900/[0.4] hover:bg-gray-900/[0.7] border border-gray-700/60 hover:border-primary-500/40 rounded-2xl transition-all duration-300 group">
                <div className="p-2.5 bg-gray-900/60 rounded-xl inline-block mb-3 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                  <FileCheck size={18} className="text-blue-400" />
                </div>
                <h4 className="text-xs font-bold uppercase r text-gray-100 mb-1.5">
                  {t("login_feature_pensiun")}
                </h4>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  {t("login_feature_pensiun_desc")}
                </p>
              </div>

              <div className="p-5 bg-gray-900/[0.4] hover:bg-gray-900/[0.7] border border-gray-700/60 hover:border-primary-500/40 rounded-2xl transition-all duration-300 group">
                <div className="p-2.5 bg-gray-900/60 rounded-xl inline-block mb-3 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300">
                  <Clock size={18} className="text-rose-400" />
                </div>
                <h4 className="text-xs font-bold uppercase r text-gray-100 mb-1.5">
                  {t("login_feature_clock")}
                </h4>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  {t("login_feature_clock_desc")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-8 text-xs text-gray-300 font-medium relative z-10 pt-6 border-t border-white/10">
            <span className="flex items-center gap-2.5 bg-gray-900/60 px-3 py-1.5 rounded-full border border-gray-700/60 text-gray-300">
              <ShieldCheck size={15} className="text-primary-400" />{" "}
              {t("login_security_guarantee")}
            </span>
            <span className="flex items-center gap-2.5 bg-gray-900/60 px-3 py-1.5 rounded-full border border-gray-700/60 text-gray-300">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </div>
              {t("login_server_online")}
            </span>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-4 py-6 sm:p-8 md:p-12 lg:p-16 relative my-auto">
          <div className="w-full max-w-[360px] sm:max-w-md bg-[#0f172a] border border-gray-800 p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Premium Subtle Accent Line */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-500 dark:to-primary-300"></div>

            <div className="mb-5 sm:mb-6 text-center relative z-10">
              {/* Mobile mini brand badge */}
              <div className="md:hidden inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full mb-3">
                <Landmark size={13} className="text-primary-400" />
                <span className="text-[10px] font-bold tracking-wider text-primary-400 uppercase">
                  {t("brand_ministry")}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
                {t("login_title")}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm">
                {t("login_subtitle")}
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-4 sm:space-y-5 relative z-10"
            >
              {/* NIP Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wider block ml-0.5">
                  {t("login_username")}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 transition-colors group-focus-within:text-primary-400">
                    <CreditCard size={18} />
                  </div>
                  <input
                    type="text"
                    maxLength={18}
                    inputMode="numeric"
                    autoComplete="username"
                    autoCorrect="off"
                    autoCapitalize="none"
                    value={nip}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setNip(val);
                    }}
                    className="w-full h-11 sm:h-12 pl-11 pr-4 bg-gray-900/80 border border-gray-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:bg-gray-900 transition-all text-white placeholder-gray-500 text-base sm:text-sm font-medium shadow-inner"
                    placeholder={t("login_username_placeholder")}
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wider block ml-0.5">
                  {t("login_password")}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 transition-colors group-focus-within:text-primary-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 sm:h-12 pl-11 pr-11 bg-gray-900/80 border border-gray-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:bg-gray-900 transition-all text-white placeholder-gray-500 text-base sm:text-sm font-medium shadow-inner"
                    placeholder={t("login_password_placeholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                    tabIndex={-1}
                    title={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Captcha Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] sm:text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 ml-0.5">
                    <ShieldCheck size={14} className="text-primary-400" />
                    {t("login_captcha")}
                  </label>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="text-[11px] text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors font-medium px-2 py-0.5 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 rounded-md touch-manipulation active:scale-95 cursor-pointer"
                    title="Acak ulang pertanyaan verifikasi"
                  >
                    <RefreshCw size={12} className="text-primary-400" /> Refresh
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-28 sm:w-32 h-11 sm:h-12 bg-gray-900/80 border border-primary-500/30 rounded-xl flex items-center justify-center text-primary-400 font-mono font-bold text-sm sm:text-base select-none shadow-inner">
                    <span>
                      {captchaNum1} + {captchaNum2} =
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    value={captchaAnswer}
                    onChange={(e) =>
                      setCaptchaAnswer(e.target.value.replace(/\D/g, ""))
                    }
                    className="flex-1 min-w-0 h-11 sm:h-12 px-3 bg-gray-900/80 border border-gray-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:bg-gray-900 transition-all text-white placeholder-gray-500 text-base font-bold shadow-inner text-center sm:text-left"
                    placeholder={t("login_captcha_placeholder")}
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="overflow-hidden">
                  <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start gap-2.5 text-rose-200 text-xs shadow-sm">
                    <AlertCircle
                      size={16}
                      className="flex-shrink-0 mt-0.5 text-rose-400"
                    />
                    <span className="font-medium leading-relaxed">
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 sm:h-12 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2 relative overflow-hidden text-xs sm:text-sm uppercase tracking-wider group cursor-pointer"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t("login_verifying")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("login_btn")}</span>
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>

          <p className="mt-5 text-[11px] sm:text-xs text-gray-500 font-medium text-center">
            {t("login_footer")}
          </p>
        </div>
      </div>
    </div>
  );
});
export default LoginPage;
