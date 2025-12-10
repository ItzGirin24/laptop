  import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001; // Different port for ngrok server

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: "sostek2025",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sostek2025-default-rtdb.firebaseio.com"
});

const firestore = admin.firestore();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Helper functions
const formatStudent = (doc) => ({
  id: doc.id,
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate() || new Date(),
  updatedAt: doc.data().updatedAt?.toDate() || new Date()
});

const formatPermission = (doc) => ({
  id: doc.id,
  ...doc.data(),
  date: doc.data().date?.toDate() || new Date(),
  createdAt: doc.data().createdAt?.toDate() || new Date()
});

const formatConfiscation = (doc) => ({
  id: doc.id,
  ...doc.data(),
  startDate: doc.data().startDate?.toDate() || new Date(),
  endDate: doc.data().endDate?.toDate() || new Date(),
  returnedAt: doc.data().returnedAt?.toDate(),
  createdAt: doc.data().createdAt?.toDate() || new Date()
});

const formatCollectionHistory = (doc) => ({
  id: doc.id,
  ...doc.data(),
  date: doc.data().date?.toDate() || new Date(),
  createdAt: doc.data().createdAt?.toDate() || new Date()
});

// Students endpoints
app.get('/api/students', async (req, res) => {
  try {
    const snapshot = await firestore.collection('students').orderBy('createdAt', 'desc').get();
    const students = snapshot.docs.map(formatStudent);
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { name, studentNumber, className, lockerNumber, collectionStatus = 'not_collected' } = req.body;
    const docRef = await firestore.collection('students').add({
      name,
      studentNumber,
      className,
      lockerNumber,
      collectionStatus,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({
      id: docRef.id,
      message: 'Student added successfully'
    });
  } catch (err) {
    console.error('Error adding student:', err);
    res.status(500).json({ message: 'Failed to add student' });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await firestore.collection('students').doc(id).update(updates);
    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ message: 'Failed to update student' });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await firestore.collection('students').doc(id).delete();
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Failed to delete student' });
  }
});

// Permissions endpoints
app.get('/api/permissions', async (req, res) => {
  try {
    const snapshot = await firestore.collection('permissions').orderBy('createdAt', 'desc').get();
    const permissions = snapshot.docs.map(formatPermission);
    res.json(permissions);
  } catch (err) {
    console.error('Error fetching permissions:', err);
    res.status(500).json({ message: 'Failed to fetch permissions' });
  }
});

app.post('/api/permissions', async (req, res) => {
  try {
    const { studentId, studentName, className, date, startTime, endTime, reason } = req.body;
    const docRef = await firestore.collection('permissions').add({
      studentId,
      studentName,
      className,
      date: new Date(date),
      startTime,
      endTime,
      reason,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({
      id: docRef.id,
      message: 'Permission added successfully'
    });
  } catch (err) {
    console.error('Error adding permission:', err);
    res.status(500).json({ message: 'Failed to add permission' });
  }
});

app.delete('/api/permissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await firestore.collection('permissions').doc(id).delete();
    res.json({ message: 'Permission deleted successfully' });
  } catch (err) {
    console.error('Error deleting permission:', err);
    res.status(500).json({ message: 'Failed to delete permission' });
  }
});

// Confiscations endpoints
app.get('/api/confiscations', async (req, res) => {
  try {
    const snapshot = await firestore.collection('confiscations').orderBy('createdAt', 'desc').get();
    const confiscations = snapshot.docs.map(formatConfiscation);
    res.json(confiscations);
  } catch (err) {
    console.error('Error fetching confiscations:', err);
    res.status(500).json({ message: 'Failed to fetch confiscations' });
  }
});

app.post('/api/confiscations', async (req, res) => {
  try {
    const { studentId, studentName, className, lockerNumber, reason, startDate, endDate, duration, status = 'active' } = req.body;
    const docRef = await firestore.collection('confiscations').add({
      studentId,
      studentName,
      className,
      lockerNumber,
      reason,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration,
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({
      id: docRef.id,
      message: 'Confiscation added successfully'
    });
  } catch (err) {
    console.error('Error adding confiscation:', err);
    res.status(500).json({ message: 'Failed to add confiscation' });
  }
});

app.put('/api/confiscations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await firestore.collection('confiscations').doc(id).update(updates);
    res.json({ message: 'Confiscation updated successfully' });
  } catch (err) {
    console.error('Error updating confiscation:', err);
    res.status(500).json({ message: 'Failed to update confiscation' });
  }
});

app.delete('/api/confiscations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await firestore.collection('confiscations').doc(id).delete();
    res.json({ message: 'Confiscation deleted successfully' });
  } catch (err) {
    console.error('Error deleting confiscation:', err);
    res.status(500).json({ message: 'Failed to delete confiscation' });
  }
});

// Collection History endpoints
app.get('/api/collection-history', async (req, res) => {
  try {
    const snapshot = await firestore.collection('collectionHistory').orderBy('createdAt', 'desc').get();
    const history = snapshot.docs.map(formatCollectionHistory);
    res.json(history);
  } catch (err) {
    console.error('Error fetching collection history:', err);
    res.status(500).json({ message: 'Failed to fetch collection history' });
  }
});

app.post('/api/collection-history', async (req, res) => {
  try {
    const { studentId, status, date } = req.body;
    const docRef = await firestore.collection('collectionHistory').add({
      studentId,
      status,
      date: new Date(date),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({
      id: docRef.id,
      message: 'Collection history added successfully'
    });
  } catch (err) {
    console.error('Error adding collection history:', err);
    res.status(500).json({ message: 'Failed to add collection history' });
  }
});

app.delete('/api/collection-history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await firestore.collection('collectionHistory').doc(id).delete();
    res.json({ message: 'Collection history deleted successfully' });
  } catch (err) {
    console.error('Error deleting collection history:', err);
    res.status(500).json({ message: 'Failed to delete collection history' });
  }
});

// Bulk operations
app.post('/api/students/bulk-update-status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    const batch = firestore.batch();

    for (const id of ids) {
      const docRef = firestore.collection('students').doc(id);
      batch.update(docRef, {
        collectionStatus: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    res.json({ message: 'Bulk update successful' });
  } catch (err) {
    console.error('Error bulk updating status:', err);
    res.status(500).json({ message: 'Failed to bulk update status' });
  }
});

app.post('/api/students/bulk-import', async (req, res) => {
  try {
    const students = req.body;
    const batch = firestore.batch();

    for (const student of students) {
      const docRef = firestore.collection('students').doc();
      batch.set(docRef, {
        ...student,
        collectionStatus: student.collectionStatus || 'not_collected',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    res.status(201).json({ message: 'Students imported successfully' });
  } catch (err) {
    console.error('Error importing students:', err);
    res.status(500).json({ message: 'Failed to import students' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Ngrok Firebase Server is running!',
    server: 'ngrok-firebase',
    port: PORT,
    endpoints: {
      health: '/api/health',
      students: '/api/students',
      permissions: '/api/permissions',
      confiscations: '/api/confiscations',
      collectionHistory: '/api/collection-history'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'ngrok-firebase',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Ngrok Firebase Server running on port ${PORT}`);
  console.log('📍 This server connects to Firebase Firestore');
});
