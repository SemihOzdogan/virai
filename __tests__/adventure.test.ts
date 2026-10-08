import {
  opening,
  parseScene,
  restoreAdventure,
  totalTurns,
  sceneIllustration,
} from '../src/features/adventure/services/story';

const scene = {
  text: 'Kapı açıldı.',
  choices: ['İçeri gir', 'Bekle', 'Seslen'],
};
test('keeps the narrator illustration through save and restore', () => {
  const illustrated = { ...scene, illustration: 'mirror' as const };
  const parsed = parseScene(JSON.stringify(illustrated), false);
  const saved = restoreAdventure(
    JSON.stringify({
      version: 1,
      turns: [{ ...parsed, action: 'Aynaya bak' }],
    }),
  );
  expect(sceneIllustration(saved.turns[0])).toBe('mirror');
});
test('uses local illustrations for legacy saves and unknown model selections', () => {
  const legacy = { ...scene, text: 'Asansörün kapısı açılıyor.' };
  expect(sceneIllustration(legacy)).toBe('elevator');
  const unknown = parseScene(
    JSON.stringify({
      ...legacy,
      illustration: 'https://example.com/image.svg',
    }),
    false,
  );
  expect(unknown.illustration).toBeUndefined();
  expect(sceneIllustration(unknown)).toBe('elevator');
  expect(sceneIllustration(opening)).toBe('lobby');
});
test('restores a saved journey with its decisions and choices', () => {
  const saved = {
    version: 1,
    turns: [{ ...scene, action: opening.choices[0] }],
  };
  expect(restoreAdventure(JSON.stringify(saved))).toEqual(saved);
  expect(restoreAdventure(null)).toEqual({ version: 1, turns: [] });
});
test('accepts fenced JSON and requires exactly three playable choices', () => {
  expect(
    parseScene('```json\n' + JSON.stringify(scene) + '\n```', false),
  ).toEqual(scene);
  for (const invalid of [
    null,
    { ...scene, choices: [] },
    { ...scene, text: '' },
    { ...scene, choices: ['a', 'a', 'b'] },
    { ...scene, choices: [1, 2, 3] },
  ]) {
    expect(() => parseScene(JSON.stringify(invalid), false)).toThrow();
  }
});
test('only the final turn can have no choices and completed games survive reload', () => {
  const final = { text: 'Mina otelden çıktı.', choices: [] };
  expect(parseScene(JSON.stringify(final), true)).toEqual(final);
  expect(() => parseScene(JSON.stringify(scene), true)).toThrow();
  const turns = Array.from({ length: totalTurns }, (_, i) => ({
    ...(i === totalTurns - 1 ? final : scene),
    action: 'Kapıyı aç',
  }));
  expect(
    restoreAdventure(JSON.stringify({ version: 1, turns })).turns,
  ).toHaveLength(totalTurns);
  expect(() =>
    restoreAdventure(
      JSON.stringify({ version: 1, turns: [...turns, turns[0]] }),
    ),
  ).toThrow();
});
test('rejects incompatible or corrupt saves instead of silently overwriting progress', () => {
  for (const raw of [
    'broken',
    'null',
    '{"version":2,"turns":[]}',
    JSON.stringify({ version: 1, turns: [{ ...scene, action: '' }] }),
  ]) {
    expect(() => restoreAdventure(raw)).toThrow();
  }
});
