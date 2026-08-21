import { getMenu } from '../_lib/toast.js';

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });

  try {
    const menu = await getMenu();
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return response.status(200).json(menu);
  } catch (error) {
    if (error.code === 'TOAST_NOT_CONFIGURED') {
      return response.status(503).json({
        error: 'Toast API setup required',
        code: error.code,
        missing: error.missing,
      });
    }

    console.error('Toast menu API error:', error.message);
    return response.status(502).json({ error: 'Unable to load the Toast menu right now' });
  }
}
