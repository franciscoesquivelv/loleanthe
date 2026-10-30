// Pruebas de la lista pegada y del destino guardado. Corren con el ejecutor de
// pruebas que trae Node, sin instalar nada:  npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { storedDestination } from './price-destinations.ts';
import {
  applyImport,
  matchName,
  notMentioned,
  parsePastedList,
  type ImportCategory,
  type ImportEntry,
  type ImportFlower,
} from './price-import.ts';
import type { PriceItem } from './priceSheets.ts';

// Catálogo de ensayo: los nombres reales de Loleanthe que importan para la
// lista de Guatemala (no son precios, solo cómo se llaman las flores).
const flor = (id: string, name: string, category = 'Fillers', archived = false): ImportFlower => ({
  id,
  name,
  category,
  archived,
  images: [`https://fotos/${id}.jpg`],
});
const FLORES: ImportFlower[] = [
  flor('stock', 'Stock'),
  flor('ruscus', 'Ruscus'),
  flor('eryngium', 'Eryngium'),
  flor('clavel', 'Clavel'),
  flor('campana', 'Campana de Irlanda'),
  flor('calas', 'Calas'),
  flor('amaranthus', 'Amaranthus'),
  flor('alstromeria', 'Alstromeria'),
  flor('crisantemo', 'Crisantemo'),
  flor('larkspur', 'Larkspur'),
  flor('limonium', 'Limonium'),
  flor('solidago', 'Solidago Golden Glory'),
  flor('gypsophila', 'Gypsophila Xlence'),
  flor('hypericum', 'Hypericum'),
  flor('delphinium', 'Delphinium Sea Waltz'),
  flor('pink-floyd', 'Pink Floyd', 'Rosas'),
  flor('pink-xpression', 'Pink Xpression', 'Rosas Garden'),
  flor('viejo', 'Viejo', 'Fillers', true),
];
const CATEGORIAS: ImportCategory[] = [
  { slug: 'rosas', label: 'Rosas', fallbackImage: '/images/rosas.jpg' },
  { slug: 'rosas-garden', label: 'Rosas Garden', fallbackImage: '/images/garden.jpg' },
  { slug: 'ranunculus', label: 'Ranunculus', fallbackImage: '/images/ranunculus.jpg' },
  { slug: 'fillers', label: 'Fillers', fallbackImage: '/images/fillers.jpg' },
];

// Precios INVENTADOS a propósito: este repositorio es público y los precios
// reales de cada país solo viven en la hoja publicada, nunca en el código.
const PRECIOS_DE_ENSAYO: [string, number][] = [
  ['Stock', 9.15],
  ['Ruscus', 4.25],
  ['Eryngium', 9.15],
  ['Clavel', 10],
  ['Campana de Irlanda', 7.3],
  ['Calas', 15],
  ['Amaranthus', 10.4],
  ['Alstromeria', 10.4],
  ['Crisantemo', 14],
  ['Larkspur', 9],
  ['Limonium', 9],
  ['Rosas', 17],
  ['Garden roses', 29],
  ['Ranúnculos', 15],
  ['Solidago', 4.25],
  ['Gypsophila', 4.25],
  ['Hypericum', 9],
  ['Delphinium', 9],
];
const LISTA_DE_ENSAYO = ['Lista de ejemplo', ...PRECIOS_DE_ENSAYO.map(([n, p]) => `${n} ${p}`)].join('\n');

test('una lista de 18 flores completa: ninguna perdida ni inventada', () => {
  const { rows, ignored } = parsePastedList(LISTA_DE_ENSAYO);
  assert.equal(rows.length, 18);
  assert.deepEqual(rows.map((r) => [r.name, r.price]), PRECIOS_DE_ENSAYO);
  // El título de arriba no tiene precio: se dice, no se pierde en silencio.
  assert.deepEqual(ignored, [{ line: 1, text: 'Lista de ejemplo', reason: 'No tiene un precio al final.' }]);
});

test('enlaza las 18 con el catálogo: 15 flores y 3 categorías', () => {
  const { rows } = parsePastedList(LISTA_DE_ENSAYO);
  const enlaces = rows.map((r) => matchName(r.name, FLORES, CATEGORIAS));
  assert.equal(enlaces.filter((m) => m.kind === 'flor').length, 15);
  assert.deepEqual(
    rows.filter((_, i) => enlaces[i].kind === 'categoria').map((r) => [r.name, (enlaces[rows.indexOf(r)] as { slug: string }).slug]),
    [
      ['Rosas', 'rosas'],
      ['Garden roses', 'rosas-garden'],
      ['Ranúnculos', 'ranunculus'],
    ]
  );
  assert.equal(enlaces.filter((m) => m.kind === 'ninguna').length, 0);
  assert.deepEqual(matchName('Solidago', FLORES, CATEGORIAS), { kind: 'flor', flowerId: 'solidago' });
  assert.deepEqual(matchName('Delphinium', FLORES, CATEGORIAS), { kind: 'flor', flowerId: 'delphinium' });
});

test('formas de escribir una línea', () => {
  const casos: [string, string, number][] = [
    ['Stock $9.15', 'Stock', 9.15],
    ['Stock: 9,15', 'Stock', 9.15],
    ['Stock - 9.15 USD', 'Stock', 9.15],
    ['- Stock = $9.15 por bunch', 'Stock', 9.15],
    ['1) Stock 9.15', 'Stock', 9.15],
    ['*Stock* 9.15', 'Stock', 9.15],
    ['Campana de Irlanda\t7.30\t10 tallos', 'Campana de Irlanda', 7.3],
    ['STOCK 11', 'STOCK', 11],
  ];
  for (const [linea, nombre, precio] of casos) {
    const { rows } = parsePastedList(linea);
    assert.deepEqual(rows.map((r) => [r.name, r.price]), [[nombre, precio]], linea);
  }
});

test('varias flores en una línea separadas por punto y coma', () => {
  const { rows } = parsePastedList('Stock 9.15; Ruscus 4.25;Clavel 10');
  assert.deepEqual(rows.map((r) => r.name), ['Stock', 'Ruscus', 'Clavel']);
});

test('lo dudoso se avisa y no se adivina', () => {
  const { rows, ignored } = parsePastedList(
    ['Stock Q85', 'Ruscus ₡3000', 'Clavel 12 GTQ', 'Calas 9.150', 'Larkspur 0', '9.15', 'Sin precio aquí'].join('\n')
  );
  assert.equal(rows.length, 0);
  assert.equal(ignored.length, 7);
  assert.match(ignored[0].reason, /quetzales o colones/);
  assert.match(ignored[1].reason, /quetzales o colones/);
  assert.match(ignored[2].reason, /quetzales o colones/);
});

test('un nombre de más de 30 letras no se corta en silencio', () => {
  const { rows, ignored } = parsePastedList('Una flor con un nombre larguísimo de verdad 12');
  assert.equal(rows.length, 0);
  assert.match(ignored[0].reason, /pasa de 30 letras/);
});

test('la misma flor repetida: gana la última', () => {
  const { rows, ignored } = parsePastedList('Stock 8\nRuscus 5\nstocks 9.15');
  assert.deepEqual(rows.map((r) => [r.name, r.price]), [['stocks', 9.15], ['Ruscus', 5]]);
  assert.equal(ignored.length, 1);
  assert.equal(ignored[0].line, 1);
});

test('plurales y mayúsculas encuentran la flor; la duda no elige', () => {
  assert.deepEqual(matchName('claveles', FLORES, CATEGORIAS), { kind: 'flor', flowerId: 'clavel' });
  assert.deepEqual(matchName('CALA', FLORES, CATEGORIAS), { kind: 'flor', flowerId: 'calas' });
  assert.deepEqual(matchName('Rosa garden', FLORES, CATEGORIAS), { kind: 'categoria', slug: 'rosas-garden' });
  assert.deepEqual(matchName('Rosa', FLORES, CATEGORIAS), { kind: 'categoria', slug: 'rosas' });
  // Dos flores empiezan con "Pink": no se elige ninguna.
  assert.deepEqual(matchName('Pink', FLORES, CATEGORIAS), { kind: 'ninguna' });
  // Una archivada no se ofrece.
  assert.deepEqual(matchName('Viejo', FLORES, CATEGORIAS), { kind: 'ninguna' });
  assert.deepEqual(matchName('Peonia', FLORES, CATEGORIAS), { kind: 'ninguna' });
});

const entradasDe = (texto: string): ImportEntry[] =>
  parsePastedList(texto).rows.map((row) => ({ row, match: matchName(row.name, FLORES, CATEGORIAS), incluir: true }));

test('hoja nueva: flores con foto del catálogo, sin tallos ni nada inventado', () => {
  const r = applyImport([], entradasDe('Stock 9.15\nRosas 17\nPeonia 40'), FLORES, CATEGORIAS);
  assert.equal(r.agregadas, 3);
  assert.deepEqual(r.items, [
    { slug: 'stock', name: 'Stock', bunchPrice: 9.15, image: 'https://fotos/stock.jpg', catalogFlowerId: 'stock' },
    { slug: 'rosas', name: 'Rosas', bunchPrice: 17, image: '/images/rosas.jpg', categorySlug: 'rosas' },
    { slug: 'peonia', name: 'Peonia', bunchPrice: 40 },
  ]);
  for (const i of r.items as PriceItem[]) {
    assert.equal(i.stemsPerBunch, undefined);
    assert.equal(i.size, undefined);
    assert.equal(i.note, undefined);
  }
});

test('hoja con flores: corregir un precio no toca foto, tallos ni nota', () => {
  const actuales: PriceItem[] = [
    { slug: 'rosa', name: 'Rosa', bunchPrice: 23, stemsPerBunch: 25, size: '50 cm', note: 'Según finca', categorySlug: 'rosas', image: '/images/rosas.jpg' },
    { slug: 'larkspur', name: 'Larkspur', bunchPrice: 21, stemsPerBunch: 10, catalogFlowerId: 'larkspur' },
  ];
  const entradas = entradasDe('Rosas 17\nLarkspur 9\nClavel 10');
  const r = applyImport(actuales, entradas, FLORES, CATEGORIAS);
  assert.equal(r.actualizadas, 2);
  assert.equal(r.agregadas, 1);
  assert.deepEqual(r.items[0], { ...actuales[0], bunchPrice: 17 });
  assert.deepEqual(r.items[1], { ...actuales[1], bunchPrice: 9 });
  assert.equal(r.items[2].name, 'Clavel');
  // No se mutó lo que ya había.
  assert.equal(actuales[0].bunchPrice, 23);
});

test('lo que la hoja tenía y no se pegó queda igual y se avisa', () => {
  const actuales: PriceItem[] = [
    { slug: 'rosa', name: 'Rosa', bunchPrice: 23, categorySlug: 'rosas' },
    { slug: 'crisantemo', name: 'Crisantemo', bunchPrice: 19, catalogFlowerId: 'crisantemo' },
  ];
  const entradas = entradasDe('Rosas 17');
  assert.deepEqual(notMentioned(actuales, entradas), ['Crisantemo']);
  assert.equal(applyImport(actuales, entradas, FLORES, CATEGORIAS).items.length, 2);
});

test('una fila desmarcada no se aplica, y dos con el mismo nombre no repiten el slug', () => {
  const entradas = entradasDe('Stock 9.15\nRuscus 4.25');
  entradas[1].incluir = false;
  assert.equal(applyImport([], entradas, FLORES, CATEGORIAS).items.length, 1);

  const iguales: ImportEntry[] = [
    { row: { line: 1, name: 'Pink', price: 10 }, match: { kind: 'ninguna' }, incluir: true },
    { row: { line: 2, name: 'pink', price: 11 }, match: { kind: 'ninguna' }, incluir: true },
  ];
  // La segunda corrige a la primera (mismo nombre): un solo ítem, sin slug repetido.
  const r = applyImport([], iguales, FLORES, CATEGORIAS);
  assert.equal(r.items.length, 1);
  assert.equal(r.items[0].bunchPrice, 11);
});

test('el destino guardado: la publicada de antes es Costa Rica, lo demás no se adivina', () => {
  assert.equal(storedDestination(undefined, 'published'), 'CR');
  assert.equal(storedDestination(null, 'published'), 'CR');
  assert.equal(storedDestination(undefined, 'draft'), null);
  assert.equal(storedDestination(undefined, 'archived'), null);
  assert.equal(storedDestination('GT', 'published'), 'GT');
  assert.equal(storedDestination('GT', 'draft'), 'GT');
  assert.equal(storedDestination('GENERAL', 'archived'), 'GENERAL');
  // Un valor mal escrito falla cerrado: invisible, nunca en el país equivocado.
  assert.equal(storedDestination('cr', 'published'), null);
  assert.equal(storedDestination('gt ', 'published'), null);
  assert.equal(storedDestination('', 'published'), null);
  assert.equal(storedDestination(7, 'published'), null);
});
