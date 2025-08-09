export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SpBp9TXUPpeJOx',
    priceId: 'price_1RtXReB1cuFGKX9I4vixfuC7',
    name: 'Gestão Confeitaria 4.0',
    description: 'Gestão e controle de produto e clientes.',
    mode: 'subscription',
    price: 19.90,
  },
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};