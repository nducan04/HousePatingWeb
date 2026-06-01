const mongoose = require('mongoose');

const colorMap = {
  'black': '#1E1E1E', 'white': '#F8F9FA', 'red': '#EF4444', 'blue': '#3B82F6',
  'green': '#10B981', 'yellow': '#F59E0B', 'grey': '#6B7280', 'gray': '#6B7280',
  'orange': '#F97316', 'purple': '#8B5CF6', 'pink': '#EC4899', 'brown': '#92400E',
  'silver': '#9CA3AF', 'gold': '#D97706', 'lavender': '#C4B5FD', 'mint': '#6EE7B7',
  'lime': '#84CC16', 'navy': '#1E3A8A', 'rose': '#F43F5E', 'ivory': '#FEF3C7',
  'champagne': '#FDE68A', 'bronze': '#B45309', 'copper': '#B45309', 'moss': '#14532D',
  'frost': '#E0F2FE', 'anthracite': '#374151', 'slate': '#475569'
};

const getHexForName = (name) => {
  const n = name.toLowerCase();
  for (const [key, hex] of Object.entries(colorMap)) {
    if (n.includes(key)) return hex;
  }
  // If no match, generate a deterministic color based on string hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

mongoose.connect('mongodb+srv://nducan08:anduc123@cluster0.vrs1i55.mongodb.net/vtsc_db?appName=Cluster0')
  .then(async () => {
    console.log('Connected to DB');
    const SP = require('./src/models/SanPhamSon');
    
    const products = await SP.find({});
    let updatedCount = 0;
    
    for (let p of products) {
      let isModified = false;
      if (p.DanhSachMaMau && p.DanhSachMaMau.length > 0) {
        for (let m of p.DanhSachMaMau) {
          if (!m.HexCode) {
            m.HexCode = getHexForName(m.TenMau);
            isModified = true;
          }
        }
      }
      if (isModified) {
        await SP.findOneAndUpdate(
          { _id: p._id },
          { $set: { DanhSachMaMau: p.DanhSachMaMau } }
        );
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} products with HexCodes!`);
    process.exit(0);
  })
  .catch(console.error);
