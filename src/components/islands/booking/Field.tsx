import type { ReactNode } from 'react';
import type { FieldErrors } from 'react-hook-form';
import type { Lead } from '../../../schemas/lead';

interface ControlProps { 'aria-invalid': boolean; 'aria-describedby': string | undefined }
interface Props { name: keyof Lead; label: string; optional?: string; hint?: string; errors: FieldErrors<Lead>; children: (control: ControlProps) => ReactNode }

export default function Field({ name, label, optional, hint, errors, children }: Props) {
  const error = errors[name]?.message;
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(' ') || undefined;
  return <label className="field">
    <span>{label}{optional && <small> ({optional})</small>}</span>
    {children({ 'aria-invalid': !!error, 'aria-describedby': describedBy })}
    {hint && <span id={`${name}-hint`} className="field-hint">{hint}</span>}
    <span id={`${name}-error`} className="field-error">{error}</span>
  </label>;
}
