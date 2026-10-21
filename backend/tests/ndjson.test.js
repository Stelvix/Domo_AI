import test from 'node:test';
import assert from 'node:assert/strict';
import { createNdjsonParser } from '../src/utils/ndjson.js';

test('ndjson : parse un objet JSON complet', () => {
  const received = [];
  const parser = createNdjsonParser((payload) => received.push(payload));

  parser.push('{"a":1}\n');
  parser.flush();

  assert.deepEqual(received, [{ a: 1 }]);
});

test('ndjson : reconstitue un objet coupé en plein milieu par le réseau', () => {
  const received = [];
  const parser = createNdjsonParser((payload) => received.push(payload));

  parser.push('{"message":{"content":"Hel');
  parser.push('lo"}}');
  parser.push('\n');

  assert.deepEqual(received, [{ message: { content: 'Hello' } }]);
});

test('ndjson : traite plusieurs objets dans un même chunk', () => {
  const received = [];
  const parser = createNdjsonParser((payload) => received.push(payload));

  parser.push('{"a":1}\n{"b":2}\n{"c":3}\n');

  assert.deepEqual(received, [{ a: 1 }, { b: 2 }, { c: 3 }]);
  assert.equal(received.length, 3);
});

test('ndjson : le dernier objet sans saut de ligne reste en attente dans le buffer', () => {
  const received = [];
  const parser = createNdjsonParser((payload) => received.push(payload));

  parser.push('{"a":1}\n{"b":2}');

  assert.deepEqual(received, [{ a: 1 }]);
});

test('ndjson : ignore les lignes vides et invalides sans interrompre le flux', () => {
  const received = [];
  const errors = [];
  const parser = createNdjsonParser(
    (payload) => received.push(payload),
    (raw) => errors.push(raw)
  );

  parser.push('{"a":1}\n\n   \npas du json\n{"b":2}\n');

  assert.deepEqual(received, [{ a: 1 }, { b: 2 }]);
  assert.equal(errors.length, 1);
});

test('ndjson : flush traite le dernier fragment sans saut de ligne', () => {
  const received = [];
  const parser = createNdjsonParser((payload) => received.push(payload));

  parser.push('{"a":1}');
  assert.equal(received.length, 0);

  parser.flush();
  assert.deepEqual(received, [{ a: 1 }]);
});

test('ndjson : ne rejoue pas un buffer déjà consommé', () => {
  const received = [];
  const parser = createNdjsonParser((payload) => received.push(payload));

  parser.push('{"a":1}\n');
  parser.flush();
  parser.flush();

  assert.equal(received.length, 1);
});
