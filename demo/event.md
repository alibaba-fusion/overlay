---
title: Event
order: 10
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

    onRequestClose = (e) => {
        // e.preventDefault();
        // e.stopPropagation();

        console.log(/onRequestClose/)
        this.setState({
            visible: false
        });
    }

    show = (e) => {
        console.log(/show/, e)
        this.setState({
            visible: true
        });
    }

    render() {
        return (
            <div style={{height: 300, width: 300, background: '#999'}} onClick={this.show}>
                <button id="clickevent">click</button>
                <Overlay 
                    target={() => document.documentElement}
                    visible={this.state.visible}
                    fixed
                    points={['cc', 'cc']}
                    offset={['40%', 100]}
                    onRequestClose={this.onRequestClose}
                    onOpen={()=>console.log(/onOpen/)}
                    onClose={()=>console.log(/onClose/)}
                    >
                    <div style={{
                        width: 200,
                        height: 200,
                        background: '#999',
                        borderRadius: 2,
                        boxShadow: '0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d'
                    }}>
                        <button onClick={this.onRequestClose}>close</button>
                    </div>
                </Overlay>
            </div>
        );
    }
}

ReactDOM.render(<Demo />, mountNode);
```