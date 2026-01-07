// Map configuration utilities
export const MAP_CONFIG = {
  defaultCenter: [33.5731, -7.5898] as [number, number], // Casablanca, Morocco
  defaultZoom: 6,
  minZoom: 3,
  maxZoom: 18,
  tileLayer: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
};

export const CATEGORY_COLORS: Record<string, string> = {
  waste: '#27ae60',
  pollution: '#f39c12',
  danger: '#e74c3c',
  noise: '#9b59b6',
  water: '#3498db',
  air: '#1abc9c',
  illegal_dumping: '#e67e22',
  deforestation: '#2ecc71'
};

export const CATEGORY_ICONS: Record<string, string> = {
  waste: '🗑️',
  pollution: '🏭',
  danger: '⚠️',
  noise: '🔊',
  water: '💧',
  air: '💨',
  illegal_dumping: '🚯',
  deforestation: '🌲'
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#95a5a6';
};

export const getCategoryIcon = (category: string): string => {
  return CATEGORY_ICONS[category] || '📍';
};

export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};
