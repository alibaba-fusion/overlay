---
title: fixed dialog
order: 1
---

fixed 模式的dialog，带有遮罩的弹层。

```jsx
import { useState, useRef } from 'react';
import Overlay from '@alifd/overlay';

const maskStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#00000073'
};

const Demo = () => {
    const [visible, setVisible] = useState(false);
    const [visible2, setVisible2] = useState(false);

    const dialogRef = useRef(null);

    
    const onClose = (e) => {
        if (e.type === 'click' && dialogRef.current && dialogRef.current.contains(e.target)) {
            return;
        }
        setVisible(false);
    }

    const onClose2 = (e) => {
        setVisible2(false);
    }

    return (
        <div>
            <button onClick={() => setVisible(true)} > 超出滚动 </button>
            <button onClick={() => setVisible2(true)} style={{marginLeft: 8}}> 内部滚动 </button>
            <Overlay 
                visible={visible}
                maskClassName='next-overlay-mask'
                maskStyle={maskStyle}
                hasMask
                canCloseByMask
                fixed
                offset={[0, 0]}
                onRequestClose={onClose}
                autoFocus
            >
                <div
                    style={{
                        position: 'fixed', top: 0, left:0, bottom: 0, right: 0, overflow: 'auto',
                    }}
                    onClick={onClose}
                >
                    <div style={{
                        position: 'relative', 
                        top: 100, 
                        width: '100vw', 
                        pointerEvents: 'none',
                        paddingBottom: 24,
                    }}
                    >
                        <div 
                            role="dialog"
                            ref={dialogRef}
                            style={{
                                pointerEvents: 'auto',
                                margin: '0 auto',
                                width: 500,
                                background: '#fff',
                                borderRadius: 2,
                                boxShadow: '0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d',
                            }}
                        >
                            with long content
                            <br/>
                            <input />
                            <div style={{padding: '1400px 8px 8px 8px'}}>
                                <button onClick={onClose}>ok</button>
                                <button onClick={onClose} style={{marginLeft: 8}}>cancel</button>
                            </div>
                        </div>   
                    </div> 
                </div>
            </Overlay>

            <Overlay 
                visible={visible2}
                maskClassName='next-overlay-mask'
                maskStyle={maskStyle}
                hasMask
                canCloseByMask
                fixed
                autoFocus
                offset={[0, 100]}
                onRequestClose={onClose2}
            >
                <div style={{
                    position: 'relative', 
                    width: '100vw', 
                    pointerEvents: 'none',
                }}
                >
                    <div 
                        role="dialog"
                        style={{
                            pointerEvents: 'auto',
                            margin: '0 auto',
                            width: 500,
                            maxHeight: 'calc(100vh - 120px)',
                            overflow: 'auto',
                            background: '#fff',
                            borderRadius: 2,
                            boxShadow: '0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d',
                        }}
                    >
                        <p>with long content</p>
                        <input />
                        <div style={{padding: '1400px 8px 8px 8px'}}>
                            <button onClick={onClose}>ok</button>
                            <button onClick={onClose} style={{marginLeft: 8}}>cancel</button>
                        </div>
                    </div>   
                </div> 
            </Overlay>
        </div>
    ); 
}

ReactDOM.render(<Demo />, mountNode);
```
