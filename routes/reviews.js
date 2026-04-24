import express from 'express';
import { addDemoReview, getDemoReviews } from '../data/demoStore.js';
import { mapReviewPayloadToRow, mapReviewRowToApi } from '../lib/db-mappers.js';
import { getSupabase, isDatabaseReady } from '../lib/supabase.js';

const router = express.Router();
const databaseReady = () => isDatabaseReady() && Boolean(getSupabase());

// GET all testimonials
router.get('/', async (req, res) => {
  try {
    if (!databaseReady()) {
      return res.json(getDemoReviews());
    }

    const supabase = getSupabase();

    const { data: reviewRows, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    const productIds = [...new Set((reviewRows || []).map((row) => row.product_id).filter(Boolean))];
    let productMap = new Map();

    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (!productsError) {
        productMap = new Map((products || []).map((product) => [product.id, product]));
      }
    }

    const reviews = (reviewRows || []).map((row) =>
      mapReviewRowToApi(row, productMap.get(row.product_id) || null)
    );

    res.json(reviews.length > 0 ? reviews : getDemoReviews());
  } catch (error) {
    res.json(getDemoReviews());
  }
});

// POST a new review
router.post('/', async (req, res) => {
  try {
    if (!databaseReady()) {
      return res.status(201).json(addDemoReview(req.body));
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('reviews')
      .insert(mapReviewPayloadToRow(req.body))
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(mapReviewRowToApi(data));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
