const DEFAULT_TOAST_API_BASE_URL = 'https://ws-api.toasttab.com';
const TOAST_ORDER_URL = 'https://order.toasttab.com/online/munchy-s-grill-12-irving-place';
const MENU_CACHE_MS = 5 * 60 * 1000;

let tokenCache = null;
let menuCache = null;

function requiredConfig() {
  const config = {
    clientId: process.env.TOAST_CLIENT_ID,
    clientSecret: process.env.TOAST_CLIENT_SECRET,
    restaurantGuid: process.env.TOAST_RESTAURANT_GUID,
    apiBaseUrl: (process.env.TOAST_API_BASE_URL || DEFAULT_TOAST_API_BASE_URL).replace(/\/$/, ''),
    menuApiVersion: (process.env.TOAST_MENU_API_VERSION || 'v2').toLowerCase(),
  };

  const missing = [];
  if (!config.clientId) missing.push('TOAST_CLIENT_ID');
  if (!config.clientSecret) missing.push('TOAST_CLIENT_SECRET');
  if (!config.restaurantGuid) missing.push('TOAST_RESTAURANT_GUID');

  return { config, missing };
}

async function getAccessToken(config) {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.value;
  }

  const response = await fetch(`${config.apiBaseUrl}/authentication/v1/authentication/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      userAccessType: 'TOAST_MACHINE_CLIENT',
    }),
  });

  if (!response.ok) {
    throw new Error(`Toast authentication failed (${response.status})`);
  }

  const payload = await response.json();
  const value = payload?.token?.accessToken;
  const expiresIn = Number(payload?.token?.expiresIn || 900);

  if (!value) {
    throw new Error('Toast authentication did not return an access token');
  }

  tokenCache = { value, expiresAt: Date.now() + expiresIn * 1000 };
  return value;
}

function hasGuestVisibility(entity) {
  if (!Array.isArray(entity?.visibility)) return true;
  return entity.visibility.includes('TOAST_ONLINE_ORDERING') || entity.visibility.includes('ORDERING_PARTNERS');
}

function imageUrl(entity) {
  if (typeof entity?.highResImage === 'string' && entity.highResImage) return entity.highResImage;
  if (typeof entity?.image === 'string' && entity.image) return entity.image;
  if (entity?.image?.url) return entity.image.url;
  if (Array.isArray(entity?.images) && entity.images.length) {
    const first = entity.images[0];
    return typeof first === 'string' ? first : first?.url || null;
  }
  return null;
}

function normalizeMenus(payload) {
  const output = [];
  const seen = new Set();

  function visitGroup(group, inheritedCategory) {
    if (!group || !hasGuestVisibility(group)) return;
    const category = group.name || inheritedCategory || 'Menu';

    for (const item of group.menuItems || []) {
      if (!item || !hasGuestVisibility(item) || !item.guid || seen.has(item.guid)) continue;
      seen.add(item.guid);
      output.push({
        id: item.guid,
        name: item.name || item.posName || 'Menu item',
        description: item.description || '',
        price: Number.isFinite(item.price) ? item.price : null,
        category,
        image: imageUrl(item),
        orderUrl: TOAST_ORDER_URL,
      });
    }

    for (const child of group.menuGroups || []) {
      visitGroup(child, category);
    }
  }

  const menus = Array.isArray(payload?.menus) ? payload.menus : [];
  for (const menu of menus) {
    if (!menu || !hasGuestVisibility(menu)) continue;
    for (const group of menu.menuGroups || []) visitGroup(group, menu.name);
  }

  return output;
}

export async function getMenu() {
  if (menuCache && menuCache.expiresAt > Date.now()) return menuCache.value;

  const { config, missing } = requiredConfig();
  if (missing.length) {
    const error = new Error('Toast API is not configured');
    error.code = 'TOAST_NOT_CONFIGURED';
    error.missing = missing;
    throw error;
  }

  const token = await getAccessToken(config);
  const version = config.menuApiVersion === 'v3' ? 'v3' : 'v2';
  const response = await fetch(`${config.apiBaseUrl}/menus/${version}/menus`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Toast-Restaurant-External-ID': config.restaurantGuid,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Toast menu request failed (${response.status})`);
  }

  const rawMenu = await response.json();
  const items = normalizeMenus(rawMenu);

  if (!items.length) {
    throw new Error('Toast returned no guest-visible menu items');
  }

  const value = {
    source: 'toast',
    updatedAt: rawMenu.lastUpdated || new Date().toISOString(),
    categories: [...new Set(items.map((item) => item.category))],
    items,
  };

  menuCache = { value, expiresAt: Date.now() + MENU_CACHE_MS };
  return value;
}
