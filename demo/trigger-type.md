---
title: 触发方式
order: 3
---

通过 `triggerType` 属性设置触发方式。


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
}
const overlay = (triggerType) => <span style={style} className="overlay">
    {triggerType} to open!
</span>;

const handleVisibleChange = (visible) => {
    console.log(visible)
}

ReactDOM.render(
    <div>
        <Popup overlay={overlay('click')} triggerType="click">
            <button>click</button>
        </Popup>
        <Popup overlay={overlay('hover')} triggerType="hover">
            <button style={{marginLeft: 16}}>hover</button>
        </Popup>
        <Popup overlay={overlay('focus')} triggerType="focus">
            <button style={{marginLeft: 16}}>focus</button>
        </Popup>

        <br/><br/>
        <Popup overlay={overlay('hover')} triggerType="hover">
            <span><button disabled style={{pointerEvents: 'none'}}>disabled hover</button></span>
        </Popup>
    </div>
    , mountNode);
```

```css
.overlay-demo {
    width: 300px;
    height: 100px;
    padding: 10px;
    border: 1px solid #eee;
    background: #FFFFFF;
    box-shadow: 2px 2px 20px rgba(0,0,0,0.15);
}
.next-btn:not(last-child) {
    margin-right: 20px;
}
```
