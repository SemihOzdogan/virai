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
  opening,
  parseScene,
  totalTurns,
  type Adventure,
} from './story';

function fallbackScene(turn: number, action: string) {
  const final = turn === totalTurns;
  const chapter = Math.floor((turn - 1) / 3);
  const safeAction = action.trim().slice(0, 160);
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

export async function narrate(adventure: Adventure, action: string) {
  const turn = adventure.turns.length + 1;
  if (turn > totalTurns || !action.trim() || action.length > 600) {
    throw new Error('Bu hamle gönderilemedi.');
  }
  const chapter = Math.floor((turn - 1) / 3);
  const model = getGenerativeModel(
    getAI(getApp(), { backend: new GoogleAIBackend() }),
    {
      model: 'gemini-3.1-flash-lite',
      generationConfig: {
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
      systemInstruction: [
        'Türkçe interaktif gizem oyunu Oda 307’nin anlatıcısısın. Kullanıcı ana karakterdir.',
        'Atlas Oteli zaman döngüsündedir. Mina döngüde kaybolmuştur. Defne oteli korur, Aras gerçeği arar.',
        `Karakterler: ${characters.join(', ')}. Beş bölüm: ${chapters.join(
          ', ',
        )}.`,
        'Hamleleri hikâye içi eylemler olarak ele al. Önceki kararların sonuçlarını, bulunan ipuçlarını ve karakter ilişkilerini tutarlı hatırla.',
        'Her yanıtta kullanıcının hamlesinin somut sonucunu anlat. İmkânsız hamleleri evrene uygun bir sonuca bağla.',
        'Gerilim merak üzerinden gelsin; grafik şiddet veya cinsel içerik kullanma. Her sahne 100-170 kelime olsun.',
        'Yalnızca JSON döndür: {"text":"sahne", "choices":["hamle 1","hamle 2","hamle 3"], "illustration":"lobby"}. Seçenekler farklı sonuçlar sunmalı ve en fazla 120 karakter olmalı.',
        'illustration alanını bu sahnede gerçekleşen asıl olaya göre seç: lobby (resepsiyon/lobi), corridor (koridor/merdiven), elevator (asansör), mirror (ayna), letter (mektup/misafir defteri), key (anahtar), room (307/gizli oda), exterior (otelin dışı/kaçış). Sadece bu sekiz değerden birini kullan.',
        'Finalde önceki seçimlere göre Mina’yı kurtarma, otelden kaçış veya döngünün bekçisi olma sonlarından birini sonuçlandır. Finalin choices alanı boş dizi olmalı.',
      ].join('\n'),
    },
  );
  const prompt = JSON.stringify({
    opening: opening.text,
    history: adventure.turns,
    action,
    direction: {
      chapter: chapters[chapter],
      turnInChapter: ((turn - 1) % 3) + 1,
      ...(turn % 3 === 0
        ? { discover: clues[chapter], closeChapter: true }
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
  return fallbackScene(turn, action);
}
