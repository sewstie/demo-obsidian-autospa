import type { Package, Vehicle } from '../schemas/site.ts';

export function quote(treatment: Package, vehicle: Vehicle) {
  return {
    price: Math.round(treatment.price * vehicle.multiplier),
    hours: treatment.hours + vehicle.extraHours,
  };
}
export const money = (amount: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(amount);
