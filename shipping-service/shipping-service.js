const express = require('express');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

let channel;

async function connectRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await connection.createChannel();
  
  await channel.assertQueue('shipping-queue', { durable: true });
  
  // Consumer for shipping processing
  channel.consume('shipping-queue', async (msg) => {
    if (msg) {
      const order = JSON.parse(msg.content.toString());
      console.log('Processing shipping for order:', order.id);
      
      // Simulate shipping processing
      setTimeout(() => {
        console.log('Shipping arranged for order:', order.id);
        // Update shipping status
        channel.publish('orders', 'shipping.arranged', 
          Buffer.from(JSON.stringify({orderId: order.id, trackingNumber: 'TRK' + order.id})));
      }, 3000);
      
      channel.ack(msg);
    }
  });
}

connectRabbitMQ();

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'ShippingService' });
});

app.listen(3002, () => {
  console.log('ShippingService running on port 3002');
});