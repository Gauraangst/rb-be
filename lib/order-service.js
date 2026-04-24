import {
  createDemoOrder,
  getDemoProductByIdentifier,
  normalizeImagePath,
} from '../data/demoStore.js';
import {
  mapOrderPayloadToRow,
  mapOrderRowToApi,
  mapProductRowToApi,
} from './db-mappers.js';
import { getSupabase, isDatabaseReady } from './supabase.js';

export const FREE_SHIPPING_THRESHOLD = 2999;
export const SHIPPING_CHARGE = 149;
export const TAX_RATE = 0.05;

const roundCurrency = (value) => Number(value.toFixed(2));

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const databaseReady = () => isDatabaseReady() && Boolean(getSupabase());

const buildOrderNumber = () => `RB-${Date.now()}`;

export const buildTotals = (itemsPrice) => {
  const shippingPrice = itemsPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const taxPrice = roundCurrency(itemsPrice * TAX_RATE);
  const totalPrice = roundCurrency(itemsPrice + shippingPrice + taxPrice);

  return { shippingPrice, taxPrice, totalPrice };
};

export const validateOrderRequest = ({ customer, shippingAddress, paymentMethod }) => {
  if (!customer?.name || !customer?.email || !customer?.phone) {
    return 'Customer name, email, and phone are required';
  }

  if (
    !shippingAddress?.address ||
    !shippingAddress?.city ||
    !shippingAddress?.state ||
    !shippingAddress?.postalCode ||
    !shippingAddress?.country
  ) {
    return 'Complete shipping address is required';
  }

  if (!paymentMethod) {
    return 'Payment method is required';
  }

  return null;
};

const buildOrderItemsFromDemo = (requestedItems) => {
  const orderItems = requestedItems.map((item) => {
    const product = getDemoProductByIdentifier(item.productId || item.product || item.slug);

    if (!product) {
      throw new Error('One of the selected products is no longer available');
    }

    const qty = Number(item.qty) || 1;
    if (qty < 1) {
      throw new Error(`Invalid quantity for ${product.name}`);
    }

    if (product.stock < qty) {
      throw new Error(`Only ${product.stock} item(s) left in stock for ${product.name}`);
    }

    return {
      name: product.name,
      qty,
      image: normalizeImagePath(product.images?.[0]),
      price: product.price,
      product: product._id,
      selectedSize: item.selectedSize || product.sizes?.[0] || '',
      selectedColor: item.selectedColor || product.colors?.[0] || null,
    };
  });

  const itemsPrice = roundCurrency(
    orderItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  return { orderItems, itemsPrice, mode: 'demo' };
};

const buildOrderItemsFromDatabase = async (requestedItems) => {
  const supabase = getSupabase();

  const identifiers = requestedItems
    .map((item) => String(item.productId || item.product || '').trim())
    .filter(Boolean);

  const idIdentifiers = identifiers.filter((value) => UUID_PATTERN.test(value));
  const slugIdentifiers = identifiers.filter((value) => !UUID_PATTERN.test(value));

  const fetchedRows = [];

  if (idIdentifiers.length > 0) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', [...new Set(idIdentifiers)]);

    if (error) {
      throw new Error(error.message || 'Unable to load products');
    }

    fetchedRows.push(...(data || []));
  }

  if (slugIdentifiers.length > 0) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('slug', [...new Set(slugIdentifiers)]);

    if (error) {
      throw new Error(error.message || 'Unable to load products');
    }

    fetchedRows.push(...(data || []));
  }

  const productMap = new Map();
  fetchedRows.forEach((row) => {
    const product = mapProductRowToApi(row);
    productMap.set(product._id, product);
    productMap.set(product.slug, product);
  });

  const orderItems = requestedItems.map((item) => {
    const identifier = String(item.productId || item.product || '').trim();
    const product = productMap.get(String(identifier));

    if (!product) {
      throw new Error('One of the selected products is no longer available');
    }

    const qty = Number(item.qty) || 1;
    if (qty < 1) {
      throw new Error(`Invalid quantity for ${product.name}`);
    }

    if (product.stock < qty) {
      throw new Error(`Only ${product.stock} item(s) left in stock for ${product.name}`);
    }

    return {
      name: product.name,
      qty,
      image: normalizeImagePath(product.images?.[0]),
      price: product.price,
      product: String(product._id),
      selectedSize: item.selectedSize || product.sizes?.[0] || '',
      selectedColor: item.selectedColor || product.colors?.[0] || null,
    };
  });

  const itemsPrice = roundCurrency(
    orderItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  );

  return { orderItems, itemsPrice, mode: 'db' };
};

export const prepareOrderInput = async ({
  requestedItems = [],
  customer,
  shippingAddress,
  paymentMethod,
  notes,
  user = null,
}) => {
  if (!requestedItems.length) {
    throw new Error('No order items');
  }

  const validationError = validateOrderRequest({ customer, shippingAddress, paymentMethod });
  if (validationError) {
    throw new Error(validationError);
  }

  const usesDemoCatalog = requestedItems.some((item) =>
    String(item.productId || item.product || '').startsWith('demo-')
  );

  const preparedOrder = !databaseReady() || usesDemoCatalog
    ? buildOrderItemsFromDemo(requestedItems)
    : await buildOrderItemsFromDatabase(requestedItems);

  return {
    ...preparedOrder,
    customer: {
      name: customer.name,
      email: String(customer.email).trim().toLowerCase(),
      phone: customer.phone,
    },
    shippingAddress,
    paymentMethod,
    notes: notes || '',
    user: user?._id || null,
  };
};

export const persistPreparedOrder = async (
  preparedOrder,
  { paymentStatus, paymentResult = null, paidAt = null } = {}
) => {
  const totals = buildTotals(preparedOrder.itemsPrice);
  const resolvedPaymentStatus =
    paymentStatus ||
    (preparedOrder.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Awaiting Confirmation');

  if (preparedOrder.mode === 'demo') {
    return createDemoOrder({
      user: preparedOrder.user,
      customer: preparedOrder.customer,
      orderItems: preparedOrder.orderItems,
      shippingAddress: preparedOrder.shippingAddress,
      paymentMethod: preparedOrder.paymentMethod,
      paymentStatus: resolvedPaymentStatus,
      paymentResult,
      paidAt,
      itemsPrice: preparedOrder.itemsPrice,
      ...totals,
      notes: preparedOrder.notes,
    });
  }

  const supabase = getSupabase();

  if (paymentResult?.razorpayPaymentId) {
    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (recentOrdersError) {
      throw new Error(recentOrdersError.message || 'Unable to verify existing payments');
    }

    const existingOrder = (recentOrders || []).find(
      (order) => order.payment_result?.razorpayPaymentId === paymentResult.razorpayPaymentId
    );

    if (existingOrder) {
      return mapOrderRowToApi(existingOrder);
    }
  }

  const orderPayload = {
    user: preparedOrder.user,
    orderNumber: buildOrderNumber(),
    customer: preparedOrder.customer,
    orderItems: preparedOrder.orderItems,
    shippingAddress: preparedOrder.shippingAddress,
    paymentMethod: preparedOrder.paymentMethod,
    paymentStatus: resolvedPaymentStatus,
    paymentResult,
    paidAt,
    itemsPrice: preparedOrder.itemsPrice,
    taxPrice: totals.taxPrice,
    shippingPrice: totals.shippingPrice,
    totalPrice: totals.totalPrice,
    status: 'Pending',
    notes: preparedOrder.notes,
  };

  const { data: insertedOrderRow, error: insertError } = await supabase
    .from('orders')
    .insert(mapOrderPayloadToRow(orderPayload))
    .select('*')
    .single();

  if (insertError) {
    throw new Error(insertError.message || 'Unable to save order');
  }

  await Promise.all(
    preparedOrder.orderItems.map(async (item) => {
      if (!UUID_PATTERN.test(String(item.product || ''))) {
        return;
      }

      const { data: productRow, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product)
        .maybeSingle();

      if (productError || !productRow) {
        return;
      }

      const nextStock = Math.max(0, Number(productRow.stock || 0) - Number(item.qty || 0));
      await supabase
        .from('products')
        .update({
          stock: nextStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.product);
    })
  );

  return mapOrderRowToApi(insertedOrderRow);
};
