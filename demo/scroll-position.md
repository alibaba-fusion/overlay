---
title: 弹层滚动自动更新位置
order: 7
---

遇到有 overflow 滚动的弹窗，会自动监听滚动实时弹窗计算位置

```jsx
import { useState } from 'react';
import Overlay from '@alifd/overlay';

const { Popup } = Overlay;
const style = {
    width: 300,
    height: 100,
    padding: 10,
    background: '#fff',
    borderRadius: 2,
    boxShadow: '2px 2px 20px rgba(0, 0, 0, 0.15)'
};

const App  = () => {
    const [position, setPosition] = useState({});

    return <div id="a" style={{
        position: 'relative',
        height: 150,
        padding: 30,
        border: '1px solid #eee',
        overflow: 'auto',
    }}>
        <Popup 
            overlay={<div style={style}>top: {position.top} <br/> left: {position.left}</div>}
            placement="bottomLeft"
            triggerType="click"
            onPosition={({style}) => {
                setPosition(style);
            }}
            >
            <button style={{marginTop: 30}}>Open</button>
        </Popup>
        <div style={{ height: 300, width: 1200 }} />
    </div>
}

ReactDOM.render( <App/>, mountNode);
```

