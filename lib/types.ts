export interface Flower {
  id: string;
  name: string;
  description: string;
  images: string[]; // Firebase Storage URLs
  inStock: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  category?: string;
}

export interface QuoteItem {
  flowerId: string;
  flowerName: string;
  flowerImage?: string;
}

export interface QuoteFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  flowers: QuoteItem[];
}
