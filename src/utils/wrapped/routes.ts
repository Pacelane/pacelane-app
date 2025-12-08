import { airports, type Airport } from './airports';

const R = 6371; // raio médio da Terra em km

function haversineKm(a: Airport, b: Airport) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type Route = { from: Airport; to: Airport; distance: number };

// Pré-calcula todas as rotas e ordena por distância ascendente
const allRoutes: Route[] = (() => {
  const list: Route[] = [];
  for (let i = 0; i < airports.length; i++) {
    for (let j = i + 1; j < airports.length; j++) {
      const from = airports[i];
      const to = airports[j];
      list.push({ from, to, distance: haversineKm(from, to) });
    }
  }
  return list.sort((a, b) => a.distance - b.distance);
})();

function pickRouteByDistance(targetKm: number) {
  // Buckets simples para evitar resultados extremos repetidos
  const shortMax = 2500;
  const midMax = 6000;

  const bucketed = allRoutes.filter((r) => {
    if (targetKm < shortMax) return r.distance <= shortMax;
    if (targetKm < midMax) return r.distance > shortMax && r.distance <= midMax;
    return r.distance > midMax;
  });

  const pool = bucketed.length ? bucketed : allRoutes;
  let best = pool[0];
  let bestDiff = Math.abs(pool[0].distance - targetKm);
  for (let k = 1; k < pool.length; k++) {
    const diff = Math.abs(pool[k].distance - targetKm);
    if (diff < bestDiff) {
      best = pool[k];
      bestDiff = diff;
    }
  }
  return best;
}

export function getDistanceRoute(totalWords: number) {
  const safeTotal = totalWords && totalWords > 0 ? totalWords : 0;
  const route = pickRouteByDistance(totalWords);
  return {
    totalWords: safeTotal,
    distanceKm: Math.round(route.distance),
    from_code: route.from.code,
    from_city: route.from.city,
    to_code: route.to.code,
    to_city: route.to.city,
  };
}

