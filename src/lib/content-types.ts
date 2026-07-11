import { Video, Link2, MessageCircle, Calendar, BookOpen, FileUp, type LucideIcon } from "lucide-react";

// Single source of truth for mentor content types — used by the mentor-side
// manager (posting/managing) and the student-facing content page, so what a
// mentor builds is exactly what a student sees.
export interface ContentTypeDef {
  value: string;
  /** Short label shown on the type-picker card */
  label: string;
  /** Section heading on the student page and in the manager list */
  sectionLabel: string;
  /** One-line explanation on the type-picker card */
  hint: string;
  icon: LucideIcon;
  color: string;
  urlLabel: string;
  urlPlaceholder: string;
  titlePlaceholder: string;
  /** Show the file-upload button prominently for this type */
  allowUpload: boolean;
}

export const CONTENT_TYPES: ContentTypeDef[] = [
  {
    value: "discord",
    label: "Community",
    sectionLabel: "Community & Discord",
    hint: "Discord, Telegram, or any group your subscribers should join",
    icon: MessageCircle,
    color: "text-indigo-400 bg-indigo-400/10",
    urlLabel: "Invite link",
    urlPlaceholder: "https://discord.gg/your-invite",
    titlePlaceholder: "e.g. Private Discord Server",
    allowUpload: false,
  },
  {
    value: "video",
    label: "Video",
    sectionLabel: "Videos & Recordings",
    hint: "YouTube, Loom, Vimeo link — or upload a recording",
    icon: Video,
    color: "text-red-400 bg-red-400/10",
    urlLabel: "Video link",
    urlPlaceholder: "https://youtube.com/watch?v=…",
    titlePlaceholder: "e.g. Week 1 — Reading Order Flow",
    allowUpload: true,
  },
  {
    value: "call",
    label: "Live Call",
    sectionLabel: "Scheduled Calls",
    hint: "Zoom / Meet link or a Calendly booking page",
    icon: Calendar,
    color: "text-amber-400 bg-amber-400/10",
    urlLabel: "Meeting or booking link",
    urlPlaceholder: "https://calendly.com/you/weekly-call",
    titlePlaceholder: "e.g. Weekly Group Call — Thursdays 6pm",
    allowUpload: false,
  },
  {
    value: "file",
    label: "File",
    sectionLabel: "Files & Downloads",
    hint: "PDF, cheat sheet, spreadsheet — up to 50MB",
    icon: FileUp,
    color: "text-emerald-400 bg-emerald-400/10",
    urlLabel: "File",
    urlPlaceholder: "Upload a file or paste a link",
    titlePlaceholder: "e.g. Risk Management Cheat Sheet",
    allowUpload: true,
  },
  {
    value: "resource",
    label: "Course",
    sectionLabel: "Course Materials",
    hint: "Structured lessons, notion pages, course platforms",
    icon: BookOpen,
    color: "text-primary bg-primary/10",
    urlLabel: "Course link",
    urlPlaceholder: "https://notion.so/your-course",
    titlePlaceholder: "e.g. Full ICT Course — Module 1",
    allowUpload: true,
  },
  {
    value: "link",
    label: "Link",
    sectionLabel: "Resources & Links",
    hint: "Anything else your students should have",
    icon: Link2,
    color: "text-blue-400 bg-blue-400/10",
    urlLabel: "URL",
    urlPlaceholder: "https://…",
    titlePlaceholder: "e.g. My TradingView Watchlist",
    allowUpload: false,
  },
];

export const getContentType = (value: string): ContentTypeDef =>
  CONTENT_TYPES.find((t) => t.value === value) ?? CONTENT_TYPES[5];

/** Section order shown to mentors and students alike */
export const CONTENT_SECTION_ORDER = CONTENT_TYPES.map((t) => t.value);
