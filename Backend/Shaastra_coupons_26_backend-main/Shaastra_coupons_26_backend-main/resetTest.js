// resetTest.js
const { sequelize } = require('./config/database');
const User = require('./models/User');

const SENDER_ID = 'ME22B034';
const RECEIVER_ID = 'CE23B005';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // 1. Refill Sender
        const sender = await User.findOne({ where: { userId: SENDER_ID } });
        if (sender) {
            sender.balance = 5000.00;
            await sender.save();
            console.log(`💰 REFILLED: ${sender.name} (${SENDER_ID}) -> ₹5000`);
        }

        // 2. Clear Receiver
        const receiver = await User.findOne({ where: { userId: RECEIVER_ID } });
        if (receiver) {
            receiver.balance = 0.00;
            await receiver.save();
            console.log(`🧹 RESET: ${receiver.name} (${RECEIVER_ID}) -> ₹0`);
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await sequelize.close();
        process.exit();
    }
};

run();