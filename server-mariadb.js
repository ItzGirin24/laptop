import express from 'express';
import mariadb from 'mariadb';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MariaDB connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'laptop_collection',
  connectionLimit: 5
});

// Helper function to convert database rows to proper format
const formatStudent = (row) => ({
  id: row.id.toString(),
  name: row.name,
  studentNumber: row.student_number,
  className: row.class_name,
  lockerNumber: row.locker_number,
  collectionStatus: row.collection_status,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

const formatPermission = (row) => ({
  id: row.id.toString(),
  studentId: row.student_id,
  studentName: row.student_name,
  className: row.class_name,
  date: new Date(row.date),
  startTime: row.start_time,
  endTime: row.end_time,
  reason: row.reason,
  createdAt: new Date(row.created_at)
});

const formatConfiscation = (row) => ({
  id: row.id.toString(),
  studentId: row.student_id,
  studentName: row.student_name,
  className: row.class_name,
  lockerNumber: row.locker_number,
  reason: row.reason,
  startDate: new Date(row.start_date),
  endDate: new Date(row.end_date),
  duration: row.duration,
  status: row.status,
  returnedAt: row.returned_at ? new Date(row.returned_at) : undefined,
  createdAt: new Date(row.created_at)
});

const formatCollectionHistory = (row) => ({
  id: row.id.toString(),
  studentId: row.student_id,
  status: row.status,
  date: new Date(row.date),
  createdAt: new Date(row.created_at)
});

// Students endpoints
app.get('/api/students', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM students ORDER BY created_at DESC');
    const students = rows.map(formatStudent);
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Failed to fetch students' });
  } finally {
    if (conn) conn.end();
  }
});

app.post('/api/students', async (req, res) => {
  const { name, studentNumber, className, lockerNumber, collectionStatus = 'not_collected' } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO students (name, student_number, class_name, locker_number, collection_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [name, studentNumber, className, lockerNumber, collectionStatus]
    );
    res.status(201).json({
      id: result.insertId.toString(),
      message: 'Student added successfully'
    });
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ message: 'Failed to add student' });
  } finally {
    if (conn) conn.end();
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let conn;
  try {
    conn = await pool.getConnection();

    // Build dynamic update query
    const fields = [];
    const values = [];
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.studentNumber !== undefined) {
      fields.push('student_number = ?');
      values.push(updates.studentNumber);
    }
    if (updates.className !== undefined) {
      fields.push('class_name = ?');
      values.push(updates.className);
    }
    if (updates.lockerNumber !== undefined) {
      fields.push('locker_number = ?');
      values.push(updates.lockerNumber);
    }
    if (updates.collectionStatus !== undefined) {
      fields.push('collection_status = ?');
      values.push(updates.collectionStatus);
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      const query = `UPDATE students SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);
      await conn.query(query, values);
    }

    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ message: 'Failed to update student' });
  } finally {
    if (conn) conn.end();
  }
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM students WHERE id = ?', [id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Failed to delete student' });
  } finally {
    if (conn) conn.end();
  }
});

// Permissions endpoints
app.get('/api/permissions', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM permissions ORDER BY created_at DESC');
    const permissions = rows.map(formatPermission);
    res.json(permissions);
  } catch (err) {
    console.error('Error fetching permissions:', err);
    res.status(500).json({ message: 'Failed to fetch permissions' });
  } finally {
    if (conn) conn.end();
  }
});

app.post('/api/permissions', async (req, res) => {
  const { studentId, studentName, className, date, startTime, endTime, reason } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO permissions (student_id, student_name, class_name, date, start_time, end_time, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [studentId, studentName, className, date, startTime, endTime, reason]
    );
    res.status(201).json({
      id: result.insertId.toString(),
      message: 'Permission added successfully'
    });
  } catch (err) {
    console.error('Error adding permission:', err);
    res.status(500).json({ message: 'Failed to add permission' });
  } finally {
    if (conn) conn.end();
  }
});

app.delete('/api/permissions/:id', async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM permissions WHERE id = ?', [id]);
    res.json({ message: 'Permission deleted successfully' });
  } catch (err) {
    console.error('Error deleting permission:', err);
    res.status(500).json({ message: 'Failed to delete permission' });
  } finally {
    if (conn) conn.end();
  }
});

// Confiscations endpoints
app.get('/api/confiscations', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM confiscations ORDER BY created_at DESC');
    const confiscations = rows.map(formatConfiscation);
    res.json(confiscations);
  } catch (err) {
    console.error('Error fetching confiscations:', err);
    res.status(500).json({ message: 'Failed to fetch confiscations' });
  } finally {
    if (conn) conn.end();
  }
});

app.post('/api/confiscations', async (req, res) => {
  const { studentId, studentName, className, lockerNumber, reason, startDate, endDate, duration, status = 'active' } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO confiscations (student_id, student_name, class_name, locker_number, reason, start_date, end_date, duration, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [studentId, studentName, className, lockerNumber, reason, startDate, endDate, duration, status]
    );
    res.status(201).json({
      id: result.insertId.toString(),
      message: 'Confiscation added successfully'
    });
  } catch (err) {
    console.error('Error adding confiscation:', err);
    res.status(500).json({ message: 'Failed to add confiscation' });
  } finally {
    if (conn) conn.end();
  }
});

app.put('/api/confiscations/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  let conn;
  try {
    conn = await pool.getConnection();

    const fields = [];
    const values = [];
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.returnedAt !== undefined) {
      fields.push('returned_at = ?');
      values.push(updates.returnedAt);
    }

    if (fields.length > 0) {
      const query = `UPDATE confiscations SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);
      await conn.query(query, values);
    }

    res.json({ message: 'Confiscation updated successfully' });
  } catch (err) {
    console.error('Error updating confiscation:', err);
    res.status(500).json({ message: 'Failed to update confiscation' });
  } finally {
    if (conn) conn.end();
  }
});

app.delete('/api/confiscations/:id', async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM confiscations WHERE id = ?', [id]);
    res.json({ message: 'Confiscation deleted successfully' });
  } catch (err) {
    console.error('Error deleting confiscation:', err);
    res.status(500).json({ message: 'Failed to delete confiscation' });
  } finally {
    if (conn) conn.end();
  }
});

// Collection History endpoints
app.get('/api/collection-history', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM collection_history ORDER BY created_at DESC');
    const history = rows.map(formatCollectionHistory);
    res.json(history);
  } catch (err) {
    console.error('Error fetching collection history:', err);
    res.status(500).json({ message: 'Failed to fetch collection history' });
  } finally {
    if (conn) conn.end();
  }
});

app.post('/api/collection-history', async (req, res) => {
  const { studentId, status, date } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO collection_history (student_id, status, date, created_at) VALUES (?, ?, ?, NOW())',
      [studentId, status, date]
    );
    res.status(201).json({
      id: result.insertId.toString(),
      message: 'Collection history added successfully'
    });
  } catch (err) {
    console.error('Error adding collection history:', err);
    res.status(500).json({ message: 'Failed to add collection history' });
  } finally {
    if (conn) conn.end();
  }
});

app.delete('/api/collection-history/:id', async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM collection_history WHERE id = ?', [id]);
    res.json({ message: 'Collection history deleted successfully' });
  } catch (err) {
    console.error('Error deleting collection history:', err);
    res.status(500).json({ message: 'Failed to delete collection history' });
  } finally {
    if (conn) conn.end();
  }
});

// Bulk operations
app.post('/api/students/bulk-update-status', async (req, res) => {
  const { ids, status } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('UPDATE students SET collection_status = ?, updated_at = NOW() WHERE id IN (?)', [status, ids]);
    res.json({ message: 'Bulk update successful' });
  } catch (err) {
    console.error('Error bulk updating status:', err);
    res.status(500).json({ message: 'Failed to bulk update status' });
  } finally {
    if (conn) conn.end();
  }
});

app.post('/api/students/bulk-import', async (req, res) => {
  const students = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const values = students.map(student =>
      [student.name, student.studentNumber, student.className, student.lockerNumber, student.collectionStatus || 'not_collected']
    );
    await conn.batch(
      'INSERT INTO students (name, student_number, class_name, locker_number, collection_status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      values
    );
    res.status(201).json({ message: 'Students imported successfully' });
  } catch (err) {
    console.error('Error importing students:', err);
    res.status(500).json({ message: 'Failed to import students' });
  } finally {
    if (conn) conn.end();
  }
});

// Function to reset all students and permissions at midnight
async function midnightReset() {
  console.log('Running midnight reset...');
  let conn;
  try {
    conn = await pool.getConnection();

    // Reset all students' collection status to 'not_collected'
    await conn.query('UPDATE students SET collection_status = ?, updated_at = NOW()', ['not_collected']);
    console.log('All students reset to not_collected');

    // Delete all permissions
    await conn.query('DELETE FROM permissions');
    console.log('All permissions deleted');

    console.log('Midnight reset completed successfully');
  } catch (error) {
    console.error('Error during midnight reset:', error);
  } finally {
    if (conn) conn.end();
  }
}

// Schedule midnight reset every day at 00:00
cron.schedule('0 0 * * *', () => {
  console.log('Running midnight reset...');
  midnightReset();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'mariadb-local',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MariaDB Local Server running on port ${PORT}`);
  console.log('📍 This server connects to local MariaDB database');
  console.log('🔄 No automatic sync - manual sync only');
  console.log('⏰ Midnight reset scheduled for 00:00 daily');
});
