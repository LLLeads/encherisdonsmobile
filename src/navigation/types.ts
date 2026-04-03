export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Auctions: undefined;
  Draw: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  AuctionDetail: { slug: string };
};
