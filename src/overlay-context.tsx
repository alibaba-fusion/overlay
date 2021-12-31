import { createContext } from 'react';

export interface OverlayContextProps {
  /**
   * 获取所有的子节点 Overlay 的「打开/关闭」状态。当前 Overlay 需要做两件事情：
   * 1. 把当前 Overlay的「打开/关闭」状态上报给父节点 Overlay。
   * 2. 把子Overlay的「打开/关闭」状态收集过来
   */
  setVisibleOverlayToParent: Function;
}

const OverlayContext = createContext<OverlayContextProps>({
  setVisibleOverlayToParent: () => {},
});

export default OverlayContext;
