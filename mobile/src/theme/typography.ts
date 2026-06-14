import { TextStyle } from 'react-native';

export const typography = {
  title: {
    fontSize: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
  },
  titleSm: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 22,
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
} as const;
