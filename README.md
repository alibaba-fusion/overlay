# 弹层

@alifd/overlay

用于生成弹层的工具类集合。

## 如何使用

Overlay 提供了一系列组件用于创建弹层。其中包含：

### Overlay

Overlay 可以在页面中弹出一个浮层，封装了定位，动画及其他一些可用性的功能。Overlay 被设计为无状态的组件，其本身并不控制自己显示和隐藏的状态。

**注意:** 类似 canCloseby\* 的配置也需要配合 onRequestClose 才能关闭弹层。

#### 安全节点 safeNode

Overlay 提供了点击弹层外文档中节点隐藏该弹层的功能，如果想让某个节点点击后不隐藏弹层（如：触发弹层打开的节点），请将该节点传入 safeNode 属性。

#### 定位

1.  points 的值可以是由空格隔开的字符串，如 `['tl', 'bl']`，其中 `tl` 代表目标元素的左上方，`bl` 代表基准元素的左下方，所以 `['tl', 'bl']` 的意思是目标元素的左上方对齐基准元素左下方。其中定位的可选值有 `tl`, `tc`, `tr`, `cl`, `cc`, `cr`, `bl`, `bc`, `br`。`t` 为 `top` 的缩写，`b` 为 `bottom` 的缩写，`c` 为 `center` 的缩写，`l` 为 `left` 的缩写，`r` 为 `right` 的缩写.


### Popup

Popup 是对 Overlay 的封装，children作为触发节点，弹出一个浮层，这个浮层默认情况下使用这个节点作为定位的参照对象。


## API

### Overlay

| 参数                    | 说明                                              | 类型            | 默认值                       |
| ---------------------- | ------------------------------------------------- | -------------- | --------------------------- |
| children               | 弹层内容                                           | ReactElement   | -                          |
| visible                | 是否显示弹层                                        | Boolean        | false                       |
| onRequestClose         | 弹层请求关闭时触发事件的回调函数                       | Function       | () => {} |
| target                 | 弹层定位的参照元素                                  | Function            | （）=> document.body |
| points                 | 弹层相对于参照元素的定位                             | [point, point] | ['tl', 'bl'] |
| offset                 | 弹层相对于trigger的定位的微调, 接收数组[hoz, ver], 表示弹层在 left / top 上的增量<br/>e.g. [100, 100] 表示往右、下分布偏移100px | Array          | [0, 0]|
| container              | 渲染组件的容器，如果是函数需要返回 ref，如果是字符串则是该 DOM 的 id，也可以直接传入 DOM 节点 | any            | - |
| hasMask                | 是否显示遮罩 | Boolean        | false |
| canCloseByEsc          | 是否支持 esc 按键关闭弹层                  | Boolean        | true  |
| canCloseByOutSideClick | 点击弹层外的区域是否关闭弹层，不显示遮罩时生效          | Boolean        | true  |
| canCloseByMask         | 点击遮罩区域是否关闭弹层，显示遮罩时生效             | Boolean        | true  |
| onOpen                 | 弹层打开时触发事件的回调函数             | Function       | noop |
| onClose                | 弹层关闭时触发事件的回调函数             | Function       | noop |
| beforePosition         | 弹层定位完成前触发的事件               | Function       | noop |
| onPosition             | 弹层定位完成时触发的事件<br/><br/>**签名**:<br/>Function(config: Object) => void<br/>**参数**:<br/>_config_: {Object} 定位的参数<br/>_config.config.points_: {Array} 对齐方式，如 ['cc', 'cc']（如果开启 needAdjust，可能和预先设置的 points 不同）<br/>_config.style.top_: {Number} 距离视口顶部距离<br/>_config.style.left_: {Number} 距离视口左侧距离 | Function       | noop |
| autoFocus              | 弹层打开时是否让其中的元素自动获取焦点              | Boolean        | false |
| autoAdjust             | 当弹层由于页面滚动等情况不在可视区域时，是否自动调整定位以出现在可视区域                              | Boolean        | true  |
| autoHideScrollOverflow | 当trigger外面有滚动条，滚动到不可见区域后隐藏弹窗 | Boolean        | true  |
| cache                  | 隐藏时是否保留子节点                       | Boolean        | false |
| safeNode               | 安全节点，当点击 document 的时候，如果包含该节点则不会关闭弹层，如果是函数需要返回 ref，如果是字符串则是该 DOM 的 id，也可以直接传入 DOM 节点，或者以上值组成的数组            | any            | - |
| wrapperClassName       | 弹层的根节点的样式类                       | String         | - |
| wrapperStyle           | 弹层的根节点的内联样式                      | Object         | - |

### Overlay.Popup

> 继承 Overlay 的 API，除非特别说明

| 参数                  | 说明         | 类型           | 默认值                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------ |
| children            | 触发弹层显示或隐藏的元素       | ReactNode    | -                              |
| overlay             | 弹层内容                    | ReactElement | -                              |
| triggerType         | 触发弹层显示或隐藏的操作类型，可以是 'click'，'hover'，'focus'，或者它们组成的数组，如 ['hover', 'focus']                    | String/Array | 'hover'                        |
| triggerClickKeycode | 当 triggerType 为 click 时才生效，可自定义触发弹层显示的键盘码           | Number/Array | [KEYCODE.SPACE, KEYCODE.ENTER] |
| visible             | 弹层当前是否显示   | Boolean      | -                              |
| defaultVisible      | 弹层默认是否显示   | Boolean      | false                          |
| onVisibleChange     | 弹层显示或隐藏时触发的回调函数<br/><br/>**签名**:<br/>Function(visible: Boolean, type: String, e: Object) => void<br/>**参数**:<br/>_visible_: {Boolean} 弹层是否显示<br/>_type_: {String} 触发弹层显示或隐藏的来源 fromTrigger 表示由trigger的点击触发； docClick 表示由document的点击触发<br/>_e_: {Object} DOM事件 | Function     | noop                      |
| disabled            | 设置此属性，弹层无法显示或隐藏| Boolean      | false                          |
| delay               | 弹层显示或隐藏的延时时间（以毫秒为单位），在 triggerType 被设置为 hover 时生效   | Number       | 200                            |
| followTrigger       | 是否跟随trigger滚动  | Boolean      | false 