---
title: 在fixed弹窗中滚动
order: 2
---

带有遮罩的弹层。

```jsx
import Overlay from '@alifd/overlay';
const { Popup } = Overlay;

const style = {
    width: 300,
    height: 100,
    padding: 10,
    background: '#fff',
    borderRadius: 2,
    boxShadow: '2px 2px 20px rgba(0, 0, 0, 0.15)'
}

class Demo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            visible: false,
            position: {},
        };
    }

    onClick = () => {
        this.setState({
            visible: true
        });
    }

    onClose = (e) => {
        console.log(/onclick/, e.target);
        if (this.dialogRef && this.dialogRef.contains(e.target)) {
            return;
        }
        this.setState({
            visible: false
        });
    }

    onPosition = ({style}) => {
        this.setState({
            position: style
        })
    }

    render() {
        return (
            <div>
                <button onClick={this.onClick} ref={ref => {
                    this.btn = ref;
                }}>
                    Open
                </button>
                <Overlay 
                    visible={this.state.visible}
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
                    safeNode={() => this.dialogRef}
                    onRequestClose={this.onClose}
                >
                    <div
                        style={{position: 'fixed', top: 0, left:0, bottom: 0, right: 0, overflow: 'auto'}}
                        onClick={this.onClose}
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
                                ref={ref => this.dialogRef = ref}
                                role="dialog"
                                style={{
                                    pointerEvents: 'auto',
                                    margin: '0 auto',
                                    width: 200,
                                    height: 1200,
                                    background: '#fff',
                                    borderRadius: 2,
                                    boxShadow: '0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d',
                                }}
                            >
                                <Popup 
                                    overlay={<div style={style}>top: {this.state.position.top} <br/> left: {this.state.position.left}</div>}
                                    onPosition={this.onPosition}
                                    >
                                    <button >click</button>
                                </Popup>
                            </div>   
                        </div> 
                    </div>
                </Overlay>
            </div>
        );
    }
}

ReactDOM.render(<Demo />, mountNode);
```
