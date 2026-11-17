import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpRight, CheckCircle2, LoaderCircle } from 'lucide-react';
import type { Site, Package, Vehicle } from '../../schemas/site';
import { leadSchema, type Lead } from '../../schemas/lead';
import { quote, money } from '../../lib/pricing';
import { asset } from '../../lib/paths';

interface Props { site: Site; treatment: Package; vehicle: Vehicle }
export default function BookingForm({ site, treatment, vehicle }: Props) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const demo = site.demo || import.meta.env.PUBLIC_STATIC_DEMO === 'true';
  const slots = site.booking.slots.filter(slot => slot.active);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Lead>({
    resolver: zodResolver(leadSchema),
    defaultValues: { vehicleId: vehicle.id, packageId: treatment.id, consent: false, website: '' },
  });
  async function submit(values: Lead) {
    if (demo) return;
    setStatus('idle');
    try {
      const response = await fetch(asset('/api/leads'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values), signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Request failed');
      setStatus('success');
    } catch { setStatus('error'); }
  }
  if (status === 'success') return <div className="booking-success" role="status"><CheckCircle2 size={36} aria-hidden="true" /><p>{site.booking.success}</p></div>;
  return <form onSubmit={handleSubmit(submit)} className="booking-form" noValidate>
    <div className="booking-summary"><div><strong>{treatment.name}</strong><span>{vehicle.name}</span></div><strong>{money(quote(treatment, vehicle).price)}<small>starting estimate</small></strong></div>
    <p className="text-sm text-muted">{site.booking.description}</p>
    {demo && <p className="form-notice">Demo preview. Appointment requests are disabled; no information is sent.</p>}
    <div className="form-grid">
      <label className="field">Your name<input autoComplete="name" {...register('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} placeholder="Full name" /><span id="name-error" className="field-error">{errors.name?.message}</span></label>
      <label className="field">Phone number<input type="tel" autoComplete="tel" {...register('phone')} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} placeholder="Your phone number" /><span id="phone-error" className="field-error">{errors.phone?.message}</span></label>
    </div>
    <label className="field">Email address<input type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} placeholder="you@example.com" /><span id="email-error" className="field-error">{errors.email?.message}</span></label>
    <label className="field">Your vehicle<input {...register('vehicle')} aria-invalid={!!errors.vehicle} aria-describedby={errors.vehicle ? 'vehicle-error' : undefined} placeholder="Year, make and model" /><span id="vehicle-error" className="field-error">{errors.vehicle?.message}</span></label>
    <label className="field">Preferred time<select {...register('slotId')} aria-invalid={!!errors.slotId} aria-describedby={errors.slotId ? 'slot-error' : undefined} defaultValue=""><option value="" disabled>Select a time preference</option>{slots.map(slot => <option key={slot.id} value={slot.id}>{slot.label}</option>)}</select><span id="slot-error" className="field-error">{errors.slotId?.message}</span></label>
    {!slots.length && <p role="status" className="form-notice">No time preferences are available. Please call the studio.</p>}
    <label className="honeypot" aria-hidden="true">Leave empty<input {...register('website')} tabIndex={-1} autoComplete="off" /></label>
    <label className="consent-field"><input type="checkbox" {...register('consent')} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'consent-error' : undefined} /><span>{site.booking.privacy}</span></label>
    {errors.consent && <p id="consent-error" className="field-error">{errors.consent.message}</p>}
    {status === 'error' && <p role="alert" className="field-error">{site.booking.error} <a className="text-link" href={`tel:${site.business.phone}`}>{site.business.phoneDisplay}</a></p>}
    <button className="button button-primary w-full" type="submit" disabled={demo || isSubmitting || !slots.length}>{isSubmitting ? <><LoaderCircle size={18} aria-hidden="true" />Sending request…</> : <>{site.booking.cta}<ArrowUpRight size={17} aria-hidden="true" /></>}</button>
    <p className="form-footnote">A request is not a confirmed appointment. No payment is taken.</p>
  </form>;
}
