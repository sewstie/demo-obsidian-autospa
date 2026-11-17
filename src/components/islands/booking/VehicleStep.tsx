import type { UseFormReturn } from 'react-hook-form';
import type { Site } from '../../../schemas/site';
import type { Lead } from '../../../schemas/lead';
import { RECOMMEND } from '../../../lib/booking';
import { money, quote } from '../../../lib/pricing';
import Field from './Field';

interface Props { form: UseFormReturn<Lead>; site: Site }
export default function VehicleStep({ form, site }: Props) {
  const { register, setValue, watch, formState: { errors } } = form;
  const { booking } = site;
  const { fields } = booking;
  const [vehicleId, packageId, addOnIds, conditionId] = watch(['vehicleId', 'packageId', 'addOnIds', 'conditionId']);
  const vehicle = site.vehicles.find(item => item.id === vehicleId) ?? site.vehicles[0];
  const toggle = (id: string) => setValue('addOnIds', addOnIds.includes(id) ? addOnIds.filter(item => item !== id) : [...addOnIds, id], { shouldDirty: true });
  // Defaults mirror the form state, so coming Back keeps the visitor's choices.
  return <>
    <fieldset className="segmented"><legend>{fields.size}</legend>
      {site.vehicles.map(item => <label key={item.id}><input type="radio" value={item.id} defaultChecked={item.id === vehicleId} {...register('vehicleId')} /><span>{item.name}</span></label>)}
    </fieldset>
    <fieldset className="box-options"><legend>{fields.package}</legend>
      {site.packages.map(item => <label className="box-option" key={item.id}>
        <input type="radio" value={item.id} defaultChecked={item.id === packageId} {...register('packageId')} /><span><strong>{item.name}</strong><small>{item.subtitle}</small></span><strong>{money(quote(item, vehicle).price)}</strong>
      </label>)}
      <label className="box-option"><input type="radio" value={RECOMMEND} defaultChecked={packageId === RECOMMEND} {...register('packageId')} /><span><strong>{booking.recommend}</strong><small>{booking.recommendNote}</small></span></label>
    </fieldset>
    {booking.addOns.length > 0 && <fieldset className="box-options"><legend>{fields.addOns} <small>({fields.optional})</small></legend>
      {booking.addOns.map(item => <label className="box-option" key={item.id}>
        <input type="checkbox" checked={addOnIds.includes(item.id)} onChange={() => toggle(item.id)} /><span><strong>{item.name}</strong></span><strong>+{money(item.price)}</strong>
      </label>)}
    </fieldset>}
    <Field name="vehicle" label={fields.vehicle} errors={errors}>{control => <input placeholder={fields.vehiclePlaceholder} {...register('vehicle')} {...control} />}</Field>
    <fieldset className="segmented" aria-describedby="conditionId-error"><legend>{fields.condition}</legend>
      {booking.conditions.map(item => <label key={item.id}><input type="radio" value={item.id} defaultChecked={item.id === conditionId} {...register('conditionId')} /><span>{item.label}</span></label>)}
      <span id="conditionId-error" className="field-error">{errors.conditionId?.message}</span>
    </fieldset>
  </>;
}
