import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useQuery } from '../../lib/useQuery';
import { unwrap } from '../../lib/util';
import { ErrorNotice, Loading, PageHeader } from '../../components/ui';

interface Counts { pending_registrations: number; pending_announcements: number; unread_messages: number }

export default function AdminHome() {
  const q = useQuery(async () => unwrap<Counts>(await supabase.rpc('admin_overview_counts')), []);
  const items = q.data
    ? [
        { label: 'Registrations awaiting approval', n: q.data.pending_registrations, to: '/admin/registrations', cta: 'Review registrations' },
        { label: 'Announcements awaiting review', n: q.data.pending_announcements, to: '/admin/review', cta: 'Open review queue' },
        { label: 'Unread contact messages', n: q.data.unread_messages, to: '/admin/messages', cta: 'Read messages' },
      ]
    : [];
  return (
    <>
      <PageHeader title="Administrator overview" intro="Pending tasks come first. Every approval and publishing action is recorded in the activity log." />
      {q.loading && <Loading />}
      {q.error && <ErrorNotice message={q.error} onRetry={q.reload} />}
      <ul className="grid gap-4 md:grid-cols-3">
        {items.map((i) => (
          <li key={i.to} className="card">
            <p className="text-3xl font-bold text-maroon-strong">{i.n}</p>
            <p className="text-sm">{i.label}</p>
            <p className="mt-3"><Link to={i.to} className={i.n > 0 ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}>{i.cta}</Link></p>
          </li>
        ))}
      </ul>
      <section className="mt-8">
        <h2 className="mb-2 text-xl font-bold">Other tasks</h2>
        <ul className="flex flex-wrap gap-4 text-sm">
          <li><Link to="/admin/announcements">Manage published announcements</Link></li>
          <li><Link to="/admin/directory">Faculty directory</Link></li>
          <li><Link to="/admin/content">Campus content</Link></li>
          <li><Link to="/admin/logs">Activity logs</Link></li>
        </ul>
      </section>
    </>
  );
}
