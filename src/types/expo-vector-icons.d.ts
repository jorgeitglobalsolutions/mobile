declare module '@expo/vector-icons' {
  import type { ComponentType } from 'react';
  import type { TextProps } from 'react-native';

  export type IoniconName = string;

  export interface IoniconProps extends TextProps {
    name: IoniconName;
    size?: number;
    color?: string;
  }

  export const Ionicons: ComponentType<IoniconProps> & { glyphMap: Record<string, string> };
}
