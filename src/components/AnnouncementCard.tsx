import { Link } from 'react-router-dom';
import type { PublicAnnouncement } from '../lib/types';
import { excerpt, formatDate } from '../lib/util';
import { StatusBadge } from './ui';

export default function AnnouncementCard({ a }: { a: PublicAnnouncement }) {
  return (
    <article className="card">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <time dateTime={a.published_at}>{formatDate(a.published_at)}</time>
        {a.category && <StatusBadge label={a.category} tone="neutral" />}
      </div>
      <h3 className="mt-2 text-lg font-bold">
        <Link to={`/announcements/${a.id}`}>{a.title}</Link>
      </h3>
      <p className="mt-1 text-sm">{excerpt(a.body)}</p>
      <p className="mt-2 text-xs text-muted">Issued by {a.issuing_office}</p>
    </article>
  );
}
