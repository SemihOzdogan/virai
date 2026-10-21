const mockGenerate = jest.fn();
const mockModel = jest.fn(() => ({ generateContent: mockGenerate }));
jest.mock('@react-native-firebase/app', () => ({ getApp: jest.fn() }));
jest.mock('@react-native-firebase/ai', () => ({
  getAI: jest.fn(),
  GoogleAIBackend: jest.fn(),
  getGenerativeModel: () => mockModel(),
  Schema: {
    object: (v: unknown) => v,
    array: (v: unknown) => v,
    string: () => ({}),
    enumString: (v: unknown) => v,
  },
}));
import { narrate } from '../src/features/adventure/services/narrator';
const valid = {
  text: 'Kapı açılıyor.',
  choices: ['Gir', 'Bekle', 'Seslen'],
  illustration: 'room',
};
const response = (text: string) => ({ response: { text: () => text } });
beforeEach(() => {
  jest.clearAllMocks();
  mockGenerate.mockReset();
});
test('uses the local scene after one malformed narrator response', async () => {
  mockGenerate
    .mockResolvedValueOnce(response('{'))
    .mockResolvedValueOnce(response(JSON.stringify(valid)));
  await expect(
    narrate({ version: 1, turns: [] }, 'Kapıyı aç'),
  ).resolves.toMatchObject({ illustration: 'lobby' });
  expect(mockGenerate).toHaveBeenCalledTimes(1);
});
test('continues with a local scene after a malformed response', async () => {
  mockGenerate.mockResolvedValue(response('{'));
  await expect(
    narrate({ version: 1, turns: [] }, 'Kapıyı aç'),
  ).resolves.toMatchObject({
    illustration: 'lobby',
    choices: expect.any(Array),
  });
  expect(mockGenerate).toHaveBeenCalledTimes(1);
});
test('continues with a local scene when the AI service is unavailable', async () => {
  mockGenerate.mockRejectedValue(new Error('quota exceeded'));
  await expect(
    narrate({ version: 1, turns: [] }, 'Kapıyı aç'),
  ).resolves.toMatchObject({
    illustration: 'lobby',
  });
  expect(mockGenerate).toHaveBeenCalledTimes(1);
});
