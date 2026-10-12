import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useQuery } from '../../lib/useQuery';
import { accountStatusInfo, check, formatDateTime, unwrap } from '../../lib/util';
import type { AccountStatus, AdminUser } from '../../lib/types';
import { ConfirmDialog, EmptyState, ErrorNotice, Loading, PageHeader, StatusBadge, type Pending } from '../../components/ui';

interface Act { label: string; status: Exclude<AccountStatus, 'pending_approval'>; danger?: boolean; reason?: boolean }

function actionsFor(u: AdminUser): Act[] {
  if (u.role === 'admin') return [];
  switch (u.status) {
    case 'pending_approval': return [{ label: 'Approve', status: 'approved' }, { label: 'Reject', status: 'rejected', danger: true, reason: true }];
    case 'approved': return [{ label: 'Suspend', status: 'suspended', danger: true, reason: true }, { label: 'Deactivate', status: 'deactivated', danger: true }];
    case 'suspended': return [{ label: 'Reactivate', status: 'approved' }, { label: 'Deactivate', status: 'deactivated', danger: true }];
    case 'deactivated': return [{ label: 'Reactivate', status: 'approved' }];
    case 'rejected': return [{ label: 'Approve instead', status: 'approved' }];
  }
}

export default function AdminUsers({ mode }: { mode: 'pending' | 'all' }) {
  const q = useQuery(async () => unwrap<AdminUser[]>(await supabase.rpc('admin_list_users')), []);
  const [pending, setPending] = useState<Pending | null>(null);
  const rows = (q.data ?? []).filter((u) => (mode === 'pending' ? u.status === 'pending_approval' : true));

  function ask(u: AdminUser, a: Act) {
    setPending({
      title: `${a.label} ${u.full_name || u.email}?`,
      message: a.status === 'approved' ? 'This person will be able to sign in and submit announcements for review.' : 'The person will lose access to the Faculty/Staff dashboard.',
      confirmLabel: a.label,
      danger: a.danger,
      requireReason: a.reason,
      reasonLabel: 'Reason (shown to the user)',
      run: async (reason) => check(await supabase.rpc('set_account_status', { p_user_id: u.id, p_status: a.status, p_reason: reason || null })),
    });
  }

  return (
    <>
      <PageHeader
        title={mode === 'pending' ? 'Registration approvals' : 'User management'}
        intro={mode === 'pending' ? 'Only email-verified registrations can be approved. Approved users can submit announcements, never publish them.' : 'All accounts. Administrator accounts are managed in the database only.'}
      />
      {q.loading && <Loading />}
      {q.error && <ErrorNotice message={q.error} onRetry={q.reload} />}
      {q.data && rows.length === 0 && <EmptyState title={mode === 'pending' ? 'No registrations are waiting' : 'No users found'} />}
      {rows.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="tbl">
            <caption className="sr-only">{mode === 'pending' ? 'Pending registrations' : 'All users'}</caption>
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Department</th><th scope="col">Registered</th><th scope="col">Email</th><th scope="col">Status</th><th scope="col">Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const s = accountStatusInfo(u.status);
                const verified = Boolean(u.email_confirmed_at);
                return (
                  <tr key={u.id}>
                    <td><p className="font-medium">{u.full_name || '(no name)'}</p><p className="text-xs text-muted">{u.email}{u.role === 'admin' ? ' · Administrator' : ''}</p></td>
                    <td>{u.department || '—'}</td>
                    <td>{formatDateTime(u.created_at)}</td>
                    <td><StatusBadge label={verified ? 'Verified' : 'Not verified'} tone={verified ? 'success' : 'warning'} /></td>
                    <td><StatusBadge {...s} />{u.status_reason && <p className="mt-1 max-w-[14rem] text-xs text-muted">{u.status_reason}</p>}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {actionsFor(u).map((a) => (
                          <button
                            key={a.label}
                            type="button"
                            className={`btn btn-sm ${a.danger ? 'btn-outline' : 'btn-primary'}`}
                            disabled={a.status === 'approved' && !verified}
                            title={a.status === 'approved' && !verified ? 'The user must verify their email first' : undefined}
                            onClick={() => ask(u, a)}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog pending={pending} onClose={() => setPending(null)} onDone={q.reload} />
    </>
  );
}
