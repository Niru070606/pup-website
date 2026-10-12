import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { SITE } from '../config/site';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/academics', label: 'Academics' },
  { to: '/faculty', label: 'Faculty & Staff' },
  { to: '/announcements', label: 'Announcements' },
  { to: '/contact', label: 'Contact' },
];

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3 no-underline">
      {SITE.logoSrc && <img src={SITE.logoSrc} alt="" className="h-12 w-12 object-contain" />}
      <span className="leading-tight">
        <span className={`block text-xs ${dark ? 'text-white/80' : 'text-muted'}`}>{SITE.universityName}</span>
        <span className={`block font-serif text-xl font-bold ${dark ? 'text-white' : 'text-maroon-strong'}`}>Unisan Campus</span>
      </span>
    </Link>
  );
}

export default function PublicLayout() {
  const { session, profile } = useAuth();
  const { content } = useContent();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const year = new Date().getFullYear();

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 text-sm font-medium no-underline ${isActive ? 'bg-maroon text-white' : 'text-maroon-strong hover:bg-surface'}`;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">Skip to main content</a>
      {content.site_notice && (
        <div role="status" className="bg-gold-soft px-4 py-2 text-center text-sm text-maroon-strong">{content.site_notice}</div>
      )}
      <header className="border-b-4 border-gold bg-white">
        <div className="page flex items-center justify-between gap-4 py-3">
          <Brand />
          <button
            type="button"
            className="btn btn-outline md:hidden"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? 'Close menu' : 'Menu'}
          </button>
          <nav id="site-nav" aria-label="Main" className={`${open ? 'block' : 'hidden'} absolute left-0 right-0 top-full z-40 border-b border-line bg-white p-3 md:static md:block md:border-0 md:p-0`}>
            <ul className="flex flex-col gap-1 md:flex-row md:items-center">
              {NAV.map((n) => (
                <li key={n.to}>
                  <NavLink to={n.to} end={n.end} className={linkCls}>{n.label}</NavLink>
                </li>
              ))}
              <li>
                <Link to={session && profile ? '/dashboard' : '/login'} className="btn btn-primary mt-1 md:ml-2 md:mt-0">
                  {session && profile ? 'Dashboard' : 'Faculty/Staff login'}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="on-dark mt-12 bg-maroon-footer text-white">
        <div className="page grid gap-8 py-10 md:grid-cols-3">
          <div>
            <Brand dark />
            <p className="mt-3 text-sm text-white/80">{SITE.attribution}</p>
          </div>
          <div className="text-sm">
            <h2 className="mb-2 font-serif text-base font-bold text-gold">Contact</h2>
            {content.contact_address || content.contact_phone || content.contact_email ? (
              <ul className="space-y-1">
                {content.contact_address && <li>{content.contact_address}</li>}
                {content.contact_phone && <li>{content.contact_phone}</li>}
                {content.contact_email && <li><a className="text-white" href={`mailto:${content.contact_email}`}>{content.contact_email}</a></li>}
              </ul>
            ) : (
              <p className="text-white/80">Contact details have not been added yet.</p>
            )}
          </div>
          <nav aria-label="Footer" className="text-sm">
            <h2 className="mb-2 font-serif text-base font-bold text-gold">Explore</h2>
            <ul className="space-y-1">
              {NAV.slice(1).map((n) => (
                <li key={n.to}><Link className="text-white" to={n.to}>{n.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="border-t border-white/20 py-3 text-center text-xs text-white/70">© {year} {SITE.campusName}</div>
      </footer>
    </div>
  );
}

