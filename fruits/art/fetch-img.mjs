#!/usr/bin/env node
// Tải ảnh cho từng loại quả từ Wikipedia / Wikimedia Commons (ảnh giấy phép tự do):
//   node fruits/art/fetch-img.mjs            # chỉ tải ảnh còn thiếu
//   node fruits/art/fetch-img.mjs mango lime # tải lại vài ảnh
//
// Mỗi mục là [tên tệp, nguồn]; nguồn là tên bài Wikipedia tiếng Anh (lấy ảnh đại diện của bài),
// hoặc 'File:...' để chỉ đích danh một ảnh trên Commons.
// Ảnh được thu về rộng 800px, lưu JPEG ở fruits/img/<tên>.jpg (cần sips của macOS).
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'img');
const UA = { 'User-Agent': 'fruits-kids-game/1.0 (image fetch script)' };

const SOURCES = [
  ['mango', 'Mango'], ['banana', 'Banana'], ['pineapple', 'Pineapple'], ['papaya', 'File:Papaya cut half.jpg'],
  ['durian', 'Durian'], ['jackfruit', 'Jackfruit'], ['cempedak', 'File:Cempedak opened1.JPG'], ['mangosteen', 'File:Mangosteens - whole and opened.jpg'],
  ['rambutan', 'Rambutan'], ['longan', 'File:Longan fruit flesh & skin.jpg'], ['lychee', 'Lychee'], ['dragon_fruit', 'Pitaya'],
  ['passion_fruit', 'File:Passiflora Edulis Open Fruit2.jpg'], ['guava', 'Psidium guajava'], ['sugar_apple', 'Sugar-apple'], ['soursop', 'Soursop'],
  ['star_apple', 'Chrysophyllum cainito'], ['sapodilla', 'Sapodilla'], ['star_fruit', 'Carambola'], ['coconut', 'File:Kokosnuss-Coconut.jpg'],
  ['avocado', 'Avocado'], ['langsat', 'File:Lanzones.jpg'], ['wax_apple', 'File:Syzygium fruit (2).jpg'], ['breadfruit', 'Breadfruit'],
  ['canistel', 'Pouteria campechiana'],
  ['orange', 'Orange (fruit)'], ['mandarin', 'Mandarin orange'], ['pomelo', 'Pomelo'], ['lime', 'Key lime'],
  ['lemon', 'Lemon'], ['calamondin', 'Calamansi'], ['kumquat', 'Kumquat'], ['buddhas_hand', "Buddha's hand"],
  ['king_mandarin', 'File:Qua-cam-sanh-viet-nam.jpg'], ['grapefruit', 'Grapefruit'], ['citron', 'Citron'],
  ['grape', 'Grape'], ['strawberry', 'Strawberry'], ['blueberry', 'Blueberry'], ['raspberry', 'Raspberry'],
  ['blackberry', 'Blackberry'], ['cranberry', 'File:Cranberrys beim Ernten.jpeg'], ['mulberry', 'File:Black mulberry fruit (Morus nigra).jpg'], ['rose_myrtle', 'File:Rose Myrtle (Rhodomyrtus tomentosa) 1.jpg'],
  ['kiwi', 'Kiwifruit'], ['cherry', 'Cherry'], ['gooseberry', 'File:Gooseberries.jpg'], ['tomato', 'Tomato'],
  ['bayberry', 'Morella rubra'],
  ['watermelon', 'Watermelon'], ['cantaloupe', 'Cantaloupe'], ['oriental_melon', 'Oriental melon'], ['honeydew', 'Honeydew (melon)'],
  ['cucumber', 'Cucumber'], ['pumpkin', 'Pumpkin'],
  ['apple', 'Apple'], ['pear', 'Pear'], ['peach', 'File:Autumn Red peaches.jpg'], ['nectarine', 'File:White nectarine and cross section02 edit.jpg'],
  ['plum', 'Prunus salicina'], ['apricot', 'File:Prunus mume in the market.jpg'], ['persimmon', 'Diospyros kaki'], ['pomegranate', 'Pomegranate'],
  ['fig', 'File:Fig (Ficus carica) fruit halved.jpg'], ['date', 'Date palm'], ['olive', 'Olive'],
  ['tamarind', 'File:Tamarind pods.JPG'], ['ambarella', 'File:2014-10-11 Spondias dulcis Goldpflaume anagoria.JPG'], ['dracontomelon', 'Dracontomelon duperreanum'], ['star_gooseberry', 'File:Phyllanthus acidus fruits JEG9349.jpg'],
  ['thi', 'Diospyros decandra'], ['java_plum', 'File:Syzygium cumini - fruits dark.jpg'], ['oleaster', 'File:Elaeagnus latifolia (bastard oleaster) 2.jpg'], ['jujube', 'Ziziphus mauritiana'],
  ['manila_tamarind', 'File:Pithecellobium dulce in Margarita Island, Venezuela.jpg'], ['wampee', 'Clausena lansium'], ['burmese_grape', 'Baccaurea ramiflora'], ['marian_plum', 'Bouea macrophylla'],
  ['chinese_olive', 'Canarium album'], ['gac', 'Gac'], ['palmyra', 'File:Palmyra Palm Fruit (Borassus aethiopum) (7083091517).jpg'], ['pink_shower', 'File:Starr-090609-0314-Cassia grandis-seedpods-Fourth Division Marine Memorial Park Haiku-Maui (24336230423).jpg'],
  ['mangrove_apple', 'Sonneratia caseolaris'], ['nipa_palm', 'File:Nypa fruticans fruit.jpg'], ['roxburgh_fig', 'File:Ficus auriculata fruits.JPG'], ['cluster_fig', 'Ficus racemosa'],
  ['amla', 'Phyllanthus emblica'], ['acerola', 'Malpighia emarginata'], ['sugar_palm', 'File:Kolang kaling fruit colored.jpg'], ['velvet_tamarind', 'File:Saigon Dialium cochinchinense fruit (cropped).jpg'],
  ['cashew', 'Cashew'], ['peanut', 'File:Roasted Peanuts with shell.jpg'], ['chestnut', 'File:Frucht der Edelkastanie.jpg'], ['walnut', 'Walnut'],
  ['macadamia', 'Macadamia'], ['almond', 'Almond'], ['lotus_seed', 'Lotus seed'], ['pistachio', 'Pistachio'],
  ['cocoa', 'Cocoa bean'], ['coffee', 'File:Coffee cherries of varying ripeness, on a tree in Colombia (by Brian Smith).jpg'],
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
// fetch có chờ và thử lại khi Wikimedia báo quá tải (429)
async function get(url) {
  for (let i = 0; ; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r;
    if (r.status !== 429 || i >= 5) throw new Error(`${r.status} ${url}`);
    await sleep(Number(r.headers.get('retry-after')) * 1000 || 5000 * (i + 1));
  }
}

async function api(host, params) {
  return (await get(`https://${host}/w/api.php?` + new URLSearchParams({ format: 'json', formatversion: '2', ...params }))).json();
}

// Trả về URL ảnh thu nhỏ rộng 800px của nguồn.
async function thumbUrl(src) {
  if (src.startsWith('File:')) {
    const j = await api('commons.wikimedia.org', { action: 'query', titles: src, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '800' });
    const ii = j.query.pages[0].imageinfo;
    return ii && (ii[0].thumburl || ii[0].url);
  }
  const j = await api('en.wikipedia.org', { action: 'query', titles: src, redirects: '1', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '800' });
  const p = j.query.pages[0];
  return p.thumbnail && p.thumbnail.source;
}

mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
let ok = 0, fail = 0;
for (const [name, src] of SOURCES) {
  const file = join(OUT, name + '.jpg');
  if (only.length ? !only.includes(name) : existsSync(file)) continue;
  try {
    const url = await thumbUrl(src);
    if (!url) throw new Error('không có ảnh');
    const r = await get(url);
    const tmp = file + '.src';
    writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '78', '-Z', '800', tmp, '--out', file], { stdio: 'ignore' });
    unlinkSync(tmp);
    ok++; console.log('✓', name, '←', src);
  } catch (e) { fail++; console.warn('✗', name, src, e.message); }
  await sleep(1000);
}
console.log(`xong: ${ok} ảnh mới, ${fail} lỗi → fruits/img/`);
