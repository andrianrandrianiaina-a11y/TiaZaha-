const fs = require('fs');
const esbuild = require('esbuild');

const filePath = '/app/applet/public/assets/index-CxKXGYsU.js';
let content = fs.readFileSync(filePath, 'utf8');

const targetOptBlock = `d.jsx("option", { value: "8035", children: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 English League (Premier)" }),
                  d.jsx("option", { value: "8036", children: "🇮🇹 Italian League (Serie A)" }),
                  d.jsx("option", { value: "8042", children: "🇫🇷 French League (Ligue 1)" }),
                  d.jsx("option", { value: "8037", children: "🇩🇪 German League (Bundesliga)" }),
                  d.jsx("option", { value: "8043", children: "🇫🇷 French League (Ligue 1)" }),
                  d.jsx("option", { value: "8044", children: "🇳🇱 Netherlands League (Eredivisie)" }),
                  d.jsx("option", { value: "8056", children: "⭐ Champions Cup (Europe)" }),
                  d.jsx("option", { value: "8060", children: "🌏 Euro / Asie Cup" }),
                  d.jsx("option", { value: "8065", children: "🏆 Coupe du Monde (World Cup)" })`;

const replaceOptBlock = `d.jsx("option", { value: "8035", children: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 English League (Premier)" }),
                  d.jsx("option", { value: "8036", children: "🇮🇹 Italian League (Serie A)" }),
                  d.jsx("option", { value: "8037", children: "🇪🇸 Spanish League (La Liga)" }),
                  d.jsx("option", { value: "8042", children: "🇫🇷 French League (Ligue 1)" }),
                  d.jsx("option", { value: "8043", children: "🇩🇪 German League (Bundesliga)" }),
                  d.jsx("option", { value: "8044", children: "🇵🇹 Portuguese League (Liga Portugal)" }),
                  d.jsx("option", { value: "8056", children: "⭐ Champions Cup (Europe)" }),
                  d.jsx("option", { value: "8060", children: "🌏 Euro / Asie Cup" }),
                  d.jsx("option", { value: "8065", children: "🏆 Coupe du Monde (World Cup)" })`;

if (content.includes(targetOptBlock)) {
  content = content.replace(targetOptBlock, replaceOptBlock);
  console.log('REPLACED OPTIONS BLOCK WITH PERFECT CORRESPONDENCE!');
} else {
  console.error('targetOptBlock not matched directly!');
  process.exit(1);
}

// Validate with esbuild
try {
  esbuild.transformSync(content, { loader: 'js' });
  console.log('ESBUILD: 100% VALID SYNTAX!');
  fs.writeFileSync(filePath, content, 'utf8');
  fs.writeFileSync('/app/applet/dist/assets/index-CxKXGYsU.js', content, 'utf8');
  console.log('Successfully saved to public and dist!');
} catch (err) {
  console.error('ESBUILD SYNTAX ERROR:', err.message);
  process.exit(1);
}
