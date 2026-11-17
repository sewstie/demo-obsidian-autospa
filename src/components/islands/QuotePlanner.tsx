import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CarFront, Check, Truck, X } from 'lucide-react';
import type { Site } from '../../schemas/site';
import { RECOMMEND } from '../../lib/booking';
import PackageCard from './PackageCard';
import BookingForm from './BookingForm';

interface Props { site: Site }
export default function QuotePlanner({ site }: Props) {
  const [vehicleId, setVehicleId] = useState(site.vehicles[0].id);
  const [requested, setRequested] = useState<string | null>(null); // package the dialog opened with
  const dialog = useRef<HTMLDialogElement>(null);
  const vehicle = site.vehicles.find(item => item.id === vehicleId) ?? site.vehicles[0];
  function open(packageId: string) {
    setRequested(packageId);
    dialog.current?.showModal();
  }
  // The bottom CTA is static markup that links to this section; once hydrated it opens the dialog instead.
  useEffect(() => {
    const links = document.querySelectorAll('[data-book]');
    const book = (event: Event) => { event.preventDefault(); open(RECOMMEND); };
    links.forEach(link => link.addEventListener('click', book));
    return () => links.forEach(link => link.removeEventListener('click', book));
  }, []);
  return <>
    <section id="services" data-light className="pricing-section section-space" aria-labelledby="pricing-title">
      <div className="section-shell">
        <div className="pricing-heading"><p className="section-label">{site.pricing.label}</p><h2 id="pricing-title" tabIndex={-1}>{site.pricing.heading}</h2><p className="section-description">{site.pricing.description}</p></div>
        <fieldset className="vehicle-fieldset">
          <legend>{site.pricing.vehicleLabel}</legend>
          <div className="vehicle-options" style={{ '--n': site.vehicles.length, '--i': site.vehicles.indexOf(vehicle) } as CSSProperties}>{site.vehicles.map((item, index) => {
            const Icon = index === 2 ? Truck : CarFront;
            return <label className={`vehicle-option ${item.id === vehicle.id ? 'is-selected' : ''}`} key={item.id}>
              <input type="radio" name="vehicle-size" value={item.id} checked={item.id === vehicle.id} onChange={() => setVehicleId(item.id)} />
              <Icon size={25} strokeWidth={1.4} aria-hidden="true" />
              <span><strong>{item.name}</strong><small>{item.description}</small></span>
            </label>;
          })}</div>
        </fieldset>
        <p className="vehicle-coverage" aria-live="polite"><Check size={16} aria-hidden="true" />{site.pricing.coverageLabel} <strong key={vehicle.id}>{vehicle.coverage}</strong></p>
        <div className="package-grid" aria-live="polite" aria-atomic="true">
          {site.packages.map(treatment => <PackageCard key={treatment.id} treatment={treatment} vehicle={vehicle} cta={site.pricing.cta} onChoose={() => open(treatment.id)} />)}
        </div>
        <p className="pricing-note">{site.pricing.note}</p>
        <noscript><p>Enable JavaScript to compare vehicle sizes and request an appointment, or call <a href={`tel:${site.business.phone}`}>{site.business.phoneDisplay}</a>.</p></noscript>
      </div>
    </section>
    <dialog ref={dialog} className="booking-dialog" onClose={() => setRequested(null)} aria-labelledby="booking-dialog-title">
      <button className="dialog-close" type="button" aria-label="Close appointment form" onClick={() => dialog.current?.close()}><X size={23} /></button>
      {requested && <><h2 id="booking-dialog-title">{site.booking.dialogTitle}</h2>
        <BookingForm site={site} initial={{ vehicleId: vehicle.id, packageId: requested }} onClose={() => dialog.current?.close()} />
      </>}
    </dialog>
  </>;
}
