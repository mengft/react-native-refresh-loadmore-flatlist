# react-native-refresh-loadmore-flatlist
基于React Native官方组件FlatList，增加可定制化“下拉刷新”、“下拉加载更多”组件API的新列表组件，具体实现功能如下：
* 自定义下拉刷新组件API
* 自定义上拉LoadMore组件API

## Installation

```bash
npm install react-native-refresh-loadmore-flatlist --save
```

## Import into your project
```js
import FlatListRefresh from "react-native-refresh-loadmore-flatlist";
```

## Examle useage

```js
<FlatListRefresh
    style={Styles.flast}
    data={this.state.source}
    renderItem={({ item, index }) => this.renderArticleItem(item)}
    keyExtractor={(item, index) => String(index)}
    ItemSeparatorComponent={() => <ItemSeparator />}
    refreshing={this.state.refreshing}
    onRefresh={() => {}}
    endReaching={this.state.endReaching}
    onEndReached={() => {}}
/>
```

## Properties
属性  | 描述    | 类型  | 默认    
------ | ------ | ------  | ------
refreshing  | 下拉刷新状态 | ``` PropTypes.bool ``` | ``` false ```
onRefresh | 下拉刷新方法  | ``` PropTypes.func ``` | 
endReaching | 加载更多状态  | ``` PropTypes.bool ```  | ``` false ``` 
onEndReached | 加载更多方法  | ``` PropTypes.func ```  |  
