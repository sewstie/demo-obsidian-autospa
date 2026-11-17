import type { RefObject } from 'react';
import { CalendarPlus, CheckCircle2 } from 'lucide-react';
import type { Site } from '../../../schemas/site';
import type { Lead } from '../../../schemas/lead';
import { bookingSummary, calendarFile } from '../../../lib/booking';
import { money } from '../../../lib/pricing';
import { address } from '../../../lib/paths';
import { Rows } from './ReviewStep';

interface Props { lead: Lead; site: Site; demo: boolean; heading: RefObject<HTMLHeadingElement | null>; onClose: () => void }
export default function Success({ lead, site, demo, heading, onClose }: Props) {
  const { booking, business } = site;
  const { success, actions } = booking;
  const summary = bookingSummary(lead, site);
  const estimate = summary.total === null ? booking.estimatePending : money(summary.total);
  // The timestamp is on the studio's clock, not the visitor's.
  const submitted = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: business.timeZone });
  const email = [`To: ${business.email}`, `Subject: ${success.emailSubject}: ${summary.line}`, '', ...summary.owner.map(row => row.join(': ')), `${booking.estimateLabel}: ${estimate}`, `${success.emailSubmitted}: ${submitted}`].join('\n');
  return <div className="booking-form form-success">
    {demo && <p className="demo-tag">{success.demoTag}</p>}
    <CheckCircle2 size={36} aria-hidden="true" />
    <h3 ref={heading} tabIndex={-1} className="step-title">{success.title}</h3>
    <p>{success.body}</p>
    <Rows rows={summary.groups.flat()} />
    <p className="booking-estimate"><span>{summary.line}</span><strong>{estimate}{summary.total !== null && <small>{booking.estimateLabel}</small>}</strong></p>
    {demo && <figure className="email-preview"><figcaption>{success.emailTitle}</figcaption><pre>{email}</pre></figure>}
    <div className="step-actions">
      <a className="button button-secondary" download="appointment.ics" href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendarFile(lead, site, business.name, address(business)))}`}><CalendarPlus size={17} aria-hidden="true" />{actions.calendar}</a>
      <button type="button" className="button button-primary" onClick={onClose}>{actions.close}</button>
    </div>
  </div>;
}
