import { ArrowUpRight, Check, Clock3 } from 'lucide-react';
import type { Package, Vehicle } from '../../schemas/site';
import { quote, money } from '../../lib/pricing';

interface Props { treatment: Package; vehicle: Vehicle; cta: string; onChoose: () => void }
export default function PackageCard({ treatment, vehicle, cta, onChoose }: Props) {
  const estimate = quote(treatment, vehicle);
  return <article data-light className={`package-card ${treatment.featured ? 'package-featured' : ''}`}>
    <p className="package-badge">{treatment.featured && <span aria-hidden="true">✦</span>}{treatment.badge}</p>
    <div className="package-content">
      <h3>{treatment.name}</h3>
      <p className="package-subtitle">{treatment.subtitle}</p>
      <p className="package-price"><span>From</span><strong key={estimate.price}>{money(estimate.price)}</strong></p>
      <p className="package-duration"><Clock3 size={13} aria-hidden="true" />{estimate.hours} hours of care <span aria-hidden="true">/</span> {treatment.duration}</p>
      <ul>{treatment.features.map(feature => <li key={feature}><Check size={15} strokeWidth={1.7} aria-hidden="true" /><span>{feature}</span></li>)}</ul>
      <button type="button" className={`button ${treatment.featured ? 'button-primary' : 'button-secondary'}`} onClick={onChoose} aria-label={`${cta}: ${treatment.name}`}>{cta}<ArrowUpRight size={16} aria-hidden="true" /></button>
    </div>
  </article>;
}
