export type ColorTokens = {
  background: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  input: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  error: string;
  placeholder: string;
  assistantBubble: string;
  userBubble: string;
};

export const lightColors: ColorTokens = {
  background: '#F5F6FB', surface: '#FFFFFF', surfaceRaised: '#EEF0F8',
  text: '#1B2133', textSecondary: '#4D5872', textMuted: '#6E7890',
  border: 'rgba(38,51,82,0.15)', input: '#F1F3F9', accent: '#6847E8',
  accentSoft: 'rgba(104,71,232,0.12)', onAccent: '#FFFFFF', error: '#C83245',
  placeholder: '#7D879E', assistantBubble: '#ECEEF5', userBubble: '#6847E8',
};

export const darkColors: ColorTokens = {
  background: '#0B1020', surface: '#111A2E', surfaceRaised: '#151F35',
  text: '#F3F5FF', textSecondary: '#AAB9D9', textMuted: '#8492B0',
  border: 'rgba(148,163,184,0.18)', input: 'rgba(148,163,184,0.08)', accent: '#7658F5',
  accentSoft: 'rgba(124,92,255,0.16)', onAccent: '#FFFFFF', error: '#FF8A8A',
  placeholder: '#8EA0BE', assistantBubble: 'rgba(148,163,184,0.1)', userBubble: '#7658F5',
};

export const getColors = (isDark: boolean): ColorTokens => (isDark ? darkColors : lightColors);
