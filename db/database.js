const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname);
fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(path.join(dbDir, 'quiz.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    username TEXT NOT NULL,
    correct INTEGER DEFAULT 0,
    incorrect INTEGER DEFAULT 0,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS guild_config (
    guild_id TEXT PRIMARY KEY,
    daily_channel_id TEXT,
    daily_hour INTEGER DEFAULT 22,
    daily_minute INTEGER DEFAULT 0,
    default_mode TEXT DEFAULT 'multiple'
  );

  CREATE INDEX IF NOT EXISTS idx_scores_guild_date ON scores(guild_id, date);
  CREATE INDEX IF NOT EXISTS idx_scores_user_guild ON scores(user_id, guild_id);
`);

// --- Score functions ---

function recordAnswer(userId, guildId, username, correct) {
  const today = getDateString();
  const existing = db.prepare(`
    SELECT id FROM scores WHERE user_id = ? AND guild_id = ? AND date = ?
  `).get(userId, guildId, today);

  if (existing) {
    if (correct) {
      db.prepare(`UPDATE scores SET correct = correct + 1 WHERE id = ?`).run(existing.id);
    } else {
      db.prepare(`UPDATE scores SET incorrect = incorrect + 1 WHERE id = ?`).run(existing.id);
    }
  } else {
    db.prepare(`
      INSERT INTO scores (user_id, guild_id, username, correct, incorrect, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, guildId, username, correct ? 1 : 0, correct ? 0 : 1, today);
  }
}

function getLeaderboard(guildId, range = 'alltime') {
  const { start, end } = getDateRange(range);

  return db.prepare(`
    SELECT
      user_id,
      username,
      SUM(correct) as correct,
      SUM(incorrect) as incorrect,
      SUM(correct) + SUM(incorrect) as total,
      ROUND(CAST(SUM(correct) AS FLOAT) / (SUM(correct) + SUM(incorrect)) * 100, 1) as accuracy
    FROM scores
    WHERE guild_id = ?
      AND date >= ?
      AND date <= ?
    GROUP BY user_id
    ORDER BY correct DESC, accuracy DESC
    LIMIT 10
  `).all(guildId, start, end);
}

function getUserStats(userId, guildId) {
  const today = getDateString();
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  const query = (start, end) => db.prepare(`
    SELECT COALESCE(SUM(correct), 0) as correct, COALESCE(SUM(incorrect), 0) as incorrect
    FROM scores WHERE user_id = ? AND guild_id = ? AND date >= ? AND date <= ?
  `).get(userId, guildId, start, end);

  return {
    daily: query(today, today),
    weekly: query(weekStart, today),
    monthly: query(monthStart, today),
    alltime: query('2000-01-01', today)
  };
}

// --- Guild config functions ---

function getGuildConfig(guildId) {
  const config = db.prepare(`SELECT * FROM guild_config WHERE guild_id = ?`).get(guildId);
  if (!config) {
    db.prepare(`INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)`).run(guildId);
    return { guild_id: guildId, daily_channel_id: null, daily_hour: 22, daily_minute: 0, default_mode: 'multiple' };
  }
  return config;
}

function setGuildConfig(guildId, key, value) {
  db.prepare(`INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)`).run(guildId);
  db.prepare(`UPDATE guild_config SET ${key} = ? WHERE guild_id = ?`).run(value, guildId);
}

function getAllGuildConfigs() {
  return db.prepare(`SELECT * FROM guild_config WHERE daily_channel_id IS NOT NULL`).all();
}

// --- Date helpers ---

function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return getDateString(d);
}

function getMonthStart() {
  const d = new Date();
  d.setDate(1);
  return getDateString(d);
}

function getYearStart() {
  const d = new Date();
  d.setMonth(0, 1);
  return getDateString(d);
}

function getDateRange(range) {
  const today = getDateString();
  switch (range) {
    case 'daily':   return { start: today, end: today };
    case 'weekly':  return { start: getWeekStart(), end: today };
    case 'monthly': return { start: getMonthStart(), end: today };
    case 'yearly':  return { start: getYearStart(), end: today };
    default:        return { start: '2000-01-01', end: today };
  }
}

module.exports = {
  recordAnswer,
  getLeaderboard,
  getUserStats,
  getGuildConfig,
  setGuildConfig,
  getAllGuildConfigs
};

// Migration: add daily_only column if it doesn't exist
try {
  db.exec(`ALTER TABLE guild_config ADD COLUMN daily_only INTEGER DEFAULT 0`);
} catch (e) {
  // Column already exists, ignore
}
