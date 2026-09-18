import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('FIRMES V2 is tenant scoped, manual-derived and reduced-motion safe',async()=>{
 const [brand,studio,workspace,css,memory,pkg]=await Promise.all([
  readFile('components/FirmesBrand.tsx','utf8'),readFile('components/studio.tsx','utf8'),readFile('components/workspace.tsx','utf8'),readFile('app/globals.css','utf8'),readFile('docs/FIRMES_BRAND_MEMORY.md','utf8'),readFile('package.json','utf8')]);
 assert.match(brand,/\\bfirmes\\b/i);assert.match(workspace,/FirmesFrame/);assert.match(studio,/firmesShell/);
 for(const value of ['#8e2c2d','#3c3c3b','#bd9b60','#fefbf6'])assert.ok(css.toLowerCase().includes(value));
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/pointer-events:none/);
 assert.match(memory,/Anton Regular/);assert.match(memory,/UI-only identity cue/);assert.match(memory,/voter microtargeting/);
 assert.ok(!JSON.parse(pkg).dependencies?.['liquid-gooey']);
});

test('FIRMES brand memory binds the exact private reference without shipping it',async()=>{
 const [memory,ignore]=await Promise.all([readFile('docs/FIRMES_BRAND_MEMORY.md','utf8'),readFile('.gitignore','utf8')]);
 assert.match(memory,/5f1a384df3da3aa3d36b6efe85142e72d4b633ac7ba6796ddb845579987569d9/);
 assert.match(memory,/57 pages/);assert.match(ignore,/(^|\n)work\/?($|\n)/);
});

test('live legacy caballito tenant activates FIRMES globally and ships the authorized horse asset',async()=>{
 const [brand,studio,workspace,profiles,provenance]=await Promise.all([readFile('components/FirmesBrand.tsx','utf8'),readFile('components/studio.tsx','utf8'),readFile('components/workspace.tsx','utf8'),readFile('components/CreativeProfiles.tsx','utf8'),readFile('config/brand-assets/firmes-caballito.provenance.json','utf8')]);
 assert.match(brand,/LEGACY_FIRMES_TENANTS=new Set\(\['caballito'\]\)/);assert.match(studio,/tenantList\.length===1/);assert.match(workspace,/CreativeDeck/);assert.match(workspace,/firmes\?\<FirmesCaballito\/\>/);assert.match(profiles,/El Caballito ya está listo\./);const p=JSON.parse(provenance);assert.equal(p.asset_id,'firmes-caballito-manual-p42');assert.equal(p.source_pdf_page,42);assert.equal(p.sha256,'b17c55ffb0eec46bfa719128ee68a9f18475c45afb90d6d73ce9d82567938397')
})
