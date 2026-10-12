import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useQuery } from '../lib/useQuery';
import { formatDateTime, isUuid, unwrap } from '../lib/util';
import type { PublicAnnouncement } from '../lib/types';
import { EmptyState, ErrorNotice, Loading, StatusBadge } from '../components/ui';

export default function AnnouncementDetail() {
  const { id = '' } = useParams();
  const q = useQuery(async () => {
    if (!isUuid(id)) return null;
    return unwrap<PublicAnnouncement | null>(await supabase.from('public_announcements').select('*').eq('id', id).maybeSingle());
  }, [id]);

  return (
    <div className="page mt-10 max-w-3xl">
      <p className="mb-4 text-sm"><Link to="/announcements">← Back to announcements</Link></p>
      {q.loading && <Loading />}
      {q.error && <ErrorNotice message="This announcement could not be loaded." onRetry={q.reload} />}
      {!q.loading && !q.error && !q.data && <EmptyState title="Announcement not found">It may have been removed or is not publicly available.</EmptyState>}
      {q.data && (
        <article>
          <h1 className="text-3xl font-bold">{q.data.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <time dateTime={q.data.published_at}>Published {formatDateTime(q.data.published_at)}</time>
            {q.data.category && <StatusBadge label={q.data.category} tone="neutral" />}
          </div>
          <p className="mt-1 text-sm text-muted">Issued by {q.data.issuing_office}</p>
          <div className="prose-plain mt-6 text-base">{q.data.body}</div>
        </article>
      )}
    </div>
  );
}
