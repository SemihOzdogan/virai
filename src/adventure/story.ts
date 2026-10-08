export const chapters = [
  'Gece yarısı giriş',
  'Kayıp misafir',
  'Aynanın ardı',
  'Son anahtar',
  'Oda 307',
];
export const characters = [
  'Defne · Resepsiyonist',
  'Aras · Dedektif',
  'Mina · Kayıp misafir',
];
export const clues = [
  '307 anahtarı',
  'Eski misafir defteri',
  'Çatlak ayna',
  'Gece yarısı mektubu',
  'Otelin sırrı',
];
export const illustrationNames = [
  'lobby',
  'corridor',
  'elevator',
  'mirror',
  'letter',
  'key',
  'room',
  'exterior',
] as const;
export type IllustrationName = (typeof illustrationNames)[number];
export type Scene = {
  text: string;
  choices: string[];
  illustration?: IllustrationName;
};
export function sceneIllustration(scene: Scene): IllustrationName {
  if (scene.illustration) {
    return scene.illustration;
  }
  const text = scene.text.toLocaleLowerCase('tr-TR');
  const matches: [RegExp, IllustrationName][] = [
    [/ayna|yansıma/, 'mirror'],
    [/mektup|defter|sayfa/, 'letter'],
    [/asansör/, 'elevator'],
    [/koridor|merdiven/, 'corridor'],
    [/anahtar/, 'key'],
    [/307|oda/, 'room'],
    [/yağmur|dışarı|sokak/, 'exterior'],
  ];
  return matches.find(([pattern]) => pattern.test(text))?.[1] ?? 'lobby';
}
export type Turn = Scene & { action: string };
export type Adventure = { version: 1; turns: Turn[] };
export const totalTurns = 15;
export const opening: Scene = {
  illustration: 'lobby',
  text: 'Yağmurdan kaçıp Atlas Oteli’ne giriyorsun. Duvardaki bütün saatler 03.07’de durmuş. Resepsiyonist Defne, sen konuşmadan adını misafir defterine yazıyor.\n\n“Geri döneceğini biliyordum.” Avucuna pirinç bir anahtar bırakıyor. “Bu sefer 307’ye girme.”\n\nAsansör kendiliğinden açılıyor. İçeriden biri fısıldıyor: “Ona inanma.”',
  choices: [
    'Defne’ye beni nereden tanıdığını sor.',
    'Asansördeki sesin peşinden git.',
    'Misafir defterinde adımı ara.',
  ],
};
export function parseScene(raw: string, final: boolean): Scene {
  const value = JSON.parse(
    raw.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, ''),
  );
  if (
    !value ||
    typeof value.text !== 'string' ||
    !value.text.trim() ||
    value.text.length > 5000 ||
    !Array.isArray(value.choices) ||
    value.choices.length !== (final ? 0 : 3) ||
    value.choices.some(
      (choice: unknown) =>
        typeof choice !== 'string' || !choice.trim() || choice.length > 200,
    ) ||
    new Set(value.choices).size !== value.choices.length
  ) {
    throw new Error('Anlatıcı geçerli bir sahne oluşturamadı. Tekrar dene.');
  }
  return {
    text: value.text.trim(),
    choices: value.choices.map((choice: string) => choice.trim()),
    ...(illustrationNames.includes(value.illustration)
      ? { illustration: value.illustration }
      : {}),
  };
}
export function restoreAdventure(raw: string | null): Adventure {
  if (!raw) {
    return { version: 1, turns: [] };
  }
  const value = JSON.parse(raw);
  if (
    value?.version !== 1 ||
    !Array.isArray(value.turns) ||
    value.turns.length > totalTurns
  ) {
    throw new Error('Macera kaydı okunamadı.');
  }
  const turns = value.turns.map((turn: Turn, index: number) => {
    if (
      typeof turn?.action !== 'string' ||
      !turn.action.trim() ||
      turn.action.length > 600
    ) {
      throw new Error('Macera kaydı okunamadı.');
    }
    return {
      ...parseScene(JSON.stringify(turn), index === totalTurns - 1),
      action: turn.action,
    };
  });
  return { version: 1, turns };
}
