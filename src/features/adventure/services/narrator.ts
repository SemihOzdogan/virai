import { getApp } from '@react-native-firebase/app';
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
} from '@react-native-firebase/ai';
import {
  chapters,
  characters,
  clues,
  getStory,
  parseScene,
  totalTurns,
  type Adventure,
  type AdventureLanguage,
} from './story';

function fallbackScene(
  turn: number,
  action: string,
  language: AdventureLanguage,
) {
  const final = turn === totalTurns;
  const chapter = Math.floor((turn - 1) / 3);
  const safeAction = action.trim().slice(0, 160);
  if (language === 'en') {
    const scenes = [
      {
        illustration: 'lobby' as const,
        text: `You follow through on “${safeAction}.” The second hand on the clock behind reception moves once. Defne closes the old guest ledger and gives you a corridor pass. “This hotel answers only the right question,” she says. The pass bears the service corridor symbol, not an elevator.`,
        choices: ['Follow the marks in the service corridor.', 'Ask Defne for the missing guest’s name.', 'Try every elevator button.'],
      },
      {
        illustration: 'letter' as const,
        text: `After “${safeAction},” a frame tilts on the wall and a yellowed letter slips out. It is in Mina’s handwriting: Room 307 opens not with a key, but with a remembered name. At the end of the corridor, Aras waits and says he has seen you here before.`,
        choices: ['Show Aras the letter.', 'Say Mina’s name aloud.', 'Enter the narrow passage behind the frame.'],
      },
      {
        illustration: 'mirror' as const,
        text: `The moment you say “${safeAction},” your reflection moves half a second late. It holds the brass key while your palm is empty. Mina whispers from inside the mirror: “Choose who to trust to break the loop.” The crack resembles the number 307.`,
        choices: ['Ask the reflection about the key.', 'Call Aras to inspect the mirror.', 'Follow the 307 mark in the crack.'],
      },
      {
        illustration: 'key' as const,
        text: `“${safeAction}” leads you to an old service stairwell. Beneath a step you find a key marked 03:07. Defne appears at the top of the stairs. “If you use it, the hotel will remember you too,” she says. Somewhere far away, a door clicks three times.`,
        choices: ['Try the key in the door.', 'Ask Defne why she protects you.', 'Give the key to Aras and watch.'],
      },
      {
        illustration: 'room' as const,
        text: final
          ? `With “${safeAction},” you cross the final threshold. The stopped clock in Room 307 begins to tick and Mina steps from the mist. The corridors open toward morning. Your choices changed Mina’s path, and the Atlas Hotel remembers your name as more than a guest’s. The story ends, but the door can always open onto another road.`
          : `With “${safeAction},” the door to Room 307 opens a little wider. Mina’s silhouette and the stopped clock face one another inside. Both wait for your decision. The key warms at the threshold, and you feel that this time you are guiding the loop.`,
        choices: final ? [] : ['Reach for Mina’s hand.', 'Turn the clock back to 03:07.', 'Close the door and observe the hotel from outside.'],
      },
    ];
    return scenes[chapter];
  }
  const scenes = [
    {
      illustration: 'lobby' as const,
      text: `Hamleni uyguluyorsun: “${safeAction}” Resepsiyonun arkasındaki saatin saniye kolu bir kez hareket ediyor. Defne, sessizce eski misafir defterini kapatıyor ve sana bir koridor kartı uzatıyor. “Bu otel cevapları yalnızca doğru soruya verir,” diyor. Kartın üzerinde asansör değil, servis koridorunun işareti var.`,
      choices: [
        'Servis koridorundaki izleri takip et.',
        'Defne’den kayıp misafirin adını iste.',
        'Asansörün düğmelerini tek tek dene.',
      ],
    },
    {
      illustration: 'letter' as const,
      text: `“${safeAction}” hamlenin ardından duvardaki çerçeve eğiliyor. Arkasından sararmış bir mektup düşüyor: Mina’nın el yazısı. Mektupta, 307’nin kapısının anahtarla değil, hatırlanan bir isimle açıldığı yazıyor. Koridorun sonunda Aras seni bekliyor; seni burada daha önce gördüğünü söylüyor.`,
      choices: [
        'Mektubu Aras’a göster.',
        'Mina’nın adını yüksek sesle söyle.',
        'Çerçevenin arkasındaki dar geçide gir.',
      ],
    },
    {
      illustration: 'mirror' as const,
      text: `“${safeAction}” dediğin anda aynadaki yansıman senden yarım saniye geç hareket ediyor. Yansımanın elinde pirinç anahtar var; senin avucun boş. Aynanın içinden Mina’nın fısıltısı geliyor: “Döngüyü kırmak için kime inanacağını seç.” Aynadaki çatlak, 307 rakamını andırıyor.`,
      choices: [
        'Aynadaki yansımaya anahtarı sor.',
        'Aras’ı çağırıp aynayı birlikte incele.',
        'Çatlağın çizdiği 307 işaretini takip et.',
      ],
    },
    {
      illustration: 'key' as const,
      text: `“${safeAction}” hamlen seni eski servis merdivenine götürüyor. Basamakların altında, üzerinde 03.07 yazan bir anahtar buluyorsun. Defne merdivenin başında beliriyor; “Bunu kullanırsan otel seni de hatırlar,” diyor. Uzakta bir kapı üç kez tıklıyor.`,
      choices: [
        'Anahtarı kapıda dene.',
        'Defne’ye neden beni koruduğunu sor.',
        'Anahtarı Aras’a verip sonucu izle.',
      ],
    },
    {
      illustration: 'room' as const,
      text: final
        ? `“${safeAction}” diyerek son eşiği geçiyorsun. Oda 307’de durmuş saat yeniden çalışıyor ve Mina sisin içinden çıkıyor. Otel bir anlığına nefes alıyor; sonra koridorlar sabaha açılıyor. Seçimlerin Mina’nın yolunu değiştirdi ve Atlas Oteli artık adını yalnızca bir misafir olarak hatırlıyor. Hikâye burada bitiyor; ama kapı her zaman başka bir yola açılabilir.`
        : `“${safeAction}” hamlenle Oda 307’nin kapısı aralanıyor. İçeride Mina’nın silueti ve durmuş saat karşı karşıya duruyor. Her ikisi de senden bir karar bekliyor. Kapının eşiğinde anahtar ısınıyor; bu kez döngünün seni değil, senin döngüyü yönlendirdiğini hissediyorsun.`,
      choices: final
        ? []
        : [
            'Mina’ya elini uzat.',
            'Saati 03.07’ye geri al.',
            'Kapıyı kapatıp oteli dışarıdan gözle.',
          ],
    },
  ];
  return scenes[chapter];
}

export async function narrate(
  adventure: Adventure,
  action: string,
  language: AdventureLanguage = 'tr',
) {
  const turn = adventure.turns.length + 1;
  if (turn > totalTurns || !action.trim() || action.length > 600) {
    throw new Error('Bu hamle gönderilemedi.');
  }
  const chapter = Math.floor((turn - 1) / 3);
  const story = getStory(language);
  const model = getGenerativeModel(
    getAI(getApp(), { backend: new GoogleAIBackend() }),
    {
      model: 'gemini-3.1-flash-lite',
      generationConfig: {
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
      systemInstruction: [
        language === 'en'
          ? 'You are the narrator of Room 307, an English interactive mystery game. The user is the protagonist.'
          : 'Türkçe interaktif gizem oyunu Oda 307’nin anlatıcısısın. Kullanıcı ana karakterdir.',
        language === 'en'
          ? 'The Atlas Hotel is trapped in a time loop. Mina is lost in it, Defne protects the hotel, and Aras seeks the truth.'
          : 'Atlas Oteli zaman döngüsündedir. Mina döngüde kaybolmuştur. Defne oteli korur, Aras gerçeği arar.',
        `${language === 'en' ? 'Characters' : 'Karakterler'}: ${story.characters.join(', ')}. ${language === 'en' ? 'Five chapters' : 'Beş bölüm'}: ${story.chapters.join(
          ', ',
        )}.`,
        language === 'en'
          ? 'Treat moves as in-story actions. Keep prior choices, clues, and character relationships consistent. Write each scene in English.'
          : 'Hamleleri hikâye içi eylemler olarak ele al. Önceki kararların sonuçlarını, bulunan ipuçlarını ve karakter ilişkilerini tutarlı hatırla.',
        language === 'en'
          ? 'Return only JSON: {"text":"scene", "choices":["move 1","move 2","move 3"], "illustration":"lobby"}. Scenes should be 100-170 words and choices must be distinct.'
          : 'Yalnızca JSON döndür: {"text":"sahne", "choices":["hamle 1","hamle 2","hamle 3"], "illustration":"lobby"}. Seçenekler farklı sonuçlar sunmalı ve en fazla 120 karakter olmalı.',
        'illustration alanını bu sahnede gerçekleşen asıl olaya göre seç: lobby (resepsiyon/lobi), corridor (koridor/merdiven), elevator (asansör), mirror (ayna), letter (mektup/misafir defteri), key (anahtar), room (307/gizli oda), exterior (otelin dışı/kaçış). Sadece bu sekiz değerden birini kullan.',
        'Finalde önceki seçimlere göre Mina’yı kurtarma, otelden kaçış veya döngünün bekçisi olma sonlarından birini sonuçlandır. Finalin choices alanı boş dizi olmalı.',
      ].join('\n'),
    },
  );
  const prompt = JSON.stringify({
    opening: story.opening.text,
    history: adventure.turns,
    action,
    direction: {
      chapter: story.chapters[chapter],
      turnInChapter: ((turn - 1) % 3) + 1,
      ...(turn % 3 === 0
        ? { discover: story.clues[chapter], closeChapter: true }
        : {}),
      final: turn === totalTurns,
    },
  });
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await model.generateContent(prompt);
      try {
        return parseScene(response.response.text(), turn === totalTurns);
      } catch {
        // Some model responses can be valid prose but not valid game JSON.
      }
    }
  } catch (error) {
    console.warn(
      'Macera anlatıcısı kullanılamadı; yerel sahne gösteriliyor.',
      error,
    );
  }
  return fallbackScene(turn, action, language);
}
