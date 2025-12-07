export type Airport = { code: string; city: string; country: string; lat: number; lon: number };

// Pequena lista confiável de aeroportos icônicos
export const airports: Airport[] = [
  { code: 'JFK', city: 'New York', country: 'USA', lat: 40.6413, lon: -73.7781 },
  { code: 'LAX', city: 'Los Angeles', country: 'USA', lat: 33.9416, lon: -118.4085 },
  { code: 'MEX', city: 'Mexico City', country: 'Mexico', lat: 19.4361, lon: -99.0719 },
  { code: 'GRU', city: 'São Paulo', country: 'Brazil', lat: -23.4356, lon: -46.4731 },
  { code: 'EZE', city: 'Buenos Aires', country: 'Argentina', lat: -34.812, lon: -58.5392 },
  { code: 'CDG', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479 },
  { code: 'LHR', city: 'London', country: 'UK', lat: 51.47, lon: -0.4543 },
  { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683 },
  { code: 'DXB', city: 'Dubai', country: 'UAE', lat: 25.2532, lon: 55.3657 },
  { code: 'HND', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798 },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915 },
  { code: 'SYD', city: 'Sydney', country: 'Australia', lat: -33.9399, lon: 151.1753 },
  { code: 'CPT', city: 'Cape Town', country: 'South Africa', lat: -33.9695, lon: 18.5972 },
];

