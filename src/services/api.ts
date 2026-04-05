import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://encheridonadmin.test'; // Change to production URL

// Callback to force logout when session expires — set by AuthContext
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

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

  if (res.status === 401) {
    // Session expired — force logout and go to login
    await SecureStore.deleteItemAsync('user_token');
    await SecureStore.deleteItemAsync('user_data');
    if (onUnauthorized) onUnauthorized();
    return {} as T; // Return empty — the app will redirect to login
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || data?.error?.message || 'Request failed');
  }

  return data;
}

// ---- Auth ----
export async function login(email: string, password: string) {
  const data = await request('/api/user/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const token = data.data?.token || data.token;
  const userData = data.data?.user || data.data;
  if (token) {
    await SecureStore.setItemAsync('user_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
  }
  return data;
}

export async function register(fields: {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  country?: string;
  preferred_language?: string;
  referrer_id?: string;
}) {
  return request('/api/user/register', {
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
  return request(`/api/auctions${query}`);
}

export async function getAuctionDetail(slug: string) {
  return request(`/api/auction-details/${slug}`);
}

export async function placeBid(auctionId: number, amount: number) {
  return request('/api/user/bid/store', {
    method: 'POST',
    body: JSON.stringify({ auction_id: auctionId, bid_amount: amount }),
  });
}

// ---- Membership ----
export async function createMembershipPaymentIntent() {
  return request('/api/user/membership/create-payment-intent', { method: 'POST' });
}

export async function confirmMembershipPayment(paymentId: number, paymentIntentId: string) {
  return request('/api/user/membership/confirm-payment', {
    method: 'POST',
    body: JSON.stringify({ payment_id: paymentId, payment_intent_id: paymentIntentId }),
  });
}

export async function chargeMembershipCard(cardNumber: string, expMonth: number, expYear: number, cvc: string) {
  // Step 1: Get payment intent + publishable key from admin
  const intentRes = await createMembershipPaymentIntent();
  if (!intentRes.status) throw new Error(intentRes.message || 'Could not create payment');

  const { client_secret, publishable_key, payment_id } = intentRes.data;

  // Step 2: Create payment method directly with Stripe
  const stripeRes = await fetch('https://api.stripe.com/v1/payment_methods', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publishable_key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `type=card&card[number]=${cardNumber}&card[exp_month]=${expMonth}&card[exp_year]=${expYear}&card[cvc]=${cvc}`,
  });
  const pmData = await stripeRes.json();
  if (pmData.error) throw new Error(pmData.error.message);

  // Step 3: Confirm payment intent with Stripe
  const confirmRes = await fetch(`https://api.stripe.com/v1/payment_intents/${client_secret.split('_secret_')[0]}/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publishable_key}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `payment_method=${pmData.id}`,
  });
  const confirmData = await confirmRes.json();
  if (confirmData.error) throw new Error(confirmData.error.message);

  if (confirmData.status !== 'succeeded') {
    throw new Error('Payment was not completed.');
  }

  // Step 4: Tell admin to activate membership
  return confirmMembershipPayment(payment_id, confirmData.id);
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

// ---- Dashboard ----
export async function getDashboard() {
  return request('/api/user/dashboard');
}

// ---- Profile ----
export async function getUserDetails() {
  return request('/api/user/get-details');
}

export async function updateProfile(fields: Record<string, string>) {
  return request('/api/user/profile-settings', {
    method: 'POST',
    body: JSON.stringify(fields),
  });
}

export async function changePassword(oldPass: string, password: string, passwordConfirmation: string) {
  return request('/api/user/change-password', {
    method: 'POST',
    body: JSON.stringify({ old_pass: oldPass, password, password_confirmation: passwordConfirmation }),
  });
}

// ---- Pages ----
export async function getPage(slug: string) {
  return request(`/api/pages-${slug}`);
}

// ---- General Settings / Menu ----
export async function getMenuPages() {
  return request('/api/all/menu-pages');
}
