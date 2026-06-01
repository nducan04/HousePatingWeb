const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replacements
  // Chatbot & Backend specifically
  content = content.replace(/\| 'Kg'/g, "| 'Thùng'");
  content = content.replace(/\|\| 'Kg'/g, "|| 'Thùng'");
  content = content.replace(/\} kg/gi, "} thùng");
  content = content.replace(/kg sơn/gi, "thùng sơn");
  content = content.replace(/kg bột/gi, "thùng bột");
  content = content.replace(/1 kg/gi, "1 thùng");
  content = content.replace(/1kg/gi, "1 thùng");
  content = content.replace(/bao nhiêu kg/gi, "bao nhiêu thùng");
  content = content.replace(/500 kg/gi, "25 thùng");
  content = content.replace(/100 kg/gi, "5 thùng");
  content = content.replace(/1000 \/ 6 = \*\*~166 kg\*\*/g, "1000 / 120 = **~8.3 thùng**");

  // General Frontend & data replacements
  content = content.replace(/Thùng 20kg/gi, "1 Thùng (20kg)");
  content = content.replace(/Thùng 25kg/gi, "1 Thùng (25kg)");
  content = content.replace(/m²\/kg/gi, "m²/thùng");
  
  // Replace standalone kg tags
  content = content.replace(/\bkg\b/g, "thùng");
  content = content.replace(/\bKg\b/g, "Thùng");
  content = content.replace(/\(kg\)/g, "(thùng)");
  content = content.replace(/\(Kg\)/g, "(Thùng)");
  content = content.replace(/Kilogram/g, "Thùng");
  content = content.replace(/kilogram/g, "thùng");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next') && !fullPath.includes('.git')) {
        walkDir(fullPath);
      }
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
        replaceInFile(fullPath);
      }
    }
  }
}

// target frontend and backend
walkDir(path.join(__dirname, 'frontend', 'app'));
walkDir(path.join(__dirname, 'frontend', 'components'));
walkDir(path.join(__dirname, 'frontend', 'lib'));
walkDir(path.join(__dirname, 'backend', 'src', 'controllers'));
walkDir(path.join(__dirname, 'backend', 'src', 'models'));

console.log('All done.');
