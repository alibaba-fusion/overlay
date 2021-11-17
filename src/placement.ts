import { CSSProperties } from 'react';
import { getViewTopLeft, getViewPort, getWidthHeight } from './utils';

type point = 'tl' | 'tc' | 'tr' | 'cl' | 'cc' | 'cr' | 'bl' | 'bc' | 'br';
export type pointsType = [point, point];
export type placementType = 'tl' | 't' | 'tr' | 'rt' | 'r' | 'rb' | 'bl' | 'b' | 'br' | 'lt' | 'l' | 'lb';

export interface TargetRect {
  width: number;
  height: number;
  /**
   * 相对网页最左侧间距
   */
  left: number;
  /**
   * 相对网页顶部间距
   */
  top: number;
};

export interface PlacementsConfig {
  position: 'absolute' | 'fixed';
  /**
   * 弹窗的目标定位元素
   */
  target: HTMLElement | { getBoundingClientRect: () => TargetRect };
  /**
   * 弹窗
   */
  overlay: HTMLElement;
  /**
   * 相对容器，position != static 的节点
   */
  container: HTMLElement;
  /**
   * 滚动节点。 target 到 container 之间的滚动节点 (不包含 target/container/body/documetnElement 元素)
   */
  scrollNode?: Array<HTMLElement>;
  /**
   * target 超出容器时隐藏 (有scrollNode时生效)
   */
  autoHideScrollOverflow?: boolean;
  /**
   * 弹窗 overlay 相对于目标元素 target 的位置
   */
  placement?: placementType;
  /**
   * 偏离 placement 对其方向像素
   */
  placementOffset?: number;
  /**
   * 对齐点 [弹窗, 相对目标]
   */
  points?: pointsType;
  offset?: number[];
  /**
   * 弹窗位置重新计算的回调，可以通过修改范围值自己订正弹窗位置
   */
  beforePosition?: (result: PositionResult, obj: any) => PositionResult;
  autoAdjust?: boolean;
  rtl?: boolean;
}

export interface placementMapType {
  tl: pointsType;
  t: pointsType;
  tr: pointsType;
  lt: pointsType;
  l: pointsType;
  lb: pointsType;
  bl: pointsType;
  b: pointsType;
  br: pointsType;
  rt: pointsType;
  r: pointsType;
  rb: pointsType;
}

const placementMap: placementMapType = {
  tl: ['bl', 'tl'],
  t: ['bc', 'tc'],
  tr: ['br', 'tr'],
  lt: ['tr', 'tl'],
  l: ['cr', 'cl'],
  lb: ['br', 'bl'],
  bl: ['tl', 'bl'],
  b: ['tc', 'bc'],
  br: ['tr', 'br'],
  rt: ['tl', 'tr'],
  r: ['cl', 'cr'],
  rb: ['bl', 'br'],
};

export interface PositionResult {
  config?: {
    placement: placementType;
    points: pointsType;
  },
  style: CSSProperties;
}

function getXY(p: placementType | undefined, staticInfo: any) {
  const { targetInfo, containerInfo, overlayInfo, points: opoints, placementOffset, offset } = staticInfo;
  let basex = targetInfo.left - containerInfo.left + containerInfo.scrollLeft;
  let basey = targetInfo.top - containerInfo.top + containerInfo.scrollTop;

  function setPointX(point: string, positive = true, width: number) {
    const plus = positive ? 1 : -1;
    switch (point) {
      case 'l':
        basex += 0;
        break;
      case 'c':
        basex += plus * width / 2;
        break;
      case 'r':
        basex += plus * width;
        break;
    }
  }

  function setPointY(point: string, positive = true, height: number) {
    const plus = positive ? 1 : -1;
    switch (point) {
      case 't':
        basey += 0;
        break;
      case 'c':
        basey += plus * height / 2;
        break;
      case 'b':
        basey += plus * height;
        break;
    }
  }

  let points = opoints;
  if (p && p in placementMap) {
    points = placementMap[p];
  }

  // 目标元素
  setPointY(points[1][0], true, targetInfo.height);
  setPointX(points[1][1], true, targetInfo.width);
  setPointY(points[0][0], false, overlayInfo.height);
  setPointX(points[0][1], false, overlayInfo.width);

  if (placementOffset && p.length >= 1) {
    switch (p[0]) {
      case 't':
        basey -= placementOffset;
        break;
      case 'b':
        basey += placementOffset;
        break;
      case 'l':
        basex -= placementOffset;
        break;
      case 'r':
        basex += placementOffset;
        break;
    }
  }

  return {
    points,
    left: basex + offset[0],
    top: basey + offset[1],
  }
}

function shouldResizePlacement(l: number, t: number, viewport: HTMLElement, staticInfo: any) {
  const { container, containerInfo, overlayInfo } = staticInfo;
  if (viewport !== container) {
    // 说明 container 不具备滚动属性
    const { left: vleft, top: vtop } = getViewTopLeft(viewport);
    const { scrollWidth: vwidth, scrollHeight: vheight, scrollTop: vscrollTop, scrollLeft: vscrollLeft } = viewport;

    const nt = t + containerInfo.top - vtop + vscrollTop;
    const nl = l + containerInfo.left - vleft + vscrollLeft;

    return nt < 0 || nl < 0 || nt + overlayInfo.height > vheight || nl + overlayInfo.width > vwidth;
  }

  return t < 0 || l < 0 || t + overlayInfo.height > containerInfo.height || l + overlayInfo.width > containerInfo.width;
}

function getNewPlacement(l: number, t: number, p: placementType, staticInfo: any) {
  const { overlayInfo, containerInfo } = staticInfo;

  let np = p.split('');
  if (np.length === 1) {
    np.push('');
  }

  // 区域不够
  if (t < 0) {
    // [上边 => 下边, 底部对齐 => 顶部对齐]
    np = [np[0].replace('t', 'b'), np[1].replace('b', 't')];
  }
  // 区域不够
  if (l < 0) {
    // [左边 => 右边, 右对齐 => 左对齐]
    np = [np[0].replace('l', 'r'), np[1].replace('r', 'l')];
  }
  // 超出区域
  if (t + overlayInfo.height > containerInfo.height) {
    // [下边 => 上边, 顶部对齐 => 底部对齐]
    np = [np[0].replace('b', 't'), np[1].replace('t', 'b')];
  }
  // 超出区域
  if (l + overlayInfo.width > containerInfo.width) {
    // [右边 => 左边, 左对齐 => 右对齐]
    np = [np[0].replace('r', 'l'), np[1].replace('l', 'r')];
  }

  return np.join('') as placementType;
}

function ajustLeftAndTop(l: number, t: number, staticInfo: any) {
  const { overlayInfo, containerInfo } = staticInfo;

  if (t < 0) {
    t = 0;
  }
  if (l < 0) {
    l = 0;
  }
  if (t + overlayInfo.height > containerInfo.height) {
    t = containerInfo.height - overlayInfo.height;
  }
  if (l + overlayInfo.width > containerInfo.width) {
    l = containerInfo.width - overlayInfo.width;
  }

  return {
    left: l,
    top: t
  }
}


/**
 * 计算相对于 container 的偏移位置
 * @param config 
 * @returns 
 */
export default function getPlacements(config: PlacementsConfig): PositionResult {
  const {
    target,
    overlay,
    container,
    scrollNode,
    placement: oplacement,
    placementOffset = 0,
    points: opoints = ['tl', 'bl'],
    offset = [0, 0],
    position = 'absolute',
    beforePosition,
    autoAdjust = true,
    autoHideScrollOverflow = true,
    rtl,
  } = config;

  if (position === 'fixed') {
    return {
      style: {
        position,
        left: offset[0],
        top: offset[1],
      }
    }
  }

  let placement = oplacement;
  
  // rtl 左右对调
  if (rtl && placement) {
    if (placement.match(/l/)) {
      placement = placement.replace('l', 'r') as placementType;
    } else if(placement.match(/r/)) {
      placement = placement.replace('r', 'l') as placementType;
    }
  }

  /**
   * 可视窗口是浏览器给用户展示的窗口
   * getBoundingClientRect(): top/left 是相对 viewport 
   * node: offsetTop/offsetarget.Left 是相对 parent 元素的
   * 
   * top: 元素上边  距离可视窗口 上边框的距离
   * left: 元素左边 距离可视窗口 左边框的距离
   * 
   * scrollTop: 容器上下滚动距离
   * scrollLeft: 容器左右滚动距离
   */
  const { width: twidth, height: theight, left: tleft, top: ttop } = target.getBoundingClientRect();
  const { left: cleft, top: ctop } = getViewTopLeft(container);
  const { scrollWidth: cwidth, scrollHeight: cheight, scrollTop: cscrollTop, scrollLeft: cscrollLeft } = container;
  const { width: owidth, height: oheight } = getWidthHeight(overlay);

  const staticInfo = {
    targetInfo: { width: twidth, height: theight, left: tleft, top: ttop },
    containerInfo: { left: cleft, top: ctop, width: cwidth, height: cheight, scrollTop: cscrollTop, scrollLeft: cscrollLeft },
    overlayInfo: { width: owidth, height: oheight },
    points: opoints,
    placementOffset,
    offset,
    container,
  };

  // step1: 根据 placement 计算位置
  let { left, top, points } = getXY(placement, staticInfo);

  // 获取可视区域，来计算容器相对位置
  const viewport = getViewPort(container);

  // step2: 根据 viewport（挂载容器不一定是可视区, eg: 挂载在父节点，但是弹窗超出父节点）重新计算位置. 根据可视区域优化位置
  // 位置动态优化思路见 https://github.com/alibaba-fusion/overlay/issues/2
  if (autoAdjust && placement && shouldResizePlacement(left, top, viewport, staticInfo)) {
    const nplacement = getNewPlacement(left, top, placement, staticInfo);
    // step2: 空间不够，替换位置重新计算位置
    if (placement !== nplacement) {
      let { left: nleft, top: ntop } = getXY(nplacement, staticInfo);

      if (shouldResizePlacement(nleft, ntop, viewport, staticInfo)) {
        const nnplacement = getNewPlacement(nleft, ntop, nplacement, staticInfo);
        // step3: 空间依然不够，说明xy轴至少有一个方向是怎么更换位置都不够的。停止计算开始补偿逻辑
        if (nplacement !== nnplacement) {
          let { left: nnleft, top: nntop } = getXY(nnplacement, staticInfo);

          const { left: nnnleft, top: nnntop } = ajustLeftAndTop(nnleft, nntop, staticInfo);

          placement = nnplacement;
          left = nnnleft;
          top = nnntop;
        } else {
          placement = nplacement;
          left = nleft;
          top = ntop;
        }
      } else {
        placement = nplacement;
        left = nleft;
        top = ntop;
      }
    }

    const { left: nleft, top: ntop } = ajustLeftAndTop(left, top, staticInfo);
    left = nleft;
    top = ntop;
  }

  const result = <PositionResult>{
    config: {
      placement,
      points,
    },
    style: {
      position,
      left: Math.round(left),
      top: Math.round(top),
    }
  };

  /**
   * step3: 滚动隐藏弹窗逻辑。避免出现 target 已经滚动消失，弹层飘在页面最上方的情况。详细见 https://github.com/alibaba-fusion/overlay/issues/3
   * 触发条件: target 和 document.body 之间存在 overflow 滚动元素， target 进入不可见区域
   */
  if (autoHideScrollOverflow && placement && scrollNode?.length) {
    // 滚动改成 transform 提高性能, 但是有动效问题
    // result.style.transform = `translate3d(${result.style.left}px, ${result.style.top}px, 0px)`;
    // result.style.left = 0;
    // result.style.top = 0;

    scrollNode.forEach(node => {
      const { top, left, width, height } = node.getBoundingClientRect();
      if (ttop + theight < top || ttop > top + height || tleft + twidth < left || tleft > left + width) {
        result.style.display = 'none';
      } else {
        result.style.display = '';
      }
    });
  }

  if (beforePosition && typeof beforePosition) {
    return beforePosition(result, {
      target: {
        node: target,
        width: twidth, height: theight, left: tleft, top: ttop
      },
      overlay: {
        node: overlay,
        width: owidth, height: oheight
      }
    });
  }

  return result;
}
