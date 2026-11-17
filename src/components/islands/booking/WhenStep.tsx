import type { UseFormReturn } from 'react-hook-form';
import type { Site } from '../../../schemas/site';
import type { Lead } from '../../../schemas/lead';
import Field from './Field';
import DatePicker from './DatePicker';

interface Props { form: UseFormReturn<Lead>; booking: Site['booking']; minDate: string }
export default function WhenStep({ form, booking, minDate }: Props) {
  const { register, setValue, watch, formState: { errors } } = form;
  const { fields } = booking;
  const [dropOffDate, timeWindowId] = watch(['dropOffDate', 'timeWindowId']);
  return <>
    <div className="field">
      <label htmlFor="booking-date">{fields.date}</label>
      <DatePicker id="booking-date" value={dropOffDate} min={minDate} closed={booking.closedWeekdays} buttonRef={register('dropOffDate').ref} onChange={value => setValue('dropOffDate', value, { shouldValidate: true, shouldDirty: true })}
        labels={{ placeholder: fields.datePlaceholder, previous: fields.previousMonth, next: fields.nextMonth }} invalid={!!errors.dropOffDate} describedBy="dropOffDate-hint dropOffDate-error" />
      <span id="dropOffDate-hint" className="field-hint">{fields.dateHint}</span>
      <span id="dropOffDate-error" className="field-error">{errors.dropOffDate?.message}</span>
    </div>
    <fieldset className="segmented" aria-describedby="timeWindowId-error"><legend>{fields.time}</legend>
      {booking.timeWindows.map(item => <label key={item.id}><input type="radio" value={item.id} defaultChecked={item.id === timeWindowId} {...register('timeWindowId')} /><span>{item.label}</span></label>)}
      <span id="timeWindowId-error" className="field-error">{errors.timeWindowId?.message}</span>
    </fieldset>
    <Field name="notes" label={fields.notes} optional={fields.optional} errors={errors}>{control => <textarea rows={3} placeholder={fields.notesPlaceholder} {...register('notes')} {...control} />}</Field>
  </>;
}
