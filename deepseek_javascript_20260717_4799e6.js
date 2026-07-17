// api/db.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const dbPath = path.join(process.cwd(), 'db.json');
    let db = {};
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    }
    res.status(200).json(db);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}