import type { Row } from '../../../lib/booking';

interface RowsProps { rows: Row[] }
export function Rows({ rows }: RowsProps) {
  return <dl className="review-rows">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

interface Props { groups: { title: string; rows: Row[] }[]; editLabel: string; onEdit: (step: number) => void }
export default function ReviewStep({ groups, editLabel, onEdit }: Props) {
  return <>{groups.map((group, index) => <section className="review-group" key={group.title} aria-label={group.title}>
    <div className="review-head"><h4>{group.title}</h4><button type="button" className="link-button" onClick={() => onEdit(index)} aria-label={`${editLabel}: ${group.title}`}>{editLabel}</button></div>
    <Rows rows={group.rows} />
  </section>)}</>;
}
