import React, {Component} from 'react';
import {
} from 'react-native';
import {Calendar} from '../../react-native-calendars';

export default class CalendarWeekModeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <Calendar
        viewMode={'week'}
      />
    );
  }
}
