import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Kanban,
  StickyNote,
  Table as TableIcon,
  Plus,
  Search,
  Pin,
  PinOff,
  CheckSquare,
  Square,
  Clock,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Sparkles,
  Trash2,
  Edit3,
  X,
  ChevronRight,
  ChevronLeft,
  Filter,
  CheckCircle2,
  ArrowUpDown,
  Download,
  RotateCcw,
  Layers,
  MoreVertical,
  Flame,
  Check,
  ChevronDown,
  Palette
} from 'lucide-react';
import { StickyTask, TaskStatus, TaskPriority, NoteColor, LabelColor, TaskChecklistItem, Employee } from '../types';

interface StickyNotesKanbanPageProps {
  currentUser?: Employee | null;
  language?: 'id' | 'en';
}

const STORAGE_KEY = 'bskji_sticky_tasks_v1';

// Preset categories relevant to BSKJI Administration
const CATEGORIES = [
  'Semua',
  'Layanan KGB',
  'Kenaikan Pangkat',
  'Layanan Pensiun',
  'Jam Kerja ASN',
  'Verifikasi Berkas',
  'Koordinasi Internal',
  'Administrasi Umum'
] as const;

// Label color configuration for cards in Kanban & Sticky Notes based on Urgency and Priority
export const LABEL_COLOR_CONFIG: Record<LabelColor, {
  name: string;
  shortName: string;
  defaultPriority: TaskPriority;
  urgencyTitle: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  topStripe: string;
  dotColor: string;
  chipBg: string;
  chipBorder: string;
}> = {
  red: {
    name: 'Merah Mendesak',
    shortName: 'Mendesak',
    defaultPriority: 'urgent',
    urgencyTitle: '🔥 Mendesak (SLA 24 Jam / Kritis)',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/70',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-300 dark:border-rose-800',
    topStripe: 'bg-rose-500',
    dotColor: 'bg-rose-500',
    chipBg: 'bg-rose-50 dark:bg-rose-950/40',
    chipBorder: 'border-rose-200 dark:border-rose-800'
  },
  orange: {
    name: 'Oranye Tinggi',
    shortName: 'Prioritas Tinggi',
    defaultPriority: 'high',
    urgencyTitle: '⚠️ Prioritas Tinggi (Pekan Ini)',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/70',
    badgeText: 'text-orange-800 dark:text-orange-300',
    badgeBorder: 'border-orange-300 dark:border-orange-800',
    topStripe: 'bg-orange-500',
    dotColor: 'bg-orange-500',
    chipBg: 'bg-orange-50 dark:bg-orange-950/40',
    chipBorder: 'border-orange-200 dark:border-orange-800'
  },
  amber: {
    name: 'Kuning Perhatian',
    shortName: 'Perhatian Khusus',
    defaultPriority: 'high',
    urgencyTitle: '⚡ Perhatian Khusus / Atensi',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/70',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-300 dark:border-amber-800',
    topStripe: 'bg-amber-500',
    dotColor: 'bg-amber-500',
    chipBg: 'bg-amber-50 dark:bg-amber-950/40',
    chipBorder: 'border-amber-200 dark:border-amber-800'
  },
  blue: {
    name: 'Biru Sedang',
    shortName: 'Prioritas Sedang',
    defaultPriority: 'medium',
    urgencyTitle: '🔷 Prioritas Sedang (Jadwal Normal)',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/70',
    badgeText: 'text-blue-800 dark:text-blue-300',
    badgeBorder: 'border-blue-300 dark:border-blue-800',
    topStripe: 'bg-blue-500',
    dotColor: 'bg-blue-500',
    chipBg: 'bg-blue-50 dark:bg-blue-950/40',
    chipBorder: 'border-blue-200 dark:border-blue-800'
  },
  green: {
    name: 'Hijau Rendah',
    shortName: 'Prioritas Rendah',
    defaultPriority: 'low',
    urgencyTitle: '☕ Prioritas Rendah / Fleksibel',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    topStripe: 'bg-emerald-500',
    dotColor: 'bg-emerald-500',
    chipBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    chipBorder: 'border-emerald-200 dark:border-emerald-800'
  },
  purple: {
    name: 'Ungu Regulasi',
    shortName: 'Regulasi & SK',
    defaultPriority: 'medium',
    urgencyTitle: '⚖️ Regulasi & Kebijakan BKN/BSKJI',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/70',
    badgeText: 'text-purple-800 dark:text-purple-300',
    badgeBorder: 'border-purple-300 dark:border-purple-800',
    topStripe: 'bg-purple-500',
    dotColor: 'bg-purple-500',
    chipBg: 'bg-purple-50 dark:bg-purple-950/40',
    chipBorder: 'border-purple-200 dark:border-purple-800'
  },
  teal: {
    name: 'Teal Verifikasi',
    shortName: 'Verifikasi Berkas',
    defaultPriority: 'high',
    urgencyTitle: '📑 Verifikasi Berkas & SIASN',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/70',
    badgeText: 'text-teal-800 dark:text-teal-300',
    badgeBorder: 'border-teal-300 dark:border-teal-800',
    topStripe: 'bg-teal-500',
    dotColor: 'bg-teal-500',
    chipBg: 'bg-teal-50 dark:bg-teal-950/40',
    chipBorder: 'border-teal-200 dark:border-teal-800'
  },
  pink: {
    name: 'Pink Koordinasi',
    shortName: 'Koordinasi Balai',
    defaultPriority: 'medium',
    urgencyTitle: '🤝 Koordinasi Balai & Pimpinan',
    badgeBg: 'bg-pink-100 dark:bg-pink-950/70',
    badgeText: 'text-pink-800 dark:text-pink-300',
    badgeBorder: 'border-pink-300 dark:border-pink-800',
    topStripe: 'bg-pink-500',
    dotColor: 'bg-pink-500',
    chipBg: 'bg-pink-50 dark:bg-pink-950/40',
    chipBorder: 'border-pink-200 dark:border-pink-800'
  },
  gray: {
    name: 'Abu Standar',
    shortName: 'Rutin / Umum',
    defaultPriority: 'low',
    urgencyTitle: '📋 Administrasi Rutin',
    badgeBg: 'bg-gray-100 dark:bg-gray-800',
    badgeText: 'text-gray-700 dark:text-gray-300',
    badgeBorder: 'border-gray-300 dark:border-gray-700',
    topStripe: 'bg-gray-400',
    dotColor: 'bg-gray-400',
    chipBg: 'bg-gray-50 dark:bg-gray-800/40',
    chipBorder: 'border-gray-200 dark:border-gray-700'
  }
};

export const DEFAULT_PRIORITY_LABEL_COLOR: Record<TaskPriority, LabelColor> = {
  urgent: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'green'
};

export const getTaskLabelColor = (task: StickyTask): LabelColor => {
  if (task.labelColor && LABEL_COLOR_CONFIG[task.labelColor]) {
    return task.labelColor;
  }
  return DEFAULT_PRIORITY_LABEL_COLOR[task.priority] || 'blue';
};

// Default initial tasks for high productivity
const INITIAL_TASKS: StickyTask[] = [
  {
    id: 'task-1',
    title: 'Verifikasi Usulan KGB Pegawai TMT Oktober 2026',
    content: 'Cek kelengkapan berkas SK KGB sebelumnya dan sinkronisasi masa kerja golongan dengan data SIASN BKN.',
    status: 'in_progress',
    priority: 'high',
    category: 'Layanan KGB',
    color: 'blue',
    labelColor: 'orange',
    labelText: 'Prioritas Tinggi',
    dueDate: '2026-09-28',
    assignee: 'Tim Subbag Kepegawaian',
    pinned: true,
    checklist: [
      { id: 'c1', text: 'Periksa kesesuaian kenaikan gaji pokok PP 5/2024', completed: true },
      { id: 'c2', text: 'Validasi riwayat pangkat terakhir di SIASN', completed: true },
      { id: 'c3', text: 'Cetak draf lembar petikan SK KGB', completed: false },
      { id: 'c4', text: 'Kirim notifikasi email kepada pegawai bersangkutan', completed: false }
    ],
    createdAt: '2026-09-15T08:30:00.000Z',
    updatedAt: '2026-09-20T09:00:00.000Z'
  },
  {
    id: 'task-2',
    title: 'Rekap Berkas Kenaikan Pangkat Periode Oktober 2026',
    content: 'Kompilasi usulan SKP 2 tahun terakhir dan surat pengantar dari masing-masing Balai Standardisasi BSKJI se-Indonesia.',
    status: 'todo',
    priority: 'urgent',
    category: 'Kenaikan Pangkat',
    color: 'pink',
    labelColor: 'red',
    labelText: 'Mendesak / BKN',
    dueDate: '2026-09-25',
    assignee: 'Analis SDM Aparatur',
    pinned: true,
    checklist: [
      { id: 'c5', text: 'Unduh rekap usulan dari Google Sheets BSKJI', completed: true },
      { id: 'c6', text: 'Cek kesesuaian angka kredit kumulatif jabatan fungsional', completed: false },
      { id: 'c7', text: 'Upload dokumen persetujuan teknis ke BKN', completed: false }
    ],
    createdAt: '2026-09-18T10:15:00.000Z',
    updatedAt: '2026-09-18T10:15:00.000Z'
  },
  {
    id: 'task-3',
    title: 'Rekonsiliasi Absensi & Jam Kerja Fleksibel BSKJI',
    content: 'Pemeriksaan log presensi bulanan, surat tugas perjalanan dinas, dan pengajuan cuti tahunan pegawai.',
    status: 'review',
    priority: 'medium',
    category: 'Jam Kerja ASN',
    color: 'purple',
    labelColor: 'purple',
    labelText: 'Regulasi Jam Kerja',
    dueDate: '2026-09-30',
    assignee: 'Pengelola Kepegawaian',
    pinned: false,
    checklist: [
      { id: 'c8', text: 'Sinkronisasi data mesin fingerprint dan mobile presensi', completed: true },
      { id: 'c9', text: 'Verifikasi surat izin sakit & surat tugas kedinasan', completed: true },
      { id: 'c10', text: 'Kirimkan rekapitulasi ke bendahara untuk tunjangan kinerja', completed: false }
    ],
    createdAt: '2026-09-17T11:00:00.000Z',
    updatedAt: '2026-09-19T14:20:00.000Z'
  },
  {
    id: 'task-4',
    title: 'Pemberitahuan Batas Usia Pensiun (BUP) Pegawai 2027',
    content: 'Penyusunan surat edaran pemberitahuan 1 tahun sebelum TMT BUP bagi pegawai yang genap berusia pensiun.',
    status: 'todo',
    priority: 'medium',
    category: 'Layanan Pensiun',
    color: 'green',
    labelColor: 'teal',
    labelText: 'Verifikasi BUP',
    dueDate: '2026-10-05',
    assignee: 'Subbag Umum & SDM',
    pinned: false,
    checklist: [
      { id: 'c11', text: 'Filter data pegawai BUP < 12 bulan di portal BSKJI', completed: true },
      { id: 'c12', text: 'Siapkan draf data perorangan calon pensiun (DPCP)', completed: false }
    ],
    createdAt: '2026-09-19T07:45:00.000Z',
    updatedAt: '2026-09-19T07:45:00.000Z'
  },
  {
    id: 'task-5',
    title: 'Evaluasi & Digitalisasi Layanan Arsip Kepegawaian',
    content: 'Migrasi dokumen fisik SK pegawai lama ke dalam repositori digital terpusat BSKJI.',
    status: 'done',
    priority: 'low',
    category: 'Administrasi Umum',
    color: 'yellow',
    labelColor: 'green',
    labelText: 'Prioritas Rendah',
    dueDate: '2026-09-15',
    assignee: 'Arsiparis BSKJI',
    pinned: false,
    checklist: [
      { id: 'c13', text: 'Pemindaian berkas SK KGB periode 2024-2025', completed: true },
      { id: 'c14', text: 'Penamaan berkas format NIP_NAMA_DOKUMEN', completed: true },
      { id: 'c15', text: 'Penyimpanan cadangan di Cloud Storage terenkripsi', completed: true }
    ],
    createdAt: '2026-09-10T09:00:00.000Z',
    updatedAt: '2026-09-15T16:00:00.000Z'
  }
];

// Color mapping for Notion-like aesthetic sticky cards
export const COLOR_CONFIG: Record<NoteColor, {
  name: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  headerAccent: string;
  pinColor: string;
}> = {
  yellow: {
    name: 'Kuning Soft',
    bgLight: 'bg-amber-50/90',
    bgDark: 'dark:bg-amber-950/30',
    borderLight: 'border-amber-200/90',
    borderDark: 'dark:border-amber-800/50',
    headerAccent: 'text-amber-700 dark:text-amber-300',
    pinColor: 'text-amber-500 fill-amber-500'
  },
  blue: {
    name: 'Biru Soft',
    bgLight: 'bg-sky-50/90',
    bgDark: 'dark:bg-sky-950/30',
    borderLight: 'border-sky-200/90',
    borderDark: 'dark:border-sky-800/50',
    headerAccent: 'text-sky-700 dark:text-sky-300',
    pinColor: 'text-sky-500 fill-sky-500'
  },
  green: {
    name: 'Hijau Mint',
    bgLight: 'bg-emerald-50/90',
    bgDark: 'dark:bg-emerald-950/30',
    borderLight: 'border-emerald-200/90',
    borderDark: 'dark:border-emerald-800/50',
    headerAccent: 'text-emerald-700 dark:text-emerald-300',
    pinColor: 'text-emerald-500 fill-emerald-500'
  },
  purple: {
    name: 'Lavender',
    bgLight: 'bg-purple-50/90',
    bgDark: 'dark:bg-purple-950/30',
    borderLight: 'border-purple-200/90',
    borderDark: 'dark:border-purple-800/50',
    headerAccent: 'text-purple-700 dark:text-purple-300',
    pinColor: 'text-purple-500 fill-purple-500'
  },
  pink: {
    name: 'Rose Pink',
    bgLight: 'bg-rose-50/90',
    bgDark: 'dark:bg-rose-950/30',
    borderLight: 'border-rose-200/90',
    borderDark: 'dark:border-rose-800/50',
    headerAccent: 'text-rose-700 dark:text-rose-300',
    pinColor: 'text-rose-500 fill-rose-500'
  },
  orange: {
    name: 'Peach Hangat',
    bgLight: 'bg-orange-50/90',
    bgDark: 'dark:bg-orange-950/30',
    borderLight: 'border-orange-200/90',
    borderDark: 'dark:border-orange-800/50',
    headerAccent: 'text-orange-700 dark:text-orange-300',
    pinColor: 'text-orange-500 fill-orange-500'
  },
  gray: {
    name: 'Slate Minimal',
    bgLight: 'bg-gray-50/90',
    bgDark: 'dark:bg-gray-800/40',
    borderLight: 'border-gray-200',
    borderDark: 'dark:border-gray-700',
    headerAccent: 'text-gray-700 dark:text-gray-300',
    pinColor: 'text-gray-500 fill-gray-500'
  }
};

const KANBAN_COLUMNS: Array<{
  id: TaskStatus;
  title: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
}> = [
  {
    id: 'todo',
    title: 'Belum Mulai',
    badgeBg: 'bg-gray-100 dark:bg-gray-800',
    badgeText: 'text-gray-700 dark:text-gray-300',
    dotColor: 'bg-gray-400'
  },
  {
    id: 'in_progress',
    title: 'Sedang Dikerjakan',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
    badgeText: 'text-blue-700 dark:text-blue-300',
    dotColor: 'bg-blue-500'
  },
  {
    id: 'review',
    title: 'Dalam Review',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
    dotColor: 'bg-amber-500'
  },
  {
    id: 'done',
    title: 'Telah Selesai',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    dotColor: 'bg-emerald-500'
  }
];

export default function StickyNotesKanbanPage({ currentUser }: StickyNotesKanbanPageProps) {
  // Load tasks from localStorage or initial seed
  const [tasks, setTasks] = useState<StickyTask[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.error('Failed to load sticky tasks:', err);
      }
    }
    return INITIAL_TASKS;
  });

  // Active view: 'kanban' (Bagan Kanban) | 'grid' (Papan Sticky Notes) | 'table' (Tabel Ringkas)
  const [viewMode, setViewMode] = useState<'kanban' | 'grid' | 'table'>('kanban');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedPriority, setSelectedPriority] = useState<string>('Semua');
  const [selectedLabelColor, setSelectedLabelColor] = useState<string>('Semua');
  const [onlyPinned, setOnlyPinned] = useState(false);

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Modal / Editor State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<StickyTask | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [activeColorPickerTaskId, setActiveColorPickerTaskId] = useState<string | null>(null);

  // Close inline color picker on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveColorPickerTaskId(null);
    };
    if (activeColorPickerTaskId) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeColorPickerTaskId]);

  // Form states for adding/editing task
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    status: TaskStatus;
    priority: TaskPriority;
    category: string;
    color: NoteColor;
    labelColor: LabelColor;
    labelText: string;
    dueDate: string;
    assignee: string;
    pinned: boolean;
    checklist: TaskChecklistItem[];
  }>({
    title: '',
    content: '',
    status: 'todo',
    priority: 'medium',
    category: 'Layanan KGB',
    color: 'yellow',
    labelColor: 'blue',
    labelText: '',
    dueDate: '',
    assignee: currentUser?.nama || 'Staf Kepegawaian',
    pinned: false,
    checklist: []
  });

  // Save tasks to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch (err) {
        console.error('Failed to persist tasks:', err);
      }
    }
  }, [tasks]);

  // Open modal to create task
  const handleOpenCreateModal = (defaultStatus: TaskStatus = 'todo', defaultPriority: TaskPriority = 'medium', defaultLabelColor?: LabelColor) => {
    setEditingTask(null);
    const resolvedLabel = defaultLabelColor || DEFAULT_PRIORITY_LABEL_COLOR[defaultPriority] || 'blue';
    setFormData({
      title: '',
      content: '',
      status: defaultStatus,
      priority: defaultPriority,
      category: 'Layanan KGB',
      color: 'yellow',
      labelColor: resolvedLabel,
      labelText: '',
      dueDate: new Date().toISOString().split('T')[0],
      assignee: currentUser?.nama || 'Staf Kepegawaian',
      pinned: false,
      checklist: []
    });
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  // Open modal to edit task
  const handleOpenEditModal = (task: StickyTask) => {
    setEditingTask(task);
    const resolvedLabel = task.labelColor || DEFAULT_PRIORITY_LABEL_COLOR[task.priority] || 'blue';
    setFormData({
      title: task.title,
      content: task.content,
      status: task.status,
      priority: task.priority,
      category: task.category,
      color: task.color,
      labelColor: resolvedLabel,
      labelText: task.labelText || '',
      dueDate: task.dueDate || '',
      assignee: task.assignee || '',
      pinned: task.pinned,
      checklist: [...task.checklist]
    });
    setNewChecklistText('');
    setIsModalOpen(true);
  };

  // Quick inline label color changer directly from Kanban card
  const handleQuickChangeLabelColor = (taskId: string, color: LabelColor, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const newPriority = LABEL_COLOR_CONFIG[color]?.defaultPriority || t.priority;
          return {
            ...t,
            labelColor: color,
            priority: newPriority,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      })
    );
    setActiveColorPickerTaskId(null);
  };

  // Save task (create or update)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask) {
      setTasks(prev =>
        prev.map(task =>
          task.id === editingTask.id
            ? {
                ...task,
                title: formData.title.trim(),
                content: formData.content.trim(),
                status: formData.status,
                priority: formData.priority,
                category: formData.category,
                color: formData.color,
                labelColor: formData.labelColor,
                labelText: formData.labelText.trim() || undefined,
                dueDate: formData.dueDate || undefined,
                assignee: formData.assignee.trim() || undefined,
                pinned: formData.pinned,
                checklist: formData.checklist,
                updatedAt: new Date().toISOString()
              }
            : task
        )
      );
    } else {
      const newTask: StickyTask = {
        id: `task-${Date.now()}`,
        title: formData.title.trim(),
        content: formData.content.trim(),
        status: formData.status,
        priority: formData.priority,
        category: formData.category,
        color: formData.color,
        labelColor: formData.labelColor,
        labelText: formData.labelText.trim() || undefined,
        dueDate: formData.dueDate || undefined,
        assignee: formData.assignee.trim() || undefined,
        pinned: formData.pinned,
        checklist: formData.checklist,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTasks(prev => [newTask, ...prev]);
    }
    setIsModalOpen(false);
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    if (confirm('Hapus catatan tugas ini?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  // Toggle pin
  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, pinned: !t.pinned, updatedAt: new Date().toISOString() } : t))
    );
  };

  // Move task to a new status
  const handleMoveStatus = (id: string, newStatus: TaskStatus, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
    );
  };

  // Toggle checklist item inside task
  const handleToggleChecklist = (taskId: string, checklistId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task;
        const updatedChecklist = task.checklist.map(item =>
          item.id === checklistId ? { ...item, completed: !item.completed } : item
        );
        return { ...task, checklist: updatedChecklist, updatedAt: new Date().toISOString() };
      })
    );
  };

  // Change color directly from card
  const handleChangeColor = (taskId: string, newColor: NoteColor, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, color: newColor, updatedAt: new Date().toISOString() } : t))
    );
  };

  // Add checklist item in modal
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: TaskChecklistItem = {
      id: `check-${Date.now()}-${Math.random()}`,
      text: newChecklistText.trim(),
      completed: false
    };
    setFormData(prev => ({
      ...prev,
      checklist: [...prev.checklist, newItem]
    }));
    setNewChecklistText('');
  };

  // Remove checklist item in modal
  const handleRemoveChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id)
    }));
  };

  // Quick Notion Templates
  const handleApplyTemplate = (type: 'kgb' | 'kp' | 'jam_kerja' | 'memo') => {
    let templateData: Partial<typeof formData> = {};
    if (type === 'kgb') {
      templateData = {
        title: 'Verifikasi Berkas SK KGB Pegawai',
        content: 'Verifikasi surat pengantar dan periksa daftar berkas kelayakan KGB periode berikutnya.',
        category: 'Layanan KGB',
        color: 'yellow',
        priority: 'high',
        checklist: [
          { id: 't1', text: 'Cek SK KGB 2 tahun sebelumnya', completed: true },
          { id: 't2', text: 'Hitung penyesuaian gaji pokok sesuai PP 5/2024', completed: false },
          { id: 't3', text: 'Input data penetapan di SIASN', completed: false },
          { id: 't4', text: 'Cetak lembar persetujuan dan serahkan ke Kasubbag', completed: false }
        ]
      };
    } else if (type === 'kp') {
      templateData = {
        title: 'Pemberkasan Usulan Kenaikan Pangkat (KP)',
        content: 'Pemeriksaan berkas SKP 2 tahun, surat pengantar unit kerja, dan angka kredit jabatan.',
        category: 'Kenaikan Pangkat',
        color: 'blue',
        priority: 'urgent',
        checklist: [
          { id: 't5', text: 'SK Pangkat terakhir telah dilegalisir', completed: true },
          { id: 't6', text: 'Penilaian Kinerja Pegawai bernilai minimal Baik', completed: false },
          { id: 't7', text: 'Persetujuan Teknis (Pertek) BKN terbit', completed: false }
        ]
      };
    } else if (type === 'jam_kerja') {
      templateData = {
        title: 'Rekap Presensi & Jam Kerja ASN BSKJI',
        content: 'Monitoring kedisiplinan jam kerja 37 jam 30 menit per minggu sesuai Permenpan RB.',
        category: 'Jam Kerja ASN',
        color: 'purple',
        priority: 'medium',
        checklist: [
          { id: 't8', text: 'Cek pegawai tidak hadir tanpa keterangan', completed: true },
          { id: 't9', text: 'Validasi form jam kerja fleksibel', completed: false },
          { id: 't10', text: 'Laporan bulanan ke BKN', completed: false }
        ]
      };
    } else {
      templateData = {
        title: 'Catatan Rapat / Memo Internal Kepegawaian',
        content: 'Tuliskan poin-poin penting hasil koordinasi atau arahan pimpinan di sini...',
        category: 'Koordinasi Internal',
        color: 'green',
        priority: 'low',
        checklist: []
      };
    }

    setFormData(prev => ({
      ...prev,
      ...templateData
    }));
  };

  // Reset to default starter tasks
  const handleResetToDefault = () => {
    if (confirm('Kembalikan tugas & catatan ke data awal bawaan? Perubahan Anda akan direset.')) {
      setTasks(INITIAL_TASKS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
    }
  };

  // Export tasks as JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sticky_notes_bskji_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDrop = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      handleMoveStatus(taskId, colId);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchContent = task.content.toLowerCase().includes(q);
        const matchAssignee = task.assignee?.toLowerCase().includes(q) || false;
        const matchCategory = task.category.toLowerCase().includes(q);
        const matchChecklist = task.checklist.some(c => c.text.toLowerCase().includes(q));
        const matchLabel = (task.labelText || '').toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchAssignee && !matchCategory && !matchChecklist && !matchLabel) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'Semua' && task.category !== selectedCategory) {
        return false;
      }

      // Priority
      if (selectedPriority !== 'Semua' && task.priority !== selectedPriority) {
        return false;
      }

      // Label Color / Urgency
      if (selectedLabelColor !== 'Semua') {
        const tColor = getTaskLabelColor(task);
        if (tColor !== selectedLabelColor) {
          return false;
        }
      }

      // Only pinned
      if (onlyPinned && !task.pinned) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Pinned always on top
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [tasks, searchQuery, selectedCategory, selectedPriority, selectedLabelColor, onlyPinned]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const review = tasks.filter(t => t.status === 'review').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const urgent = tasks.filter(t => (t.priority === 'urgent' || getTaskLabelColor(t) === 'red') && t.status !== 'done').length;
    const pinned = tasks.filter(t => t.pinned).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, done, inProgress, review, todo, urgent, pinned, percent };
  }, [tasks]);

  // Count cards by label color
  const labelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      const col = getTaskLabelColor(t);
      counts[col] = (counts[col] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  // Render task label badge with optional quick inline color changer
  const renderTaskLabelBadge = (task: StickyTask, interactive = false) => {
    const resolvedLabelKey = getTaskLabelColor(task);
    const labelStyle = LABEL_COLOR_CONFIG[resolvedLabelKey] || LABEL_COLOR_CONFIG.blue;
    const isPickerOpen = activeColorPickerTaskId === task.id;

    if (!interactive) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${labelStyle.badgeBg} ${labelStyle.badgeText} ${labelStyle.badgeBorder}`}
          title={labelStyle.urgencyTitle}
        >
          <span className={`w-2 h-2 rounded-full ${labelStyle.dotColor} shrink-0`} />
          <span className="truncate max-w-[130px]">{task.labelText || labelStyle.shortName}</span>
        </span>
      );
    }

    return (
      <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveColorPickerTaskId(isPickerOpen ? null : task.id);
          }}
          title="Klik untuk ubah warna label / urgensi tugas ini secara cepat"
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${labelStyle.badgeBg} ${labelStyle.badgeText} ${labelStyle.badgeBorder} hover:shadow-xs hover:scale-105 select-none`}
        >
          <span className={`w-2 h-2 rounded-full ${labelStyle.dotColor} shrink-0`} />
          <span className="truncate max-w-[120px]">{task.labelText || labelStyle.shortName}</span>
          <ChevronDown size={11} className="opacity-60 shrink-0" />
        </button>

        {isPickerOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full mt-1.5 z-50 w-56 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100 dark:border-gray-700 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Palette size={11} />
                Warna Label Urgensi
              </span>
              <button
                type="button"
                onClick={() => setActiveColorPickerTaskId(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-1 max-h-52 overflow-y-auto custom-scrollbar pt-1">
              {(Object.keys(LABEL_COLOR_CONFIG) as LabelColor[]).map((cKey) => {
                const cfg = LABEL_COLOR_CONFIG[cKey];
                const isCurrent = resolvedLabelKey === cKey;
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={(e) => handleQuickChangeLabelColor(task.id, cKey, e)}
                    className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? `${cfg.badgeBg} ${cfg.badgeText} font-bold`
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor} shrink-0`} />
                      <span className="truncate">{cfg.name}</span>
                    </div>
                    {isCurrent && <Check size={12} className="shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render priority badge
  const renderPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Flame size={11} className="shrink-0" />
            Mendesak
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Tinggi
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Sedang
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            Rendah
          </span>
        );
    }
  };

  // Render a single sticky note card
  const renderCard = (task: StickyTask, isKanban = false) => {
    const colorStyle = COLOR_CONFIG[task.color] || COLOR_CONFIG.yellow;
    const resolvedLabelKey = getTaskLabelColor(task);
    const labelStyle = LABEL_COLOR_CONFIG[resolvedLabelKey] || LABEL_COLOR_CONFIG.blue;
    const completedCount = task.checklist.filter(c => c.completed).length;
    const totalCount = task.checklist.length;
    const checklistProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Quick step calculation between Kanban columns
    const currentColIndex = KANBAN_COLUMNS.findIndex(col => col.id === task.status);
    const prevCol = currentColIndex > 0 ? KANBAN_COLUMNS[currentColIndex - 1] : null;
    const nextCol = currentColIndex >= 0 && currentColIndex < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[currentColIndex + 1] : null;

    return (
      <motion.div
        key={task.id}
        layout
        layoutId={`kanban-card-${task.id}`}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{
          opacity: draggedTaskId === task.id ? 0.35 : 1,
          scale: draggedTaskId === task.id ? 1.02 : 1,
          y: 0
        }}
        exit={{
          opacity: 0,
          scale: 0.9,
          transition: { duration: 0.18 }
        }}
        transition={{
          layout: {
            type: 'spring',
            stiffness: 350,
            damping: 28,
            mass: 0.8
          },
          opacity: { duration: 0.2 },
          scale: { duration: 0.2 }
        }}
        draggable
        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, task.id)}
        onDragEnd={() => {
          setDraggedTaskId(null);
          setDragOverColumn(null);
        }}
        onClick={() => handleOpenEditModal(task)}
        className={`group relative rounded-2xl p-4 cursor-pointer shadow-xs hover:shadow-md border ${colorStyle.bgLight} ${colorStyle.bgDark} ${colorStyle.borderLight} ${colorStyle.borderDark} hover:scale-[1.01] transition-shadow flex flex-col justify-between overflow-visible`}
      >
        {/* Top Urgency Color Stripe for Kanban & Notes */}
        <div className={`-mt-4 -mx-4 mb-3.5 h-1.5 rounded-t-2xl ${labelStyle.topStripe}`} />

        {/* Top bar: Category + Urgency Label Pill + Pin + Actions */}
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-2.5">
            <div className="flex items-center flex-wrap gap-1.5 min-w-0">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-white/85 dark:bg-gray-900/70 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60 truncate max-w-[120px]">
                {task.category}
              </span>
              {/* Interactive Urgency/Priority Label Badge */}
              {renderTaskLabelBadge(task, true)}
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={(e) => handleTogglePin(task.id, e)}
                title={task.pinned ? 'Lepas Sematan' : 'Sematkan di Atas'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  task.pinned
                    ? 'text-amber-500 bg-amber-100/80 dark:bg-amber-900/40'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/60'
                }`}
              >
                {task.pinned ? <Pin size={14} className="fill-amber-500" /> : <Pin size={14} />}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.id);
                }}
                title="Hapus Catatan"
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Title */}
          <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-snug line-clamp-2 mb-1.5">
            {task.title}
          </h4>

          {/* Content snippet */}
          {task.content && (
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 mb-3 leading-relaxed whitespace-pre-line">
              {task.content}
            </p>
          )}

          {/* Checklist / Subtasks (Interactive inline toggle) */}
          {task.checklist.length > 0 && (
            <div className="my-2.5 p-2.5 rounded-xl bg-white/70 dark:bg-gray-900/40 border border-gray-200/40 dark:border-gray-700/40 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                <span className="flex items-center gap-1">
                  <CheckSquare size={12} className="text-primary-500" />
                  Subtugas ({completedCount}/{totalCount})
                </span>
                <span className="font-bold text-[10px]">{checklistProgress}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-gray-200/70 dark:bg-gray-700/60 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>

              {/* Checklist items list */}
              <div className="space-y-1">
                {task.checklist.map(item => (
                  <div
                    key={item.id}
                    onClick={(e) => handleToggleChecklist(task.id, item.id, e)}
                    className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800/80 p-1 rounded-md transition-colors cursor-pointer select-none"
                  >
                    {item.completed ? (
                      <CheckSquare size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Square size={14} className="text-gray-400 shrink-0" />
                    )}
                    <span className={`text-[11px] truncate flex-1 ${item.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom meta: Due Date + Assignee + Fast Column Move with Step Chevrons */}
        <div className="mt-3 pt-2.5 border-t border-gray-200/50 dark:border-gray-700/40 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 min-w-0">
            {task.dueDate && (
              <span className="flex items-center gap-1 truncate font-medium">
                <Calendar size={12} className="shrink-0 text-gray-400" />
                {task.dueDate}
              </span>
            )}
            {task.assignee && (
              <span className="flex items-center gap-1 truncate text-gray-600 dark:text-gray-300">
                <User size={12} className="shrink-0 text-gray-400" />
                {task.assignee.split(' ')[0]}
              </span>
            )}
          </div>

          {/* Column Switcher with Quick Step Arrows & Status Dropdown */}
          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
            {isKanban && (
              <div className="flex items-center gap-0.5 mr-0.5">
                {prevCol && (
                  <button
                    type="button"
                    onClick={(e) => handleMoveStatus(task.id, prevCol.id, e)}
                    title={`Geser kartu ke "${prevCol.title}"`}
                    className="p-1 rounded-lg bg-white/90 dark:bg-gray-800 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 border border-gray-200/70 dark:border-gray-700/70 hover:border-primary-400 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft size={12} />
                  </button>
                )}
                {nextCol && (
                  <button
                    type="button"
                    onClick={(e) => handleMoveStatus(task.id, nextCol.id, e)}
                    title={`Geser kartu ke "${nextCol.title}"`}
                    className="p-1 rounded-lg bg-white/90 dark:bg-gray-800 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 border border-gray-200/70 dark:border-gray-700/70 hover:border-primary-400 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
            )}

            <select
              value={task.status}
              onChange={(e) => handleMoveStatus(task.id, e.target.value as TaskStatus)}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/90 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Selesai</option>
            </select>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Notion-Style Header & Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
              <Sparkles size={14} />
              <span>Ruang Kerja Produktivitas ASN BSKJI</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <StickyNote size={22} />
              </div>
              Sticky Notes & Kanban Tugas
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              Kelola daftar progres tugas, verifikasi berkas KGB, usulan kenaikan pangkat, dan catatan harian kepegawaian dengan papan kanban interaktif ala Notion.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => handleOpenCreateModal()}
              className="px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>Tambah Tugas Baru</span>
            </button>

            <button
              onClick={handleExportJSON}
              title="Ekspor Data Catatan ke JSON"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <Download size={16} />
            </button>

            <button
              onClick={handleResetToDefault}
              title="Reset ke Contoh Data Awal"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Notion-Like Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-gray-700/60">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 block">Total Tugas</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white mt-0.5 block">{stats.total}</span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 block">Dikerjakan</span>
            <span className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-0.5 block">{stats.inProgress}</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 block">Dalam Review</span>
            <span className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5 block">{stats.review}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 block">Telah Selesai</span>
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block">{stats.done}</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
            <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 block">Mendesak</span>
            <span className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-0.5 block">{stats.urgent}</span>
          </div>

          <div className="p-3 rounded-xl bg-primary-50/70 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-primary-700 dark:text-primary-300">Penyelesaian</span>
              <span className="text-xs font-bold text-primary-700 dark:text-primary-300">{stats.percent}%</span>
            </div>
            <div className="w-full h-2 bg-primary-100 dark:bg-primary-900/60 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full transition-all duration-500" style={{ width: `${stats.percent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: View Switcher, Search, and Category Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
        {/* View Mode Switcher (Notion-Style Tab Pills) */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900/80 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Kanban size={15} />
            <span>Bagan Kanban</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <StickyNote size={15} />
            <span>Papan Sticky Notes</span>
          </button>

          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <TableIcon size={15} />
            <span>Tabel Tugas</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center flex-wrap gap-2 flex-1 justify-end">
          <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tugas, PIC, subtugas..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-medium"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                Kategori: {cat}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-medium"
          >
            <option value="Semua">Prioritas: Semua</option>
            <option value="urgent">Mendesak</option>
            <option value="high">Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Rendah</option>
          </select>

          {/* Label Color / Urgency Filter */}
          <select
            value={selectedLabelColor}
            onChange={(e) => setSelectedLabelColor(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-medium"
          >
            <option value="Semua">🏷️ Warna Label: Semua</option>
            {(Object.keys(LABEL_COLOR_CONFIG) as LabelColor[]).map((cKey) => {
              const cfg = LABEL_COLOR_CONFIG[cKey];
              const count = labelCounts[cKey] || 0;
              return (
                <option key={cKey} value={cKey}>
                  {cfg.name} ({count})
                </option>
              );
            })}
          </select>

          {/* Only Pinned Toggle */}
          <button
            onClick={() => setOnlyPinned(!onlyPinned)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              onlyPinned
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Pin size={13} className={onlyPinned ? 'fill-amber-500 text-amber-500' : ''} />
            <span>Tersemat</span>
          </button>
        </div>
      </div>

      {/* Interactive Quick Label Filter Chips Bar */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-gray-700 dark:text-gray-300">
          <Palette size={14} className="text-primary-600 dark:text-primary-400" />
          <span>Kategori Urgensi:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto custom-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedLabelColor('Semua')}
            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shrink-0 ${
              selectedLabelColor === 'Semua'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Semua ({tasks.length})
          </button>

          {(Object.keys(LABEL_COLOR_CONFIG) as LabelColor[]).map((cKey) => {
            const cfg = LABEL_COLOR_CONFIG[cKey];
            const count = labelCounts[cKey] || 0;
            const isSelected = selectedLabelColor === cKey;
            return (
              <button
                key={cKey}
                type="button"
                onClick={() => setSelectedLabelColor(isSelected ? 'Semua' : cKey)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? `${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} ring-2 ring-primary-500 shadow-xs scale-105`
                    : `${cfg.chipBg} text-gray-700 dark:text-gray-300 ${cfg.chipBorder} hover:opacity-90`
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                <span>{cfg.shortName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/60 dark:bg-black/40' : 'bg-black/5 dark:bg-white/10'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {selectedLabelColor !== 'Semua' && (
          <button
            type="button"
            onClick={() => setSelectedLabelColor('Semua')}
            className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline shrink-0 cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* VIEW 1: BAGAN KANBAN (KANBAN BOARD) */}
      {viewMode === 'kanban' && (
        <LayoutGroup id="kanban-layout-group">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {KANBAN_COLUMNS.map(col => {
              const colTasks = filteredTasks.filter(t => t.status === col.id);
              const isDragOver = dragOverColumn === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex flex-col rounded-2xl bg-gray-100/70 dark:bg-gray-900/40 border transition-colors duration-200 min-h-[480px] p-3.5 ${
                    isDragOver
                      ? 'border-primary-500 bg-primary-50/25 dark:bg-primary-950/25 ring-2 ring-primary-500/20'
                      : 'border-gray-200/80 dark:border-gray-800'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                      <h3 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider">
                        {col.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${col.badgeBg} ${col.badgeText}`}>
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenCreateModal(col.id)}
                      title={`Tambah tugas di kolom ${col.title}`}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Cards Container with Framer Motion AnimatePresence */}
                  <div className="flex-1 space-y-3 overflow-y-auto min-h-[120px]">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {/* Interactive Smooth Drop Zone Indicator */}
                      {isDragOver && (
                        <motion.div
                          key={`drop-target-${col.id}`}
                          initial={{ opacity: 0, height: 0, scale: 0.95 }}
                          animate={{ opacity: 1, height: 48, scale: 1 }}
                          exit={{ opacity: 0, height: 0, scale: 0.95 }}
                          transition={{ duration: 0.16 }}
                          className="border-2 border-dashed border-primary-500 dark:border-primary-400 rounded-2xl bg-primary-50/70 dark:bg-primary-950/50 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300 pointer-events-none shadow-2xs"
                        >
                          ✨ Lepaskan untuk memindahkan ke {col.title}
                        </motion.div>
                      )}

                      {colTasks.length === 0 && !isDragOver ? (
                        <motion.div
                          key={`empty-${col.id}`}
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="h-40 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex flex-col items-center justify-center p-4 text-center"
                        >
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Belum ada tugas</p>
                          <button
                            onClick={() => handleOpenCreateModal(col.id)}
                            className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:underline mt-1 cursor-pointer"
                          >
                            + Tambah sekarang
                          </button>
                        </motion.div>
                      ) : (
                        colTasks.map(task => renderCard(task, true))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </LayoutGroup>
      )}

      {/* VIEW 2: PAPAN STICKY NOTES (GRID VIEW) */}
      {viewMode === 'grid' && (
        <LayoutGroup id="grid-layout-group">
          <div>
            {filteredTasks.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <StickyNote size={36} className="mx-auto text-gray-400 mb-2" />
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Tidak ada sticky note</h3>
                <p className="text-xs text-gray-500 mt-1">Coba ubah kata kunci pencarian atau buat catatan tugas baru.</p>
                <button
                  onClick={() => handleOpenCreateModal()}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>Buat Sticky Note Pertama</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredTasks.map(task => renderCard(task, false))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </LayoutGroup>
      )}

      {/* VIEW 3: TABEL TUGAS (NOTION TABLE VIEW) */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
              <thead className="bg-gray-50/80 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Pin</th>
                  <th className="py-3 px-4">Tugas & Keterangan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Label & Urgensi</th>
                  <th className="py-3 px-4">Prioritas</th>
                  <th className="py-3 px-4">Subtugas</th>
                  <th className="py-3 px-4">Tenggat</th>
                  <th className="py-3 px-4">PIC</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-gray-400">
                      Tidak ada catatan tugas yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => {
                    const completed = task.checklist.filter(c => c.completed).length;
                    const total = task.checklist.length;
                    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                        onClick={() => handleOpenEditModal(task)}
                      >
                        <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleTogglePin(task.id)}
                            className="text-gray-400 hover:text-amber-500 cursor-pointer"
                          >
                            {task.pinned ? <Pin size={14} className="fill-amber-500 text-amber-500" /> : <Pin size={14} />}
                          </button>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-bold text-gray-900 dark:text-white truncate">{task.title}</p>
                          {task.content && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{task.content}</p>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {task.category}
                          </span>
                        </td>

                        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                          <select
                            value={task.status}
                            onChange={(e) => handleMoveStatus(task.id, e.target.value as TaskStatus)}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 border-none text-gray-800 dark:text-gray-200 cursor-pointer"
                          >
                            <option value="todo">Belum Mulai</option>
                            <option value="in_progress">Sedang Dikerjakan</option>
                            <option value="review">Dalam Review</option>
                            <option value="done">Selesai</option>
                          </select>
                        </td>

                        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                          {renderTaskLabelBadge(task, true)}
                        </td>

                        <td className="py-3 px-4">{renderPriorityBadge(task.priority)}</td>

                        <td className="py-3 px-4">
                          {total > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium">{completed}/{total}</span>
                              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[11px]">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px]">
                          {task.dueDate || '-'}
                        </td>

                        <td className="py-3 px-4 truncate max-w-[120px]">
                          {task.assignee || '-'}
                        </td>

                        <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(task)}
                              className="p-1 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Edit"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Hapus"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NOTION-STYLE TASK MODAL / DRAWER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <StickyNote size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {editingTask ? 'Edit Sticky Note & Tugas' : 'Tambah Catatan Tugas Baru'}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Atur status kanban, subtugas, dan warna sticky note
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Templates Selector (if creating) */}
            {!editingTask && (
              <div className="px-6 py-2.5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 overflow-x-auto text-xs">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                  Gunakan Template:
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('kgb')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 text-gray-700 dark:text-gray-300 font-medium shrink-0 cursor-pointer"
                >
                  📑 Verifikasi KGB
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('kp')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 text-gray-700 dark:text-gray-300 font-medium shrink-0 cursor-pointer"
                >
                  🎖️ Usulan Kenaikan Pangkat
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('jam_kerja')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 text-gray-700 dark:text-gray-300 font-medium shrink-0 cursor-pointer"
                >
                  ⏰ Jam Kerja BSKJI
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('memo')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 text-gray-700 dark:text-gray-300 font-medium shrink-0 cursor-pointer"
                >
                  📝 Memo Bebas
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveTask} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Judul Tugas / Catatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Verifikasi berkas KGB pegawai Gol. III/c TMT Oktober"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Category + Status + Priority row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Kategori Layanan
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-medium"
                  >
                    {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Status Progres
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-medium"
                  >
                    <option value="todo">📋 Belum Mulai (To Do)</option>
                    <option value="in_progress">⏳ Sedang Dikerjakan (In Progress)</option>
                    <option value="review">🔍 Dalam Review</option>
                    <option value="done">✅ Selesai (Done)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer font-medium"
                  >
                    <option value="urgent">🔥 Mendesak</option>
                    <option value="high">⚠️ Tinggi</option>
                    <option value="medium">🔷 Sedang</option>
                    <option value="low">☕ Rendah</option>
                  </select>
                </div>
              </div>

              {/* Color Picker (Notion Pastel Styles) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Warna Sticky Note
                </label>
                <div className="flex items-center flex-wrap gap-2.5">
                  {(Object.keys(COLOR_CONFIG) as NoteColor[]).map(c => {
                    const cfg = COLOR_CONFIG[c];
                    const isSelected = formData.color === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        className={`h-8 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                          cfg.bgLight
                        } ${cfg.borderLight} ${isSelected ? 'ring-2 ring-primary-600 scale-105 shadow-xs' : 'opacity-80 hover:opacity-100'}`}
                      >
                        <span className={`w-3 h-3 rounded-full border border-black/10 ${cfg.bgLight}`} />
                        <span className="text-gray-800 text-[11px]">{cfg.name}</span>
                        {isSelected && <Check size={12} className="text-primary-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Label Color / Urgency Selector for Kanban Categorization */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Warna Label & Tingkat Urgensi Kanban
                  </label>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Kategorisasi visual kartu
                  </span>
                </div>

                {/* Color Chips Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(LABEL_COLOR_CONFIG) as LabelColor[]).map((cKey) => {
                    const cfg = LABEL_COLOR_CONFIG[cKey];
                    const isSelected = formData.labelColor === cKey;
                    return (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            labelColor: cKey,
                            labelText: prev.labelText ? prev.labelText : cfg.shortName
                          }));
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? `${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder} ring-2 ring-primary-500 shadow-xs scale-[1.02]`
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-3 h-3 rounded-full ${cfg.dotColor} shrink-0`} />
                          <span className="truncate text-[11px]">{cfg.name}</span>
                        </div>
                        {isSelected && <Check size={14} className="shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Label Text */}
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Teks Label Kustom (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.labelText}
                    onChange={(e) => setFormData({ ...formData, labelText: e.target.value })}
                    placeholder="Contoh: Mendesak, Prioritas Utama, Menunggu Balasan..."
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    Label ini akan ditampilkan sebagai garis strip warna dan badge interaktif pada kartu Kanban.
                  </p>
                </div>
              </div>

              {/* Due Date + Assignee + Pin toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tenggat Waktu
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Penanggung Jawab (PIC)
                  </label>
                  <input
                    type="text"
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    placeholder="Nama Staf / Bagian"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 w-full cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.pinned}
                      onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                      className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Pin size={14} className={formData.pinned ? 'fill-amber-500 text-amber-500' : 'text-gray-400'} />
                      Sematkan di Atas
                    </span>
                  </label>
                </div>
              </div>

              {/* Subtasks / Checklist Builder */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Subtugas / Daftar Centang (Checklist)
                </label>
                <div className="space-y-2 mb-2">
                  {formData.checklist.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.checklist];
                          updated[idx].completed = !updated[idx].completed;
                          setFormData({ ...formData, checklist: updated });
                        }}
                        className="cursor-pointer"
                      >
                        {item.completed ? (
                          <CheckSquare size={16} className="text-emerald-600" />
                        ) : (
                          <Square size={16} className="text-gray-400" />
                        )}
                      </button>

                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const updated = [...formData.checklist];
                          updated[idx].text = e.target.value;
                          setFormData({ ...formData, checklist: updated });
                        }}
                        className={`flex-1 bg-transparent border-none text-xs text-gray-900 dark:text-white focus:outline-none ${
                          item.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new checklist input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    placeholder="Ketik subtugas baru, lalu tekan Enter atau klik Tambah..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-xs font-bold text-gray-800 dark:text-white cursor-pointer"
                  >
                    + Tambah
                  </button>
                </div>
              </div>

              {/* Notes / Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Catatan Rinci / Deskripsi Tugas
                </label>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Tuliskan catatan, instruksi, atau detail berkas yang dibutuhkan..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 custom-scrollbar leading-relaxed"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                >
                  {editingTask ? 'Simpan Perubahan' : 'Tambahkan ke Papan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
