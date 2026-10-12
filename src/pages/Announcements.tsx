import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useQuery } from '../lib/useQuery';
import type { PublicAnnouncement } from '../lib/types';
import AnnouncementCard from '../components/AnnouncementCard';
import { EmptyState, ErrorNotice, Loading } from '../components/ui';

const PAGE_SIZE = 10;

export default function Announcements() {
  const [sp, setSp] = useSearchParams();
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);

  const q = useQuery(async () => {
    const from = (page - 1) * PAGE_SIZE;
    const r = await supabase
      .from('public_announcements')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (r.error) throw new Error('Announcements could not be loaded.');
    return { rows: (r.data ?? []) as PublicAnnouncement[], total: r.count ?? 0 };
  }, [page]);

  const pages = Math.max(1, Math.ceil((q.data?.total ?? 0) / PAGE_SIZE));
  const go = (n: number) => { setSp({ page: String(n) }); window.scrollTo({ top: 0 }); };

  return (
    <div className="page mt-10 max-w-3xl">
      <h1 className="text-3xl font-bold">Announcements</h1>
      <p className="mt-2 text-sm text-muted">Newest first. Only approved announcements are published here.</p>
      <div className="mt-6 space-y-4">
        {q.loading && <Loading />}
        {q.error && <ErrorNotice message={q.error} onRetry={q.reload} />}
        {q.data && q.data.rows.length === 0 && <EmptyState title="No announcements to show">Check back later for campus announcements.</EmptyState>}
        {q.data?.rows.map((a) => <AnnouncementCard key={a.id} a={a} />)}
      </div>
      {q.data && q.data.total > PAGE_SIZE && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
          <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => go(page - 1)}>Previous</button>
          <span className="text-sm text-muted">Page {page} of {pages}</span>
          <button type="button" className="btn btn-outline" disabled={page >= pages} onClick={() => go(page + 1)}>Next</button>
        </nav>
      )}
    </div>
  );
}
