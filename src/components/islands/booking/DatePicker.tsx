import { useRef, useState, type KeyboardEvent, type Ref } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

// Dates stay YYYY-MM-DD strings and all math is UTC, so the visitor's time zone can never shift a day.
const iso = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
const format = (value: string, options: Intl.DateTimeFormatOptions) => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', ...options });
const WEEKDAYS = Array.from({ length: 7 }, (_, day) => format(iso(2023, 0, day + 1), { weekday: 'short' }).slice(0, 2)); // 1 Jan 2023 was a Sunday
const STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

interface Props {
  id: string; value: string; min: string; closed: number[]; onChange: (value: string) => void; buttonRef: Ref<HTMLButtonElement>;
  labels: { placeholder: string; previous: string; next: string }; invalid: boolean; describedBy: string;
}
export default function DatePicker({ id, value, min, closed, onChange, buttonRef, labels, invalid, describedBy }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<string | null>(null);
  // Empty until hydration supplies `min`: the prerendered HTML has no "today" to show a month for.
  const month = view ?? (value || min).slice(0, 7);
  const [year, monthNumber] = month.split('-').map(Number);
  const firstMonth = min.slice(0, 7);
  // Past days and the weekdays the studio is closed cannot be picked.
  const off = (day: string) => day < min || closed.includes(new Date(`${day}T12:00:00Z`).getUTCDay());
  const pick = (day: string) => { onChange(day); setView(null); panel.current?.hidePopover(); };
  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    const days = [...event.currentTarget.querySelectorAll('button')];
    days[days.indexOf(event.target as HTMLButtonElement) + step]?.focus();
  };
  return <>
    <button type="button" id={id} ref={buttonRef} className="date-button" popoverTarget={`${id}-calendar`} aria-haspopup="dialog" aria-invalid={invalid} aria-describedby={describedBy} data-empty={value ? undefined : ''}>
      {value ? format(value, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : labels.placeholder}<CalendarDays size={18} aria-hidden="true" />
    </button>
    <div id={`${id}-calendar`} ref={panel} popover="auto" className="calendar" role="dialog" aria-label={labels.placeholder}>
      {month && <>
        <div className="calendar-head">
          <button type="button" aria-label={labels.previous} aria-disabled={month <= firstMonth} onClick={() => month > firstMonth && setView(iso(year, monthNumber - 2, 1).slice(0, 7))}><ChevronLeft size={18} aria-hidden="true" /></button>
          <strong aria-live="polite">{format(`${month}-01`, { month: 'long', year: 'numeric' })}</strong>
          <button type="button" aria-label={labels.next} onClick={() => setView(iso(year, monthNumber, 1).slice(0, 7))}><ChevronRight size={18} aria-hidden="true" /></button>
        </div>
        <div className="calendar-grid" onKeyDown={move}>
          {WEEKDAYS.map(day => <span key={day} aria-hidden="true">{day}</span>)}
          {Array.from({ length: new Date(Date.UTC(year, monthNumber, 0)).getUTCDate() }, (_, index) => {
            const day = iso(year, monthNumber - 1, index + 1);
            const first = index ? undefined : { gridColumnStart: new Date(`${day}T12:00:00Z`).getUTCDay() + 1 };
            return <button type="button" key={day} style={first} aria-label={format(day, { dateStyle: 'full' })} aria-pressed={day === value} aria-disabled={off(day)} onClick={() => !off(day) && pick(day)}>{index + 1}</button>;
          })}
        </div>
      </>}
    </div>
  </>;
}
