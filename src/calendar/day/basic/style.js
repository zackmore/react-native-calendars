import {StyleSheet, Platform} from 'react-native';
import * as defaultStyle from '../../../style';

const STYLESHEET_ID = 'stylesheet.day.basic';

export default function styleConstructor(theme={}) {
  const appStyle = {...defaultStyle, ...theme};
  return StyleSheet.create({
    base: {
      width: 44,
      height: 44,
      alignItems: 'center',
    },
    text: {
      marginTop: Platform.OS === 'android' ? 4 : 6,
      fontSize: appStyle.textDayFontSize,
      fontFamily: appStyle.textDayFontFamily,
      fontWeight: '300',
      color: appStyle.dayTextColor,
      backgroundColor: 'rgba(255, 255, 255, 0)',
      width: 24,
      height: 24,
      textAlign: 'center',
      lineHeight: 24
    },
    alignedText: {
      marginTop: Platform.OS === 'android' ? 4 : 6
    },
    selected: {
      backgroundColor: appStyle.selectedDayBackgroundColor,
    },
    todayText: {
      color: appStyle.todayTextColor,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      borderRadius: 12
    },
    selectedText: {
      color: appStyle.selectedDayTextColor,
      backgroundColor: appStyle.selectedDayBackgroundColor,
      borderRadius: 12
    },
    disabledText: {
      color: appStyle.textDisabledColor
    },
    dot: {
      width: 6,
      height: 6,
      marginTop: 4,
      borderRadius: 3,
      opacity: 0
    },
    visibleDot: {
      opacity: 1,
      backgroundColor: appStyle.dotColor
    },
    selectedDot: {
      backgroundColor: appStyle.dotColor
    },
    ...(theme[STYLESHEET_ID] || {})
  });
}
