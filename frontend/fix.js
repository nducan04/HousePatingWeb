const fs = require('fs');
let content = fs.readFileSync('app/(public)/tracking/page.tsx', 'utf8');
const lines = content.split('\n');
lines.splice(276, 5, "  const [activeTab, setActiveTab] = useState<'shipment' | 'samples'>('shipment');");
fs.writeFileSync('app/(public)/tracking/page.tsx', lines.join('\n'));
