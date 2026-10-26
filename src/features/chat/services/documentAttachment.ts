import ReactNativeBlobUtil from 'react-native-blob-util';
import { launchImageLibrary } from 'react-native-image-picker';

// PDF input is sent inline as base64, which adds roughly one third to its
// transfer size. A 4 MB cap keeps document analysis responsive on mobile.
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export type SelectedDocument = {
  name: string;
  mimeType: 'application/pdf' | 'text/plain';
  size: number;
  data: string;
};

export type SelectedImage = {
  name: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
  data: string;
};

type PickedFile = {
  uri: string;
  name: string | null;
  type: string | null;
  size: number | null;
  hasRequestedType: boolean;
};

function getMimeType(file: PickedFile): SelectedDocument['mimeType'] | null {
  if (file.type === 'application/pdf' || file.type === 'text/plain') {
    return file.type;
  }

  const extension = file.name?.split('.').pop()?.toLocaleLowerCase('tr-TR');
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'txt') return 'text/plain';
  return null;
}

function getImageMimeType(file: PickedFile): SelectedImage['mimeType'] | null {
  if (
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/webp'
  ) {
    return file.type;
  }

  const extension = file.name?.split('.').pop()?.toLocaleLowerCase('tr-TR');
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return null;
}

function localPath(uri: string) {
  return uri.startsWith('file://') ? decodeURIComponent(uri.slice(7)) : uri;
}

export async function chooseDocument(): Promise<SelectedDocument | null> {
  const { errorCodes, isErrorWithCode, keepLocalCopy, pick, types } =
    await import('@react-native-documents/picker');

  let files: PickedFile[];
  try {
    files = await pick({ type: [types.pdf, types.plainText] });
  } catch (error) {
    if (
      isErrorWithCode(error) &&
      error.code === errorCodes.OPERATION_CANCELED
    ) {
      return null;
    }
    throw new Error('Dosya seçilemedi. Lütfen tekrar deneyin.');
  }

  const file = files[0];
  const mimeType = file && file.hasRequestedType ? getMimeType(file) : null;
  if (!file || !mimeType) {
    throw new Error('Yalnızca PDF veya TXT dosyaları eklenebilir.');
  }
  if (!file.name || !file.size || file.size <= 0) {
    throw new Error('Dosya bilgileri okunamadı. Başka bir dosya seçin.');
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error('Dosya en fazla 4 MB olabilir.');
  }

  let localUri: string;
  try {
    const [copy] = await keepLocalCopy({
      destination: 'cachesDirectory',
      files: [{ uri: file.uri, fileName: file.name }],
    });
    if (!copy || copy.status !== 'success') {
      throw new Error('copy failed');
    }
    localUri = copy.localUri;
  } catch {
    throw new Error('Dosya cihaza aktarılamadı. Lütfen tekrar deneyin.');
  }

  let data: string;
  try {
    data = await ReactNativeBlobUtil.fs.readFile(localPath(localUri), 'base64');
  } catch {
    throw new Error('Dosya okunamadı. Lütfen tekrar deneyin.');
  }
  if (!data) {
    throw new Error('Dosya okunamadı. Lütfen tekrar deneyin.');
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error('Dosya en fazla 4 MB olabilir.');
  }

  return {
    name: file.name.slice(0, 120),
    mimeType,
    size: file.size,
    data,
  };
}

export async function chooseImage(): Promise<SelectedImage | null> {
  const response = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
    includeBase64: true,
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.8,
    assetRepresentationMode: 'compatible',
  });
  if (response.didCancel) return null;
  if (response.errorCode) {
    throw new Error(
      response.errorMessage ?? 'Görsel seçilemedi. Lütfen tekrar deneyin.',
    );
  }

  const asset = response.assets?.[0];
  const file: PickedFile | null = asset
    ? {
        uri: asset.uri ?? '',
        name: asset.fileName ?? 'ilan-ekran-goruntusu.jpg',
        type: asset.type ?? 'image/jpeg',
        size: asset.fileSize ?? 0,
        hasRequestedType: true,
      }
    : null;
  const mimeType = file ? getImageMimeType(file) : null;
  if (!file || !mimeType || !asset?.base64) {
    throw new Error('Yalnızca JPG, PNG veya WEBP görseller eklenebilir.');
  }
  const encodedSize = Math.floor((asset.base64.length * 3) / 4);
  if (encodedSize > MAX_IMAGE_BYTES) {
    throw new Error('Görsel en fazla 4 MB olabilir.');
  }

  return {
    name: (file.name ?? 'ilan-ekran-goruntusu.jpg').slice(0, 120),
    mimeType,
    size: encodedSize,
    data: asset.base64,
  };
}
