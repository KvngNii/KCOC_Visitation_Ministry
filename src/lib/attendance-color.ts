export type AttendanceColor = "GREEN" | "YELLOW" | "ORANGE" | "RED" | "GREY";

export interface ColorConfig {
  color: AttendanceColor;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  description: string;
}

export const COLOR_CONFIG: Record<AttendanceColor, ColorConfig> = {
  GREEN: {
    color: "GREEN",
    label: "Active",
    bgClass: "bg-green-500",
    textClass: "text-green-700",
    borderClass: "border-green-500",
    description: "Present consistently for 3+ months",
  },
  YELLOW: {
    color: "YELLOW",
    label: "Warning",
    bgClass: "bg-yellow-400",
    textClass: "text-yellow-700",
    borderClass: "border-yellow-400",
    description: "Absent for 1 month",
  },
  ORANGE: {
    color: "ORANGE",
    label: "At Risk",
    bgClass: "bg-orange-500",
    textClass: "text-orange-700",
    borderClass: "border-orange-500",
    description: "Absent for 2 months",
  },
  RED: {
    color: "RED",
    label: "Critical",
    bgClass: "bg-red-600",
    textClass: "text-red-700",
    borderClass: "border-red-600",
    description: "Absent for 3+ months",
  },
  GREY: {
    color: "GREY",
    label: "New",
    bgClass: "bg-gray-400",
    textClass: "text-gray-600",
    borderClass: "border-gray-400",
    description: "Insufficient attendance data",
  },
};

export function computeAttendanceColor(
  lastAttendanceDate: Date | null,
  threeMonthsAttendance: boolean
): AttendanceColor {
  if (!lastAttendanceDate) return "GREY";

  const now = new Date();
  const diffMs = now.getTime() - lastAttendanceDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const diffMonths = diffDays / 30;

  if (threeMonthsAttendance) return "GREEN";
  if (diffMonths >= 3) return "RED";
  if (diffMonths >= 2) return "ORANGE";
  if (diffMonths >= 1) return "YELLOW";
  return "GREEN";
}
