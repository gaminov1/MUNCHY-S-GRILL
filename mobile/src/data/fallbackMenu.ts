import type { MenuItem } from '../types';

export const TOAST_ORDER_URL = 'https://order.toasttab.com/online/munchy-s-grill-12-irving-place';

export const fallbackMenu: MenuItem[] = [
  {
    id: 'classic-burger',
    name: 'Classic Burger',
    description: 'A juicy burger stacked with your choice of fresh toppings and Munchy’s sauces.',
    price: 17.5,
    category: 'Burgers',
    image: require('../../assets/classic-burger.jpg'),
    orderUrl: `${TOAST_ORDER_URL}/item-1-classic-burger_78f6f67c-3cb5-46f3-91d3-c28ca808f071`,
  },
  {
    id: 'cheese-burger',
    name: 'Cheese Burger',
    description: 'Juicy beef, melted cheese, and your choice of toppings. A classic with a kick.',
    price: 19.5,
    category: 'Burgers',
    image: require('../../assets/cheeseburger.jpg'),
    orderUrl: `${TOAST_ORDER_URL}/item-2-cheese-burger_91bb5624-2209-44d1-8079-bbfe1d4d277c`,
  },
  {
    id: 'schnitzel-burger',
    name: 'Schnitzel Burger',
    description: 'Beef patty and crispy fried schnitzel, stacked high with bold flavor.',
    price: 26,
    category: 'Burgers',
    image: require('../../assets/schnitzel-burger.png'),
    orderUrl: `${TOAST_ORDER_URL}/item-3-schnitzel-burger_551624fb-c85c-44a2-9c10-557cb57b455b`,
  },
  {
    id: 'schnitzel-baguette',
    name: 'Schnitzel Baguette',
    description: 'Golden crunchy schnitzel on a toasted baguette with toppings made your way.',
    price: 17.5,
    category: 'Sandwiches',
    image: require('../../assets/schnitzel-baguette.jpg'),
    orderUrl: `${TOAST_ORDER_URL}/item-4-shnitzel-baguette_9087235a-51d5-4c49-9582-662288758852`,
  },
  {
    id: 'munchys-wrap',
    name: 'Munchy’s Wrap',
    description: 'Your choice of meat, sauce, and fresh toppings in a white or whole-wheat wrap.',
    price: 17.5,
    category: 'Wraps',
    image: require('../../assets/munchys-wrap.jpg'),
    orderUrl: `${TOAST_ORDER_URL}/item-5-munchys-wrap_dbebf7a2-1009-43df-a8f6-731967979343`,
  },
  {
    id: 'mazalito-shawarma',
    name: 'Mazalito Chicken Shawarma',
    description: 'Tender spiced chicken shawarma served in a warm laffa, soft pita, or fresh wrap.',
    price: 19,
    category: 'Shawarma',
    image: require('../../assets/mazalito-shawarma.jpg'),
    orderUrl: `${TOAST_ORDER_URL}/item-6-mazalito-chicken-shawarma_d4759acf-fbd4-456b-9501-082bb0f158ba`,
  },
];
