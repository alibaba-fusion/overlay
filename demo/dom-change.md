---
title: Trigger changed
order: 11
---

trigger 动态发生变化的时候需要能够准确获取


```jsx
import { useState, useEffect } from 'react';
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

const overlay = <span style={style}>
    Hello World From Popup!
</span>;

const DyncButton = (props) => {
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setDisabled(false);
        }, 100);
    }, []);

    if (disabled) {
        return <span> 
            <button {...props} disabled>Disabled button</button>
        </span>
    }
    
    return <button {...props}>Open</button>
};

const Demo = () => {
    return <div>
        <Popup overlay={overlay} triggerType="click">
            <DyncButton/>
        </Popup>
    </div>
}


ReactDOM.render(<Demo/>, mountNode);
```
