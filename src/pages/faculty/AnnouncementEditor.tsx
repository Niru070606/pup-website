import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useQuery } from '../../lib/useQuery';
import { announcementStatusInfo, errMsg, isEditable, isUuid, unwrap } from '../../lib/util';
import { CATEGORIES } from '../../config/site';
import type { AnnouncementOverview, Review } from '../../lib/types';
import { ConfirmDialog, ErrorNotice, Loading, PageHeader, StatusBadge, type Pending } from '../../components/ui';

/** Shared by the Faculty/Staff dashboard and the Admin dashboard. Saving never publishes: that needs admin approval. */
export default function AnnouncementEditor({ base }: { base: '/dashboard' | '/admin' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', category: '', office: '', body: '' });
  const [loaded, setLoaded] = useState(!id);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);

  const existing = useQuery(async () => {
    if (!id || !isUuid(id)) return null;
    const row = unwrap<AnnouncementOverview | null>(await supabase.from('announcement_overview').select('*').eq('id', id).maybeSingle());
    let review: Review | null = null;
    if (row && (row.latest_status === 'rejected' || row.latest_status === 'revision_required')) {
      const r = unwrap<Review[]>(await supabase.from('announcement_reviews').select('revision_id,decision,reason,created_at').eq('revision_id', row.latest_revision_id).order('created_at', { ascending: false }).limit(1));
      review = r[0] ?? null;
    }
    return { row, review };
  }, [id]);

  const row = existing.data?.row ?? null;
  useEffect(() => {
    if (row && !loaded) {
      setForm({ title: row.title, category: row.category ?? '', office: row.issuing_office, body: row.body });
      setLoaded(true);
    }
  }, [row, loaded]);

  const afterSubmit = base === '/admin' ? '/admin/review' : '/dashboard/announcements';
  const locked = !!row && !isEditable(row);
  const isRevisionOfPublished = !!row && row.status === 'published';
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((p) => ({ ...p, [k]: e.target.value }));

  function validate(submit: boolean): string | null {
    if (form.title.trim().length < 3) return 'Enter a title of at least 3 characters.';
    if (submit && form.body.trim().length < 10) return 'Write the announcement content before submitting.';
    if (submit && !form.office.trim()) return 'Enter the issuing office or approved author name.';
    return null;
  }

  async function persist(submit: boolean): Promise<string> {
    return unwrap<string>(
      await supabase.rpc('save_announcement', {
        p_id: id ?? null, p_title: form.title, p_body: form.body, p_category: form.category || null, p_office: form.office, p_submit: submit,
      }),
    );
  }

  async function saveDraft() {
    const v = validate(false);
    if (v) { setError(v); return; }
    setBusy(true); setError(null); setNotice(null);
    try {
      const newId = await persist(false);
      setNotice('Draft saved.');
      if (!id) navigate(`${base}/announcements/${newId}/edit`, { replace: true });
      else existing.reload();
    } catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  }

  function askSubmit() {
    const v = validate(true);
    if (v) { setError(v); return; }
    setError(null);
    setPending({
      title: isRevisionOfPublished ? 'Submit revision for approval?' : 'Submit for administrator review?',
      message: isRevisionOfPublished
        ? 'The currently published version stays public until an administrator approves your changes.'
        : 'You will not be able to edit it while it is under review. It is not public until approved.',
      confirmLabel: 'Submit for review',
      run: async () => {
        await persist(true);
        navigate(afterSubmit, { state: { notice: 'Submitted for administrator review.' } });
      },
    });
  }

  if (id && !isUuid(id)) return <ErrorNotice message="This announcement does not exist." />;
  if (id && existing.loading) return <Loading />;
  if (existing.error) return <ErrorNotice message={existing.error} onRetry={existing.reload} />;
  if (id && !row) return <ErrorNotice message="Announcement not found, or you do not have access to it." />;

  const status = row ? announcementStatusInfo(row) : null;

  return (
    <>
      <PageHeader
        title={id ? 'Edit announcement' : 'Create announcement'}
        intro="Plain text only. Line breaks are kept. An administrator must approve it before it appears publicly."
        actions={status && <StatusBadge {...status} />}
      />
      {existing.data?.review && (
        <div className="alert alert-warning mb-4">
          <p className="font-semibold">{existing.data.review.decision === 'rejected' ? 'Rejected' : 'Revision requested'} by an administrator</p>
          <p className="prose-plain mt-1">{existing.data.review.reason}</p>
        </div>
      )}
      {isRevisionOfPublished && <div className="alert alert-info mb-4">This announcement is live. Your edits become a new revision; the public keeps seeing the approved version until an administrator approves the change.</div>}
      {locked && <div className="alert alert-warning mb-4">This announcement can not be edited right now ({row!.latest_status === 'pending' ? 'it is awaiting review' : 'it is unpublished or archived'}).</div>}
      {error && <div role="alert" className="alert alert-error mb-4">{error}</div>}
      {notice && <div role="status" className="alert alert-success mb-4">{notice}</div>}

      <form className="card space-y-4" onSubmit={(e) => e.preventDefault()} noValidate>
        <div>
          <label className="label" htmlFor="a-title">Title</label>
          <input id="a-title" className="input" maxLength={200} value={form.title} onChange={set('title')} disabled={locked} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="a-cat">Category (optional)</label>
            <select id="a-cat" className="input" value={form.category} onChange={set('category')} disabled={locked}>
              <option value="">No category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="a-office">Issuing office or author</label>
            <input id="a-office" className="input" maxLength={150} value={form.office} onChange={set('office')} disabled={locked} />
            <p className="hint">Shown publicly as the source of this announcement.</p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="a-body">Content</label>
          <textarea id="a-body" rows={12} className="input" maxLength={10000} value={form.body} onChange={set('body')} disabled={locked} />
          <p className="hint">{form.body.length} / 10,000 characters</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-outline" onClick={saveDraft} disabled={busy || locked}>Save draft</button>
          <button type="button" className="btn btn-primary" onClick={askSubmit} disabled={busy || locked}>
            {isRevisionOfPublished ? 'Submit revision for approval' : 'Submit for review'}
          </button>
          <Link to={base === '/admin' ? '/admin/announcements' : '/dashboard/announcements'} className="btn btn-outline">Back to list</Link>
        </div>
      </form>
      <ConfirmDialog pending={pending} onClose={() => setPending(null)} onDone={() => {}} />
    </>
  );
}
