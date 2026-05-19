import { COLOR_CONFIG, AttendanceColor } from "@/lib/attendance-color";

export function AttendanceBadge({ color }: { color: AttendanceColor }) {
  const config = COLOR_CONFIG[color];
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-white ${config.bgClass}`}
      title={config.description}
    >
      {config.label}
    </span>
  );
}

export function AttendanceColorDot({ color }: { color: AttendanceColor }) {
  const config = COLOR_CONFIG[color];
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full ${config.bgClass} flex-shrink-0`}
      title={`${config.label}: ${config.description}`}
    />
  );
}
