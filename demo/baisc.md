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
            visible: false,
            visible2: false,
            visible3: false
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
                    points={['tl', 'tr']}
                    offset={[4, 0]}
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
                <button 
                    style={{marginLeft:8}} 
                    onClick={() => this.setState({visible2: true})}
                >
                    Fixed FullScreen
                </button>
                <Overlay 
                    visible={this.state.visible2}
                    onRequestClose={() => this.setState({visible2: false})}
                    disableScroll
                    fixed
                    offset={['calc(50vw - 90vw/2)', 'calc(50vh - 80vh/2)']}
                    >
                    <div style={{
                        width: '90vw',
                        height: '80vh',
                        background: '#999',
                        boxShadow: '0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d'
                    }}>
                        hello world
                    </div>
                </Overlay>
            </div>
        );
    }
}

ReactDOM.render(<Demo />, mountNode);
```