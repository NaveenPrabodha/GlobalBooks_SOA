const express = require('express');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

let channel;

// --- PASTE THIS NEW FUNCTION IN ITS PLACE ---
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    // Ensure the central 'orders' exchange exists
    await channel.assertExchange('orders', 'topic', { durable: true });
    
    // Ensure the 'shipping-queue' exists
    const q = await channel.assertQueue('shipping-queue', { durable: true });
    
    // Bind the queue to the exchange, listening for the 'order.paid' routing key
    await channel.bindQueue(q.queue, 'orders', 'order.paid');
    
    console.log('ShippingService is waiting for paid orders...');
    
    // Consumer for shipping processing
    channel.consume(q.queue, (msg) => {
      if (msg) {
        const order = JSON.parse(msg.content.toString());
        console.log('Processing shipping for order:', order.id);
        
        // Simulate shipping processing
        setTimeout(() => {
          console.log('Shipping arranged for order:', order.id);
          // In a real system, you might publish another event like 'shipping.complete'
        }, 3000);
        
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error("Failed to connect to RabbitMQ in ShippingService:", error);
  }
}

connectRabbitMQ();

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'ShippingService' });
});

app.listen(3002, () => {
  console.log('ShippingService running on port 3002');
});