import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, CreditCard, ArrowRight, ShieldCheck, Landmark, Building, FileCheck, Clock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { fetchEmployeeData } from '../services/dataService';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS } from '../utils/translationHelper';

const GovtBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#020817]">
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none" 
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            backgroundPosition: '0 0, 30px 30px'
          }}
        ></div>
        
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1)_0%,transparent_60%)] z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.05)_0%,transparent_60%)] z-0 pointer-events-none"></div>
      </div>
    );
};

interface Props {
  onLogin: (nip: string) => void;
}

const LoginPage: React.FC<Props> = React.memo(({ onLogin }) => {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = (key: string) => TRANSLATIONS['id']?.[key] || key;

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaNum1(num1);
    setCaptchaNum2(num2);
    setCaptchaAnswer('');
    return { num1, num2 };
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        if (!captchaAnswer.trim() || parseInt(captchaAnswer.trim(), 10) !== captchaNum1 + captchaNum2) {
            generateCaptcha();
            throw new Error('Jawaban verifikasi keamanan (CAPTCHA) salah. Silakan coba lagi.');
        }

        if (password !== 'bskji') {
            throw new Error('Kata sandi akses tidak valid.');
        }

        const employees = await fetchEmployeeData();
        const foundEmployee = employees.find(emp => emp.nip === nip.trim());

        if (foundEmployee) {
            onLogin(foundEmployee.nip);
        } else {
            throw new Error('NIP tidak terdaftar dalam database layanan BSKJI.');
        }

    } catch (err: any) {
        setError(err.message || 'Gagal masuk. Silakan periksa koneksi atau data input Anda.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans relative overflow-hidden bg-slate-950 w-full py-8 md:py-0 overflow-y-auto md:overflow-hidden">
      <GovtBackground />

      <div className="relative z-10 w-full flex flex-col md:flex-row min-h-screen md:h-screen">
        
        {/* Left Side: Brand & Info */}
        <div className="hidden md:flex flex-col justify-between w-1/2 p-12 lg:p-20 text-white relative">
            
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative z-10 my-auto"
            >
                <div className="flex items-center gap-4 mb-8 group cursor-default">
                    <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-2xl group-hover:bg-primary-500/20 group-hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                        <Landmark size={32} className="text-primary-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-primary-400 uppercase tracking-[0.2em] mb-0.5">{t('brand_ministry')}</p>
                        <p className="text-[10px] text-slate-300 font-medium tracking-wide">{t('brand_country')}</p>
                    </div>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold leading-[1.15] mb-6 tracking-tight text-white font-display">
                    {t('login_left_title')}
                </h1>
                
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-[2px] w-12 bg-primary-500"></div>
                    <div className="h-[2px] w-2 bg-amber-500"></div>
                    <div className="h-[2px] w-2 bg-primary-500"></div>
                </div>
                
                <p className="text-slate-200 text-sm lg:text-base leading-relaxed max-w-lg font-normal mb-10">
                    {t('login_left_desc')}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-lg">
                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="p-5 bg-slate-900/[0.4] hover:bg-slate-900/[0.7] border border-slate-700/60 hover:border-primary-500/40 rounded-2xl transition-all duration-300 group"
                    >
                        <div className="p-2.5 bg-slate-900/60 rounded-xl inline-block mb-3 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                            <Building size={18} className="text-amber-400" />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-1.5">{t('login_feature_kgb')}</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{t('login_feature_kgb_desc')}</p>
                    </motion.div>

                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="p-5 bg-slate-900/[0.4] hover:bg-slate-900/[0.7] border border-slate-700/60 hover:border-primary-500/40 rounded-2xl transition-all duration-300 group"
                    >
                        <div className="p-2.5 bg-slate-900/60 rounded-xl inline-block mb-3 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                            <FileCheck size={18} className="text-blue-400" />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-1.5">{t('login_feature_pensiun')}</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{t('login_feature_pensiun_desc')}</p>
                    </motion.div>

                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="p-5 bg-slate-900/[0.4] hover:bg-slate-900/[0.7] border border-slate-700/60 hover:border-primary-500/40 rounded-2xl transition-all duration-300 group"
                    >
                        <div className="p-2.5 bg-slate-900/60 rounded-xl inline-block mb-3 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300">
                            <Clock size={18} className="text-rose-400" />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 mb-1.5">{t('login_feature_clock')}</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{t('login_feature_clock_desc')}</p>
                    </motion.div>
                </div>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="flex gap-8 text-xs text-slate-300 font-medium relative z-10 pt-6 border-t border-white/10"
            >
                <span className="flex items-center gap-2.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-700/60 text-slate-300">
                    <ShieldCheck size={15} className="text-primary-400"/> {t('login_security_guarantee')}
                </span>
                <span className="flex items-center gap-2.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-700/60 text-slate-300">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                    </div>
                    {t('login_server_online')}
                </span>
            </motion.div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-3 sm:p-6 md:p-12 lg:p-16 relative my-auto">
            <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 p-5 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                {/* Premium Subtle Accent Line */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500"></div>
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)] pointer-events-none"></div>
                
                <div className="mb-6 sm:mb-8 text-center relative z-10">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-display tracking-tight">{t('login_title')}</h2>
                    <p className="text-slate-300 text-xs sm:text-sm">{t('login_subtitle')}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5 relative z-10">
                    <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block ml-1">{t('login_username')}</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 transition-colors group-focus-within:text-primary-400">
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
                                    const val = e.target.value.replace(/\D/g, '');
                                    setNip(val);
                                }}
                                className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-slate-900/80 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:bg-slate-900 transition-all duration-300 text-white placeholder-slate-400 text-sm font-medium shadow-inner"
                                placeholder={t('login_username_placeholder')}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block ml-1">{t('login_password')}</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 transition-colors group-focus-within:text-primary-400">
                                <Lock size={18} />
                            </div>
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                value={password}
                                autoComplete="current-password"
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 sm:py-3.5 bg-slate-900/80 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:bg-slate-900 transition-all duration-300 text-white placeholder-slate-400 text-sm font-medium shadow-inner"
                                placeholder={t('login_password_placeholder')}
                             />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                                tabIndex={-1}
                                title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                <ShieldCheck size={13} className="text-primary-400" />
                                {t('login_captcha')}
                            </label>
                            <button
                                type="button"
                                onClick={generateCaptcha}
                                className="text-[11px] text-primary-400 hover:text-primary-300 flex items-center gap-1.5 transition-colors font-semibold px-2.5 py-1 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 rounded-lg touch-manipulation active:scale-95 cursor-pointer"
                                title="Acak ulang pertanyaan verifikasi"
                            >
                                <RefreshCw size={12} className="text-primary-400" /> Refresh
                            </button>
                        </div>
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="flex-shrink-0 min-w-[100px] sm:min-w-[120px] px-3 py-3 sm:py-3.5 bg-slate-900/80 border border-primary-500/30 rounded-2xl flex items-center justify-center text-primary-400 font-bold text-base sm:text-lg select-none shadow-inner tracking-wider relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-transparent"></div>
                                <span className="relative z-10">{captchaNum1} + {captchaNum2} =</span>
                            </div>
                            <input 
                                type="text" 
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="none"
                                value={captchaAnswer}
                                onChange={(e) => setCaptchaAnswer(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 min-w-0 px-4 py-3 sm:py-3.5 bg-slate-900/80 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 focus:bg-slate-900 transition-all duration-300 text-white placeholder-slate-400 text-base font-bold shadow-inner text-center sm:text-left tracking-wider"
                                placeholder={t('login_captcha_placeholder')}
                                required
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-3.5 mt-2 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start gap-3 text-rose-200 text-xs shadow-sm">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-rose-400" />
                                    <span className="font-semibold leading-relaxed">{error}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-6 relative overflow-hidden text-sm uppercase tracking-wider group cursor-pointer"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                        <div className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>{t('login_verifying')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('login_btn')}</span>
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </div>
                    </button>
                </form>

            </div>
            
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="mt-8 text-[11px] text-slate-400 font-medium text-center tracking-wide"
            >
                {t('login_footer')}
            </motion.p>
        </div>
      </div>
    </div>
  );
});

export default LoginPage;

