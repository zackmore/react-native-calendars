import React, {Component} from 'react';
import {
  FlatList, Platform, Dimensions,
} from 'react-native';
import PropTypes from 'prop-types';
import XDate from 'xdate';

import {xdateToData, parseDate} from '../interface';
import styleConstructor from './style';
import dateutils from '../dateutils';
import Calendar from '../calendar';
import CalendarListItem from './item';

const {width} = Dimensions.get('window');
const viewabilityConfig = {
  itemVisiblePercentThreshold: 50
};

class CalendarList extends Component {
  static propTypes = {
    ...Calendar.propTypes,

    // Max amount of months allowed to scroll to the past. Default = 50
    pastScrollRange: PropTypes.number,

    // Max amount of months allowed to scroll to the future. Default = 50
    futureScrollRange: PropTypes.number,

    // Enable or disable scrolling of calendar list
    scrollEnabled: PropTypes.bool,

    // Enable or disable vertical scroll indicator. Default = false
    showScrollIndicator: PropTypes.bool,

    // When true, the calendar list scrolls to top when the status bar is tapped. Default = true
    scrollsToTop: PropTypes.bool,

    // Enable or disable paging on scroll
    pagingEnabled: PropTypes.bool,

    // Used when calendar scroll is horizontal, default is device width, pagination should be disabled
    calendarWidth: PropTypes.number,

    // Whether the scroll is horizontal
    horizontal: PropTypes.bool,
    // Dynamic calendar height
    calendarHeight: PropTypes.number,

    // View Mode
    viewMode: PropTypes.oneOf(['week', 'month'])
  };

  static defaultProps = {
    viewMode: 'week'
  };

  constructor(props) {
    super(props);
    this.pastScrollRange = props.pastScrollRange === undefined ? 50 : props.pastScrollRange;
    this.futureScrollRange = props.futureScrollRange === undefined ? 50 : props.futureScrollRange;
    this.style = styleConstructor(props.theme);
    this.calendarWidth = this.props.calendarWidth || width;
    this.calendarHeight = props.calendarHeight;

    const rows = [];
    const texts = [];
    const date = parseDate(props.current) || XDate();
    for (let i = 0; i <= this.pastScrollRange + this.futureScrollRange; i++) {
      let rangeDate;
      let rangeDateStr;
      if (this.props.viewMode === 'month') {
        rangeDate = date.clone().addMonths(i - this.pastScrollRange, true);
      } else if (this.props.viewMode === 'week') {
        rangeDate = date.clone().addWeeks(i - this.pastScrollRange, true);
      }
      // rangeDateStr = rangeDate.toString('MM yyyy');
      rangeDateStr = '请稍后...';
      texts.push(rangeDateStr);
      /*
       * This selects range around current shown month [-0, +2] or [-1, +1] month for detail calendar rendering.
       * If `this.pastScrollRange` is `undefined` it's equal to `false` or 0 in next condition.
       */
      if (this.pastScrollRange - 1 <= i && i <= this.pastScrollRange + 1 || !this.pastScrollRange && i <= this.pastScrollRange + 2) {
        rows.push(rangeDate);
      } else {
        rows.push(rangeDateStr);
      }
    }

    this.state = {
      rows,
      texts,
      openDate: date
    };

    this.onViewableItemsChangedBound = this.onViewableItemsChanged.bind(this);
    this.renderCalendarBound = this.renderCalendar.bind(this);
    this.getItemLayout = this.getItemLayout.bind(this);
    this.onLayout = this.onLayout.bind(this);
  }

  onLayout(event) {
    if (this.props.onLayout) {
      this.props.onLayout(event);
    }
  }

  scrollToMonth(m) {
    const month = parseDate(m);
    const scrollTo = month || this.state.openDate;
    let diff;
    if (this.props.viewMode === 'month') {
      diff = Math.round(this.state.openDate.clone().setDate(1).diffMonths(scrollTo.clone().setDate(1)));
    } else if (this.props.viewMode === 'week') {
      const thisWeek = this.state.openDate.clone().getWeek();
      const toWeek = scrollTo.clone().addDays(1).getWeek(); // add oneday to fix click sunday diff bug
      diff = toWeek - thisWeek;
    }
    const size = this.props.horizontal ? this.calendarWidth : this.calendarHeight;
    const scrollAmount = (size * this.pastScrollRange) + (diff * size);
    // console.log(month, this.state.openDate);
    // console.log(scrollAmount, diff, this.props.viewMode);
    this.listView.scrollToOffset({offset: scrollAmount, animated: false});
  }

  componentWillReceiveProps(props) {
    // Changed:
    if (props.viewMode !== this.props.viewMode) {
      // viewMode changed, re-get rows
      const rows = [];
      const texts = [];
      const date = parseDate(props.current) || XDate();
      for (let i = 0; i <= this.pastScrollRange + this.futureScrollRange; i++) {
        let rangeDate;
        let rangeDateStr;
        if (props.viewMode === 'month') {
          rangeDate = date.clone().addMonths(i - this.pastScrollRange, true);
        } else if (props.viewMode === 'week') {
          rangeDate = date.clone().addWeeks(i - this.pastScrollRange, true);
        }
        // rangeDateStr = rangeDate.toString('MM yyyy');
        rangeDateStr = '请稍候...';
        texts.push(rangeDateStr);
        /*
         * This selects range around current shown month [-0, +2] or [-1, +1] month for detail calendar rendering.
         * If `this.pastScrollRange` is `undefined` it's equal to `false` or 0 in next condition.
         */
        if (this.pastScrollRange - 1 <= i && i <= this.pastScrollRange + 1 || !this.pastScrollRange && i <= this.pastScrollRange + 2) {
          rows.push(rangeDate);
        } else {
          rows.push(rangeDateStr);
        }
      }

      this.setState({
        rows,
        texts,
        openDate: date
      });

      setTimeout(() => {
        const nextCurrent = parseDate(props.current);
        this.scrollToMonth(nextCurrent);
      }, 10);
    } else {
      const current = parseDate(this.props.current);
      const nextCurrent = parseDate(props.current);
      if (nextCurrent && current && nextCurrent.getTime() !== current.getTime()) {
        this.scrollToMonth(nextCurrent);
      }

      const rowclone = this.state.rows;
      const newrows = [];
      for (let i = 0; i < rowclone.length; i++) {
        let val = this.state.texts[i];
        if (rowclone[i].getTime) {
          val = rowclone[i].clone();
          val.propbump = rowclone[i].propbump ? rowclone[i].propbump + 1 : 1;
        }
        newrows.push(val);
      }

      this.setState({
        rows: newrows
      });
    }
  }

  onViewableItemsChanged({viewableItems}) {
    function rowIsCloseToViewable(index, distance) {
      for (let i = 0; i < viewableItems.length; i++) {
        if (Math.abs(index - parseInt(viewableItems[i].index)) <= distance) {
          return true;
        }
      }
      return false;
    }

    const rowclone = this.state.rows;
    const newrows = [];

    const visibleMonths = [];
    for (let i = 0; i < rowclone.length; i++) {
      let val = rowclone[i];
      const rowShouldBeRendered = rowIsCloseToViewable(i, 1);
      if (rowShouldBeRendered && !rowclone[i].getTime) {
        if (this.props.viewMode === 'month') {
          val = this.state.openDate.clone().addMonths(i - this.pastScrollRange, true);
        } else if (this.props.viewMode === 'week') {
          val = this.state.openDate.clone().addWeeks(i - this.pastScrollRange, true);
        }
      } else if (!rowShouldBeRendered) {
        val = this.state.texts[i];
      }
      newrows.push(val);
      if (rowIsCloseToViewable(i, 0)) {
        visibleMonths.push(xdateToData(val));
      }
    }
    if (this.props.onVisibleMonthsChange) {
      this.props.onVisibleMonthsChange(visibleMonths);
    }
    this.setState({
      rows: newrows
    });
  }

  renderCalendar({item}) {
    return (<CalendarListItem viewMode={this.props.viewMode} item={item} calendarHeight={this.calendarHeight} calendarWidth={this.props.horizontal ? this.calendarWidth : undefined  } {...this.props} />);
  }

  getItemLayout(data, index) {
    return {length: this.props.horizontal ? this.calendarWidth : this.calendarHeight, offset: (this.props.horizontal ? this.calendarWidth : this.calendarHeight) * index, index};
  }

  getMonthIndex(month) {
    let diffMonths = this.state.openDate.diffMonths(month) + this.pastScrollRange;
    return diffMonths;
  }

  render() {
    return (
      <FlatList
        onLayout={this.onLayout}
        ref={(c) => this.listView = c}
        //scrollEventThrottle={1000}
        style={[this.style.container, this.props.style]}
        initialListSize={this.pastScrollRange + this.futureScrollRange + 1}
        data={this.state.rows}
        //snapToAlignment='start'
        //snapToInterval={this.calendarHeight}
        removeClippedSubviews={this.props.removeClippedSubviews !== undefined ? this.props.removeClippedSubviews: (Platform.OS === 'android' ? false : true)}
        pageSize={1}
        horizontal={this.props.horizontal || false}
        pagingEnabled={this.props.pagingEnabled}
        onViewableItemsChanged={this.onViewableItemsChangedBound}
        viewabilityConfig={viewabilityConfig}
        renderItem={this.renderCalendarBound}
        showsVerticalScrollIndicator={this.props.showScrollIndicator !== undefined ? this.props.showScrollIndicator : false}
        showsHorizontalScrollIndicator={this.props.showScrollIndicator !== undefined ? this.props.showScrollIndicator : false}
        scrollEnabled={this.props.scrollingEnabled !== undefined ? this.props.scrollingEnabled : true}
        keyExtractor={(item, index) => String(index)}
        initialScrollIndex={this.state.openDate ? this.getMonthIndex(this.state.openDate) : false}
        getItemLayout={this.getItemLayout}
        scrollsToTop={this.props.scrollsToTop !== undefined ? this.props.scrollsToTop : false}
      />
    );
  }
}

CalendarList.defaultProps = {
  calendarHeight: 360
};

export default CalendarList;
