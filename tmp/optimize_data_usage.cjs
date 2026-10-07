const fs = require('fs');
const esbuild = require('esbuild');

const filePath = '/app/applet/public/assets/index-CxKXGYsU.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the wasteful syncStorage that downloads all-matches every 15s
const targetWastefulSync = 'Y.useEffect(()=>{const syncStorage=()=>{fetch("/api/storage/all-matches").then(res=>res.json()).then(json=>{if(json&&Array.isArray(json.matches)&&json.matches.length>0){i(prev=>{const map=new Map();json.matches.forEach(m=>map.set(String(m.id),m));prev.forEach(m=>map.set(String(m.id),m));const merged=Array.from(map.values());try{localStorage.setItem("virtualbet_matches",JSON.stringify(merged.slice(0,5e3)))}catch(e){}return merged})}}).catch(()=>{})};syncStorage();const iv=setInterval(syncStorage,15e3);return()=>clearInterval(iv)},[]);';

if (content.includes(targetWastefulSync)) {
  content = content.replace(targetWastefulSync, '');
  console.log('REMOVED: Wasteful /api/storage/all-matches background loop!');
}

// 2. Add document.hidden check in RedAllLeaguesWidget & PinnedUpcomingWidget polling
const targetRedFetch = 'var fetchLeagues = function() {';
const replacementRedFetch = 'var fetchLeagues = function() { if (typeof document !== "undefined" && document.hidden) return;';

if (content.includes(targetRedFetch)) {
  content = content.replace(targetRedFetch, replacementRedFetch);
  console.log('UPDATED: RedAllLeaguesWidget respects document.hidden!');
}

// Update interval from 5000 to 10000 ms to halve data consumption
const targetRedInterval = 'var iv = setInterval(fetchLeagues, 5000);';
const replacementRedInterval = 'var iv = setInterval(fetchLeagues, 10000);';
if (content.includes(targetRedInterval)) {
  content = content.replace(targetRedInterval, replacementRedInterval);
  console.log('UPDATED: RedAllLeaguesWidget interval optimized to 10s!');
}

// PinnedUpcomingWidget document.hidden check
const targetPinnedLoad = 'const loadPinned = (sel = lg) => {';
const replacementPinnedLoad = 'const loadPinned = (sel = lg) => { if (typeof document !== "undefined" && document.hidden) return;';
if (content.includes(targetPinnedLoad)) {
  content = content.replace(targetPinnedLoad, replacementPinnedLoad);
  console.log('UPDATED: PinnedUpcomingWidget respects document.hidden!');
}

const targetPinnedInterval = 'const iv = setInterval(() => loadPinned(lg), 5000);';
const replacementPinnedInterval = 'const iv = setInterval(() => loadPinned(lg), 10000);';
if (content.includes(targetPinnedInterval)) {
  content = content.replace(targetPinnedInterval, replacementPinnedInterval);
  console.log('UPDATED: PinnedUpcomingWidget interval optimized to 10s!');
}

// Validate with esbuild
try {
  esbuild.transformSync(content, { loader: 'js' });
  console.log('ESBUILD VALIDATION: SUCCESSFUL 100%!');
  fs.writeFileSync(filePath, content, 'utf8');
  fs.writeFileSync('/app/applet/dist/assets/index-CxKXGYsU.js', content, 'utf8');
  console.log('WROTE OPTIMIZED BUNDLE TO PUBLIC AND DIST!');
} catch (err) {
  console.error('ESBUILD SYNTAX ERROR:', err.message);
  process.exit(1);
}
