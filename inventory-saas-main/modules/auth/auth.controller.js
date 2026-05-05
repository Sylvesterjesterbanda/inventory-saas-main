const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
const register = async (req, res) => {
  try {
    // 1. Pull data from the request body
    const { name, email, password, company_id } = req.body;

    // 2. Validate — never trust user input
    if (!name || !email || !password || !company_id) {
      return res.status(400).json({
        error: 'Name, email, password and company_id are all required'
      });
    }

    // 3. Check if email already exists
    // We use parameterized queries (the ? marks) to prevent SQL injection
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // 4. Check that the company actually exists
    const [companies] = await pool.query(
      'SELECT id FROM companies WHERE id = ?',
      [company_id]
    );

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // 5. Hash the password
    // bcrypt.hash(password, saltRounds)
    // saltRounds = 10 means bcrypt runs the hashing algorithm 2^10 = 1024 times
    // More rounds = harder to crack but slower. 10 is the industry standard.
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Insert the new user into the database
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, company_id) 
       VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, company_id]
    );

    // 7. Respond with success — never send the password back
    return res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
const login = async (req, res) => {
  try {
    // 1. Pull credentials from request body
    const { email, password } = req.body;

    // 2. Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 3. Find the user by email
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    // 4. If no user found — use a vague error message on purpose
    // Never say "email not found" — that tells hackers valid emails
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // 5. Compare the entered password against the stored hash
    // bcrypt.compare() hashes the input and compares — you never "decrypt" bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 6. Create the JWT token
    // We embed userId and companyId into the token payload
    // This is how the server knows WHO you are and WHICH company you belong to
    const token = jwt.sign(
      {
        userId: user.id,
        companyId: user.company_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Token expires in 24 hours
    );

    // 7. Send back the token
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company_id: user.company_id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { register, login };