import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(100),
  phone: z.string().trim().regex(/^(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/, 'Enter a valid US phone number.'),
  email: z.email('Enter a valid email address.').max(254),
  vehicle: z.string().trim().min(2, 'Tell us the year, make and model.').max(150),
  vehicleId: z.string().min(1).max(40),
  packageId: z.string().min(1).max(40),
  slotId: z.string().min(1, 'Choose an available time preference.').max(40),
  consent: z.boolean().refine(Boolean, 'Please agree so we can contact you about this request.'),
  website: z.string().max(0, 'Leave this field empty.').optional(),
});
export type Lead = z.infer<typeof leadSchema>;
