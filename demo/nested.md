---
title: 弹层嵌套
order: 5
---

有弹层嵌套需求时，请使用 container 属性将第二个弹层渲染到第一个弹层内部, 这样不会因为点击第二个弹窗导致第一个弹窗消失。

```jsx
import { useState } from 'react';
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

const Demo = () => {
    const [followTrigger, setFollowTrigger] = useState(false);

    const overlay2 = (<div style={{...style}} >
        <Popup 
            overlay={<div style={style}><p>挂载容器没有overflow:hidden, 依然超出容器展示，不会因为挂载容器小自动订正位置，viewport 任然为 body</p></div>}
            followTrigger={followTrigger}
        >
            <button>Open third overlay</button>
        </Popup>
        <p>Hello World From First Overlay!</p>
    </div>);

    const overlay = (<div style={{...style}} >
        <Popup 
            overlay={overlay2}
            followTrigger={followTrigger}
        >
            <button>Open second overlay</button>
        </Popup>
        <p>Hello World From First Overlay!</p>
    </div>);

    return (<div>
        followTrigger: <input type="checkbox" checked={followTrigger} onChange={e => setFollowTrigger(e.target.checked)}/>
        <br/><br/>
        <Popup overlay={overlay} >
            <button>Open first overlay</button>
        </Popup>
    </div>);
}

ReactDOM.render(<Demo/>, mountNode);
```
