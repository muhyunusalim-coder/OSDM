import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Database,
  X
} from 'lucide-react';
import { CSV_EXPORT_URL, GOOGLE_SHEET_ID } from '../../constants';

export type ConnectionStatus = 'connected' | 'checking' | 'error';

export interface StatusCheckProps {
  sheetUrl?: string;
  sheetId?: string;
  checkIntervalMs?: number;
  onStatusChange?: (status: ConnectionStatus, latencyMs?: number) => void;
  className?: string;
}

export const StatusCheck: React.FC<StatusCheckProps> = ({
  sheetUrl = CSV_EXPORT_URL,
  sheetId = GOOGLE_SHEET_ID,
  checkIntervalMs = 60000,
  onStatusChange,
  className = ''
}) => {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const checkConnection = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus('error');
      setLatency(null);
      setErrorMessage('Tidak ada koneksi internet (Offline)');
      setLastChecked(new Date());
      onStatusChange?.('error');
      return;
    }

    setStatus('checking');
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const start = performance.now();

    try {
      // Perform lightweight fetch with credentials omitted to check sheet availability
      const response = await fetch(sheetUrl, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'Range': 'bytes=0-200' // Request minimal bytes for fast health verification
        }
      });

      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - start);

      if (response.ok || response.status === 206 || response.type === 'opaque') {
        setStatus('connected');
        setLatency(elapsed);
        setLastChecked(new Date());
        setErrorMessage(null);
        onStatusChange?.('connected', elapsed);
      } else {
        throw new Error(`HTTP ${response.status}: Layanan tidak merespons normal`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setStatus('error');
      setLatency(null);
      setLastChecked(new Date());
      const msg = err.name === 'AbortError' 
        ? 'Batas waktu koneksi habis (>7 detik)' 
        : (err.message || 'Gagal terhubung ke Google Sheets');
      setErrorMessage(msg);
      onStatusChange?.('error');
    }
  }, [sheetUrl, onStatusChange]);

  // Initial check and periodic polling
  useEffect(() => {
    checkConnection();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkConnection();
      }
    }, checkIntervalMs);

    const handleOnline = () => checkConnection();
    const handleOffline = () => {
      setStatus('error');
      setLatency(null);
      setErrorMessage('Koneksi internet terputus');
      setLastChecked(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection, checkIntervalMs]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getLatencyQuality = (ms: number | null) => {
    if (ms === null) return { text: 'Tidak tersedia', color: 'text-gray-400' };
    if (ms < 300) return { text: `${ms} ms (Sangat Cepat)`, color: 'text-emerald-600 dark:text-emerald-400 font-semibold' };
    if (ms < 800) return { text: `${ms} ms (Normal)`, color: 'text-blue-600 dark:text-blue-400 font-semibold' };
    return { text: `${ms} ms (Lambat)`, color: 'text-amber-600 dark:text-amber-400 font-semibold' };
  };

  const latencyInfo = getLatencyQuality(latency);

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      {/* Trigger Pill / Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border border-gray-200/90 dark:border-gray-800 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100/80 dark:hover:bg-gray-800 transition-all cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 shadow-2xs active:scale-95"
        title="Status Koneksi Sumber Data Google Sheets"
        aria-label="Status Koneksi Google Sheets"
        aria-expanded={isOpen}
      >
        {/* Status Dot with Pulse animation */}
        <span className="relative flex h-2 w-2 shrink-0">
          {status === 'connected' && (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          )}
          {status === 'checking' && (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
          )}
          {status === 'error' && (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          )}
        </span>

        {/* Text description (responsive) */}
        <span className="hidden xl:inline text-[11px] font-semibold tracking-tight">
          {status === 'connected' && 'Google Sheets'}
          {status === 'checking' && 'Memeriksa...'}
          {status === 'error' && 'Sheets Offline'}
        </span>

        {/* Latency badge on wide screens */}
        {status === 'connected' && latency !== null && (
          <span className="hidden 2xl:inline text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/50">
            {latency}ms
          </span>
        )}

        {status === 'checking' && (
          <RefreshCw size={12} className="animate-spin text-amber-500 shrink-0" />
        )}
      </button>

      {/* Health Details Popover */}
      {isOpen && (
        <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-1rem)] sm:w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl z-50 p-4 space-y-3.5 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-primary-600 dark:text-primary-400" />
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                Status Sumber Data
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
              aria-label="Tutup Detail"
            >
              <X size={15} />
            </button>
          </div>

          {/* Status Banner */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              status === 'connected'
                ? 'bg-emerald-50/70 border-emerald-200/70 dark:bg-emerald-950/30 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                : status === 'checking'
                ? 'bg-amber-50/70 border-amber-200/70 dark:bg-amber-950/30 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
                : 'bg-rose-50/70 border-rose-200/70 dark:bg-rose-950/30 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
            }`}
          >
            {status === 'connected' && <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />}
            {status === 'checking' && <RefreshCw size={18} className="text-amber-500 shrink-0 mt-0.5 animate-spin" />}
            {status === 'error' && <AlertCircle size={18} className="text-rose-500 shrink-0 mt-0.5" />}
            
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight">
                {status === 'connected' && 'Google Sheets Terhubung'}
                {status === 'checking' && 'Sedang Menguji Koneksi...'}
                {status === 'error' && 'Koneksi Terkendala'}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5 leading-snug">
                {status === 'connected' && 'Sinkronisasi data pegawai dan KGB aktif secara langsung (live).'}
                {status === 'checking' && 'Mengirim sinyal ping ke server spreadsheet Google...'}
                {status === 'error' && (errorMessage || 'Sistem beralih ke cache lokal / data tersimpan.')}
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-[10px] text-gray-400 font-medium block">Latensi Respons</span>
              <span className={`text-xs block mt-0.5 ${latencyInfo.color}`}>
                {latencyInfo.text}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-medium block">Pemeriksaan Terakhir</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 block mt-0.5 font-mono">
                {lastChecked ? lastChecked.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
              </span>
            </div>
          </div>

          {/* Endpoint Details */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-medium block">Dokumen Spreadsheet ID</span>
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-[11px] font-mono text-gray-600 dark:text-gray-300 truncate select-all">
              {sheetId}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={checkConnection}
              disabled={status === 'checking'}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-95 text-white font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <RefreshCw size={13} className={status === 'checking' ? 'animate-spin' : ''} />
              <span>{status === 'checking' ? 'Memeriksa...' : 'Uji Koneksi Ulang'}</span>
            </button>

            <a
              href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Buka Dokumen Google Sheets"
            >
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusCheck;
