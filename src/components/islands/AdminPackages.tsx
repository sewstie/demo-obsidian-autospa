import React from 'react';
import type { Site } from '../../schemas/site.ts';

export interface AdminPackagesProps {
  site: Site;
  onUpdateSite: (updater: (prev: Site) => Site) => void;
}

export const AdminPackages: React.FC<AdminPackagesProps> = ({ site, onUpdateSite }) => {
  const setPrice = (index: number, vehicleId: string, value: string) => {
    const price = Math.max(1, parseInt(value, 10) || 1);
    onUpdateSite(prev => ({
      ...prev, packages: prev.packages.map((pkg, i) => i === index ? { ...pkg, prices: { ...pkg.prices, [vehicleId]: price } } : pkg),
    }));
  };
  return (
    <section className="admin-card">
      <h2>Package prices by vehicle size</h2>
      <div className="admin-grid">
        {site.packages.map((pkg, index) => (
          <fieldset key={pkg.id} className="admin-group">
            <legend>{pkg.name}</legend>
            <p className="admin-note">{pkg.subtitle}</p>
            {site.vehicles.map(vehicle => (
              <label key={vehicle.id} className="admin-field">{vehicle.name} (USD)
                <input type="number" min="1" max="50000" step="1" value={pkg.prices[vehicle.id]} onChange={e => setPrice(index, vehicle.id, e.target.value)} required />
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </section>
  );
};
