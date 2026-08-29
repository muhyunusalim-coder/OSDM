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
    const Component: React.ElementType = onClick ? "button" : "div";

    return (
      <Component
        onClick={onClick}
        className={`group flex items-center gap-4 w-full rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-900 ${
          onClick ? "cursor-pointer active:scale-95 hover:bg-gray-50 dark:hover:bg-gray-800/50" : ""
        }`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tone === 'blue' ? 'bg-blue-50 text-blue-600' : tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
          <Icon size={24} strokeWidth={2} />
        </div>
        
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400 mb-0.5 truncate">
            {title}
          </p>
          <div className="flex items-center gap-2">
            <h3 className={`text-base font-bold truncate ${tone === 'blue' ? 'text-blue-700' : tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-rose-700'}`}>
              {value} {title === 'Total Pegawai' ? 'Pegawai' : 'Berkas'}
            </h3>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{description}</p>
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
