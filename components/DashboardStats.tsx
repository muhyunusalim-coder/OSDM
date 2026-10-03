import React from "react";
import {
  Users,
  CalendarClock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { DashboardStats as StatsType } from "../types";

interface Props {
  stats: StatsType;
  onCardClick?: (type: string) => void;
}

type Tone = "blue" | "amber" | "rose" | "emerald";

const toneMap: Record<
  Tone,
  {
    icon: string;
    border: string;
    badge: string;
    accent: string;
  }
> = {
  blue: {
    icon: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    border: "hover:border-blue-300 dark:hover:border-blue-700",
    badge: "text-blue-700 dark:text-blue-400 font-semibold",
    accent: "bg-blue-600",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    border: "hover:border-amber-300 dark:hover:border-amber-700",
    badge: "text-amber-700 dark:text-amber-400 font-semibold",
    accent: "bg-amber-600",
  },
  rose: {
    icon: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    border: "hover:border-rose-300 dark:hover:border-rose-700",
    badge: "text-rose-700 dark:text-rose-400 font-semibold",
    accent: "bg-rose-600",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    border: "hover:border-emerald-300 dark:hover:border-emerald-700",
    badge: "text-emerald-700 dark:text-emerald-400 font-semibold",
    accent: "bg-emerald-600",
  },
};

const StatCard = React.memo(
  ({
    title,
    value,
    description,
    caption,
    icon: Icon,
    tone,
    onClick,
  }: {
    title: string;
    value: string | number;
    description: string;
    caption: string;
    icon: React.ElementType;
    tone: Tone;
    onClick?: () => void;
  }) => {
    const t = toneMap[tone];
    const Component: React.ElementType = onClick ? "button" : "div";

    return (
      <Component
        onClick={onClick}
        className={`group relative w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 text-left shadow-2xs transition-all duration-200 ${
          t.border
        } ${
          onClick ? "cursor-pointer active:scale-[0.99] hover:shadow-xs" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {title}
            </p>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold leading-none tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
                {Number(value || 0).toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Pegawai
              </span>
            </div>
          </div>

          <div className={`rounded-lg p-2.5 shrink-0 ${t.icon}`}>
            <Icon size={20} />
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
          {description}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {caption}
          </span>

          {onClick ? (
            <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
              <span>Buka Data</span>
              <ArrowRight size={13} />
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono">
              Terverifikasi
            </span>
          )}
        </div>
      </Component>
    );
  }
);

StatCard.displayName = "StatCard";

const DashboardStats: React.FC<Props> = React.memo(({ stats, onCardClick }) => (
  <section aria-label="Statistik Kepegawaian BSKJI" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
    <StatCard
      title="Total Pegawai Terdata"
      value={stats.totalEmployees}
      icon={Users}
      tone="blue"
      description="Jumlah keseluruhan data pegawai ASN BSKJI aktif yang terdaftar dalam sistem."
      caption="Basis Data Kepegawaian"
    />

    <StatCard
      title="KGB Periode Terdekat"
      value={stats.upcomingKGB}
      icon={CalendarClock}
      tone="amber"
      description={`Agenda kenaikan gaji berkala yang jatuh tempo${
        stats.nextMonthName
          ? ` pada ${stats.nextMonthName} ${stats.nextMonthYear || ""}`
          : ""
      }.`}
      caption="Jadwal Mendatang"
      onClick={() => onCardClick?.("upcoming")}
    />

    <StatCard
      title="Perlu Verifikasi Berkas"
      value={stats.pendingKGB}
      icon={AlertTriangle}
      tone="rose"
      description="Daftar berkas atau usulan yang memerlukan verifikasi kelengkapan dokumen."
      caption="Tindak Lanjut Administrasi"
      onClick={() => onCardClick?.("pending")}
    />

    <StatCard
      title="SK Telah Diterbitkan"
      value={stats.processedKGB}
      icon={CheckCircle2}
      tone="emerald"
      description="KGB yang telah selesai diproses dan surat keputusan (SK) telah diterbitkan."
      caption="Arsip Realisasi Layanan"
      onClick={() => onCardClick?.("processed")}
    />
  </section>
));

DashboardStats.displayName = "DashboardStats";

export default DashboardStats;
