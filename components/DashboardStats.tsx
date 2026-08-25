import React from "react";
import {
  Users,
  CalendarClock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
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
    glow: string;
    pill: string;
    bar: string;
  }
> = {
  blue: {
    icon: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
    glow: "from-blue-500/15",
    pill: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
    bar: "bg-blue-500",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    glow: "from-amber-500/15",
    pill: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    bar: "bg-amber-500",
  },
  rose: {
    icon: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
    glow: "from-rose-500/15",
    pill: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
    bar: "bg-rose-500",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    glow: "from-emerald-500/15",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
    bar: "bg-emerald-500",
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
        className={`group relative w-full overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-4 sm:p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-xl dark:border-gray-800/80 dark:bg-gray-900/90 dark:hover:border-gray-700 ${
          onClick ? "cursor-pointer active:scale-[0.98]" : ""
        }`}
      >
        <div
          className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${t.glow} to-transparent blur-2xl`}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {title}
            </p>

            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-semibold leading-none tracking-tight text-gray-950 dark:text-white sm:text-4xl">
                {Number(value || 0).toLocaleString("id-ID")}
              </span>

              <span
                className={`mb-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${t.pill}`}
              >
                <TrendingUp size={12} />
                Live
              </span>
            </div>
          </div>

          <div className={`rounded-2xl border p-3 shadow-sm ${t.icon}`}>
            <Icon size={22} />
          </div>
        </div>

        <p className="relative mt-4 min-h-10 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {description}
        </p>

        <div className="relative mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {caption}
          </span>

          {onClick ? (
            <ArrowRight
              size={16}
              className="text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-400"
            />
          ) : (
            <span className={`h-2 w-2 rounded-full ${t.bar}`} />
          )}
        </div>
      </Component>
    );
  }
);

StatCard.displayName = "StatCard";

const DashboardStats: React.FC<Props> = React.memo(({ stats, onCardClick }) => (
  <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
    <StatCard
      title="Total Pegawai"
      value={stats.totalEmployees}
      icon={Users}
      tone="blue"
      description="Seluruh data ASN/pegawai yang termuat dalam sistem monitoring kepegawaian."
      caption="Basis data aktif"
    />

    <StatCard
      title="KGB Mendatang"
      value={stats.upcomingKGB}
      icon={CalendarClock}
      tone="amber"
      description={`Agenda KGB terdekat${
        stats.nextMonthName
          ? ` periode ${stats.nextMonthName} ${stats.nextMonthYear || ""}`
          : ""
      }.`}
      caption="Klik untuk filter"
      onClick={() => onCardClick?.("upcoming")}
    />

    <StatCard
      title="Perlu Tindak Lanjut"
      value={stats.pendingKGB}
      icon={AlertTriangle}
      tone="rose"
      description="Berkas atau layanan yang masih perlu diperiksa agar tidak melewati tenggat."
      caption="Prioritas layanan"
      onClick={() => onCardClick?.("pending")}
    />

    <StatCard
      title="Selesai Diproses"
      value={stats.processedKGB}
      icon={CheckCircle2}
      tone="emerald"
      description="Dokumen/layanan yang sudah selesai dan dapat ditindaklanjuti untuk arsip."
      caption="Riwayat selesai"
      onClick={() => onCardClick?.("processed")}
    />
  </section>
));

DashboardStats.displayName = "DashboardStats";

export default DashboardStats;
