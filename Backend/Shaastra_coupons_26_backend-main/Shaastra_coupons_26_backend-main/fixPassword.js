// fixPassword.js
const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// 🔴 UPDATED TARGET TO RECEIVER
const TARGET_USER_ID = 'CE23B005'; 
const NEW_PASSWORD = 'password123'; 

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        const user = await User.findOne({ where: { userId: TARGET_USER_ID } });
        if (!user) {
            console.error('❌ User not found!');
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(NEW_PASSWORD, salt);
        await user.save();

        console.log(`🎉 SUCCESS! Password for ${user.userId} set to: ${NEW_PASSWORD}`);
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await sequelize.close();
        process.exit();
    }
};

run();