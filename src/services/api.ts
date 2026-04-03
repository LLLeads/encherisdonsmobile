import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://encheridonadmin.test'; // Change to production URL

async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('user_token');
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || data?.error?.message || 'Request failed');
  }

  return data;
}

// ---- Auth ----
export async function login(email: string, password: string) {
  const data = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    await SecureStore.setItemAsync('user_token', data.token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(data.data));
  }
  return data;
}

export async function register(fields: {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  preferred_language?: string;
  referrer_id?: string;
}) {
  return request('/api/register', {
    method: 'POST',
    body: JSON.stringify(fields),
  });
}

export async function logout() {
  await SecureStore.deleteItemAsync('user_token');
  await SecureStore.deleteItemAsync('user_data');
}

export async function getUser() {
  const userData = await SecureStore.getItemAsync('user_data');
  return userData ? JSON.parse(userData) : null;
}

// ---- Auctions ----
export async function getAuctions(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(`/api/product${query}`);
}

export async function getAuctionDetail(slug: string) {
  return request(`/api/product/details/${slug}`);
}

export async function placeBid(productId: number, amount: number) {
  return request('/api/bid/store', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, bid_amount: amount }),
  });
}

// ---- Draws ----
export async function getDraws(lang: string = 'fr') {
  return request(`/api/draws?lang=${lang}`);
}

export async function getDrawParticipants() {
  return request('/api/draw-participants');
}

export async function joinDraw(drawId: number, referrerId?: string) {
  const body: Record<string, any> = { draw_id: drawId };
  if (referrerId) body.referrer_id = referrerId;
  return request('/api/draw-participants', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---- Home ----
export async function getHomeData(lang: string = 'fr') {
  return request(`/api?lang=${lang}`);
}

// ---- General Settings / Menu ----
export async function getMenuPages() {
  return request('/api/all/menu-pages');
}
