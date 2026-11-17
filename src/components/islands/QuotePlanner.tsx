import { useRef, useState, type CSSProperties } from 'react';
import { CarFront, Truck, X } from 'lucide-react';
import type { Site, Package } from '../../schemas/site';
import PackageCard from './PackageCard';
import BookingForm from './BookingForm';

interface Props { site: Site }
export default function QuotePlanner({ site }: Props) {
  const [vehicleId, setVehicleId] = useState(site.vehicles[0].id);
  const [selected, setSelected] = useState<Package | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const vehicle = site.vehicles.find(item => item.id === vehicleId) ?? site.vehicles[0];
  function choose(treatment: Package) {
    setSelected(treatment);
    dialog.current?.showModal();
  }
  return <>
    <section id="services" data-light className="pricing-section section-space" aria-labelledby="pricing-title">
      <div className="section-shell">
        <div className="pricing-heading"><p className="section-label">{site.pricing.label}</p><h2 id="pricing-title">{site.pricing.heading}</h2><p className="section-description">{site.pricing.description}</p></div>
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
        <div className="package-grid" aria-live="polite" aria-atomic="true">
          {site.packages.map(treatment => <PackageCard key={treatment.id} treatment={treatment} vehicle={vehicle} cta={site.pricing.cta} onChoose={() => choose(treatment)} />)}
        </div>
        <p className="pricing-note">{site.pricing.note}</p>
        <noscript><p>Enable JavaScript to compare vehicle sizes and request an appointment, or call <a href={`tel:${site.business.phone}`}>{site.business.phoneDisplay}</a>.</p></noscript>
      </div>
    </section>
    <dialog ref={dialog} className="booking-dialog" onClose={() => setSelected(null)} aria-labelledby="booking-dialog-title">
      <button className="dialog-close" type="button" aria-label="Close appointment form" onClick={() => dialog.current?.close()}><X size={23} /></button>
      {selected && <><p className="section-label">{site.booking.label}</p><h2 id="booking-dialog-title">Request your appointment</h2>
        <BookingForm key={`${selected.id}-${vehicle.id}`} site={site} treatment={selected} vehicle={vehicle} />
      </>}
    </dialog>
  </>;
}
