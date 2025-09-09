const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SessionManager = require('./models/session');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://cal.catto.at", "http://cal.catto.at"]
      : ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const MASTER_PASSWORD_HASH = process.env.MASTER_PASSWORD_HASH || '$2b$10$.4YUm7TpS9W1FvCV5rpY3O/eI/4d9pDF4QNhLVuBY9YRDF3QfSmru'; // Default: 'AetherialSession2025!'

app.use(cors());
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

const calendarConfig = {
  year_len: 528,
  events: 1,
  n_months: 12,
  months: ["Auro'ithil","Man'alasse","Thael'orne","Pel'anor","Drac'uial","Val'kaurn","Shad'morn","Ley'thurin","Nex'illien","Tun'giliath","Mor'galad","Cir'annen"],
  month_len: {
    "Auro'ithil": 44, "Man'alasse": 44, "Thael'orne": 44, "Pel'anor": 44,
    "Drac'uial": 44, "Val'kaurn": 44, "Shad'morn": 44, "Ley'thurin": 44,
    "Nex'illien": 44, "Tun'giliath": 44, "Mor'galad": 44, "Cir'annen": 44
  },
  week_len: 8,
  weekdays: ["Auro'dae","Sol'dae","Wis'dae","Man'dae","Drak'dae","Um'dae","Ley'dae","Nex'dae"],
  n_moons: 3,
  moons: ["Lumenis (Der Große Weiße Mond)","Umbrath (Der Schattenmond)","Manith (Der Kleine Arkane Mond)"],
  lunar_cyc: {
    "Lumenis (Der Große Weiße Mond)": 12,
    "Umbrath (Der Schattenmond)": 6,
    "Manith (Der Kleine Arkane Mond)": 48
  },
  lunar_shf: {
    "Lumenis (Der Große Weiße Mond)": 0,
    "Umbrath (Der Schattenmond)": 0,
    "Manith (Der Kleine Arkane Mond)": 0
  },
  year: 1048,
  first_day: 0,
  notes: {}
};

const dbPath = process.env.DATABASE_PATH || './calendar.db';
const db = new sqlite3.Database(dbPath);
const sessionManager = new SessionManager(db);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    day INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    confirmed BOOLEAN DEFAULT 0,
    is_recurring BOOLEAN DEFAULT 0,
    recurring_type TEXT DEFAULT NULL,
    recurring_interval INTEGER DEFAULT 1,
    recurring_end_date TEXT DEFAULT NULL,
    recurring_parent_id INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (recurring_parent_id) REFERENCES events(id)
  )`);
  
  // Migration: Add confirmed column to existing events table
  db.run(`ALTER TABLE events ADD COLUMN confirmed BOOLEAN DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Migration error:', err);
    }
  });

  // Migration: Add recurring columns to existing events table
  const recurringColumns = [
    'is_recurring BOOLEAN DEFAULT 0',
    'recurring_type TEXT DEFAULT NULL',
    'recurring_interval INTEGER DEFAULT 1', 
    'recurring_end_date TEXT DEFAULT NULL',
    'recurring_parent_id INTEGER DEFAULT NULL'
  ];

  recurringColumns.forEach(column => {
    db.run(`ALTER TABLE events ADD COLUMN ${column}`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Recurring migration error:', err);
      }
    });
  });

  // Create categories table
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3498db',
    emoji TEXT DEFAULT '📅',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, name),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  )`);

  // Add category_id to events table
  db.run(`ALTER TABLE events ADD COLUMN category_id INTEGER DEFAULT NULL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Category migration error:', err);
    }
  });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const isValidPassword = await bcrypt.compare(password, MASTER_PASSWORD_HASH);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { authenticated: true, timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, message: 'Authentication successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/config', (req, res) => {
  res.json(calendarConfig);
});

app.get('/api/events/:sessionId/:year/:month', authenticateToken, (req, res) => {
  const { sessionId, year, month } = req.params;
  
  db.all(
    'SELECT * FROM events WHERE session_id = ? AND year = ? AND month = ? ORDER BY day',
    [sessionId, year, month],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Helper function to calculate next occurrence date
const calculateNextDate = (year, month, day, recurringType, interval) => {
  const date = new Date(year, month, day);
  
  switch (recurringType) {
    case 'daily':
      date.setDate(date.getDate() + interval);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (7 * interval));
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + interval);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + interval);
      break;
  }
  
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate()
  };
};

// Helper function to create recurring events
const createRecurringEvents = (session_id, year, month, day, title, description, recurringType, interval, endDate, parentId, categoryId) => {
  return new Promise((resolve, reject) => {
    const events = [];
    const endDateObj = endDate ? new Date(endDate) : null;
    let currentYear = year;
    let currentMonth = month;
    let currentDay = day;
    let iterations = 0;
    const maxIterations = 100; // Safety limit
    
    while (iterations < maxIterations) {
      const nextDate = calculateNextDate(currentYear, currentMonth, currentDay, recurringType, interval);
      const eventDate = new Date(nextDate.year, nextDate.month, nextDate.day);
      
      if (endDateObj && eventDate > endDateObj) {
        break;
      }
      
      events.push({
        session_id,
        year: nextDate.year,
        month: nextDate.month,
        day: nextDate.day,
        title,
        description,
        is_recurring: 1,
        recurring_type: recurringType,
        recurring_interval: interval,
        recurring_end_date: endDate,
        recurring_parent_id: parentId,
        category_id: categoryId
      });
      
      currentYear = nextDate.year;
      currentMonth = nextDate.month;
      currentDay = nextDate.day;
      iterations++;
      
      // If no end date, only create next 20 occurrences
      if (!endDateObj && iterations >= 20) {
        break;
      }
    }
    
    if (events.length === 0) {
      resolve([]);
      return;
    }
    
    // Insert all events in a transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let completed = 0;
      let hasError = false;
      
      events.forEach((event) => {
        db.run(
          'INSERT INTO events (session_id, year, month, day, title, description, is_recurring, recurring_type, recurring_interval, recurring_end_date, recurring_parent_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [event.session_id, event.year, event.month, event.day, event.title, event.description, event.is_recurring, event.recurring_type, event.recurring_interval, event.recurring_end_date, event.recurring_parent_id, event.category_id],
          function(err) {
            if (err && !hasError) {
              hasError = true;
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            if (!hasError) {
              completed++;
              if (completed === events.length) {
                db.run('COMMIT');
                resolve(events);
              }
            }
          }
        );
      });
    });
  });
};

app.post('/api/events', authenticateToken, async (req, res) => {
  const { session_id, year, month, day, title, description, is_recurring, recurring_type, recurring_interval, recurring_end_date, category_id } = req.body;
  
  try {
    // Insert the main event first
    const insertPromise = new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO events (session_id, year, month, day, title, description, is_recurring, recurring_type, recurring_interval, recurring_end_date, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [session_id, year, month, day, title, description, is_recurring ? 1 : 0, recurring_type || null, recurring_interval || 1, recurring_end_date || null, category_id || null],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.lastID);
        }
      );
    });

    const mainEventId = await insertPromise;
    const newEvent = { 
      id: mainEventId, 
      session_id, 
      year, 
      month, 
      day, 
      title, 
      description, 
      is_recurring: is_recurring ? 1 : 0,
      recurring_type: recurring_type || null,
      recurring_interval: recurring_interval || 1,
      recurring_end_date: recurring_end_date || null
    };

    let recurringEvents = [];
    
    // If this is a recurring event, create the subsequent events
    if (is_recurring && recurring_type) {
      recurringEvents = await createRecurringEvents(
        session_id, 
        year, 
        month, 
        day, 
        title, 
        description, 
        recurring_type, 
        recurring_interval || 1, 
        recurring_end_date, 
        mainEventId,
        category_id || null
      );
    }
    
    // Broadcast to all clients in the session
    if (session_id) {
      io.to(session_id).emit('event-added', {
        event: newEvent,
        recurringEvents,
        timestamp: new Date()
      });
    }
    
    res.json({ event: newEvent, recurringEvents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Categories API
app.get('/api/sessions/:sessionId/categories', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const categories = await sessionManager.getCategories(sessionId);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions/:sessionId/categories', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, color, emoji } = req.body;
    const category = await sessionManager.createCategory(sessionId, name, color, emoji);
    
    // Broadcast to all clients in the session
    io.to(sessionId).emit('category-added', {
      category,
      timestamp: new Date()
    });
    
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:categoryId', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { sessionId } = req.body;
    const result = await sessionManager.deleteCategory(categoryId);
    
    // Broadcast to all clients in the session
    if (sessionId) {
      io.to(sessionId).emit('category-deleted', {
        categoryId: parseInt(categoryId),
        timestamp: new Date()
      });
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Session Management API
app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await sessionManager.getAllSessions();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const { id, name, description, startYear, startMonth } = req.body;
    const session = await sessionManager.createSession(id, name, description, startYear, startMonth);
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public session validation endpoint (no auth required)
app.get('/api/sessions/:id/exists', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Validating session existence:', id);
    const session = await sessionManager.getSession(id);
    if (!session) {
      console.log('❌ Session does not exist:', id);
      res.status(404).json({ exists: false, error: 'Session not found' });
      return;
    }
    console.log('✅ Session exists:', id);
    res.json({ exists: true, id: session.id, name: session.name });
  } catch (err) {
    console.log('💥 Session validation error:', err.message);
    res.status(500).json({ exists: false, error: err.message });
  }
});

app.get('/api/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const session = await sessionManager.getSession(id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Party Group API
app.post('/api/sessions/:sessionId/groups', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, color } = req.body;
    const group = await sessionManager.createPartyGroup(sessionId, name, color);
    
    // Broadcast to all clients in the session
    io.to(sessionId).emit('party-group-added', {
      group,
      timestamp: new Date()
    });
    
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions/:sessionId/groups', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const groups = await sessionManager.getPartyGroups(sessionId);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/groups/:groupId/position', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { year, month, day, sessionId } = req.body;
    const result = await sessionManager.updatePartyPosition(groupId, year, month, day);
    
    // Broadcast to all clients in the session
    if (sessionId) {
      io.to(sessionId).emit('party-position-updated', {
        groupId,
        year,
        month,
        day,
        timestamp: new Date()
      });
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Party Group API
app.delete('/api/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { sessionId } = req.body;
    const result = await sessionManager.deletePartyGroup(groupId);
    
    // Broadcast to all clients in the session
    if (sessionId) {
      io.to(sessionId).emit('party-group-deleted', {
        groupId: parseInt(groupId),
        timestamp: new Date()
      });
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Event API
app.delete('/api/events/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sessionId } = req.body;
    
    // Get event details before deleting for broadcast
    const event = await sessionManager.getEvent(eventId);
    
    const result = await sessionManager.deleteEvent(eventId);
    
    // Broadcast to all clients in the session
    if (sessionId && event) {
      io.to(sessionId).emit('event-deleted', {
        eventId: parseInt(eventId),
        event: event,
        timestamp: new Date()
      });
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Move Event API - Update event date
app.put('/api/events/:eventId/move', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sessionId, year, month, day } = req.body;
    
    if (!sessionId || year === undefined || month === undefined || day === undefined) {
      return res.status(400).json({ error: 'Session ID, year, month, and day are required' });
    }

    // First get the current event to verify it exists and belongs to the session
    const getCurrentEvent = () => {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM events WHERE id = ? AND session_id = ?', [eventId, sessionId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    };

    const currentEvent = await getCurrentEvent();
    if (!currentEvent) {
      return res.status(404).json({ error: 'Event not found or does not belong to this session' });
    }

    // Update the event's date
    const updateEvent = () => {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE events SET year = ?, month = ?, day = ? WHERE id = ? AND session_id = ?',
          [year, month, day, eventId, sessionId],
          function(err) {
            if (err) reject(err);
            else resolve({ changes: this.changes });
          }
        );
      });
    };

    const result = await updateEvent();
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get the updated event
    const updatedEvent = await getCurrentEvent();
    
    // Broadcast to all clients in the session
    io.to(sessionId).emit('event-moved', {
      eventId: parseInt(eventId),
      event: updatedEvent,
      oldDate: { year: currentEvent.year, month: currentEvent.month, day: currentEvent.day },
      newDate: { year, month, day },
      timestamp: new Date()
    });
    
    res.json({ success: true, event: updatedEvent });
  } catch (err) {
    console.error('Move event error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Event Confirmation API
app.put('/api/events/:eventId/confirm', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { sessionId, confirmed } = req.body;
    
    const result = await sessionManager.updateEventConfirmation(eventId, confirmed);
    
    // Broadcast to all clients in the session
    if (sessionId) {
      io.to(sessionId).emit('event-confirmation-updated', {
        eventId: parseInt(eventId),
        confirmed: confirmed,
        timestamp: new Date()
      });
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Completed Days API
app.get('/api/sessions/:sessionId/completed/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { sessionId, year, month } = req.params;
    const completedDays = await sessionManager.getCompletedDays(sessionId, parseInt(year), parseInt(month));
    res.json(completedDays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all completed days for a session (for finding current month)
app.get('/api/sessions/:sessionId/completed', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const completedDays = await sessionManager.getAllCompletedDays(sessionId);
    res.json(completedDays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions/:sessionId/completed', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { year, month, day } = req.body;
    const result = await sessionManager.markDayCompleted(sessionId, year, month, day);
    
    // Broadcast to all clients in the session
    io.to(sessionId).emit('day-completed', {
      sessionId,
      year,
      month,
      day,
      timestamp: new Date()
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sessions/:sessionId/completed/:year/:month/:day', authenticateToken, async (req, res) => {
  try {
    const { sessionId, year, month, day } = req.params;
    const result = await sessionManager.unmarkDayCompleted(sessionId, parseInt(year), parseInt(month), parseInt(day));
    
    // Broadcast to all clients in the session
    io.to(sessionId).emit('day-uncompleted', {
      sessionId,
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      timestamp: new Date()
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search API - Search events and notes by keyword
app.get('/api/sessions/:sessionId/search', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { q: query, year, month } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long' });
    }

    const searchQuery = `%${query.trim().toLowerCase()}%`;
    let sql = `
      SELECT e.*, c.name as category_name, c.color as category_color, c.emoji as category_emoji
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.session_id = ? AND (
        LOWER(e.title) LIKE ? OR 
        LOWER(e.description) LIKE ?
      )
    `;
    const params = [sessionId, searchQuery, searchQuery];

    // Add optional year/month filters
    if (year && !isNaN(parseInt(year))) {
      sql += ' AND e.year = ?';
      params.push(parseInt(year));
    }
    
    if (month && !isNaN(parseInt(month))) {
      sql += ' AND e.month = ?';
      params.push(parseInt(month));
    }

    sql += ' ORDER BY e.year DESC, e.month DESC, e.day DESC, e.created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: err.message });
        return;
      }

      const results = rows.map(row => ({
        id: row.id,
        session_id: row.session_id,
        year: row.year,
        month: row.month,
        day: row.day,
        title: row.title,
        description: row.description,
        confirmed: row.confirmed,
        is_recurring: row.is_recurring,
        category_id: row.category_id,
        category: row.category_name ? {
          name: row.category_name,
          color: row.category_color,
          emoji: row.category_emoji
        } : null,
        created_at: row.created_at,
        type: row.title.startsWith('📝') ? 'note' : 'event'
      }));

      res.json({
        query: query.trim(),
        total: results.length,
        results
      });
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Session API with special password
app.delete('/api/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { password } = req.body;
    
    console.log('🗑️ Session deletion request for:', sessionId);
    
    // Check for special deletion password
    if (password !== 'theonetodeletethem') {
      console.log('❌ Invalid deletion password');
      return res.status(403).json({ error: 'Invalid deletion password' });
    }
    
    console.log('✅ Valid deletion password, proceeding with deletion');
    
    // First check if session exists
    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const result = await sessionManager.deleteSession(sessionId);
    console.log('🗑️ Session deleted successfully:', sessionId);
    
    // Broadcast to all clients in the session before deleting
    io.to(sessionId).emit('session-deleted', {
      sessionId,
      timestamp: new Date()
    });
    
    res.json(result);
  } catch (err) {
    console.log('💥 Session deletion error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// In-memory storage for user roles (per socket connection)
const userRoles = new Map(); // socketId -> { sessionId, role, username }

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join session room with role (backward compatible)
  socket.on('join-session', (data) => {
    console.log('🔌 Socket join-session received data:', data, 'Type:', typeof data);
    
    let sessionId, role, username;
    
    // Handle both old format (string) and new format (object)
    if (typeof data === 'string') {
      // Old format - just session ID
      sessionId = data;
      role = 'Player';
      username = 'Anonymous';
    } else {
      // New format - object with sessionId, role, username
      sessionId = data.sessionId;
      role = data.role || 'Player';
      username = data.username || 'Anonymous';
    }
    
    // Validate role
    const validRoles = ['DM', 'Player'];
    const userRole = validRoles.includes(role) ? role : 'Player';
    
    // Store user role information
    userRoles.set(socket.id, {
      sessionId,
      role: userRole,
      username,
      joinedAt: new Date()
    });
    
    socket.join(sessionId);
    console.log(`User ${socket.id} (${username}) joined session ${sessionId} as ${userRole}`);
    
    // Broadcast user joined to session (only if new format with explicit role)
    if (typeof data === 'object') {
      socket.to(sessionId).emit('user-joined', {
        socketId: socket.id,
        username,
        role: userRole,
        timestamp: new Date()
      });
    }
  });

  // Leave session room
  socket.on('leave-session', (sessionId) => {
    const userInfo = userRoles.get(socket.id);
    if (userInfo) {
      socket.to(sessionId).emit('user-left', {
        socketId: socket.id,
        username: userInfo.username,
        role: userInfo.role,
        timestamp: new Date()
      });
      userRoles.delete(socket.id);
    }
    
    socket.leave(sessionId);
    console.log(`User ${socket.id} left session: ${sessionId}`);
  });

  // Get user role information
  socket.on('get-session-users', (sessionId) => {
    const sessionUsers = [];
    for (const [socketId, userInfo] of userRoles) {
      if (userInfo.sessionId === sessionId) {
        sessionUsers.push({
          socketId,
          username: userInfo.username,
          role: userInfo.role,
          joinedAt: userInfo.joinedAt
        });
      }
    }
    socket.emit('session-users', sessionUsers);
  });

  socket.on('disconnect', () => {
    const userInfo = userRoles.get(socket.id);
    if (userInfo) {
      socket.to(userInfo.sessionId).emit('user-left', {
        socketId: socket.id,
        username: userInfo.username,
        role: userInfo.role,
        timestamp: new Date()
      });
      userRoles.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

// Helper function to check user role
const getUserRole = (socketId) => {
  const userInfo = userRoles.get(socketId);
  return userInfo ? userInfo.role : null;
};

// Helper function to check if user is DM
const isDM = (socketId) => {
  return getUserRole(socketId) === 'DM';
};

// Catch-all handler for React Router in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`🌙 Aetherial Calender running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${dbPath}`);
});