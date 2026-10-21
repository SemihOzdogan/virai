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
export type AdventureEnding = 'rescue' | 'escape' | 'keeper';
export type AdventurePath = {
  ending: AdventureEnding;
  compassion: number;
  truth: number;
  risk: number;
};
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

const englishStory = {
  chapters: [
    'Midnight arrival',
    'The missing guest',
    'Behind the mirror',
    'The final key',
    'Room 307',
  ],
  characters: [
    'Defne · Receptionist',
    'Aras · Detective',
    'Mina · Missing guest',
  ],
  clues: [
    'The 307 key',
    'An old guest ledger',
    'A cracked mirror',
    'A midnight letter',
    'The hotel’s secret',
  ],
  opening: {
    illustration: 'lobby' as const,
    text: 'Escaping the rain, you enter the Atlas Hotel. Every clock on the wall has stopped at 03:07. Before you say a word, the receptionist Defne writes your name in the guest ledger.\n\n“I knew you would come back.” She places a brass key in your palm. “Don’t enter 307 this time.”\n\nThe elevator opens by itself. Someone whispers from inside: “Don’t trust her.”',
    choices: [
      'Ask Defne how she knows you.',
      'Follow the voice in the elevator.',
      'Look for your name in the guest ledger.',
    ],
  },
};

export type AdventureLanguage = 'tr' | 'en';
export function getStory(language: AdventureLanguage) {
  return language === 'en'
    ? englishStory
    : { chapters, characters, clues, opening };
}

/**
 * Converts the player's decisions into a stable ending.  The AI narrator is
 * given this path too, so a saved game and the local fallback tell the same
 * kind of ending even when the network is unavailable.
 */
export function getAdventurePath(adventure: Adventure): AdventurePath {
  let compassion = 0;
  let truth = 0;
  let risk = 0;

  adventure.turns.forEach((turn, index) => {
    const previousChoices =
      index === 0 ? opening.choices : adventure.turns[index - 1].choices;
    const choiceIndex = previousChoices.indexOf(turn.action);
    if (choiceIndex === 0) {
      compassion += 1;
      return;
    }
    if (choiceIndex === 1) {
      truth += 1;
      return;
    }
    if (choiceIndex === 2) {
      risk += 1;
      return;
    }

    const action = turn.action.toLocaleLowerCase('tr-TR');
    if (/mina|yardım|kurtar|elini|güven|help|rescue|trust/.test(action)) {
      compassion += 1;
    } else if (/dışarı|kaç|gerçek|mektup|polis|escape|truth|letter|outside/.test(action)) {
      truth += 1;
    } else {
      risk += 1;
    }
  });

  const ending: AdventureEnding =
    compassion >= truth && compassion >= risk
      ? 'rescue'
      : truth >= risk
        ? 'escape'
        : 'keeper';
  return { ending, compassion, truth, risk };
}
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
