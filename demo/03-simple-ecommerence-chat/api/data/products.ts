/**
 * ZStore Product Catalog
 *
 * Contains all products sold by ZStore — a fictional gadget e-commerce store.
 * Each product includes a unique ID, name, category, description, price, and image URL.
 * This data is used by the chatbot to answer product-related queries and by the
 * "search_products" tool for semantic search via MongoDB Atlas Vector Search.
 */

export interface Product {
  productId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
}

export const PRODUCTS: Product[] = [
  {
    productId: 'ZS-001',
    name: 'iPhone 16 Pro',
    category: 'Smartphones',
    description:
      'Apple iPhone 16 Pro with A18 Pro chip, 48MP camera system, titanium design, ' +
      'and all-day battery life. Features Dynamic Island, always-on display, and ' +
      'USB-C connectivity. Available in Desert Titanium, Natural Titanium, White Titanium, and Black Titanium.',
    price: 42900,
    currency: 'THB',
    imageUrl: '/images/iphone-16-pro.webp',
  },
  {
    productId: 'ZS-002',
    name: 'Samsung Galaxy S25 Ultra',
    category: 'Smartphones',
    description:
      'Samsung Galaxy S25 Ultra with Snapdragon 8 Elite processor, 200MP camera, ' +
      'built-in S Pen, and 5000mAh battery. Features a 6.9-inch QHD+ AMOLED display ' +
      'with 120Hz refresh rate. Titanium frame with enhanced Galaxy AI features.',
    price: 47900,
    currency: 'THB',
    imageUrl: '/images/galaxy-s25-ultra.webp',
  },
  {
    productId: 'ZS-003',
    name: 'Sony WH-1000XM5 Headphones',
    category: 'Audio',
    description:
      'Sony WH-1000XM5 wireless noise-cancelling headphones. Industry-leading ANC with ' +
      'two processors controlling 8 microphones. 30-hour battery life, 3-minute quick charge ' +
      'for 3 hours of playback, multipoint Bluetooth connection, and crystal-clear calls.',
    price: 12990,
    currency: 'THB',
    imageUrl: '/images/sony-wh1000xm5.webp',
  },
  {
    productId: 'ZS-004',
    name: 'iPad Pro 13-inch (M4)',
    category: 'Tablets',
    description:
      'iPad Pro 13-inch powered by M4 chip with Ultra Retina XDR OLED tandem display. ' +
      'Incredibly thin at 5.1mm, supports Apple Pencil Pro, Magic Keyboard, and Thunderbolt. ' +
      'Perfect for creative professionals, designers, and developers.',
    price: 49900,
    currency: 'THB',
    imageUrl: '/images/ipad-pro-m4.webp',
  },
  {
    productId: 'ZS-005',
    name: 'Apple Watch Series 10',
    category: 'Wearables',
    description:
      'Apple Watch Series 10 with the largest, most advanced display ever. Features ' +
      'sleep apnea detection, water depth gauge, faster charging, and up to 18 hours ' +
      'of battery life. Available in Aluminum and Titanium finishes.',
    price: 15900,
    currency: 'THB',
    imageUrl: '/images/apple-watch-10.webp',
  },
  {
    productId: 'ZS-006',
    name: 'MacBook Air 15-inch (M3)',
    category: 'Laptops',
    description:
      'MacBook Air 15-inch with M3 chip, 18 hours of battery life, Liquid Retina display, ' +
      '1080p FaceTime camera, MagSafe charging, and a fanless silent design. ' +
      '8-core CPU and 10-core GPU make it perfect for productivity and light creative work.',
    price: 52900,
    currency: 'THB',
    imageUrl: '/images/macbook-air-15-m3.webp',
  },
  {
    productId: 'ZS-007',
    name: 'AirPods Pro 2 (USB-C)',
    category: 'Audio',
    description:
      'AirPods Pro 2 with USB-C, H2 chip, Adaptive Audio that automatically tunes ' +
      'noise control, Conversation Awareness, and Personalized Spatial Audio. ' +
      'Up to 6 hours of listening time and up to 30 hours with the charging case.',
    price: 9490,
    currency: 'THB',
    imageUrl: '/images/airpods-pro-2.webp',
  },
  {
    productId: 'ZS-008',
    name: 'Nintendo Switch 2',
    category: 'Gaming',
    description:
      'Nintendo Switch 2 with a larger 8-inch LCD screen, magnetic Joy-Con controllers, ' +
      'and backwards compatibility with Nintendo Switch games. Features enhanced performance ' +
      'with NVIDIA custom chip, USB-C, and support for 4K output when docked.',
    price: 16900,
    currency: 'THB',
    imageUrl: '/images/nintendo-switch-2.webp',
  },
];
