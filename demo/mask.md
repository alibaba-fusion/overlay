---
title: 遮罩层
order: 1
---

带有遮罩的弹层。

```jsx
import Overlay from '@alifd/overlay';

class Demo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            visible: false
        };
    }

    onClick = () => {
        this.setState({
            visible: true
        });
    }

    onClose = () => {
        this.setState({
            visible: false
        });
    }

    render() {
        return (
            <div>
                <button onClick={this.onClick} ref={ref => {
                    this.btn = ref;
                }}>
                    Open
                </button>
                <Overlay visible={this.state.visible}
                    hasMask
                    canCloseByMask
                    fixed
                    offset={[0, 100]}
                    safeNode={() => this.dialogRef}
                    onRequestClose={this.onClose}
                    >                
                    <div style={{width: '100vw', pointerEvents: 'none'}}>
                        <div 
                            ref={ref => this.dialogRef = ref}
                            role="dialog"
                            style={{
                                pointerEvents: 'auto',
                                margin: '0 auto',
                                width: 200,
                                height: 200,
                                background: '#fff',
                                borderRadius: 2,
                                boxShadow: '0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d',
                            }}
                        >
                            Title
                            <div style={{paddingTop: 140, paddingLeft: 80}}>
                                <button onClick={this.onClose}>ok</button>
                                <button onClick={this.onClose} style={{marginLeft: 8}}>cancel</button>
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
