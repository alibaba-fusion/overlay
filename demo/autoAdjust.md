---
title: 自动更换位置
order: 7
---

能够根据空间大小自动更换 placement

```jsx
import { useState } from 'react';
import Overlay from '@alifd/overlay';

const { Popup } = Overlay;
const style = {
    width: 200,
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
        height: 200,
        padding: 20,
        border: '1px solid #eee',
        overflow: 'auto',
    }}>
        <div>
        <Popup 
            overlay={<div style={style}>上面空间不够</div>}
            placement="tl"
            triggerType="click"
            followTrigger
            >
            <button >TL-> BL</button>
        </Popup>
        <Popup 
            overlay={<div style={style}>上面空间不够</div>}
            placement="t"
            triggerType="click"
            followTrigger
            >
            <button style={{marginLeft: 10}}>T -> B</button>
        </Popup>
        <Popup 
            overlay={<div style={style}>上面空间不够</div>}
            placement="tr"
            triggerType="click"
            followTrigger
            >
            <button style={{marginLeft: 10}}>TR -> BR</button>
        </Popup>
        <Popup 
            overlay={<div style={style}>上面空间不够</div>}
            placement="tl"
            triggerType="click"
            followTrigger
            >
            <button style={{marginTop: 0, float: 'right', right: 0}}>TL-> BR</button>
        </Popup>
        </div>

        <br/>
        <div>
            <Popup 
                overlay={<div style={style}>左边空间不够</div>}
                placement="lt"
                triggerType="click"
                followTrigger
                >
                <button style={{marginTop: 0}}>LT-> RT</button>
            </Popup>
            <Popup 
                overlay={<div style={style}>右边空间不够</div>}
                placement="rt"
                triggerType="click"
                followTrigger
                >
                <button style={{float: 'right', right: 0}}>RT-> LT</button>
            </Popup>
            
            <br/><br/>
            <Popup 
                overlay={<div style={style}>左边空间不够</div>}
                placement="lb"
                triggerType="click"
                followTrigger
                >
                <button style={{marginTop: 0}}>LB-> RB</button>
            </Popup>
            <Popup 
                overlay={<div style={style}>右边空间不够</div>}
                placement="rb"
                triggerType="click"
                followTrigger
                >
                <button style={{float: 'right', right: 0}}>RB-> LB</button>
            </Popup>
            <br/><br/>
            <Popup 
                overlay={<div style={style}>左边、下边空间不够</div>}
                placement="l"
                triggerType="click"
                followTrigger
                >
                <button style={{marginTop: 0}}>L-> R</button>
            </Popup>
            <Popup 
                overlay={<div style={style}>右边空间不够</div>}
                placement="r"
                triggerType="click"
                followTrigger
                >
                <button style={{float: 'right', right: 0}}>R-> L</button>
            </Popup>
        </div>
        
        <br/>
        <div>
        <Popup 
            overlay={<div style={style}>下边/左边空间都不够</div>}
            placement="b"
            triggerType="click"
            followTrigger
            >
            <button >B -> T</button>
        </Popup>
        <Popup 
            overlay={<div style={style}>下边/左边空间都不够</div>}
            placement="br"
            triggerType="click"
            followTrigger
            >
            <button style={{ marginLeft: 10}}>BR -> TL</button>
        </Popup>
        <Popup 
                overlay={<div style={style}>右边空间不够</div>}
                placement="bl"
                triggerType="click"
                followTrigger
                >
                <button style={{float: 'right', right: 0}}>BL-> TR</button>
            </Popup>
        </div>
    </div>
}

ReactDOM.render( <App/>, mountNode);
```

