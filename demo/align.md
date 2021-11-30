---
title: 对齐
order: 6
---

通过 `placement` 可以自定义对齐方式。

```jsx
import Overlay from '@alifd/overlay';

const { Popup } = Overlay;

const style = {
    position: 'relative',
    height: 150,
    margin: 50,
    border: '1px solid #eee',
    textAlign: 'center',
}

ReactDOM.render(
    <div id="containerId" style={style}>
        <Overlay target="containerId" container={() => document.getElementById("containerId")} visible points={["br", "tl"]}><button>br tl</button></Overlay>
        <Overlay target="containerId" visible points={["tc", "tc"]}><button>tc tc</button></Overlay>
        <Overlay target="containerId" visible points={["bl", "tr"]}><button>bl tr</button></Overlay>
        <Overlay target="containerId" visible points={["cr", "cr"]}><button>cr cr</button></Overlay>
        <Overlay target="containerId" visible points={["br", "br"]}><button>br br</button></Overlay>
        <Overlay target="containerId" visible points={["tc", "bc"]}><button>tc bc</button></Overlay>
        <Overlay target="containerId" visible points={["bl", "bl"]}><button>bl bl</button></Overlay>
        <Overlay target="containerId" visible points={["cl", "cl"]}><button>cl cl</button></Overlay>
        <Overlay target="containerId" visible points={["cc", "cc"]}><button>cc cc</button></Overlay>
    </div>
  , mountNode);
```
