import React from 'react';
import { z } from 'zod';
import { siteSchema, type Site } from '../../schemas/site.ts';

export interface AdminEditorProps {
  site: Site;
  onUpdateSite: (updater: (prev: Site) => Site) => void;
  jsonDirty: boolean;
  onJsonDirty: (dirty: boolean) => void;
  children: React.ReactNode;
}

// Contact details, then the site-specific sections, then raw JSON for everything else. Same layout as the other demo admins.
export const AdminEditor: React.FC<AdminEditorProps> = ({ site, onUpdateSite, jsonDirty, onJsonDirty, children }) => {
  const [jsonText, setJsonText] = React.useState('');
  const [jsonStatus, setJsonStatus] = React.useState<{ text: string; isError: boolean } | null>(null);
  const setBusiness = (patch: Partial<Site['business']>) => onUpdateSite(prev => ({ ...prev, business: { ...prev.business, ...patch } }));

  const syncJsonFromState = () => {
    setJsonText(JSON.stringify(site, null, 2));
    setJsonStatus(null);
    onJsonDirty(false);
  };

  const applyJson = () => {
    try {
      const validated = siteSchema.parse(JSON.parse(jsonText));
      onUpdateSite(() => validated);
      onJsonDirty(false);
      setJsonStatus({ text: 'Applied. Save changes to publish.', isError: false });
    } catch (err) {
      setJsonStatus({ text: err instanceof z.ZodError ? z.prettifyError(err) : err instanceof Error ? err.message : 'Invalid JSON.', isError: true });
    }
  };

  return (
    <>
      <section className="admin-card">
        <h2>Contact details</h2>
        <div className="admin-grid">
          <label className="admin-field">Phone as shown
            <input value={site.business.phoneDisplay} onChange={e => setBusiness({ phoneDisplay: e.target.value })} required />
          </label>
          <label className="admin-field">Phone for call links (+1 and 10 digits)
            <input type="tel" value={site.business.phone} pattern="\+1[0-9]{10}" onChange={e => setBusiness({ phone: e.target.value })} required />
          </label>
          <label className="admin-field">Email address
            <input type="email" value={site.business.email} onChange={e => setBusiness({ email: e.target.value })} required />
          </label>
        </div>
      </section>
      {children}
      <details className="admin-card admin-json" onToggle={e => { if ((e.target as HTMLDetailsElement).open && !jsonDirty) syncJsonFromState(); }}>
        <summary>Edit all site content (JSON)</summary>
        <div className="admin-stack">
          <p className="admin-note">Covers page text, FAQs and reviews. Apply your edits, then save changes.</p>
          <textarea rows={16} value={jsonText} spellCheck={false} aria-label="Site content JSON" onChange={e => { setJsonText(e.target.value); onJsonDirty(true); }} />
          <div className="admin-row">
            <button type="button" onClick={applyJson} className="admin-button">Apply JSON</button>
            <button type="button" onClick={syncJsonFromState} className="admin-button">Reset to form values</button>
            <p role="status" className="admin-status" data-tone={jsonStatus && (jsonStatus.isError ? 'error' : 'success')}>{jsonStatus?.text}</p>
          </div>
        </div>
      </details>
    </>
  );
};
