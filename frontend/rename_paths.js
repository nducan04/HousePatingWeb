const fs = require('fs');
const path = require('path');

const renameMap = {
  "bao-cao": "reports",
  "bao-hanh": "warranties",
  "doi-tac": "partners",
  "don-hang": "orders",
  "gia-thanh": "cost-analysis",
  "giohang": "cart",
  "hieu-suat": "performance",
  "kho": "inventory",
  "khuyen-mai": "promotions",
  "nha-cung-cap": "suppliers",
  "nhan-vien": "staff",
  "phanquyen": "roles",
  "quy-trinh": "processes",
  "san-pham": "products",
  "taikhoan": "accounts",
  "thanh-toan": "payments",
  "thanh-toan-hd": "contract-payments",
  "thong-ke": "statistics",
  "thongtin": "profile",
  "tin-tuc": "news",
  "van-chuyen": "shipping",
  "cua-hang": "shop",
  "lich-su-don-hang": "order-history",
  "truy-xuat": "trace"
};

const appDir = path.join(__dirname, 'app');

function renameDirectories(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      if (renameMap[item]) {
        const newPath = path.join(dir, renameMap[item]);
        console.log(`Renaming ${itemPath} to ${newPath}`);
        fs.renameSync(itemPath, newPath);
        // Recurse into the new directory
        renameDirectories(newPath);
      } else {
        renameDirectories(itemPath);
      }
    }
  }
}

function processFilesForLinks(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      if (item !== 'node_modules' && item !== '.next') {
        processFilesForLinks(itemPath);
      }
    } else if (itemPath.endsWith('.tsx') || itemPath.endsWith('.ts') || itemPath.endsWith('.js')) {
      let content = fs.readFileSync(itemPath, 'utf8');
      let originalContent = content;

      for (const [oldName, newName] of Object.entries(renameMap)) {
        // Replace exact paths or paths with subdirectories like "/don-hang/..."
        const regexes = [
          new RegExp(`"/${oldName}([/"])`, 'g'),
          new RegExp(`'/${oldName}([/'])`, 'g'),
          new RegExp(`\`/${oldName}([/\\\`])`, 'g')
        ];

        regexes.forEach((regex, idx) => {
          const quotes = ['"', "'", '`'];
          const quote = quotes[idx];
          content = content.replace(regex, (match, p1) => `${quote}/${newName}${p1}`);
        });
      }

      if (content !== originalContent) {
        console.log(`Updated links in ${itemPath}`);
        fs.writeFileSync(itemPath, content, 'utf8');
      }
    }
  }
}

// 1. Rename directories in app/
console.log("--- Renaming Directories ---");
renameDirectories(appDir);

// 2. Update links in all components and app/
console.log("--- Updating Links ---");
const componentsDir = path.join(__dirname, 'components');
processFilesForLinks(appDir);
if (fs.existsSync(componentsDir)) {
  processFilesForLinks(componentsDir);
}
const libDir = path.join(__dirname, 'lib');
if (fs.existsSync(libDir)) {
  processFilesForLinks(libDir);
}

console.log("Done.");
