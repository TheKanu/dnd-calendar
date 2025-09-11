const sqlite3 = require('sqlite3').verbose();

class SessionManager {
  constructor(db) {
    this.db = db;
    this.initTables();
  }

  initTables() {
    this.db.serialize(() => {
      this.db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        start_year INTEGER DEFAULT 1048,
        start_month INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      this.db.run(`CREATE TABLE IF NOT EXISTS party_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#ff6b6b',
        current_year INTEGER DEFAULT 1048,
        current_month INTEGER DEFAULT 0,
        current_day INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )`);

      this.db.run(`CREATE TABLE IF NOT EXISTS completed_days (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, year, month, day),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )`);
    });
  }

  createSession(id, name, description = '', startYear = 1048, startMonth = 0) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO sessions (id, name, description, start_year, start_month) VALUES (?, ?, ?, ?, ?)',
        [id, name, description, startYear, startMonth],
        function(err) {
          if (err) reject(err);
          else resolve({ id, name, description, start_year: startYear, start_month: startMonth });
        }
      );
    });
  }

  getSession(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM sessions WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  getAllSessions() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT id, name, description, start_year, start_month, created_at FROM sessions ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  createPartyGroup(sessionId, name, color = '#ff6b6b') {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO party_groups (session_id, name, color) VALUES (?, ?, ?)',
        [sessionId, name, color],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, sessionId, name, color });
        }
      );
    });
  }

  getPartyGroups(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM party_groups WHERE session_id = ?',
        [sessionId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  updatePartyPosition(groupId, year, month, day) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE party_groups SET current_year = ?, current_month = ?, current_day = ? WHERE id = ?',
        [year, month, day, groupId],
        function(err) {
          if (err) reject(err);
          else resolve({ groupId, year, month, day });
        }
      );
    });
  }

  markDayCompleted(sessionId, year, month, day) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO completed_days (session_id, year, month, day) VALUES (?, ?, ?, ?)',
        [sessionId, year, month, day],
        function(err) {
          if (err) reject(err);
          else resolve({ sessionId, year, month, day });
        }
      );
    });
  }

  unmarkDayCompleted(sessionId, year, month, day) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM completed_days WHERE session_id = ? AND year = ? AND month = ? AND day = ?',
        [sessionId, year, month, day],
        function(err) {
          if (err) reject(err);
          else resolve({ sessionId, year, month, day });
        }
      );
    });
  }

  getCompletedDays(sessionId, year, month) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM completed_days WHERE session_id = ? AND year = ? AND month = ?',
        [sessionId, year, month],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  getAllCompletedDays(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM completed_days WHERE session_id = ? ORDER BY year ASC, month ASC, day ASC',
        [sessionId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  deletePartyGroup(groupId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM party_groups WHERE id = ?',
        [groupId],
        function(err) {
          if (err) reject(err);
          else resolve({ groupId, deleted: this.changes > 0 });
        }
      );
    });
  }

  getEvent(eventId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM events WHERE id = ?',
        [eventId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  deleteEvent(eventId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM events WHERE id = ?',
        [eventId],
        function(err) {
          if (err) reject(err);
          else resolve({ eventId, deleted: this.changes > 0 });
        }
      );
    });
  }

  deleteEventSeries(parentId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM events WHERE id = ? OR recurring_parent_id = ?',
        [parentId, parentId],
        function(err) {
          if (err) reject(err);
          else resolve({ parentId, seriesDeleted: this.changes > 0, deletedCount: this.changes });
        }
      );
    });
  }

  updateEventConfirmation(eventId, confirmed) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE events SET confirmed = ? WHERE id = ?',
        [confirmed ? 1 : 0, eventId],
        function(err) {
          if (err) reject(err);
          else resolve({ eventId, confirmed: confirmed, updated: this.changes > 0 });
        }
      );
    });
  }

  getCategories(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM categories WHERE session_id = ? ORDER BY name',
        [sessionId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  createCategory(sessionId, name, color = '#3498db', emoji = '📅') {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO categories (session_id, name, color, emoji) VALUES (?, ?, ?, ?)',
        [sessionId, name, color, emoji],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, session_id: sessionId, name, color, emoji });
        }
      );
    });
  }

  deleteCategory(categoryId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM categories WHERE id = ?',
        [categoryId],
        function(err) {
          if (err) reject(err);
          else resolve({ categoryId, deleted: this.changes > 0 });
        }
      );
    });
  }

  deleteSession(sessionId) {
    return new Promise((resolve, reject) => {
      const db = this.db; // Save reference to db
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete all related data first
        db.run('DELETE FROM events WHERE session_id = ?', [sessionId]);
        db.run('DELETE FROM party_groups WHERE session_id = ?', [sessionId]);
        db.run('DELETE FROM completed_days WHERE session_id = ?', [sessionId]);
        db.run('DELETE FROM categories WHERE session_id = ?', [sessionId]);
        
        // Finally delete the session
        db.run(
          'DELETE FROM sessions WHERE id = ?',
          [sessionId],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
            } else {
              db.run('COMMIT');
              resolve({ sessionId, deleted: this.changes > 0 });
            }
          }
        );
      });
    });
  }
}

module.exports = SessionManager;