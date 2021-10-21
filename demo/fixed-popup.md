---
title: 在fixed弹窗中滚动
order: 7
---

带有遮罩的弹层。

```jsx
import { useState, useRef } from 'react';
import Overlay from '@alifd/overlay';
const { Popup } = Overlay;

const style = {
    width: 400,
    height: 150,
    padding: 10,
    background: '#fff',
    borderRadius: 2,
    boxShadow: '2px 2px 20px rgba(0, 0, 0, 0.15)'
}

const Demo = () => {
    const [visible, setVisible] = useState(false);
    const [visible2, setVisible2] = useState(false);
    const [position, setPosition] = useState({});
    const [position2, setPosition2] = useState({});
    const [position3, setPosition3] = useState({});

    const dialogRef = useRef(null);

    
    const onClose = (e) => {
        console.log(/onclick/, e.target);
        if (dialogRef.current && dialogRef.current.contains(e.target)) {
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
            {/*<div style={{position: 'fixed', top: 200, left: 300}}>
                <Popup 
                    overlay={<span style={style}>left: {position3.left} top: {position3.top}</span>} 
                    onPosition={({style}) => setPosition3(style)}
                >
                    <button>打开后滚动试试</button>
                </Popup>
            </div>*/}
            <Overlay 
                visible={visible}
                maskClassName='next-overlay-mask'
                maskStyle={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    height: '100%',
                    backgroundColor: '#00000073'
                }}
                hasMask
                canCloseByMask
                fixed
                offset={[0, 0]}
                onRequestClose={onClose}
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
                                <Popup 
                                    overlay={<span style={style}>{position.transform}</span>} 
                                    onPosition={({style}) => setPosition(style)}
                                >
                                    <button>打开后滚动试试</button>
                                </Popup>
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
                maskStyle={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    height: '100%',
                    backgroundColor: '#00000073'
                }}
                hasMask
                canCloseByMask
                fixed
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
                         <Popup 
                            overlay={<span style={style}>{position2.transform}</span>} 
                            onPosition={({style}) => setPosition2(style)}
                        >
                            <button>打开后滚动试试</button>
                        </Popup>
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
