const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const multer = require('multer');
const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'inventory_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Successfully connected to the database');
    connection.release();
});

app.get('/api/inventory', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM inventory');
        const formattedRows = rows.map(row => ({
            ...row,
            price: Number(row.price),
            image: row.image_data ? `/api/inventory/${row.id}/image` : 'https://via.placeholder.com/150'
        }));
        res.json(formattedRows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory data' });
    }
});
// GET all inventory items
app.get('/api/inventory', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM inventory');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory data' });
    }
});

// GET single inventory item
app.get('/api/inventory/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM inventory WHERE id = ?', [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

app.get('/api/inventory/:id/image', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT image_data, image_type FROM inventory WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0 || !rows[0].image_data) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Set the correct content type
        res.setHeader('Content-Type', rows[0].image_type);

        // Send the image data directly
        res.send(rows[0].image_data);
    } catch (error) {
        console.error('Error retrieving image:', error);
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
});

// Update stock level
app.patch('/api/inventory/:id/stock', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { newQuantity, reason } = req.body;

        if (typeof newQuantity !== 'number' || newQuantity < 0) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }

        // Get current stock level
        const [currentItem] = await connection.query(
            'SELECT * FROM inventory WHERE id = ?',
            [req.params.id]
        );

        if (currentItem.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Item not found' });
        }

        // Update stock
        await connection.query(
            'UPDATE inventory SET stock = ? WHERE id = ?',
            [newQuantity, req.params.id]
        );

        // Log the change in stock_history
        await connection.query(
            'INSERT INTO stock_history (inventory_id, old_quantity, new_quantity, change_reason) VALUES (?, ?, ?, ?)',
            [req.params.id, currentItem[0].stock, newQuantity, reason]
        );

        await connection.commit();

        const [updatedItem] = await connection.query(
            'SELECT * FROM inventory WHERE id = ?',
            [req.params.id]
        );

        res.json(updatedItem[0]);
    } catch (error) {
        await connection.rollback();
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Failed to update stock level' });
    } finally {
        connection.release();
    }
});

app.post('/api/inventory', async (req, res) => {
    const { name, sku, category, stock, price, reorderPoint, brand } = req.body;

    try {
        // Validate required fields
        if (!name || !sku || !category || stock === undefined || price === undefined || !reorderPoint) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate data types
        if (typeof stock !== 'number' || typeof price !== 'number' || typeof reorderPoint !== 'number') {
            return res.status(400).json({ error: 'Invalid data types for numeric fields' });
        }

        // Check if SKU already exists
        const [existing] = await pool.query('SELECT id FROM inventory WHERE sku = ?', [sku]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'SKU already exists' });
        }

        const [result] = await pool.query(
            'INSERT INTO inventory (name, sku, category, stock, price, reorder_point, brand) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, sku, category, stock, price, reorderPoint, brand || '']
        );

        const [newItem] = await pool.query('SELECT * FROM inventory WHERE id = ?', [result.insertId]);
        res.status(201).json(newItem[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.post('/api/inventory/:id/image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    try {
        await pool.query(
            'UPDATE inventory SET image_data = ?, image_type = ? WHERE id = ?',
            [req.file.buffer, req.file.mimetype, req.params.id]
        );

        res.json({ message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Delete product
app.delete('/api/inventory/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // First delete related records from stock_history
        await connection.query('DELETE FROM stock_history WHERE inventory_id = ?', [req.params.id]);

        // Then delete the inventory item
        const [result] = await connection.query('DELETE FROM inventory WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Product not found' });
        }

        await connection.commit();
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    } finally {
        connection.release();
    }
});

app.post('/api/sales', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            transactionId,
            customerName,
            memberId,
            paymentMethod,
            items,
            subtotal,
            discount,
            sst,
            totalAmount,
            memberDetails
        } = req.body;

        // Insert sale record
        const [saleResult] = await connection.query(
            'INSERT INTO sales (transaction_id, customer_name, member_id, payment_method, subtotal, discount, sst, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [transactionId, customerName, memberId || null, paymentMethod, subtotal, discount, sst, totalAmount]
        );

        const saleId = saleResult.insertId;

        // Insert sale items
        for (const item of items) {
            await connection.query(
                'INSERT INTO sales_items (sale_id, product_id, quantity, price_per_unit, discount_percentage) VALUES (?, ?, ?, ?, ?)',
                [saleId, item.id, item.quantity, item.price, item.discount || 0]
            );
        }

        // Update member points if applicable
        if (memberDetails) {
            await connection.query(
                'INSERT INTO member_points_history (member_id, sale_id, points_earned, points_balance) VALUES (?, ?, ?, ?)',
                [memberId, saleId, memberDetails.pointsEarned, memberDetails.newTotalPoints]
            );

            // Update member's total points
            await connection.query(
                'UPDATE members SET points = ? WHERE member_id = ?',
                [memberDetails.newTotalPoints, memberId]
            );
        }

        await connection.commit();
        res.status(201).json({
            message: 'Sale recorded successfully',
            saleId,
            transactionId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error recording sale:', error);
        res.status(500).json({ error: 'Failed to record sale' });
    } finally {
        connection.release();
    }
});

// Get sales by date
app.get('/api/sales/:date', async (req, res) => {
    try {
        const [sales] = await pool.query(
            `SELECT s.*,
                    GROUP_CONCAT(si.quantity, 'x ', (SELECT name FROM inventory WHERE id = si.product_id)) as items
             FROM sales s
                      LEFT JOIN sales_items si ON s.id = si.sale_id
             WHERE DATE(s.created_at) = ?
             GROUP BY s.id`,
            [req.params.date]
        );
        res.json(sales);
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ error: 'Failed to fetch sales data' });
    }
});

// Get member by ID
app.get('/api/members/:id', async (req, res) => {
    try {
        const [member] = await pool.query(
            `SELECT m.*, t.points_multiplier
             FROM members m
                      JOIN membership_tiers t ON m.tier = t.tier_name
             WHERE member_id = ?`,
            [req.params.id]
        );

        if (member.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }

        res.json(member[0]);
    } catch (error) {
        console.error('Error fetching member:', error);
        res.status(500).json({ error: 'Failed to fetch member data' });
    }
});

// Get all tiers
app.get('/api/tiers', async (req, res) => {
    try {
        const [tiers] = await pool.query('SELECT * FROM membership_tiers');
        res.json(tiers);
    } catch (error) {
        console.error('Error fetching tiers:', error);
        res.status(500).json({ error: 'Failed to fetch tier data' });
    }
});

// Update member points
app.patch('/api/members/:id/points', async (req, res) => {
    const { points } = req.body;
    try {
        await pool.query(
            'UPDATE members SET points = ? WHERE member_id = ?',
            [points, req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating points:', error);
        res.status(500).json({ error: 'Failed to update points' });
    }
});

// fetch all members

app.get('/api/members', async (req, res) => {
    try {
        console.log('Attempting to fetch all members...');
        const [members] = await pool.query(
            `SELECT
                 m.member_id,
                 m.name,
                 m.email,
                 m.phone,
                 m.tier,
                 m.points,
                 m.join_date,
                 m.total_spent,
                 t.points_multiplier
             FROM members m
                      LEFT JOIN membership_tiers t ON m.tier = t.tier_name
             ORDER BY m.member_id`
        );

        console.log('Query executed successfully');
        console.log('Number of members found:', members.length);

        res.json(members);
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({
            error: 'Failed to fetch members data',
            details: error.message
        });
    }
});

// Update member registration endpoint in server.js
app.post('/api/members', async (req, res) => {
    const { name, email, phone, tier } = req.body;
    const connection = await pool.getConnection();

    try {
        console.log('Starting member registration process...');
        console.log('Received data:', { name, email, phone, tier });

        // Validate input
        if (!name || !email || !phone || !tier) {
            throw new Error('Name, email, phone and tier are required');
        }

        // Get all existing member IDs for debugging
        const [allMembers] = await connection.query('SELECT member_id FROM members ORDER BY member_id ASC');
        console.log('All existing member IDs:', allMembers.map(m => m.member_id));

        // Find the highest numeric value
        let maxNumber = 0;
        allMembers.forEach(member => {
            // Extract just the numbers from the ID
            const matches = member.member_id.match(/\d+/);
            if (matches) {
                const num = parseInt(matches[0], 10);
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            }
        });

        console.log('Highest number found:', maxNumber);

        // Generate new ID
        const nextNumber = maxNumber + 1;
        const memberId = `M${String(nextNumber).padStart(3, '0')}`;
        console.log('Generated new member ID:', memberId);

        // Insert new member
        const insertQuery = `
            INSERT INTO members
                (member_id, name, email, phone, tier, points, join_date, total_spent)
            VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?)
        `;
        const insertValues = [memberId, name, email, phone, tier, 0, 0.00];
        console.log('Executing insert with values:', insertValues);

        await connection.query(insertQuery, insertValues);

        // Verify the insert
        const [newMember] = await connection.query(
            'SELECT m.*, t.points_multiplier FROM members m LEFT JOIN membership_tiers t ON m.tier = t.tier_name WHERE m.member_id = ?',
            [memberId]
        );

        console.log('New member created:', newMember[0]);
        res.status(201).json(newMember[0]);

    } catch (error) {
        console.error('Detailed registration error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to register member',
            details: error.message,
            stack: error.stack
        });
    } finally {
        connection.release();
    }
});

app.get('/api/members/search', async (req, res) => {
    try {
        const { query } = req.query;

        let sqlQuery = `
            SELECT m.*, t.points_multiplier
            FROM members m
                     LEFT JOIN membership_tiers t ON m.tier = t.tier_name
        `;

        if (query) {
            sqlQuery += ` WHERE 
                m.member_id LIKE ? OR 
                m.name LIKE ? OR 
                m.email LIKE ? OR 
                m.phone LIKE ?`;

            const searchPattern = `%${query}%`;
            const [members] = await pool.query(sqlQuery, [searchPattern, searchPattern, searchPattern, searchPattern]);
            res.json(members);
        } else {
            // If no query provided, return all members
            const [members] = await pool.query(sqlQuery);
            res.json(members);
        }
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to search members' });
    }
});

// Update member
app.put('/api/members/:id', async (req, res) => {
    const { name, email, phone, tier } = req.body;
    const memberId = req.params.id;

    try {
        // Validate input
        if (!name || !email || !phone || !tier) {
            throw new Error('All fields are required');
        }

        await pool.query(
            `UPDATE members
             SET name = ?, email = ?, phone = ?, tier = ?
             WHERE member_id = ?`,
            [name, email, phone, tier, memberId]
        );

        // Fetch updated member
        const [updatedMember] = await pool.query(
            `SELECT m.*, t.points_multiplier
             FROM members m
                      LEFT JOIN membership_tiers t ON m.tier = t.tier_name
             WHERE m.member_id = ?`,
            [memberId]
        );

        if (updatedMember.length === 0) {
            return res.status(404).json({ error: 'Member not found' });
        }

        res.json(updatedMember[0]);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update member' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});