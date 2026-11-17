import { z } from 'zod';
import { RECOMMEND, weekday, type Catalog } from '../lib/booking.ts';

const PHONE = /^(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;

// Built per request so the options always match the live site data and today's date.
export const leadSchema = ({ vehicles, packages, booking }: Catalog, minDate: string) => {
  const has = (items: { id: string }[]) => (value: string) => items.some(item => item.id === value);
  return z.object({
    vehicleId: z.string().refine(has(vehicles), 'Choose your vehicle size.'),
    packageId: z.string().refine(value => value === RECOMMEND || has(packages)(value), 'Choose a package.'),
    addOnIds: z.array(z.string()).max(booking.addOns.length).refine(ids => ids.every(has(booking.addOns)), 'Choose from the listed add-ons.'),
    vehicle: z.string().trim().min(2, 'Tell us the year, make and model.').max(150),
    conditionId: z.string().refine(has(booking.conditions), 'Choose the paint condition.'),
    dropOffDate: z.iso.date('Choose a drop-off date.')
      .refine(value => value >= minDate, 'Choose a later drop-off date.')
      .refine(value => !booking.closedWeekdays.includes(weekday(value)), 'We are closed that day. Choose another date.'),
    timeWindowId: z.string().refine(has(booking.timeWindows), 'Choose a time window.'),
    notes: z.string().trim().max(500, 'Keep notes under 500 characters.'),
    name: z.string().trim().min(2, 'Enter your name.').max(100),
    contact: z.string().trim().max(254).refine(value => z.email().safeParse(value).success || PHONE.test(value), 'Enter a valid email address or US phone number.'),
    website: z.string().max(0, 'Leave this field empty.').optional(),
  });
};
export type Lead = z.infer<ReturnType<typeof leadSchema>>;
