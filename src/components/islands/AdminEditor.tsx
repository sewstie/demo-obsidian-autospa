import React from 'react';
import { siteSchema, type Site } from '../../schemas/site.ts';

export interface AdminEditorProps {
  site: Site;
  version: string;
  isSaving: boolean;
  onUpdateSite: (updater: (prev: Site) => Site) => void;
  onSave: () => void;
  onReload: () => void;
  onLogout: () => void;
}

export const AdminEditor: React.FC<AdminEditorProps> = ({
  site, version, isSaving, onUpdateSite, onSave, onReload, onLogout,
}) => {
  const [jsonText, setJsonText] = React.useState('');
  const [jsonError, setJsonError] = React.useState('');

  const syncJsonFromState = () => {
    setJsonText(JSON.stringify(site, null, 2));
    setJsonError('');
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const validated = siteSchema.parse(parsed);
      onUpdateSite(() => validated);
      setJsonError('');
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid site JSON.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold">Studio Settings</h2>
          <p className="text-xs text-muted">Version token: {version || 'local'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onReload} disabled={isSaving} className="button button-secondary text-xs min-h-[44px]">Reload</button>
          <button type="button" onClick={onLogout} disabled={isSaving} className="button button-secondary text-xs min-h-[44px]">Log out</button>
          <button type="button" onClick={onSave} disabled={isSaving} className="button button-primary text-xs min-h-[44px]">
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
      <fieldset disabled={isSaving} className="space-y-4 border-0 p-0 m-0">
        <h3 className="text-lg font-semibold text-accent">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-xs">
            <span className="text-muted block mb-1">Phone display</span>
            <input type="text" value={site.business.phoneDisplay} onChange={e => onUpdateSite(prev => ({
              ...prev, business: { ...prev.business, phoneDisplay: e.target.value },
            }))} className="w-full min-h-[44px] bg-secondary border border-border p-2 rounded text-sm text-foreground" />
          </label>
          <label className="block text-xs">
            <span className="text-muted block mb-1">E.164 Phone</span>
            <input type="text" value={site.business.phone} onChange={e => onUpdateSite(prev => ({
              ...prev, business: { ...prev.business, phone: e.target.value },
            }))} className="w-full min-h-[44px] bg-secondary border border-border p-2 rounded text-sm text-foreground" />
          </label>
          <label className="block text-xs md:col-span-2">
            <span className="text-muted block mb-1">Email address</span>
            <input type="email" value={site.business.email} onChange={e => onUpdateSite(prev => ({
              ...prev, business: { ...prev.business, email: e.target.value },
            }))} className="w-full min-h-[44px] bg-secondary border border-border p-2 rounded text-sm text-foreground" />
          </label>
        </div>
      </fieldset>
      <details className="border border-border rounded p-4 bg-secondary" onToggle={e => {
        if ((e.target as HTMLDetailsElement).open && !jsonText) syncJsonFromState();
      }}>
        <summary className="cursor-pointer text-sm font-semibold text-accent min-h-[44px] flex items-center">Advanced: Full Site JSON</summary>
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <button type="button" onClick={syncJsonFromState} disabled={isSaving} className="button button-secondary text-xs min-h-[44px]">Load form into JSON</button>
            <button type="button" onClick={applyJson} disabled={isSaving} className="button button-secondary text-xs min-h-[44px]">Apply JSON to form</button>
          </div>
          <label className="block text-xs">
            <span className="text-muted block mb-1">Site JSON configuration</span>
            <textarea rows={8} value={jsonText} onChange={e => setJsonText(e.target.value)} disabled={isSaving} aria-label="Site JSON configuration" className="w-full font-mono text-xs bg-background border border-border p-3 rounded text-foreground" />
          </label>
          {jsonError && <p className="text-xs text-error">{jsonError}</p>}
        </div>
      </details>
    </div>
  );
};
