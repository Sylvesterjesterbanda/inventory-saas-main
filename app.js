const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const authRoutes      = require('./modules/auth/auth.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/inventory', inventoryRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Akatundu Mini Inventory is running' });
});

// Railway gives its own PORT — must use process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;