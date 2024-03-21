---
title: 滚动自动隐藏面板
order: 16
---

展示 `autoHideScrollOverflow` 的用法

```jsx
import Overlay from '@alifd/overlay';

const { Popup } = Overlay;

const style = {
  width: 400,
  height: 100,
  padding: 10,
  background: '#fff',
  borderRadius: 2,
  boxShadow: '2px 2px 20px rgba(0, 0, 0, 0.15)',
};

const FunctionalOverlay = (props) => (
  <span {...props} style={style}>
    Hello World From Popup!
  </span>
);

const FunctionalButton = (props) => (
  <button style={{ border: '4px solid' }} {...props}>
    Open
  </button>
);

ReactDOM.render(
  <div>
    <div className="scroll-box">
      <div style={{ height: 50 }}></div>
      <div>
        <Popup overlay={<div className="my-popup">auto hide</div>} visible triggerType="click">
          <button>trigger1</button>
        </Popup>
        <Popup
          overlay={<div className="my-popup">not hide</div>}
          visible
          triggerType="click"
          autoHideScrollOverflow={false}
        >
          <button style={{ marginLeft: 50 }}>trigger2</button>
        </Popup>
      </div>
      <div style={{ height: 500 }}></div>
    </div>
  </div>,
  mountNode
);
```

```css
.scroll-box {
  height: 300px;
  width: 400px;
  border: 1px solid #000;
  overflow: auto;
}
.my-popup {
  background-color: cyan;
  height: 150px;
  text-align: center;
  line-height: 150px;
}
```
