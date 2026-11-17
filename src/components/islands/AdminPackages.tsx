import React from 'react';
import type { Site } from '../../schemas/site.ts';

export interface AdminPackagesProps {
  site: Site;
  disabled?: boolean;
  onUpdateSite: (updater: (prev: Site) => Site) => void;
}

export const AdminPackages: React.FC<AdminPackagesProps> = ({ site, disabled = false, onUpdateSite }) => {
  return (
    <fieldset disabled={disabled} className="space-y-6 border-0 p-0 m-0">
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-accent">Package Prices by Vehicle Size</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {site.packages.map((pkg, idx) => (
            <div key={pkg.id} className="border border-border p-3 rounded bg-secondary space-y-2">
              <span className="text-xs font-semibold block">{pkg.name}</span>
              <span className="text-xs text-muted block">{pkg.subtitle}</span>
              {site.vehicles.map(vehicle => (
                <label key={vehicle.id} className="block text-xs">
                  <span className="text-muted block mb-1">{vehicle.name} (USD)</span>
                  <input
                    type="number"
                    min="1"
                    max="50000"
                    value={pkg.prices[vehicle.id]}
                    onChange={e => {
                      const price = Math.max(1, parseInt(e.target.value, 10) || 1);
                      onUpdateSite(prev => {
                        const packages = [...prev.packages];
                        packages[idx] = { ...packages[idx], prices: { ...packages[idx].prices, [vehicle.id]: price } };
                        return { ...prev, packages };
                      });
                    }}
                    className="w-full min-h-[44px] bg-background border border-border p-2 rounded text-sm text-foreground"
                  />
                </label>
              ))}
            </div>
          ))}
        </div>
      </section>

    </fieldset>
  );
};
