const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
    });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, role } = req.body;
    console.log('Login attempt:', { username, role });

    let user = await User.findOne({ username });

    if (!user) {
      user = new User({ username, role });
      await user.save();
      console.log('New user created:', user);
    } else if (user.role !== role) {
      user.role = role;
      await user.save();
      console.log('User role updated:', user);
    }

    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET);

    res.json({ success: true, user: { id: user._id, username: user.username, role: user.role }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;