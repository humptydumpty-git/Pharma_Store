const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 3000;
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log('Request for ' + req.url);
    
    // Parse the URL
    const parsedUrl = url.parse(req.url);
    let pathname = `.${parsedUrl.pathname}`;
    
    // Default to index.html if no file is specified
    if (pathname === './' || pathname === '') {
        pathname = './index.html';
    }

    // Get the file extension
    const extname = String(path.extname(pathname)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Read the file
    fs.readFile(pathname, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                if (req.url === '/' || req.url === '/index.html' || req.url === '') {
                    // If index.html is not found, send a basic response
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('Index file not found. Please ensure index.html exists in the root directory.', 'utf-8');
                } else {
                    // For other files, send 404
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('404 Not Found: ' + req.url, 'utf-8');
                }
            } else {
                // Server error
                res.writeHead(500);
                res.end('Server Error: ' + error.code + '\n');
            }
        } else {
            // Successful response
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            res.end(content, 'utf-8');
        }
    });
});

// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Start the server
server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log('Serving files from:', process.cwd());
    console.log('Press Ctrl+C to stop the server');
});
