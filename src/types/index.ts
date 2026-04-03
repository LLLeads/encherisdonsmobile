export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  profile_photo?: string;
  preferred_language?: string;
  email_verified?: boolean;
}

export interface Auction {
  id: number;
  title: string;
  slug: string;
  image?: string;
  price: number;
  highest_bid: number;
  bid_count?: number;
  end_date: string;
  start_date?: string;
  description?: string;
  category?: { name: string; slug: string };
  is_wish?: boolean;
  is_own?: boolean;
}

export interface Draw {
  id: number;
  name: string;
  frequency: string;
  prize_description: string;
  draw_date: string;
  active: boolean;
}

export interface DrawParticipant {
  id: number;
  draw_id: number;
  user_id: number;
  chances: number;
}

export interface ApiResponse<T = any> {
  status: boolean;
  data?: T;
  message?: string;
  error?: { message: string };
}
