---
title: 更换弹窗挂载容器
order: 7
---

可以通过 container 把弹窗挂到指定位置，这样性能更好不会一直计算位置，弹窗也不会超出

```jsx
import { useState } from 'react';
import Overlay from '@alifd/overlay';

const { Popup } = Overlay;
const style = {
    width: 500,
    height: 100,
    padding: 10,
    background: '#fff',
    borderRadius: 2,
    boxShadow: '2px 2px 20px rgba(0, 0, 0, 0.15)'
};

const App  = () => {
    const [position, setPosition] = useState({});

    return <div style={{
        position: 'relative',
        height: 150,
        padding: 30,
        border: '1px solid #eee',
        overflow: 'auto',
    }}>
        <Popup 
            overlay={<div style={style}>把节点挂载在父容器下可以避免top一直计算，提高性能: {JSON.stringify(position)}</div>}
            placement="bl"
            triggerType="click"
            container={ target => target.parentNode}
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

