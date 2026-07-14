const fs = require('fs');
let html = fs.readFileSync('D:/CineWeave/dist/index.html', 'utf8');
const css = fs.readFileSync('D:/CineWeave/dist/assets/index-DjC2zH63.css', 'utf8');

// Replace CSS link with inline style
html = html.replace('<link rel="stylesheet" crossorigin href="/assets/index-DjC2zH63.css">', '<style>' + css + '</style>');

// Add cache-busting to JS
html = html.replace('/assets/index-D9jE3xpp.js', '/assets/index-D9jE3xpp.js?v=' + Date.now());

fs.writeFileSync('D:/CineWeave/dist/index.html', html);
console.log('HTML updated, size:', html.length);
