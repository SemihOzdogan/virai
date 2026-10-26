export const AppleButton = Object.assign(() => null, {
  Type: {
    CONTINUE: 'Continue',
    SIGN_IN: 'SignIn',
  },
  Style: {
    WHITE: 'White',
    BLACK: 'Black',
  },
});

export const appleAuth = {
  Error: { CANCELED: '1001' },
  Operation: { LOGIN: 1 },
  Scope: { FULL_NAME: 1, EMAIL: 0 },
  performRequest: jest.fn(),
};
