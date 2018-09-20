/*
 * @Author: fantao.meng
 * @Date: 2018-09-04 11:07:39
 * @Last Modified by: fantao.meng
 * @Last Modified time: 2018-09-20 16:26:42
 */

import React from 'react';
import {
	View, Text, Image, FlatList, Animated, PanResponder, StyleSheet,
} from 'react-native';
import * as PropTypes from 'prop-types';
import LoadView from 'react-native-loadview';

const HEADER_HEIGHT = 70;
const HEADER_MAX_HEIGHT = 80;

export default class FlatListRefresh extends React.Component {
	static propTypes = {
		// data: PropTypes.array.isRequired,
		// renderItem: PropTypes.func.isRequired,
		// keyExtractor: PropTypes.func.isRequired,

		refreshing: PropTypes.bool,
		endReaching: PropTypes.bool,
		// onRefresh: PropTypes.func,
		// onEndReached: PropTypes.func,
		// ItemSeparatorComponent: PropTypes.func,
	};

	static defaultProps = {
		refreshing: false,
		endReaching: false,
		// onRefresh: () => {},
		// onEndReached: () => {},
		// ItemSeparatorComponent: () => <ItemSeparator />
	};

	constructor(props) {
    	super(props);
    	this.state = {
			refreshStatus: 0,						// 0 初始状态(静默状态) 1 下拉状态 2 回收状态 3 更新状态 4 没有触发刷新状态
			headerHeight: new Animated.Value(0),		// FlatList ReFreshController 高度
		};
		this.topBarHeight = null;
		this.hideDy = null;
	}

	componentWillMount() {
		// TopBar区滑动事件响应
		this._headerPanResponder = PanResponder.create({
    		// 要求成为响应者：
			onStartShouldSetPanResponder: (evt, gestureState) => true,
    		onStartShouldSetPanResponderCapture: (evt, gestureState) => {
				// 发生点击事件，将事件响应交给Touchable控件
				if (Math.abs(gestureState.dx) < 4 && Math.abs(gestureState.dy) < 4) return false;
				// 发生拖动事件
				return true;
			},
    		onMoveShouldSetPanResponder: (evt, gestureState) => true,
    		onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
    		onPanResponderGrant: (evt, gestureState) => {
    			// 开始手势操作。给用户一些视觉反馈，让他们知道发生了什么事情！
				// gestureState.{x,y} 现在会被设置为0
				this.onPanResponderGrant(evt, gestureState);
    		},
    		onPanResponderMove: (evt, gestureState) => {
    			// 最近一次的移动距离为gestureState.move{X,Y}
				// 从成为响应者开始时的累计手势移动距离为gestureState.d{x,y}
				this.onPanResponderMove(gestureState);
    		},
    		onPanResponderTerminationRequest: (evt, gestureState) => true,
    		onPanResponderRelease: (evt, gestureState) => {
    			// 用户放开了所有的触摸点，且此时视图已经成为了响应者。
				// 一般来说这意味着一个手势操作已经成功完成。
				this.onPanResponderRelease(gestureState);
    		},
    		onPanResponderTerminate: (evt, gestureState) => {
    			// 另一个组件已经成为了新的响应者，所以当前手势将被取消。
    		},
    		onShouldBlockNativeResponder: (evt, gestureState) => true
    		,
    	});
	}

	componentWillReceiveProps(nextProps) {
		// 收起下拉刷新
		if (!nextProps.refreshing && this.props.refreshing) {
			this.restoreAnimted();
		}
	}

	/**
	 * 开始手势
	 * locationX 触摸点相对于组件的位置
	 * pageX 触摸点相对于屏幕的位置
	 * @param {*} evt
	 * @param {*} gestureState
	 */
	onPanResponderGrant(evt, gestureState) {
		const { pageY, locationY } = evt.nativeEvent;
		// console.log(evt.nativeEvent)
		// console.log(gestureState)
		if (!this.topBarHeight) {
			this.topBarHeight = pageY - locationY;
			this.hideDy = 0;
		} else {
			this.hideDy = locationY - (pageY - this.topBarHeight);
		}
		// console.log(this.topBarHeight);
	}

	/**
	 * moveY	自上次回调，手势移动距离
	 * dy		从手势开始时，到当前回调是移动距离
	 * y0		滑动手势识别开始的时候的在屏幕中的坐标
	 * vy		当前手势移动的速度
	 * @param {*} gestureState
	 */
	onPanResponderMove(gestureState) {
		if (gestureState.dy > 0) {
			const headerHeight = gestureState.dy - this.hideDy;
			if (headerHeight > 0) {
				if (headerHeight < HEADER_HEIGHT) {
					if (this.state.refreshStatus !== 1) this.setState({ refreshStatus: 1 });
					this.state.headerHeight.setValue(headerHeight);
				} else if (headerHeight < HEADER_MAX_HEIGHT) {
					if (this.state.refreshStatus !== 2) this.setState({ refreshStatus: 2 });
				}
			}
		}
	}

	/**
	 * 手势结束
	 * @param {*} gestureState
	 */
	onPanResponderRelease(gestureState) {
		if (this.state.refreshStatus === 2) {
			// 启用下拉刷新
			this.state.headerHeight.setValue(HEADER_HEIGHT);
			this.setState({ refreshStatus: 3 });
		} else if (this.state.refreshStatus === 1) {
			// 短暂下拉未能启用下拉刷新
			const headerHeight = this.animatedView.props.style[0].height.__getValue();
			if (headerHeight === 0) return;
			this.state.headerHeight.setValue(headerHeight);
			this.setState({ refreshStatus: 4 }, () => {
				this.restoreAnimted();
			});
		}
	}

	/**
	 * 动画结束、开启数据刷新
	 */
	onMomentumScrollEnd(e) {
		// 兼容onMomentumScrollEnd
		if (typeof this.props.onMomentumScrollEnd === 'function') {
			this.props.onMomentumScrollEnd();
		}
		if (this.state.refreshStatus === 3 && typeof this.props.onRefresh === 'function') this.props.onRefresh();
	}

	/**
	 * 下拉还原动画
	 */
	restoreAnimted() {
		Animated.timing(this.state.headerHeight, {
			toValue: 0,
			duration: 600,
			isInteraction: true,
		}).start(() => {
			this.setState({ refreshStatus: 0 });
		});
	}

	/**
	 * 渲染动画Header
	 */
	renderListHeaderComponent() {
		let warnText;
		switch (this.state.refreshStatus) {
		case 1:
			warnText = '下拉刷新';
			break;
		case 2:
			warnText = '松开刷新';
			break;
		case 3:
			warnText = '更新中...';
			break;
		default:
			break;
		}
		return (
			<View>
				<Animated.View ref={(e) => { if (e) this.animatedView = e; }} style={[{ height: this.state.headerHeight, overflow: 'hidden' }]}>
					{typeof this.props.refreshControl !== 'function'
						? (
							<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
								<Image source={require('../Assets/Images/Component/loading-triangles.gif')} style={{ width: 35, height: 35 }} />
								<Text style={Styles.warnText}>{warnText}</Text>
							</View>
						)
						: this.props.refreshControl()
					}
				</Animated.View>
				{typeof this.props.ListHeaderComponent === 'function' && this.props.ListHeaderComponent()}
			</View>
		);
	}

	/**
	 * 渲染Footer
	 */
	renderListFooterComponent() {
		return (
			<View>
				{typeof this.props.ListFooterComponent === 'function' && this.props.ListFooterComponent()}
				<LoadView visible={this.props.endReaching} />
			</View>
		);
	}

	render() {
		const props = { ...this.props };
		delete props.refreshing;
		delete props.onRefresh;
		delete props.endReaching;
		delete props.refreshControl;
		delete props.key;
		return (
			<FlatList
				{...this._headerPanResponder.panHandlers}					// 手势控制
				{...props}

				onMomentumScrollEnd={e => this.onMomentumScrollEnd(e)}		// 兼容onMomentumScrollEnd
				ListHeaderComponent={this.renderListHeaderComponent()}		// 兼容ListHeaderComponent
				ListFooterComponent={this.renderListFooterComponent()}		// 兼容ListFooterComponent

				// style={this.props.style}
				// data={this.props.data}
				// renderItem={this.props.renderItem}
				// keyExtractor={this.props.keyExtractor}
				// ItemSeparatorComponent={this.props.ItemSeparatorComponent}
				// onEndReached={this.props.onEndReached}
			/>
		);
	}
}

const Styles = StyleSheet.create({
	warnText: { color: '#aab9ca', fontSize: 10, marginTop: 2 },
});

/**
 * Required and Regular Props
 * style
 * data
 * renderItem
 * keyExtractor
 * ItemSeparatorComponent
 * refreshing
 * onRefresh
 * endReaching
 * onEndReached
 * refreshControl
 */
