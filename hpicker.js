import React, {
  Component,
  PropTypes,
} from 'react';
import {
  StyleSheet,
  Dimensions,
  Animated,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  ScrollView,
  View,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';

const defaultForegroundColor = '#444';

const itemPropTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  style: View.propTypes.style,
  foregroundColor: PropTypes.string,
};
const itemDefaultProps = {
  foregroundColor: defaultForegroundColor,
};

class HorizontalPickerItem extends Component {

  constructor(props) {
    super(props);
    this.state = intialState;
  }
}

const propTypes = {
  style: View.propTypes.style,
  selectedValue: PropTypes.any,
  children: PropTypes.array, // TODO: Make it HorizontalPicker.Item[]
  itemWidth: PropTypes.number,
  onChange: PropTypes.func,
  renderOverlay: PropTypes.func,
  foregroundColor: PropTypes.string,
  backgroundColor: PropTypes.string,
};

const defaultProps = {
  itemWidth: 30,
  foregroundColor: defaultForegroundColor,
};

const intialState = {
  selectedItem: null,
  bounds: null,
  padding: {left: 0, right: 0}

};

class HorizontalPicker extends Component {

  constructor(props) {
    super(props);
    this.state = intialState;
    this.isScrolling = false;
    this.scrollX = 0;
    this.ignoreNextScroll = false;
    this.snapDelay = 100;
  }

  static Item = HorizontalPickerItem

  componentWillReceiveProps(nextProps) {
    if (!this.isScrolling && this.props.selectedValue !== nextProps.selectedValue) {
      const index = this.getIndexForItem(nextProps.selectedValue);
      this.snapToIndex(index);
    }
  }

  componentDidMount() {
    this.snapToItem(this.props.selectedValue, false);
  }

  getIndexAt = (x) => {
    const {itemWidth} = this.props;
    const dx = this.state.bounds.width / 2 - this.state.padding.left;
    return Math.floor((x + dx) / itemWidth);
  }

  getIndexForItem = (item) => {
    const children = this.getChildren();
    return children.findIndex(e => e.props.value === item);
  }

  getChildren = () => React.Children.toArray(this.props.children);

  snap = () => {
    //const index = this.getIndexAt(this.scrollX);
    const index = this.getIndexForItem(this.props.selectedValue);
    this.snapToIndex(index);
  }

  snapToItem = (item) => {
    const index = this.getIndexForItem(item);
    this.snapToIndex(index);
  }

  snapToIndex = (index, animated = true, initial = false) => {
    //console.log('snapToIndex:', index);
    const itemsCount = this.props.children.length;

    if (!index) {
      index = 0;  
    }

    const snapX = index * this.props.itemWidth;
    // Make sure the component hasn't been unmounted
    if (this._scrollview) {
      //console.log('--------');
      //console.log('! SNAP ! ->', snapX);
      //console.log('--------');
      this._scrollview.scrollTo({x: snapX, y: 0, animated });
      //this.props.onSnapToIndex && fireCallback && this.props.onSnapToIndex(index);
      this.setState({ oldItemIndex: index });

      // iOS fix
      if (!initial && Platform.OS === 'ios') {
        //console.log('ignoreNextScroll');
        this.ignoreNextScroll = true;
      }
    }
  }

  onScroll = (event) => {
    this.scrollX = event.nativeEvent.contentOffset.x;
    //console.log('onScroll', this.scrollX);
    this.cancelDelayedSnap();
  }

  onScrollBeginDrag = (event) => {
    this.isScrolling = true;
    this.scrollStart = event.nativeEvent.contentOffset.x;
    this.cancelDelayedSnap();
    this.ignoreNextScroll = false;
    //console.log('onScrollBeginDrag', this.scrollStart);
  }
  
  onScrollEndDrag = (event) => {
    this.isScrolling = false;
    if (this.ignoreNextScroll) {
      //console.log('onScrollEnd, ignored');
      this.ignoreNextScroll = false;
      return;
    }
    //console.log('onScrollEnd');
    this.delayedSnap();
  }

  onMomentumScrollBegin = (event) => {
    this.isScrolling = true;
    //console.log('onMomentumScrollBegin', event.nativeEvent);
    this.cancelDelayedSnap();
  }

  onMomentumScrollEnd = (event) => {
    this.isScrolling = false;
    if (this.ignoreNextScroll) {
      //console.log('onMomentumScrollEnd, ignored');
      this.ignoreNextScroll = false;
      return;
    }
    this.delayedSnap();
  }

  delayedSnap = (item) => {
    //console.log('delayedSnap, cancelling previous...');
    this.cancelDelayedSnap();
    //console.log('delayedSnap');
    this.snapNoMomentumTimeout =
      setTimeout(() => {
        //console.log('snap');
        this.onChange()
        this.snap();
      }, this.snapDelay);
  }

  onChange = () => {
    const index = this.getIndexAt(this.scrollX);
    const item = this.getChildren()[index];
    //console.log('onScroll', index);
    if (item && this.props.onChange) {
      this.props.onChange(item.props.value);
    }
  }

  cancelDelayedSnap = () => {
    if (this.snapNoMomentumTimeout) {
      //console.log('cancelDelayedSnap');
      clearTimeout(this.snapNoMomentumTimeout);
    }
  }

  handleItemPress = (value) => {
    return () => {
      this.snapToItem(value);
    };
  }

  renderChildren = (children) => {
    return children.map(this.renderChild);
  }

  renderChild = (child) => {
    const itemValue = child.props.value;
    const color = this.props.foregroundColor || defaultForegroundColor;
    return (
      <TouchableWithoutFeedback key={itemValue} onPress={x = this.handleItemPress(itemValue)}>
        <View style={[styles.itemContainer, {width: this.props.itemWidth}]}>
          <View style={[styles.item, child.props.style]}>
            <Text style={[styles.itemText, {color}]}>{child.props.label}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
        // <HorizontalPicker.Item {...child.props} foregroundColor={this.props.foregroundColor}/>
  }

  onLayout = (event) => {
    const {nativeEvent: {layout: {x, y, width, height}}} = event;
    const bounds = {width, height};
    const leftItemWidth = this.props.itemWidth;
    const rightItemWidth = this.props.itemWidth;
    const padding ={
      left: !bounds ? 0 : ((bounds.width - leftItemWidth) / 2),
      right: !bounds ? 0 : ((bounds.width - rightItemWidth) / 2)
    } 

    this.setState({
      bounds,
      padding
    });
  }

  calculatePositions = () => {
    const { itemWidth } = this.props;

    this.getChildren().map((item, index) => {
      const _index = this._getCustomIndex(index, props);
      this._positions[index] = {
        start: _index * itemWidth,
        end: _index * itemWidth + itemWidth
      };
    });
  }

  renderDefaultOverlay = () => {
    const color = this.props.foregroundColor;
    return (
      <View style={{flex: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: color}} />
    );
  }

  render() {
    const bounds = this.state.bounds;
    const renderOverlay = this.props.renderOverlay || this.renderDefaultOverlay;
    return (
      <View style={[this.props.style]}>
        <ScrollView
          ref={(scrollview) => { this._scrollview = scrollview; }}
          decelerationRate={'fast'}
          scrollEventThrottle={16}
          contentContainerStyle={{paddingLeft: this.state.padding.left, paddingRight: this.state.padding.right}}
          showsHorizontalScrollIndicator={false}
          horizontal={true}
          onScroll={this.onScroll}
          onScrollBeginDrag={this.onScrollBeginDrag}
          onScrollEndDrag={this.onScrollEndDrag}
          onMomentumScrollBegin={this.onMomentumScrollBegin}
          onMomentumScrollEnd={this.onMomentumScrollEnd}
          onLayout={this.onLayout}
          style={this.scrollView}>
          <View style={styles.contentContainer}>
            {bounds && this.renderChildren(this.props.children)}
          </View>
        </ScrollView>
        <View style={styles.overlay} pointerEvents='none'>
          <View style={[{flex: 1, width: this.props.itemWidth}]}>
            {renderOverlay()}
          </View>
        </View>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  image: {
    flex: 1
  },
  touchArea: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scrollView: {
    flex: 1
  },
  contentContainer: {
    flexDirection: 'row'
  },
  itemContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center'
  },
  item: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center'
  },
  itemText: {
    fontSize: 20,
    textAlign: 'center',
    flex: 1
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'column',
    flex: 1,
    alignItems: 'center'
  }
});

HorizontalPickerItem.propTypes = itemPropTypes;
HorizontalPickerItem.defaultProps = itemDefaultProps;

HorizontalPicker.propTypes = propTypes;
HorizontalPicker.defaultProps = defaultProps;

export default HorizontalPicker;
