---
title: 受控显示隐藏
order: 4
---

展示了 `Popup` 受控显示隐藏的用法。

```jsx
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

const DemoOverlay = React.forwardRef((props, ref) => {
    return <span {...props} style={{...style, ...props.style}} ref={ref}>
    Hello World From Popup!
</span>
})

class Demo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            visible: false
        };
    }

    onVisibleChange = visible => {
        this.setState({
            visible
        });
    }

    onGroupVisibleChange = groupVisible => {
        this.setState({
            groupVisible
        });
    }

    render() {
        return (
            <div>
                <div>
                    <Popup 
                        overlay={<DemoOverlay/>}
                        triggerType="click"
                        visible={this.state.visible}
                        onVisibleChange={this.onVisibleChange}>
                        <button>Open</button>
                    </Popup>
                </div>
                <br />
                <div>
                    <Popup 
                        overlay={<DemoOverlay ref={ref => {
                            console.log(/overlay1/);
                            this.overlay1 = ref}}/>}
                        triggerType="click"
                        visible={this.state.groupVisible}
                        safeNode={[() => this.btn1, () => this.overlay2]}
                        onVisibleChange={this.onGroupVisibleChange}>
                        <button style={{"marginRight": "50px"}} ref={ref => {
                        this.btn1 = ref;
                                                    console.log(/btn1/, this.btn1);

                        }}>Paired Popup 1</button>
                    </Popup>
                    <Popup 
                        overlay={<DemoOverlay ref={ref => {this.overlay2 = ref}}/>}
                        triggerType="click"
                        visible={this.state.groupVisible}
                        safeNode={[() => this.btn1, () => this.overlay1]}
                        onVisibleChange={this.onGroupVisibleChange}>
                        <button ref={ref => {this.btn2 = ref;}}>Paired Popup 2</button>
                    </Popup>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<Demo />, mountNode);
```
