/** Coarse centroids for seeded region scopes. Used only after the viewer opts in. */
export const REGION_CENTROIDS: Array<{
  id: string;
  lat: number;
  lng: number;
}> = [
  { id: "region-tamil-nadu", lat: 11.13, lng: 78.66 },
  { id: "region-kerala", lat: 10.16, lng: 76.64 },
  { id: "region-karnataka", lat: 15.32, lng: 75.71 },
  { id: "region-west-bengal", lat: 22.99, lng: 87.86 },
  { id: "region-punjab", lat: 31.15, lng: 75.34 },
  { id: "region-sri-lanka", lat: 7.87, lng: 80.77 },
  { id: "region-kyoto", lat: 35.01, lng: 135.77 },
  { id: "region-andalusia", lat: 37.39, lng: -4.78 },
  { id: "region-tigray", lat: 14.14, lng: 38.31 },
  { id: "region-quezon", lat: 14.05, lng: 121.98 },
];

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function nearestRegionScopeId(lat: number, lng: number): string {
  let best = REGION_CENTROIDS[0]!;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const region of REGION_CENTROIDS) {
    const dLat = toRad(region.lat - lat);
    const dLng = toRad(region.lng - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(region.lat)) * Math.sin(dLng / 2) ** 2;
    const dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < bestDist) {
      bestDist = dist;
      best = region;
    }
  }
  return best.id;
}
