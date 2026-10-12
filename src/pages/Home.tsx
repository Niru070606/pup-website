import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useQuery } from '../lib/useQuery';
import { isHttpsUrl, unwrap } from '../lib/util';
import { useContent } from '../context/ContentContext';
import { SITE } from '../config/site';
import type { AcademicProgram, PublicAnnouncement } from '../lib/types';
import AnnouncementCard from '../components/AnnouncementCard';
import { ContentBlock, EmptyState, ErrorNotice, Loading, Placeholder } from '../components/ui';

export default function Home() {
  const { content } = useContent();
  const ann = useQuery(
    async () => unwrap<PublicAnnouncement[]>(await supabase.from('public_announcements').select('*').order('published_at', { ascending: false }).limit(5)),
    [],
  );
  const progs = useQuery(
    async () => unwrap<AcademicProgram[]>(await supabase.from('academic_programs').select('*').eq('is_published', true).order('display_order').order('name').limit(6)),
    [],
  );

  const admissions = isHttpsUrl(content.admissions_url ?? '') ? content.admissions_url : null;
  const calendar = isHttpsUrl(content.academic_calendar_url ?? '') ? content.academic_calendar_url : null;

  return (
    <>
      <section className="on-dark bg-maroon text-white">
        <div className="page py-14 sm:py-20">
          <h1 className="max-w-3xl text-3xl font-bold text-white sm:text-5xl">{SITE.campusName}</h1>
          <div className="mt-4 max-w-2xl text-lg text-white/90">
            {content.welcome_message ? <p className="prose-plain">{content.welcome_message}</p> : <p>Welcome to the campus information website.</p>}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/announcements" className="btn btn-gold">Read announcements</Link>
            <Link to="/academics" className="btn btn-light">Academic programs</Link>
          </div>
        </div>
      </section>

      <section className="page mt-12" aria-labelledby="latest-h">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 id="latest-h" className="text-2xl font-bold">Latest announcements</h2>
          <Link to="/announcements">View all announcements</Link>
        </div>
        {ann.loading && <Loading />}
        {ann.error && <ErrorNotice message="Announcements could not be loaded." onRetry={ann.reload} />}
        {ann.data && ann.data.length === 0 && <EmptyState title="No announcements yet">Published announcements will appear here.</EmptyState>}
        {ann.data && ann.data.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {ann.data.map((a) => <AnnouncementCard key={a.id} a={a} />)}
          </div>
        )}
      </section>

      <section className="page mt-14" aria-labelledby="intro-h">
        <h2 id="intro-h" className="mb-4 text-2xl font-bold">About the campus</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card"><h3 className="mb-2 text-lg font-bold">History</h3><ContentBlock value={content.history} /></div>
          <div className="card"><h3 className="mb-2 text-lg font-bold">Vision</h3><ContentBlock value={content.vision} /></div>
          <div className="card"><h3 className="mb-2 text-lg font-bold">Mission</h3><ContentBlock value={content.mission} /></div>
        </div>
        <p className="mt-3"><Link to="/about">More about the campus</Link></p>
      </section>

      <section className="page mt-14" aria-labelledby="acad-h">
        <h2 id="acad-h" className="mb-4 text-2xl font-bold">Academic information</h2>
        {progs.loading && <Loading />}
        {progs.data && progs.data.length === 0 && <Placeholder what="Academic programs" />}
        {progs.data && progs.data.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {progs.data.map((p) => <li key={p.id} className="card py-3 font-medium">{p.name}</li>)}
          </ul>
        )}
        <p className="mt-3 flex flex-wrap gap-4">
          <Link to="/academics">All academic programs</Link>
          <Link to="/faculty">Faculty and staff directory</Link>
        </p>
      </section>

      <section className="page mt-14" aria-labelledby="links-h">
        <h2 id="links-h" className="mb-4 text-2xl font-bold">Quick links</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <li className="card py-3">{admissions ? <a href={admissions} target="_blank" rel="noopener noreferrer">Admissions information</a> : <Link to="/contact">Admissions inquiries</Link>}</li>
          {calendar && <li className="card py-3"><a href={calendar} target="_blank" rel="noopener noreferrer">Academic calendar</a></li>}
          <li className="card py-3"><Link to="/announcements">Announcements</Link></li>
          <li className="card py-3"><Link to="/faculty">Faculty and staff directory</Link></li>
          <li className="card py-3"><Link to="/contact">Contact information</Link></li>
        </ul>
      </section>
    </>
  );
}
