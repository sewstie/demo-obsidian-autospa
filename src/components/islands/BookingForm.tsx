import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowUpRight, LoaderCircle } from 'lucide-react';
import type { Site } from '../../schemas/site';
import { leadSchema, type Lead } from '../../schemas/lead';
import { bookingSummary, minDropOffDate } from '../../lib/booking';
import { money } from '../../lib/pricing';
import { asset } from '../../lib/paths';
import VehicleStep from './booking/VehicleStep';
import WhenStep from './booking/WhenStep';
import DetailsStep from './booking/DetailsStep';
import ReviewStep from './booking/ReviewStep';
import Success from './booking/Success';

const STEPS = ['vehicle', 'when', 'details', 'review'] as const;
const STEP_FIELDS: (keyof Lead)[][] = [['vehicleId', 'packageId', 'addOnIds', 'vehicle', 'conditionId'], ['dropOffDate', 'timeWindowId', 'notes'], ['name', 'contact']];
const REVIEW = STEPS.length - 1;

interface Props { site: Site; initial: Pick<Lead, 'vehicleId' | 'packageId'>; onClose: () => void }
export default function BookingForm({ site, initial, onClose }: Props) {
  const { booking, business } = site;
  const { actions } = booking;
  const demo = site.demoMode || import.meta.env.PUBLIC_STATIC_DEMO === 'true';
  const earliest = () => minDropOffDate(booking.leadDays, business.timeZone);
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState<Lead | null>(null);
  const [failed, setFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const form = useForm<Lead>({
    resolver: (values, context, options) => zodResolver(leadSchema(site, earliest()))(values, context, options),
    defaultValues: { ...initial, addOnIds: [], vehicle: '', conditionId: '', dropOffDate: '', timeWindowId: '', notes: '', name: '', contact: '', website: '' },
  });
  // Runs only after the visitor changes step, never when the dialog first opens.
  useEffect(() => { if (moved.current) heading.current?.focus(); }, [step, sent]);
  const go = (next: number) => { moved.current = true; setStep(next); };
  const advance = async () => { if (await form.trigger(STEP_FIELDS[step], { shouldFocus: true })) go(step + 1); };
  async function submit(values: Lead) {
    setFailed(false);
    if (!demo) {
      try {
        const response = await fetch(asset('/api/leads'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values), signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('Request failed');
      } catch { setFailed(true); return; }
    }
    moved.current = true;
    setSent(values);
  }
  if (sent) return <Success lead={sent} site={site} demo={demo} heading={heading} onClose={onClose} />;
  const summary = bookingSummary(form.watch(), site);
  const sending = form.formState.isSubmitting;
  return <form onSubmit={step < REVIEW ? event => { event.preventDefault(); void advance(); } : form.handleSubmit(submit)} className="booking-form" noValidate>
    <ol className="steps">{STEPS.map((key, index) => <li key={key} aria-current={index === step ? 'step' : undefined}><span>{index + 1}</span>{booking.steps[key].short}</li>)}</ol>
    <h3 ref={heading} tabIndex={-1} className="step-title">{booking.steps[STEPS[step]].title}</h3>
    {step === 0 && <VehicleStep form={form} site={site} />}
    {step === 1 && <WhenStep form={form} booking={booking} minDate={earliest()} />}
    {step === 2 && <DetailsStep form={form} fields={booking.fields} />}
    {step === REVIEW && <ReviewStep editLabel={actions.edit} onEdit={go} groups={summary.groups.map((rows, index) => ({ title: booking.steps[STEPS[index]].title, rows }))} />}
    <label className="honeypot" aria-hidden="true">Leave empty<input {...form.register('website')} tabIndex={-1} autoComplete="off" /></label>
    <p className="booking-estimate" aria-live="polite"><span>{summary.line}</span><strong>{summary.total === null ? booking.estimatePending : money(summary.total)}{summary.total !== null && <small>{booking.estimateLabel}</small>}</strong></p>
    {failed && <p role="alert" className="field-error">{booking.error} <a className="text-link" href={`tel:${business.phone}`}>{business.phoneDisplay}</a></p>}
    <div className="step-actions">
      {step > 0 && <button type="button" className="button button-secondary" onClick={() => go(step - 1)} disabled={sending}><ArrowLeft size={17} aria-hidden="true" />{actions.back}</button>}
      {step < REVIEW
        ? <button type="submit" className="button button-primary">{actions.next}<ArrowUpRight size={17} aria-hidden="true" /></button>
        // A double-click on Continue must not land on Send as a second click.
        : <button type="submit" className="button button-primary" disabled={sending} onClick={event => { if (event.detail > 1) event.preventDefault(); }}>{sending ? <><LoaderCircle size={18} aria-hidden="true" />{actions.sending}</> : <>{actions.submit}<ArrowUpRight size={17} aria-hidden="true" /></>}</button>}
    </div>
    {step === REVIEW && <p className="form-footnote">{booking.privacy}</p>}
  </form>;
}
