import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
  PanResponderGestureState,
  LayoutChangeEvent,
} from 'react-native';
import { Rect } from './components/Rect';
import { SliderThumb } from './components/SliderThumb';
import {
  DEFAULT_ANIMATION_CONFIGS,
  THUMB_SIZE,
  TRACK_SIZE,
  TRACK_STYLE,
} from './helpers/Const';
import {
  getBoundedValue,
  handleMoveShouldSetPanResponder,
  handlePanResponderRequestEnd,
} from './helpers/Utils';
import {
  EventTypes,
  RneFunctionComponent,
  Sizable,
  SizableVars,
  SliderProps,
} from './types';

/** Sliders allow users to select a value from a fixed set of values using drag utility.*/
export const Slider: RneFunctionComponent<SliderProps> = ({
  allowTouchTrack = false,
  animateTransitions,
  animationConfig,
  animationType = 'timing',
  containerStyle,
  debugTouchArea = false,
  disabled,
  maximumTrackTintColor = '#b3b3b3',
  maximumValue = 1,
  minimumTrackTintColor = '#3f3f3f',
  minimumValue = 0,
  onSlidingComplete,
  onSlidingStart,
  onValueChange,
  orientation = 'horizontal',
  step = 0,
  style,
  thumbProps,
  thumbStyle,
  thumbTintColor = 'red',
  thumbTouchSize = { height: THUMB_SIZE, width: THUMB_SIZE },
  trackStyle,
  value: _propValue = 0,
  ...other
}) => {
  const propValue = getBoundedValue(_propValue, maximumValue, minimumValue);
  const prevPropValue = useRef(propValue);
  const animatedValue = useRef(new Animated.Value(propValue));
  const _previousLeft = useRef(0);
  const gestureStartPosition = useRef(0);
  const [allMeasured, setAllMeasured] = useState(false);
  const [containerSize, setContainerSize] = useState<Sizable>({
    width: 0,
    height: 0,
  });
  const [trackSize, setTrackSize] = useState<Sizable>({ width: 0, height: 0 });
  const [thumbSize, setThumbSize] = useState<Sizable>({ width: 0, height: 0 });
  const isVertical = orientation === 'vertical';

  // update size rect for given variable
  const handleMeasure = useCallback(
    (name: SizableVars, event: LayoutChangeEvent) => {
      // get current value and setter for the appropriate variable
      const varInfo = {
        containerSize: { size: containerSize, setSize: setContainerSize },
        thumbSize: { size: thumbSize, setSize: setThumbSize },
        trackSize: { size: trackSize, setSize: setTrackSize },
      };
      const { size, setSize } = varInfo[name];

      // update the var's size, adjusting for horizontal/vertical
      const rect = event.nativeEvent.layout;
      const rectWidth = rect?.width ?? size.width;
      const rectHeight = rect?.height ?? size.height;
      const newSize = {
        height: isVertical ? rectWidth : rectHeight,
        width: isVertical ? rectHeight : rectWidth,
      };
      setSize(newSize);
    },
    [containerSize, isVertical, thumbSize, trackSize]
  );

  // use an effect to update allMeasured when sizes change
  useEffect(
    () =>
      setAllMeasured(
        !!(
          containerSize.height &&
          containerSize.width &&
          thumbSize.height &&
          thumbSize.width &&
          trackSize.height &&
          trackSize.width
        )
      ),
    [
      containerSize.height,
      containerSize.width,
      thumbSize.height,
      thumbSize.width,
      trackSize.height,
      trackSize.width,
    ]
  );

  const measureContainer = useCallback(
    (event) => handleMeasure(SizableVars.containerSize, event),
    [handleMeasure]
  );
  const measureTrack = useCallback(
    (event) => handleMeasure(SizableVars.trackSize, event),
    [handleMeasure]
  );
  const measureThumb = useCallback(
    (event) => handleMeasure(SizableVars.thumbSize, event),
    [handleMeasure]
  );

  // set the current animation value
  const setCurrentValue = useCallback(
    (v: number) => animatedValue.current.setValue(v),
    [animatedValue]
  );

  // animate to the new value
  const setCurrentValueAnimated = useCallback(
    (v: number) =>
      Animated[animationType](animatedValue.current, {
        ...DEFAULT_ANIMATION_CONFIGS[animationType],
        ...animationConfig,
        toValue: v,
      }).start(),
    [animationConfig, animationType]
  );

  // update animation values if props.value changed
  useEffect(() => {
    // if value prop changed, we need to update
    if (prevPropValue.current !== propValue) {
      prevPropValue.current = propValue;
      if (animateTransitions) {
        setCurrentValueAnimated(propValue);
      } else {
        setCurrentValue(propValue);
      }
    }
  }, [
    animateTransitions,
    maximumValue,
    minimumValue,
    setCurrentValue,
    setCurrentValueAnimated,
    propValue,
  ]);

  const getValueForTouch = useCallback(
    (location: number) => {
      const length = containerSize.width - thumbSize.width;
      const ratio = location / length;
      let newValue = ratio * (maximumValue - minimumValue);
      if (step) {
        newValue = Math.round(newValue / step) * step;
      }
      return getBoundedValue(
        newValue + minimumValue,
        maximumValue,
        minimumValue
      );
    },
    [containerSize.width, maximumValue, minimumValue, step, thumbSize.width]
  );

  // get value of where some touched on slider.
  const getOnTouchValue = useCallback(
    ({ nativeEvent }: GestureResponderEvent) => {
      const location = isVertical
        ? nativeEvent.locationY
        : nativeEvent.locationX;
      return getValueForTouch(location);
    },
    [getValueForTouch, isVertical]
  );

  const getThumbLeft = useCallback(
    (v: number) => {
      const ratio = (v - minimumValue) / (maximumValue - minimumValue);
      return ratio * (containerSize.width - thumbSize.width);
    },
    [containerSize.width, maximumValue, minimumValue, thumbSize.width]
  );

  const getTouchOverflowSize = useCallback(
    (): Sizable =>
      allMeasured
        ? {
            height: Math.max(0, thumbTouchSize.height - containerSize.height),
            width: Math.max(0, thumbTouchSize.width - thumbSize.width),
          }
        : { height: 0, width: 0 },
    [
      allMeasured,
      containerSize.height,
      thumbSize.width,
      thumbTouchSize.height,
      thumbTouchSize.width,
    ]
  );

  const getCurrentValue = useCallback(
    () => (animatedValue.current as any).__getValue(),
    []
  );

  const getThumbTouchRect = useCallback(() => {
    const touchOverflowSize: any = getTouchOverflowSize();
    const height =
      touchOverflowSize.height / 2 +
      (containerSize.height - thumbTouchSize.height) / 2;
    const width =
      touchOverflowSize.width / 2 +
      getThumbLeft(getCurrentValue()) +
      (thumbSize.width - thumbTouchSize.width) / 2;
    return isVertical
      ? new Rect(height, width, thumbTouchSize.width, thumbTouchSize.height)
      : new Rect(width, height, thumbTouchSize.width, thumbTouchSize.height);
  }, [
    containerSize.height,
    getCurrentValue,
    getThumbLeft,
    getTouchOverflowSize,
    isVertical,
    thumbSize.width,
    thumbTouchSize.height,
    thumbTouchSize.width,
  ]);

  const getValue = useCallback(
    (gestureState: PanResponderGestureState) => {
      const delta =
        (isVertical ? gestureState.moveY : gestureState.moveX) -
        gestureStartPosition.current;
      const location = _previousLeft.current + delta;
      return getValueForTouch(location);
    },
    [getValueForTouch, isVertical]
  );

  const fireChangeEvent = useCallback(
    (event: EventTypes) => {
      const v = getCurrentValue();
      if (event === EventTypes.onSlidingStart) {
        onSlidingStart?.(v);
      } else if (event === EventTypes.onSlidingComplete) {
        onSlidingComplete?.(v);
      } else if (event === EventTypes.onValueChange) {
        onValueChange?.(v);
      }
    },
    [getCurrentValue, onSlidingComplete, onSlidingStart, onValueChange]
  );

  const handlePanResponderGrant = useCallback(
    (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      _previousLeft.current = getThumbLeft(getCurrentValue());
      gestureStartPosition.current = isVertical
        ? gestureState.y0
        : gestureState.x0;
      fireChangeEvent(EventTypes.onSlidingStart);
    },
    [fireChangeEvent, getCurrentValue, getThumbLeft, isVertical]
  );

  const handlePanResponderMove = useCallback(
    (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
      if (!disabled) {
        setCurrentValue(getValue(gestureState));
        fireChangeEvent(EventTypes.onValueChange);
      }
    },
    [disabled, fireChangeEvent, getValue, setCurrentValue]
  );

  const handlePanResponderEnd = useCallback(() => {
    if (!disabled) {
      fireChangeEvent(EventTypes.onSlidingComplete);
    }
  }, [disabled, fireChangeEvent]);

  const thumbHitTest = useCallback(
    ({ nativeEvent }: GestureResponderEvent) => {
      const thumbTouchRect = getThumbTouchRect();
      return thumbTouchRect.containsPoint(
        nativeEvent.locationX,
        nativeEvent.locationY
      );
    },
    [getThumbTouchRect]
  );

  const handleStartShouldSetPanResponder = useCallback(
    (e: GestureResponderEvent /* gestureState: Object */) => {
      // Should we become active when the user presses down on the thumb?
      if (!allowTouchTrack) {
        return thumbHitTest(e);
      }
      setCurrentValue(getOnTouchValue(e));
      fireChangeEvent(EventTypes.onValueChange);
      return true;
    },
    [
      allowTouchTrack,
      fireChangeEvent,
      getOnTouchValue,
      setCurrentValue,
      thumbHitTest,
    ]
  );

  const getTouchOverflowStyle = useCallback(() => {
    const { width, height } = getTouchOverflowSize();
    const touchOverflowStyle: ViewStyle = {};
    const verticalMargin = -height / 2;
    touchOverflowStyle.marginTop = verticalMargin;
    touchOverflowStyle.marginBottom = verticalMargin;
    const horizontalMargin = -width / 2;
    touchOverflowStyle.marginLeft = horizontalMargin;
    touchOverflowStyle.marginRight = horizontalMargin;
    if (debugTouchArea === true) {
      touchOverflowStyle.backgroundColor = 'orange';
      touchOverflowStyle.opacity = 0.5;
    }
    return touchOverflowStyle;
  }, [debugTouchArea, getTouchOverflowSize]);

  const renderDebugThumbTouchRect = useCallback(
    (thumbLeft: Animated.AnimatedInterpolation<any>) => {
      const thumbTouchRect = getThumbTouchRect();
      const positionStyle = {
        left: thumbLeft,
        top: thumbTouchRect.y,
        width: thumbTouchRect.width,
        height: thumbTouchRect.height,
      };

      return <Animated.View style={positionStyle} pointerEvents="none" />;
    },
    [getThumbTouchRect]
  );

  const getMinimumTrackStyles = useCallback(
    (thumbStart: Animated.Animated) => {
      const minimumTrackStyle: StyleProp<any> = {
        position: 'absolute',
      };
      if (!allMeasured) {
        minimumTrackStyle.height = 0;
        minimumTrackStyle.width = 0;
      } else if (isVertical) {
        minimumTrackStyle.height = Animated.add(
          thumbStart,
          thumbSize.height / 2
        );
        minimumTrackStyle.marginLeft = trackSize.width * TRACK_STYLE;
      } else {
        minimumTrackStyle.width = Animated.add(thumbStart, thumbSize.width / 2);
        minimumTrackStyle.marginTop = trackSize.height * TRACK_STYLE;
      }
      return minimumTrackStyle;
    },
    [
      allMeasured,
      isVertical,
      thumbSize.height,
      thumbSize.width,
      trackSize.height,
      trackSize.width,
    ]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: handleStartShouldSetPanResponder,
        onMoveShouldSetPanResponder: handleMoveShouldSetPanResponder,
        onPanResponderGrant: handlePanResponderGrant,
        onPanResponderMove: handlePanResponderMove,
        onPanResponderRelease: handlePanResponderEnd,
        onPanResponderTerminationRequest: handlePanResponderRequestEnd,
        onPanResponderTerminate: handlePanResponderEnd,
      }),
    [
      handleStartShouldSetPanResponder,
      handlePanResponderGrant,
      handlePanResponderMove,
      handlePanResponderEnd,
    ]
  );

  const mainStyles = containerStyle ?? styles;
  const appliedTrackStyle = StyleSheet.flatten([styles.track, trackStyle]);
  const thumbStart = animatedValue.current.interpolate({
    inputRange: [minimumValue, maximumValue],
    outputRange: [0, containerSize.width - thumbSize.width],
  });
  const minimumTrackStyle = {
    ...getMinimumTrackStyles(thumbStart),
    backgroundColor: minimumTrackTintColor,
  };
  const touchOverflowStyle = getTouchOverflowStyle();

  return (
    <View
      testID="RNE__Slider_Container"
      {...other}
      style={StyleSheet.flatten([
        isVertical
          ? mainStyles.containerVertical
          : mainStyles.containerHorizontal,
        style,
      ])}
      onLayout={measureContainer}
      accessibilityRole="adjustable"
      accessibilityValue={{
        min: minimumValue,
        max: maximumValue,
        now: getCurrentValue(),
      }}
    >
      <View
        testID="RNE__Slider_Track_maximum"
        style={StyleSheet.flatten([
          mainStyles.track,
          isVertical ? mainStyles.trackVertical : mainStyles.trackHorizontal,
          appliedTrackStyle,
          { backgroundColor: maximumTrackTintColor },
        ])}
        onLayout={measureTrack}
      />

      <Animated.View
        testID="RNE__Slider_Track_minimum"
        style={StyleSheet.flatten([
          mainStyles.track,
          isVertical ? mainStyles.trackVertical : mainStyles.trackHorizontal,
          appliedTrackStyle,
          minimumTrackStyle,
        ])}
      />
      <SliderThumb
        isVisible={allMeasured}
        onLayout={measureThumb}
        style={thumbStyle}
        color={thumbTintColor}
        start={thumbStart}
        vertical={isVertical}
        {...thumbProps}
      />
      <View
        testID="RNE__Slider_TouchArea"
        style={StyleSheet.flatten([styles.touchArea, touchOverflowStyle])}
        {...panResponder.panHandlers}
      >
        {debugTouchArea === true && renderDebugThumbTouchRect(thumbStart)}
      </View>
    </View>
  );
};

Slider.defaultProps = {
  value: 0,
  minimumValue: 0,
  maximumValue: 1,
  step: 0,
  minimumTrackTintColor: '#3f3f3f',
  maximumTrackTintColor: '#b3b3b3',
  allowTouchTrack: false,
  thumbTintColor: 'red',
  thumbTouchSize: { width: THUMB_SIZE, height: THUMB_SIZE },
  debugTouchArea: false,
  animationType: 'timing',
  orientation: 'horizontal',
};

const styles = StyleSheet.create({
  containerHorizontal: {
    height: 40,
    justifyContent: 'center',
  },
  containerVertical: {
    width: 40,
    flexDirection: 'column',
    alignItems: 'center',
  },
  track: {
    borderRadius: TRACK_SIZE / 2,
  },
  trackHorizontal: {
    height: TRACK_SIZE,
  },
  trackVertical: {
    flex: 1,
    width: TRACK_SIZE,
  },
  touchArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  debugThumbTouchArea: {
    position: 'absolute',
    backgroundColor: 'green',
    opacity: 0.5,
  },
});

Slider.displayName = 'Slider';
