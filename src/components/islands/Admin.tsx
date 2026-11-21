import React from 'react';
import { z } from 'zod';
import { siteSchema, type Site } from '../../schemas/site.ts';
import { asset } from '../../lib/paths.ts';
import { AdminEditor } from './AdminEditor.tsx';
import { AdminPackages } from './AdminPackages.tsx';

const adminResponseSchema = z.object({ site: siteSchema, version: z.string().min(1) });
const errorResponseSchema = z.object({ error: z.string() });
// Stable ref callback: focuses the editor heading once, when sign-in replaces the form.
const focusOnMount = (element: HTMLElement | null) => element?.focus();

export interface AdminProps { initialSite: Site; }

export const Admin: React.FC<AdminProps> = ({ initialSite }) => {
  const [password, setPassword] = React.useState('');
  const [authenticated, setAuthenticated] = React.useState(false);
  const [site, setSite] = React.useState<Site>(initialSite);
  const [version, setVersion] = React.useState('');
  const [status, setStatus] = React.useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [jsonDirty, setJsonDirty] = React.useState(false);

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
      if (authenticated) setStatus({ text: 'Latest saved content loaded.', isError: false });
      setAuthenticated(true);
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : 'Error logging in.', isError: true });
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (jsonDirty) return setStatus({ text: 'Apply or reset your JSON edits before saving.', isError: true });
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
      setStatus({ text: 'Saved. The live site updates after it rebuilds.', isError: false });
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : 'Save error.', isError: true });
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    setPassword('');
    setAuthenticated(false);
    setVersion('');
    setStatus(null);
    setJsonDirty(false);
  };

  const statusLine = <p role="status" className="admin-status" data-tone={status && (status.isError ? 'error' : 'success')}>{status?.text}</p>;

  if (!authenticated) {
    return (
      <form className="admin-card admin-login" onSubmit={e => { e.preventDefault(); void authenticateAndLoad(password); }}>
        <h1>Sign in</h1>
        <p className="admin-note">The password stays in this tab's memory and is never stored in the browser.</p>
        <label className="admin-field">Admin password
          <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <div className="admin-row">
          <button type="submit" disabled={loading} className="admin-button admin-button-primary">{loading ? 'Signing in…' : 'Sign in'}</button>
          {statusLine}
        </div>
      </form>
    );
  }

  return (
    <form className="admin-editor" onSubmit={e => { e.preventDefault(); void handleSave(); }}>
      <div className="admin-head">
        <h1 tabIndex={-1} ref={focusOnMount}>Site settings</h1>
        <p className="admin-note">Edit the details below, then save. The live site updates after it rebuilds.</p>
      </div>
      <fieldset disabled={loading} className="admin-sections">
        <AdminEditor site={site} onUpdateSite={setSite} jsonDirty={jsonDirty} onJsonDirty={setJsonDirty}>
          <AdminPackages site={site} onUpdateSite={setSite} />
        </AdminEditor>
      </fieldset>
      <div className="admin-actions">
        {statusLine}
        <button type="button" onClick={() => void authenticateAndLoad(password)} disabled={loading} className="admin-button">Reload</button>
        <button type="button" onClick={handleLogout} disabled={loading} className="admin-button">Sign out</button>
        <button type="submit" disabled={loading} className="admin-button admin-button-primary">{loading ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>
  );
};
export default Admin;
