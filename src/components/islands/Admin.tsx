import React from 'react';
import { z } from 'zod';
import { siteSchema, type Site } from '../../schemas/site.ts';
import { asset } from '../../lib/paths.ts';
import { AdminEditor } from './AdminEditor.tsx';
import { AdminPackages } from './AdminPackages.tsx';

const adminResponseSchema = z.object({ site: siteSchema, version: z.string().min(1) });
const errorResponseSchema = z.object({ error: z.string() });

export interface AdminProps { initialSite: Site; }

export const Admin: React.FC<AdminProps> = ({ initialSite }) => {
  const [password, setPassword] = React.useState('');
  const [authenticated, setAuthenticated] = React.useState(false);
  const [site, setSite] = React.useState<Site>(initialSite);
  const [version, setVersion] = React.useState('');
  const [status, setStatus] = React.useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const authenticateAndLoad = async (pw: string) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(asset('/api/site'), { headers: { Authorization: `Bearer ${pw}` }, signal: AbortSignal.timeout(25000) });
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        const err = errorResponseSchema.safeParse(raw);
        throw new Error(err.success ? err.data.error : 'Authentication failed.');
      }
      const data = adminResponseSchema.parse(raw);
      setSite(data.site);
      setVersion(data.version);
      setAuthenticated(true);
      setStatus({ text: 'Authenticated successfully.', isError: false });
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : 'Error logging in.', isError: true });
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(asset('/api/site'), {
        method: 'PUT', signal: AbortSignal.timeout(25000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ site, version }),
      });
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        const err = errorResponseSchema.safeParse(raw);
        throw new Error(err.success ? err.data.error : 'Failed to save configuration.');
      }
      const data = adminResponseSchema.parse(raw);
      setSite(data.site);
      setVersion(data.version);
      setStatus({ text: 'Site changes persisted successfully.', isError: false });
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : 'Save error.', isError: true });
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    setPassword('');
    setAuthenticated(false);
    setVersion('');
    setStatus(null);
  };

  if (!authenticated) {
    return (
      <div className="section-shell section-space max-w-md mx-auto">
        <form onSubmit={e => { e.preventDefault(); void authenticateAndLoad(password); }} className="space-y-4 p-6 border border-border bg-secondary rounded">
          <h1 className="text-2xl font-bold">Studio Admin Login</h1>
          <p className="text-xs text-muted">Password is kept in React memory only and never stored in the browser.</p>
          <label className="block text-xs">
            <span className="text-muted block mb-1">Admin password</span>
            <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} aria-label="Admin password" required className="w-full min-h-[44px] bg-background border border-border p-2 rounded text-sm text-foreground" />
          </label>
          <button type="submit" disabled={loading || !password} className="button button-primary w-full text-xs min-h-[44px]">
            {loading ? 'Authenticating...' : 'Sign in to edit'}
          </button>
          {status && <p role="status" className={`text-xs ${status.isError ? 'text-error' : 'text-success'}`}>{status.text}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="section-shell section-space space-y-6">
      {status && (
        <div role="status" className={`p-3 rounded text-xs ${status.isError ? 'bg-secondary text-error border border-error' : 'bg-secondary text-success border border-success'}`}>
          {status.text}
        </div>
      )}
      <AdminEditor site={site} version={version} isSaving={loading} onUpdateSite={setSite} onSave={handleSave} onReload={() => void authenticateAndLoad(password)} onLogout={handleLogout} />
      <AdminPackages site={site} disabled={loading} onUpdateSite={setSite} />
    </div>
  );
};
export default Admin;
