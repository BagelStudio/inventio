import { createServer, IncomingMessage, ServerResponse } from 'http';
import sqlite3 from 'sqlite3';
import formidable, { Fields, Files, Part } from 'formidable';
import slugify from 'slugify';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const port = 8888;

// SQLite setup
const db = new sqlite3.Database('./lostfound.db', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to SQLite database.');
});

db.run(`DROP TABLE IF EXISTS items`);

db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    description TEXT,
    attributes TEXT,
    imagePath TEXT
)`);

// Helper to parse query string for GET requests
const parseQuery = (url: string) => {
    const urlObj = new URL(url, `http://localhost:${port}`);
    return Object.fromEntries(urlObj.searchParams.entries());
};

// Server
const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    // Set CORS headers (since no Express middleware)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Serve uploaded images
    if (req.url?.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'image/jpeg' }); // Adjust MIME type as needed
            res.end(data);
            
        });
        return;
    }

    // POST /lost - Submit lost item
    if (req.method === 'POST' && req.url === '/lost') {
        const form = formidable({
            uploadDir: './uploads',
            keepExtensions: true,
            filename: (name: String, ext : String, part : Part) => {
                const originalFilename = slugify(part.originalFilename || 'unknown', '_');
                return `${Date.now()}-${originalFilename}`
            }
        });

        form.parse(req, (err: Error, fields: Fields, files: Files) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error parsing form' }));
                return;
            }

            const description = fields.description as string[];
            const image = Array.isArray(files.image) ? files.image[0] : files.image as formidable.File | undefined;
            const imagePath = image ? `/uploads/${image.newFilename}` : null;
            console.log(fields.description);

            let imageAttributes : string[] = [];
            if (fields.attributes) {
                imageAttributes = fields.attributes as string[];
                console.log(fields.attributes);
            } else {
                console.log("No image attribures passed.");
            }

            db.run(
                `INSERT INTO items (type, description, attributes, imagePath) VALUES (?, ?, ?, ?)`,
                ['lost', description[0], JSON.parse(imageAttributes[0]), imagePath],
                (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Error saving item' }));
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Lost item submitted!' }));
                }
            );
        });
        return;
    }

    // GET /search - Search found items
    if (req.method === 'GET' && req.url?.startsWith('/search')) {
        const query = parseQuery(req.url);
        const description = query.description || '';

        db.all(
            `SELECT * FROM items WHERE type = 'lost' AND description LIKE ?`,
            [`%${description}%`],
            (err, rows) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Error searching' }));
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(rows));
            }
        );
        return;
    }

    // 404 for unmatched routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Create uploads folder if it doesn't exist
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}