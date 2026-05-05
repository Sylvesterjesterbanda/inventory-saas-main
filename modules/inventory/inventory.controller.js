const pool = require('../../config/db');

// ─────────────────────────────────────────
// ADD ITEM
// ─────────────────────────────────────────
const addItem = async (req, res) => {
  try {
    // 1. Get companyId and userId from the TOKEN — never from user input
    const { companyId, userId } = req.user;

    // 2. Get item details from request body
    const { name, description, quantity, price } = req.body;

    // 3. Validate inputs
    if (!name || quantity === undefined || price === undefined) {
      return res.status(400).json({
        error: 'Name, quantity and price are required'
      });
    }

    // 4. Insert item — notice companyId comes from req.user
    // This means a user can NEVER add an item to another company
    const [result] = await pool.query(
      `INSERT INTO items (company_id, user_id, name, description, quantity, price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [companyId, userId, name, description, quantity, price]
    );

    return res.status(201).json({
      message: 'Item added successfully',
      itemId: result.insertId
    });

  } catch (error) {
    console.error('Add item error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// GET ALL ITEMS
// ─────────────────────────────────────────
const getItems = async (req, res) => {
  try {
    // 1. Get companyId from token
    const { companyId } = req.user;

    // 2. ALWAYS filter by company_id — this is what isolates tenant data
    // A user from Company A will NEVER see Company B's items
    const [items] = await pool.query(
      `SELECT 
        id,
        name,
        description,
        quantity,
        price,
        created_at
       FROM items
       WHERE company_id = ?
       ORDER BY created_at DESC`,
      [companyId]
    );

    return res.status(200).json({
      company_id: companyId,
      total: items.length,
      items
    });

  } catch (error) {
    console.error('Get items error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// GET SINGLE ITEM
// ─────────────────────────────────────────
const getItem = async (req, res) => {
  try {
    const { companyId } = req.user;

    // Item ID comes from the URL — e.g. /api/inventory/items/5
    const { id } = req.params;

    // IMPORTANT: We filter by BOTH id AND company_id
    // Without company_id check, any logged in user could fetch
    // any item just by guessing the ID number
    const [items] = await pool.query(
      `SELECT 
        id,
        name,
        description,
        quantity,
        price,
        created_at
       FROM items
       WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.status(200).json({ item: items[0] });

  } catch (error) {
    console.error('Get item error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// UPDATE ITEM
// ─────────────────────────────────────────
const updateItem = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const { name, description, quantity, price } = req.body;

    // First check the item exists AND belongs to this company
    const [items] = await pool.query(
      'SELECT id FROM items WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Now safe to update
    await pool.query(
      `UPDATE items 
       SET name = ?, description = ?, quantity = ?, price = ?
       WHERE id = ? AND company_id = ?`,
      [name, description, quantity, price, id, companyId]
    );

    return res.status(200).json({ message: 'Item updated successfully' });

  } catch (error) {
    console.error('Update item error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// DELETE ITEM
// ─────────────────────────────────────────
const deleteItem = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    // Always include company_id in DELETE queries
    // Without it a user could delete ANY item by ID
    const [result] = await pool.query(
      'DELETE FROM items WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    // affectedRows tells us if anything was actually deleted
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.status(200).json({ message: 'Item deleted successfully' });

  } catch (error) {
    console.error('Delete item error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { addItem, getItems, getItem, updateItem, deleteItem };