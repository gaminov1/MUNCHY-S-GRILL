import type { ImageSourcePropType } from 'react-native';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number | null;
  category: string;
  image?: ImageSourcePropType;
  orderUrl?: string;
};

export type MenuApiItem = Omit<MenuItem, 'image'> & {
  image?: string | null;
};

export type MenuApiResponse = {
  source: 'toast' | 'fallback';
  updatedAt: string;
  categories: string[];
  items: MenuApiItem[];
};

export type AppTab = 'home' | 'menu' | 'favorites' | 'info';
