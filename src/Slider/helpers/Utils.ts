import { TRACK_STYLE } from './Const';

// return a value bounded to min/max
export const getBoundedValue = (
  value: number,
  maximumValue: number,
  minimumValue: number
) => Math.max(Math.min(value, maximumValue), minimumValue);

// Should we allow another component to take over this pan?
export const handlePanResponderRequestEnd = () => false;

// Should we become active when the user moves a touch over the thumb?
export const handleMoveShouldSetPanResponder = () => !TRACK_STYLE;
