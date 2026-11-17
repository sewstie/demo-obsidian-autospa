import type { UseFormReturn } from 'react-hook-form';
import type { Site } from '../../../schemas/site';
import type { Lead } from '../../../schemas/lead';
import Field from './Field';

interface Props { form: UseFormReturn<Lead>; fields: Site['booking']['fields'] }
export default function DetailsStep({ form, fields }: Props) {
  const { register, formState: { errors } } = form;
  return <>
    <Field name="name" label={fields.name} errors={errors}>{control => <input autoComplete="name" {...register('name')} {...control} />}</Field>
    <Field name="contact" label={fields.contact} hint={fields.contactHint} errors={errors}>{control => <input inputMode="email" autoComplete="email" autoCapitalize="none" {...register('contact')} {...control} />}</Field>
  </>;
}
