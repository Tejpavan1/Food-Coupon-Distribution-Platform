// backend/exportTeam.js
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./config/database');
const User = require('./models/User');

async function exportUsers() {
  try {
    await sequelize.authenticate();
    console.log('🔌 Connected to DB');

    // Fetch all users, sorted by ID
    const users = await User.findAll({
      order: [['userId', 'ASC']],
      raw: true // Get plain data, not Sequelize instances
    });

    console.log(`📊 Found ${users.length} users. Generating CSV...`);

    // Create CSV Header
    const headers = ['name', 'userId', 'smail', 'contact', 'department', 'role', 'balance'];
    
    // Convert rows to CSV format
    const csvContent = [
      headers.join(','), // Add header row
      ...users.map(u => [
        `"${u.name}"`,
        u.userId,
        u.smail,
        `"${u.contact}"`, // Quote contact in case of formatting
        u.department,
        u.role,
        u.balance
      ].join(','))
    ].join('\n');

    // Write file
    const outputPath = path.join(__dirname, 'full_database_dump.csv');
    fs.writeFileSync(outputPath, csvContent);

    console.log(`✅ Successfully exported ${users.length} users to:`);
    console.log(`📂 ${outputPath}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await sequelize.close();
  }
}

exportUsers();