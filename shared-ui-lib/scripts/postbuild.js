const fs = require('fs');
const path = require('path');

const distPackagePath = path.join(__dirname, '..', 'dist', 'package.json');

if (!fs.existsSync(distPackagePath)) {
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(distPackagePath, 'utf8'));
pkg.exports = pkg.exports || {};
pkg.exports['./tokens.css'] = { default: './tokens.css' };

fs.writeFileSync(distPackagePath, JSON.stringify(pkg, null, 2) + '\n');
