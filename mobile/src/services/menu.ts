import type { MenuApiResponse, MenuItem } from '../types';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://www.munchysgrillny.com').replace(/\/$/, '');

export async function getToastMenu(signal?: AbortSignal): Promise<MenuItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/toast/menu`, {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Menu request failed with ${response.status}`);
  }

  const payload = (await response.json()) as MenuApiResponse;

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error('Toast returned an empty menu');
  }

  return payload.items.map((item) => ({
    ...item,
    image: item.image ? { uri: item.image } : undefined,
  }));
}
