export type Role = 'faculty' | 'admin';
export type AccountStatus = 'pending_approval' | 'approved' | 'rejected' | 'suspended' | 'deactivated';
export type AnnouncementStatus = 'draft' | 'pending' | 'published' | 'rejected' | 'revision_required' | 'unpublished' | 'archived';
export type RevisionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'revision_required';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  department: string;
  role: Role;
  status: AccountStatus;
  status_reason: string | null;
  created_at: string;
}
export interface AdminUser extends Profile {
  email_confirmed_at: string | null;
}
export interface CampusContentRow {
  key: string;
  grp: string;
  label: string;
  kind: 'text' | 'longtext' | 'url' | 'toggle';
  value: string;
}
export interface DirectoryEntry {
  id: string;
  profile_id: string | null;
  full_name: string;
  job_title: string | null;
  department: string | null;
  public_email: string | null;
  is_public: boolean;
  display_order: number;
}
export interface AcademicProgram {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_published: boolean;
}
export interface PublicAnnouncement {
  id: string;
  title: string;
  body: string;
  category: string | null;
  issuing_office: string;
  published_at: string;
}
export interface AnnouncementOverview {
  id: string;
  status: AnnouncementStatus;
  author_id: string;
  author_name: string | null;
  author_department: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  latest_revision_id: string;
  latest_version: number;
  latest_status: RevisionStatus;
  title: string;
  body: string;
  category: string | null;
  issuing_office: string;
  submitted_at: string | null;
  live_title: string | null;
}
export interface Review {
  revision_id: string;
  decision: 'approved' | 'rejected' | 'revision_required';
  reason: string | null;
  created_at: string;
}
export interface AuditLog {
  id: number;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  actor: { full_name: string; email: string } | null;
}
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}
export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';
