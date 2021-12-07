---
title: 悬停点击弹出窗口
order: 5
---

显示如何创建可悬停和单击的弹出窗口。


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

class Demo extends React.Component {
  state = {
    clicked: false,
    hovered: false,
  };

  hide = () => {
    this.setState({
      clicked: false,
      hovered: false,
    });
  };

  handleHoverChange = visible => {
    this.setState({
      hovered: visible,
      clicked: false,
    });
  };

  handleClickChange = visible => {
    this.setState({
      clicked: visible,
      hovered: false,
    });
  };

  render() {
    const hoverContent = <div style={style}>This is hover content.</div>;
    const clickContent = <div >This is click content.</div>;
    return (<>
      <Popup
        style={{ width: 500 }}
        overlay={hoverContent}
        triggerType="hover"
        visible={this.state.hovered}
        onVisibleChange={this.handleHoverChange}
      >
        <button ref={ref=>this.btn=ref} onClick={() => this.handleClickChange(true)}>Hover and click / 悬停并单击</button>
      </Popup>
      <Popup
          target={() => this.btn}
          overlay={
            <div style={style}>
              {clickContent}
              <button onClick={this.hide}>Close</button>
            </div>
          }
          visible={this.state.clicked}
          onVisibleChange={this.handleClickChange}
        >
        </Popup>
    </>);
  }
}

ReactDOM.render(<Demo />, mountNode);
```
