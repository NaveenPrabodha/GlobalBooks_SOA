const express = require('express');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

let channel;

async function connectRabbitMQ() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await connection.createChannel();
  
  await channel.assertQueue('payment-queue', { durable: true });
  
  // Consumer for payment processing
  channel.consume('payment-queue', async (msg) => {
    if (msg) {
      const order = JSON.parse(msg.content.toString());
      console.log('Processing payment for order:', order.id);
      
      // Simulate payment processing
      setTimeout(() => {
        console.log('Payment processed for order:', order.id);
        // Publish payment success event
        channel.publish('orders', 'payment.success', 
          Buffer.from(JSON.stringify({orderId: order.id, status: 'PAID'})));
      }, 2000);
      
      channel.ack(msg);
    }
  });
}

connectRabbitMQ();

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'PaymentsService' });
});

app.listen(3001, () => {
  console.log('PaymentsService running on port 3001');
});