---
title: 更换弹窗挂载容器
order: 7
---

弹层默认参照 `document.body` 绝对定位，如果弹层显示隐藏的触发元素所在容器（一般为父节点）有滚动条，那么当容器滚动时，会发生触发元素与弹层相分离的情况，可以将弹层渲染到触发元素所在的容器中。


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
            overlay={<div style={style}>top: {position.top} <br/> left:{position.left}</div>}
            placement="bottomLeft"
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

