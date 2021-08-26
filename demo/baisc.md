---
title: Overlay
order: 0
---

Overlay 使用。

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
            visible: !this.state.visible
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
                    Toggle visible
                </button>
                <Overlay 
                    visible={this.state.visible}
                    target={() => this.btn}
                    safeNode={() => this.btn}
                    onRequestClose={this.onClose}
                    onOpen={()=>console.log(/open/)}
                    onClose={()=>console.log(/close/)}
                    >
                    <div style={{
                        width: 200,
                        height: 200,
                        background: '#999',
                        borderRadius: 2,
                        boxShadow: '0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d'
                    }} />
                </Overlay>
            </div>
        );
    }
}

ReactDOM.render(<Demo />, mountNode);
```