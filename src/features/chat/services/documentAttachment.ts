import ReactNativeBlobUtil from 'react-native-blob-util';

export const MAX_DOCUMENT_BYTES = 12 * 1024 * 1024;

export type SelectedDocument = {
  name: string;
  mimeType: 'application/pdf' | 'text/plain';
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

function localPath(uri: string) {
  return uri.startsWith('file://') ? decodeURIComponent(uri.slice(7)) : uri;
}

export async function chooseDocument(): Promise<SelectedDocument | null> {
  const { errorCodes, isErrorWithCode, keepLocalCopy, pick, types } = await import(
    '@react-native-documents/picker'
  );

  let files: PickedFile[];
  try {
    files = await pick({ type: [types.pdf, types.plainText] });
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
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
    throw new Error('Dosya en fazla 12 MB olabilir.');
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
    throw new Error('Dosya en fazla 12 MB olabilir.');
  }

  return {
    name: file.name.slice(0, 120),
    mimeType,
    size: file.size,
    data,
  };
}
