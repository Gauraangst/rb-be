import {
  getAllDemoOrders,
  getDemoOrderById,
  getDemoOrdersByEmail,
  updateDemoOrderStatus,
} from '../data/demoStore.js';
import { mapOrderRowToApi } from '../lib/db-mappers.js';
import { getSupabase, isDatabaseReady } from '../lib/supabase.js';
import { prepareOrderInput, persistPreparedOrder } from '../lib/order-service.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const databaseReady = () => isDatabaseReady() && Boolean(getSupabase());

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
export const addItemsToOrder = async (req, res) => {
  const { orderItems: requestedItems = [], customer, shippingAddress, paymentMethod, notes } = req.body;

  try {
    const preparedOrder = await prepareOrderInput({
      requestedItems,
      customer,
      shippingAddress,
      paymentMethod,
      notes,
      user: req.user || null,
    });

    const createdOrder = await persistPreparedOrder(preparedOrder);
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Unable to create order' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public
export const getOrderById = async (req, res) => {
  try {
    if (!databaseReady()) {
      const order = getDemoOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      return res.json(order);
    }

    const supabase = getSupabase();

    let query = supabase.from('orders').select('*').limit(1);
    if (UUID_PATTERN.test(req.params.id)) {
      query = query.or(`id.eq.${req.params.id},order_number.eq.${req.params.id}`);
    } else {
      query = query.eq('order_number', req.params.id);
    }

    const { data: rows, error } = await query;

    if (error) {
      throw error;
    }

    const order = mapOrderRowToApi(rows?.[0] || null);

    if (!order) {
      const fallbackOrder = getDemoOrderById(req.params.id);
      if (fallbackOrder) {
        return res.json(fallbackOrder);
      }

      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!databaseReady()) {
      const orders = getDemoOrdersByEmail(req.user.email);
      return res.json(orders);
    }

    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.user._id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const orders = (rows || []).map(mapOrderRowToApi);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
  try {
    if (!databaseReady()) {
      return res.json(getAllDemoOrders());
    }

    const supabase = getSupabase();

    const { data: rows, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const orders = (rows || []).map(mapOrderRowToApi);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status to specific status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    if (!databaseReady()) {
      const updatedOrder = updateDemoOrderStatus(req.params.id, req.body.status);

      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      return res.json(updatedOrder);
    }

    const supabase = getSupabase();

    let findQuery = supabase.from('orders').select('*').limit(1);
    if (UUID_PATTERN.test(req.params.id)) {
      findQuery = findQuery.or(`id.eq.${req.params.id},order_number.eq.${req.params.id}`);
    } else {
      findQuery = findQuery.eq('order_number', req.params.id);
    }

    const { data: rows, error: findError } = await findQuery;

    if (findError) {
      throw findError;
    }

    const order = rows?.[0];

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('orders')
      .update({
        status: req.body.status || order.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json(mapOrderRowToApi(updatedRow));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
