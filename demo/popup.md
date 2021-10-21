---
title: Popup弹层
order: 2
---

`Popup` 是对 `Overlay` 的封装，它接收某个节点作为触发节点，弹出一个浮层，这个浮层默认情况下使用这个节点作为定位的参照对象。


```jsx
import Overlay from '@alifd/overlay';

const { Popup } = Overlay;

const style = {
    width: 400,
    height: 100,
    padding: 10,
    background: '#fff',
    borderRadius: 2,
    boxShadow: '2px 2px 20px rgba(0, 0, 0, 0.15)'
}

const overlay = <span style={style} >
    Hello World From Popup!
</span>;

ReactDOM.render(
    <div>
        <Popup overlay={overlay} triggerType="click">
            <button style={{border: '4px solid'}}>Open</button>
        </Popup>
        <br />
        <br />
        <Popup overlay={overlay} triggerType="click" triggerClickKeyCode={40}>
            <input placeholder="Use Down Arrow to open" />
        </Popup>
    </div>,
    mountNode
);
```
