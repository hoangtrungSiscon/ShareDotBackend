const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('../../models/users');
const router = express.Router();
const pool = require('../../config/db')
const crypto = require('crypto');
require('dotenv').config();

function hashSHA256(data) {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = hashSHA256(password);

    pool.query(`SELECT * FROM users WHERE username = '${username}' AND password = '${hashedPassword}'`, (err, result) => {
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    })
});

router.get('/', (req, res, next) => {
    pool.query('SELECT * FROM mainsubjects;', (err, result) => {
        res.status(200).json(result.rows)
    })
})
