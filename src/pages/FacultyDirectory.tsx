import { supabase } from '../lib/supabase';
import { useQuery } from '../lib/useQuery';
import { unwrap } from '../lib/util';
import type { DirectoryEntry } from '../lib/types';
import { EmptyState, ErrorNotice, Loading } from '../components/ui';

export default function FacultyDirectory() {
  const q = useQuery(
    async () => unwrap<DirectoryEntry[]>(await supabase.from('faculty_directory').select('*').eq('is_public', true).order('display_order').order('full_name')),
    [],
  );
  return (
    <div className="page mt-10">
      <h1 className="text-3xl font-bold">Faculty and staff directory</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">Only information approved for public display is shown.</p>
      <div className="mt-6">
        {q.loading && <Loading />}
        {q.error && <ErrorNotice message="The directory could not be loaded." onRetry={q.reload} />}
        {q.data && q.data.length === 0 && <EmptyState title="No directory entries yet">Approved faculty and staff records will appear here.</EmptyState>}
        {q.data && q.data.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {q.data.map((p) => (
              <li key={p.id} className="card">
                <h2 className="text-lg font-bold">{p.full_name}</h2>
                {p.job_title && <p className="text-sm font-medium">{p.job_title}</p>}
                {p.department && <p className="text-sm text-muted">{p.department}</p>}
                {p.public_email && <p className="mt-2 text-sm"><a href={`mailto:${p.public_email}`}>{p.public_email}</a></p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
