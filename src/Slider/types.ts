import type { Animated, StyleProp, ViewStyle } from 'react-native';

export type RneFunctionComponent<T> = React.FunctionComponent<
  T & {
    children?: React.ReactNode | undefined;
  }
>;
export interface SliderProps {
  /** Initial value of the slider. */
  value?: number;

  /** If true the user won't be able to move the slider. */
  disabled?: boolean;

  /** Initial minimum value of the slider. */
  minimumValue?: number;

  /** Initial maximum value of the slider. */
  maximumValue?: number;

  /** Step value of the slider. The value should be between 0 and maximumValue - minimumValue). */
  step?: number;

  /** The color used for the track to the left of the button. */
  minimumTrackTintColor?: string;

  /** The color used for the track to the right of the button. */
  maximumTrackTintColor?: string;

  /** If true, thumb will respond and jump to any touch along the track. */
  allowTouchTrack?: boolean;

  /** The color used for the thumb. */
  thumbTintColor?: string;

  /** The size of the touch area that allows moving the thumb. The touch area has the same center as the visible thumb. This allows to have a visually small thumb while still allowing the user to move it easily. */
  thumbTouchSize?: Sizable;

  /** Callback continuously called while the user is dragging the slider. */
  onValueChange?(value: number): void;

  /** Callback called when the user starts changing the value (e.g. when the slider is pressed). */
  onSlidingStart?(value: number): void;

  /** Callback called when the user finishes changing the value (e.g. when the slider is released). */
  onSlidingComplete?(value: number): void;

  /** The style applied to the slider container. */
  style?: StyleProp<ViewStyle>;

  /** The style applied to the track. */
  trackStyle?: StyleProp<ViewStyle>;

  /** The style applied to the thumb. */
  thumbStyle?: StyleProp<ViewStyle>;

  /** The props applied to the thumb. Uses `Component` prop which can accept `Animated` components. */
  thumbProps?: any;

  /** Set this to true to visually see the thumb touch rect in green. */
  debugTouchArea?: boolean;

  /** Set to true if you want to use the default 'spring' animation. */
  animateTransitions?: boolean;

  /** Set to 'spring' or 'timing' to use one of those two types of animations with the default [animation properties](https://reactnative.dev/docs/animations.html). */
  animationType?: 'spring' | 'timing';

  /** Set the orientation of the slider. */
  orientation?: 'horizontal' | 'vertical';

  /** Used to configure the animation parameters. These are the same parameters in the [Animated library](https://reactnative.dev/docs/animations.html). */
  animationConfig?:
    | Animated.TimingAnimationConfig
    | Animated.SpringAnimationConfig;

  /** Apply style to the container of the slider.
   * @type Style
   */
  containerStyle?: {
    containerHorizontal: ViewStyle;
    containerVertical: ViewStyle;
    track: ViewStyle;
    trackHorizontal: ViewStyle;
    trackVertical: ViewStyle;
    touchArea: ViewStyle;
    debugThumbTouchArea: ViewStyle;
  };
}
export type Sizable = {
  width: number;
  height: number;
};

// enum to track vars that contain Sizable structures (used by handleMeasure)
export enum SizableVars {
  containerSize = 'containerSize',
  thumbSize = 'thumbSize',
  trackSize = 'trackSize',
}

// enum to track event types
export enum EventTypes {
  onSlidingStart = 'onSlidingStart',
  onValueChange = 'onValueChange',
  onSlidingComplete = 'onSlidingComplete',
}
