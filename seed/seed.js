import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { normalizeImagePath } from '../data/demoStore.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storeFilePath = path.join(__dirname, '..', 'data', 'store.json');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readStoreData = () => {
  const raw = fs.readFileSync(storeFilePath, 'utf8');
  return JSON.parse(raw);
};

const buildSupabaseClient = () => {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed data');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const mapProductToRow = (product) => ({
  name: product.name,
  slug: product.slug,
  description: product.description,
  price: toNumber(product.price),
  original_price: product.originalPrice == null ? null : toNumber(product.originalPrice),
  category: product.category,
  subcategory: product.subcategory || null,
  images: Array.isArray(product.images) ? product.images.map(normalizeImagePath) : [],
  colors: Array.isArray(product.colors) ? product.colors : [],
  sizes: Array.isArray(product.sizes) ? product.sizes : [],
  material: product.material || '',
  is_bestseller: Boolean(product.isBestseller),
  is_featured: Boolean(product.isFeatured),
  is_new_arrival: Boolean(product.isNewArrival),
  stock: toNumber(product.stock, 0),
  rating: toNumber(product.rating, 0),
  review_count: toNumber(product.reviewCount, 0),
  tags: Array.isArray(product.tags) ? product.tags : [],
  created_at: product.createdAt || new Date().toISOString(),
  updated_at: product.updatedAt || new Date().toISOString(),
});

const mapReviewToRow = (review, index, productRows) => ({
  customer_name: review.customerName,
  location: review.location || null,
  rating: toNumber(review.rating, 5),
  title: review.title || null,
  text: review.text,
  product_id: productRows[index % productRows.length]?.id || null,
  is_verified: review.isVerified !== false,
  avatar: review.avatar || null,
  created_at: review.createdAt || new Date().toISOString(),
  updated_at: review.updatedAt || new Date().toISOString(),
});

async function seedDatabase() {
  const supabase = buildSupabaseClient();
  const store = readStoreData();
  const products = Array.isArray(store.products) ? store.products : [];
  const reviews = Array.isArray(store.reviews) ? store.reviews : [];

  if (products.length === 0) {
    throw new Error('No products found in data/store.json');
  }

  console.log('Seeding Supabase tables...');

  const { error: deleteReviewsError } = await supabase.from('reviews').delete().not('id', 'is', null);
  if (deleteReviewsError) {
    throw deleteReviewsError;
  }

  const { error: deleteProductsError } = await supabase.from('products').delete().not('id', 'is', null);
  if (deleteProductsError) {
    throw deleteProductsError;
  }

  const productRows = products.map(mapProductToRow);
  const { data: insertedProducts, error: insertProductsError } = await supabase
    .from('products')
    .insert(productRows)
    .select('id');

  if (insertProductsError) {
    throw insertProductsError;
  }

  const reviewRows = reviews.map((review, index) => mapReviewToRow(review, index, insertedProducts || []));
  if (reviewRows.length > 0) {
    const { error: insertReviewsError } = await supabase.from('reviews').insert(reviewRows);
    if (insertReviewsError) {
      throw insertReviewsError;
    }
  }

  console.log(`Inserted ${productRows.length} products and ${reviewRows.length} reviews`);
  console.log('Supabase seed complete');
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding error:', error.message || error);
    process.exit(1);
  });
