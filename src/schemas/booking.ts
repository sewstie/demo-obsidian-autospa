import { z } from 'zod';
import { id, text, texts, time } from './primitives.ts';

const step = texts('short', 'title');
const option = z.object({ id, label: text });
export const bookingSchema = z.object({
  label: text, heading: text, description: text, dialogTitle: text, recommend: text, recommendNote: text,
  estimateLabel: text, estimatePending: text, privacy: text, error: text,
  leadDays: z.number().int().min(0).max(60),
  closedWeekdays: z.array(z.number().int().min(0).max(6)).max(6), // 0 = Sunday
  addOns: z.array(z.object({ id, name: text, price: z.number().int().min(1).max(50000) })).max(8),
  conditions: z.array(option).min(1).max(6),
  timeWindows: z.array(option.extend({ open: time, close: time }).refine(value => value.open < value.close, 'Window must start before it ends.')).min(1).max(6),
  steps: z.object({ vehicle: step, when: step, details: step, review: step }),
  fields: texts(
    'size', 'package', 'addOns', 'vehicle', 'vehiclePlaceholder', 'condition', 'date', 'datePlaceholder', 'previousMonth', 'nextMonth', 'dateHint',
    'time', 'notes', 'notesPlaceholder', 'optional', 'name', 'contact', 'contactHint',
  ),
  actions: texts('back', 'next', 'edit', 'submit', 'sending', 'calendar', 'close'),
  success: texts('title', 'body', 'demoTag', 'emailTitle', 'emailSubject', 'emailName', 'emailContact', 'emailVehicle', 'emailPackage', 'emailDate', 'emailSubmitted', 'calendarTitle'),
});
