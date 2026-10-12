import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useQuery } from '../../lib/useQuery';
import { check, errMsg, isEmail, unwrap } from '../../lib/util';
import type { AdminUser, DirectoryEntry } from '../../lib/types';
import { ConfirmDialog, EmptyState, ErrorNotice, Loading, PageHeader, StatusBadge, type Pending } from '../../components/ui';

interface Form { id?: string; full_name: string; job_title: string; department: string; public_email: string; is_public: boolean; display_order: string; profile_id: string }
const EMPTY: Form = { full_name: '', job_title: '', department: '', public_email: '', is_public: true, display_order: '0', profile_id: '' };

export default function AdminDirectory() {
  const q = useQuery(async () => {
    const entries = unwrap<DirectoryEntry[]>(await supabase.from('faculty_directory').select('*').order('display_order').order('full_name'));
    const users = unwrap<AdminUser[]>(await supabase.rpc('admin_list_users')).filter((u) => u.role === 'faculty' && u.status === 'approved');
    return { entries, users };
  }, []);
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((p) => (p ? { ...p, [k]: e.target.value } : p));

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.full_name.trim()) { setError('Enter a name.'); return; }
    if (form.public_email.trim() && !isEmail(form.public_email.trim())) { setError('Enter a valid public email address, or leave it blank.'); return; }
    setBusy(true); setError(null);
    const payload = {
      full_name: form.full_name.trim(), job_title: form.job_title.trim() || null, department: form.department.trim() || null,
      public_email: form.public_email.trim() || null, is_public: form.is_public, display_order: parseInt(form.display_order, 10) || 0, profile_id: form.profile_id || null,
    };
    try {
      check(form.id ? await supabase.from('faculty_directory').update(payload).eq('id', form.id) : await supabase.from('faculty_directory').insert(payload));
      setForm(null);
      q.reload();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  }

  function remove(d: DirectoryEntry) {
    setPending({
      title: `Delete ${d.full_name}?`,
      message: 'This removes the directory record. It cannot be undone.',
      confirmLabel: 'Delete', danger: true,
      run: async () => check(await supabase.from('faculty_directory').delete().eq('id', d.id)),
    });
  }

  return (
    <>
      <PageHeader
        title="Faculty and staff directory"
        intro="Only add details that are verified and approved for public display. Do not publish private contact information."
        actions={!form && <button type="button" className="btn btn-primary" onClick={() => { setForm(EMPTY); setError(null); }}>Add person</button>}
      />
      {form && (
        <form onSubmit={save} noValidate className="card mb-6 space-y-4">
          <h2 className="text-lg font-bold">{form.id ? 'Edit record' : 'New record'}</h2>
          {error && <div role="alert" className="alert alert-error">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="d-name">Full name</label><input id="d-name" className="input" maxLength={120} value={form.full_name} onChange={set('full_name')} /></div>
            <div><label className="label" htmlFor="d-title">Position (verified)</label><input id="d-title" className="input" maxLength={120} value={form.job_title} onChange={set('job_title')} /></div>
            <div><label className="label" htmlFor="d-dept">Department (verified)</label><input id="d-dept" className="input" maxLength={120} value={form.department} onChange={set('department')} /></div>
            <div>
              <label className="label" htmlFor="d-mail">Public email (optional)</label>
              <input id="d-mail" type="email" className="input" value={form.public_email} onChange={set('public_email')} />
              <p className="hint">Shown publicly. Leave blank unless this person approved it.</p>
            </div>
            <div><label className="label" htmlFor="d-order">Display order</label><input id="d-order" type="number" className="input" value={form.display_order} onChange={set('display_order')} /></div>
            <div>
              <label className="label" htmlFor="d-user">Linked account (optional)</label>
              <select id="d-user" className="input" value={form.profile_id} onChange={set('profile_id')}>
                <option value="">Not linked</option>
                {q.data?.users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_public} onChange={(e) => setForm((p) => (p ? { ...p, is_public: e.target.checked } : p))} /> Show on the public directory</label>
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save record'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}
      {q.loading && <Loading />}
      {q.error && <ErrorNotice message={q.error} onRetry={q.reload} />}
      {q.data && q.data.entries.length === 0 && <EmptyState title="No directory records yet">Add the first person using the button above.</EmptyState>}
      {q.data && q.data.entries.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="tbl">
            <caption className="sr-only">Directory records</caption>
            <thead><tr><th scope="col">Name</th><th scope="col">Position</th><th scope="col">Department</th><th scope="col">Visibility</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {q.data.entries.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.full_name}</td>
                  <td>{d.job_title || '—'}</td>
                  <td>{d.department || '—'}</td>
                  <td><StatusBadge label={d.is_public ? 'Public' : 'Hidden'} tone={d.is_public ? 'success' : 'neutral'} /></td>
                  <td>
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setError(null); setForm({ id: d.id, full_name: d.full_name, job_title: d.job_title ?? '', department: d.department ?? '', public_email: d.public_email ?? '', is_public: d.is_public, display_order: String(d.display_order), profile_id: d.profile_id ?? '' }); }}>Edit</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => remove(d)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog pending={pending} onClose={() => setPending(null)} onDone={q.reload} />
    </>
  );
}
