import type { Site } from '../schemas/site.ts';

export const asset = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
export const address = (business: Site['business']) => `${business.street}, ${business.city}, ${business.region} ${business.postalCode}`;
