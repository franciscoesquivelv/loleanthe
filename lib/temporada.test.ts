import assert from 'node:assert/strict';
import { test } from 'node:test';
import { finDeTemporada, nombreDeTemporada } from './temporada.ts';

test('la temporada cierra el último día del mes dos meses adelante', () => {
  assert.equal(finDeTemporada('2026-10-30'), '2026-12-31');
  assert.equal(finDeTemporada('2026-10-01'), '2026-12-31');
  assert.equal(finDeTemporada('2026-11-15'), '2027-01-31');
  assert.equal(finDeTemporada('2026-12-31'), '2027-02-28');
  assert.equal(finDeTemporada('2027-12-05'), '2028-02-29');
});

test('el nombre sigue el estilo de las listas de siempre', () => {
  assert.equal(nombreDeTemporada('2026-10-30', '2026-12-31'), 'Temporada Octubre - Diciembre');
  assert.equal(nombreDeTemporada('2026-11-15', '2027-01-31'), 'Temporada Noviembre - Enero');
  assert.equal(nombreDeTemporada('2026-10-01', '2026-10-31'), 'Temporada Octubre');
});

test('sin fechas válidas no se sugiere nada', () => {
  assert.equal(nombreDeTemporada('', '2026-12-31'), '');
  assert.equal(nombreDeTemporada('2026-13-01', '2026-12-31'), '');
});
