const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const {
  addItem,
  getItems,
  getItem,
  updateItem,
  deleteItem
} = require('./inventory.controller');

// All routes below are protected by authMiddleware
router.use(authMiddleware);

// POST   /api/inventory/items       → add new item
// GET    /api/inventory/items       → get all items
// GET    /api/inventory/items/:id   → get single item
// PUT    /api/inventory/items/:id   → update item
// DELETE /api/inventory/items/:id   → delete item

router.post('/items', addItem);
router.get('/items', getItems);
router.get('/items/:id', getItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

module.exports = router;