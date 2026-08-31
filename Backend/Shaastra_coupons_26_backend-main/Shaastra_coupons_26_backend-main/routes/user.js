// routes/user.js - WITH RATE LIMITING
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { isCore } = require('../middleware/roleMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');
const { Op } = require('sequelize');


// ============================================
// GET /api/user/profile
// ✅ RATE LIMITED: 100 requests per 15 minutes
// ============================================
router.get('/profile', [authMiddleware, apiLimiter], async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'sPin', 'otp', 'otpExpiry'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).send('Server error');
  }
});

// ============================================
// GET /api/user/by-role
// ✅ RATE LIMITED: 100 requests per 15 minutes
// ============================================
router.get('/by-role', [authMiddleware, isCore, apiLimiter], async (req, res) => {
  try {
    const { role } = req.query;
    
    if (!role) {
      return res.status(400).json({ message: 'Role query parameter is required.' });
    }
    
    const users = await User.findAll({ 
      where: { role: role },
      attributes: ['name', 'userId'] 
    });
    
    res.json(users);
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).send('Server Error');
  }
});

// ============================================
// GET /api/user/by-role-in-my-department
// ✅ RATE LIMITED: 100 requests per 15 minutes
// ============================================
router.get('/by-role-in-my-department', [authMiddleware, isCore, apiLimiter], async (req, res) => {
  try {
    const { role } = req.query;
    
    if (!role) {
      return res.status(400).json({ message: 'Role query parameter is required.' });
    }

    const requestingUser = await User.findByPk(req.user.id, {
      attributes: ['department']
    });

    if (!requestingUser || !requestingUser.department) {
      return res.status(400).json({ message: 'User department not found.' });
    }

    const users = await User.findAll({
      where: {
        role: role,
        department: requestingUser.department
      },
      attributes: ['name', 'userId', 'id']
    });
    
    res.json(users);
  } catch (error) {
    console.error("Error fetching users by role in department:", error);
    res.status(500).send('Server Error');
  }
});

// ============================================
// GET /api/user/all-cores
// ✅ RATE LIMITED: 100 requests per 15 minutes
// Returns all Cores excluding Finance/WebOps Core
// ============================================
// ============================================
// GET /api/user/all-cores
// DEBUG VERSION
// ============================================
router.get('/all-cores', [authMiddleware, isCore, apiLimiter], async (req, res) => {
  try {
    console.log("🔍 [DEBUG] /all-cores hit. Checking user...");
    
    // 1. Check if req.user exists (Middleware check)
    if (!req.user || !req.user.id) {
        console.error("❌ [DEBUG] No req.user.id found. Auth failed?");
        return res.status(401).json({ message: 'Authentication failed: No User ID' });
    }

    console.log(`👤 [DEBUG] Requesting User ID: ${req.user.id}`);

    // 2. Check if the user exists in DB
    const requestingUser = await User.findByPk(req.user.id, {
      attributes: ['id', 'department', 'role']
    });

    if (!requestingUser) {
      console.error("❌ [DEBUG] User found in token but NOT in DB.");
      return res.status(404).json({ message: 'User not found in database.' });
    }

    console.log(`✅ [DEBUG] User verified. Dept: ${requestingUser.department}, Role: ${requestingUser.role}`);

    // 3. Execute the Query
    console.log("⏳ [DEBUG] Executing findAll query...");
    
    const cores = await User.findAll({
      where: {
        role: 'Core',
        id: { [Op.ne]: requestingUser.id }, // Exclude self
        department: { 
            [Op.notIn]: ['Finance', 'WebOps'] // Exclude these departments
        }
      },
      attributes: ['name', 'userId', 'id', 'department'],
      order: [['department', 'ASC'], ['name', 'ASC']]
    });
    
    console.log(`🚀 [DEBUG] Query success! Found ${cores.length} cores.`);
    res.json(cores);

  } catch (error) {
    // THIS IS THE IMPORTANT PART
    console.error("🔥 [CRITICAL ERROR] in /all-cores route:", error); 
    console.error(error.stack); // Prints the full trace
    
    // Send the specific error message to frontend so you can see it in the alert
    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
});

module.exports = router;