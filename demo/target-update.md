---
title: 动态 target
order: 15
---

target 动态变化


```jsx
import Overlay from '@alifd/overlay';

let idx = 0;
class Demo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: true,
      target: () => this.btn0
    };
  }
  next = (idx) => {
    switch (idx) {
      case 0:
        this.setState({
          target: () => this.btn0
        })
        break;
      case 1:
        this.setState({
          target: () => this.btn1
        })
        break;
      case 2:
        this.setState({
          target: () => this.btn2
        })
        break;
    }
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
        <button onClick={this.onClick} ref={ref => this.btn0 = ref}>First</button>
        <button onClick={this.onClick} ref={ref => this.btn1 = ref} style={{ marginLeft: 500 }}>Second</button>
        <br/>
        <button onClick={this.onClick} ref={ref => this.btn2 = ref} style={{ marginLeft: 500, marginTop: 400 }}>Third</button>
        <Overlay
          placement="b"
          visible={this.state.visible}
          target={this.state.target}
        >
          <span style={{width: 300, height: 200, border: '1px solid'}}>
            Hello World From Overlay!
            <br /><br /><br /><br /><br /><br /><br />
            <button style={{ marginLeft: 200 }}
              onClick={() => this.next((++idx)%3)}>next</button>
          </span>
        </Overlay>
      </div>
    );
  }
}

ReactDOM.render(<Demo />, mountNode);
```
