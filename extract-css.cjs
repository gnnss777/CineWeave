const fs = require('fs');
const js = fs.readFileSync('D:/CineWeave/dist/assets/app-v99.js', 'utf8');
const updateIdx = js.indexOf('updateStyle');
if (updateIdx > 0) {
  const context = js.substring(updateIdx - 500, updateIdx + 200);
  console.log('updateStyle context:', context);
} else {
  console.log('updateStyle not found');
  // Look for style injection
  const styleIdx = js.indexOf('createElement');
  if (styleIdx > 0) {
    console.log('createElement at:', styleIdx);
    console.log(js.substring(styleIdx - 100, styleIdx + 300));
  }
  // Look for the CSS content directly
  const rootIdx = js.indexOf(':root{');
  if (rootIdx > 0) {
    // Find the start of the string containing :root
    let start = rootIdx;
    while (start > 0 && js[start] !== '"' && js[start] !== "'" && js[start] !== '`') start--;
    // Find the end
    let end = rootIdx;
    const quote = js[start];
    end = start + 1;
    while (end < js.length && js[end] !== quote) end++;
    const css = js.substring(start + 1, end);
    fs.writeFileSync('D:/CineWeave/dist/assets/styles.css', css.replace(/\\n/g, '\n').replace(/\\'/g, "'"));
    console.log('CSS extracted, length:', css.length);
  }
}
