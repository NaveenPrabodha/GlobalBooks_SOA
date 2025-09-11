const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Ajv = require('ajv');
const amqp = require('amqplib');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory database
const orders = new Map();

// JSON Schema for order validation
const ajv = new Ajv();
const orderSchema = {
  type: 'object',
  properties: {
    customerId: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          isbn: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
          price: { type: 'number' }
        },
        required: ['isbn', 'quantity', 'price']
      }
    },
    shippingAddress: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        country: { type: 'string' },
        zipCode: { type: 'string' }
      },
      required: ['street', 'city', 'country', 'zipCode']
    }
  },
  required: ['customerId', 'items', 'shippingAddress']
};

const validateOrder = ajv.compile(orderSchema);

// RabbitMQ connection
let channel = null;
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    channel = await connection.createChannel();
    
    // Create exchanges and queues
    await channel.assertExchange('orders', 'topic', { durable: true });
    await channel.assertQueue('payment-queue', { durable: true });
    await channel.assertQueue('shipping-queue', { durable: true });
    
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connection failed:', error);
    // Continue without RabbitMQ for demo purposes
  }
}

connectRabbitMQ();

// REST Endpoints
app.use('/orders', authenticateToken);

// Create Order - POST /orders
app.post('/orders', async (req, res) => {
  try {
    // Validate request body
    if (!validateOrder(req.body)) {
      return res.status(400).json({
        error: 'Invalid order format',
        details: validateOrder.errors
      });
    }

    // Generate order ID
    const orderId = uuidv4();
    
    // Calculate total
    const total = req.body.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0);

    // Create order object
    const order = {
      id: orderId,
      ...req.body,
      status: 'PENDING',
      total: total,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store order
    orders.set(orderId, order);

    // Send to payment queue (if RabbitMQ is connected)
    if (channel) {
      await channel.publish('orders', 'order.created', 
        Buffer.from(JSON.stringify(order)));
    }

    // Return created order
    res.status(201).json({
      message: 'Order created successfully',
      order: order
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Order by ID - GET /orders/:id
app.get('/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const order = orders.get(orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.json(order);
});

// Get All Orders - GET /orders
app.get('/orders', (req, res) => {
  const allOrders = Array.from(orders.values());
  
  // Support filtering by status
  if (req.query.status) {
    const filtered = allOrders.filter(o => o.status === req.query.status);
    return res.json(filtered);
  }

  res.json(allOrders);
});

// Update Order Status - PATCH /orders/:id/status
app.patch('/orders/:id/status', async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const order = orders.get(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Update status
  order.status = status;
  order.updatedAt = new Date().toISOString();

  // Send status update to shipping queue
  if (channel && status === 'PAID') {
    await channel.publish('orders', 'order.paid', 
      Buffer.from(JSON.stringify(order)));
  }

  res.json({
    message: 'Order status updated',
    order: order
  });
});

// Cancel Order - DELETE /orders/:id
app.delete('/orders/:id', (req, res) => {
  const orderId = req.params.id;
  
  if (!orders.has(orderId)) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const order = orders.get(orderId);
  order.status = 'CANCELLED';
  order.updatedAt = new Date().toISOString();

  res.json({
    message: 'Order cancelled',
    order: order
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP', 
    service: 'OrdersService',
    timestamp: new Date().toISOString()
  });
});

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// OAuth2 middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Token generation endpoint
app.post('/oauth/token', (req, res) => {
  const { client_id, client_secret, grant_type } = req.body;

  // Simple validation (in production, verify against database)
  if (grant_type !== 'client_credentials') {
    return res.status(400).json({ error: 'Unsupported grant type' });
  }

  if (client_id === 'globalbooks-client' && client_secret === 'secret123') {
    const token = jwt.sign(
      { client_id, scope: 'orders:read orders:write' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600
    });
  } else {
    res.status(401).json({ error: 'Invalid client credentials' });
  }
});

// Protected routes


// Start server
app.listen(PORT, () => {
  console.log(`OrdersService running on port ${PORT}`);
  console.log(`API Documentation:`);
  console.log(`  POST   /orders          - Create new order`);
  console.log(`  GET    /orders/:id      - Get order by ID`);
  console.log(`  GET    /orders          - Get all orders`);
  console.log(`  PATCH  /orders/:id/status - Update order status`);
  console.log(`  DELETE /orders/:id      - Cancel order`);
});