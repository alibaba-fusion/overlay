import { CSSProperties } from 'react';
import { getViewTopLeft, getViewPort } from './utils';

type point = 'tl' | 'tc' | 'tr' | 'cl' | 'cc' | 'cr' | 'bl' | 'bc' | 'br';
export type pointsType = [point, point];
export type placementType = 'topLeft' | 'top' | 'topRight' | 'rightTop' | 'right' | 'rightBottom' | 'bottomLeft' | 'bottom' | 'bottomRight' | 'leftTop' | 'left' | 'leftBottom';

export interface PlacementsConfig {
  position: 'absolute' | 'fixed';
  /**
   * 弹窗的目标定位元素
   */
  target: HTMLElement;
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
   * 对其点 [弹窗, 相对目标]
   */
  points?: pointsType;
  offset?: number[];
  beforePosition?: Function;
  needAdjust?: boolean;
}

export interface placementMapType {
  topLeft: pointsType;
  top: pointsType;
  topRight: pointsType;
  leftTop: pointsType;
  left: pointsType;
  leftBottom: pointsType;
  bottomLeft: pointsType;
  bottom: pointsType;
  bottomRight: pointsType;
  rightTop: pointsType;
  right: pointsType;
  rightBottom: pointsType;
}

const placementMap: placementMapType = {
  topLeft: ['bl', 'tl'],
  top: ['bc', 'tc'],
  topRight: ['br', 'tr'],
  leftTop: ['tr', 'tl'],
  left: ['cr', 'cl'],
  leftBottom: ['br', 'bl'],
  bottomLeft: ['tl', 'bl'],
  bottom: ['tc', 'bc'],
  bottomRight: ['tr', 'br'],
  rightTop: ['tl', 'tr'],
  right: ['cl', 'cr'],
  rightBottom: ['bl', 'br'],
};

export interface placementStyleType {
  config?: {
    placement: placementType | undefined;
  },
  style: CSSProperties
}
/**
 * 计算相对于 container 的偏移位置
 * @param config 
 * @returns 
 */
export default function getPlacements(config: PlacementsConfig): placementStyleType {
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
    needAdjust = true,
    autoHideScrollOverflow = true
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

  /**
   * 可视窗口是浏览器给用户展示的窗口
   * getBoundingClientRect(): top/left 是相对 viewport 
   * node: offsetTop/offsetLeft 是相对 parent 元素的
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
  const { width: owidth, height: oheight } = overlay.getBoundingClientRect();

  function getXY(p: placementType | undefined) {
    let basex = tleft - cleft + cscrollLeft;
    let basey = ttop - ctop + cscrollTop;

    let points = opoints;
    if (p && p in placementMap) {
      points = placementMap[p];

      if (placementOffset) {
        switch (p.replace(/Left|Right|Top|Bottom/, '')) {
          case 'top':
            basey -= placementOffset;
            break;
          case 'bottom':
            basey += placementOffset;
            break;
          case 'left':
            basex -= placementOffset;
            break;
          case 'right':
            basex += placementOffset;
            break;
        }
      }
    }

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

    // 目标元素
    setPointY(points[1][0], true, theight);
    setPointX(points[1][1], true, twidth);
    setPointY(points[0][0], false, oheight);
    setPointX(points[0][1], false, owidth);

    return {
      points,
      left: basex + offset[0],
      top: basey + offset[1],
    }
  }

  let { left, top, points } = getXY(placement);

  function shouldResizePlacement(l: number, t: number, viewport: HTMLElement) {
    if (viewport !== container) {
      // 说明 container 不具备滚动属性
      const { left: vleft, top: vtop } = getViewTopLeft(viewport);
      const { scrollWidth: vwidth, scrollHeight: vheight, scrollTop: vscrollTop, scrollLeft: vscrollLeft } = viewport;

      const nt = t + ctop - vtop + vscrollTop;
      const nl = l + cleft - vleft + vscrollLeft;

      return nt < 0 || nl < 0 || nt + oheight > vheight || nl + owidth > vwidth;
    }

    return t < 0 || l < 0 || t + oheight > cheight || l + owidth > cwidth;
  }

  function getNewPlacement(l: number, t: number, p: placementType) {
    let np: placementType = p;
    // 区域不够
    if (t < 0) {
      // 上边 => 下边
      np = np.replace('top', 'bottom') as placementType;
      // 底部对齐 => 顶部对齐
      np = np.replace('Bottom', 'Top') as placementType;
    }
    if (l < 0) {
      // 左边 => 右边
      np = np.replace('left', 'right') as placementType;
      // 右对齐 => 左对齐
      np = np.replace('Right', 'Left') as placementType;
    }
    // 超出区域
    if (t + oheight > cheight) {
      // 下边 => 上边
      np = np.replace('bottom', 'top') as placementType;
      // 顶部对齐 => 底部对齐
      np = np.replace('Top', 'Bottom') as placementType;
    }
    if (l + owidth > cwidth) {
      // 右边 => 左边
      np = np.replace('right', 'left') as placementType;
      // 左对齐 => 右对齐
      np = np.replace('Left', 'Right') as placementType;
    }

    return np;
  }

  function ajustLeftAndTop(l: number, t: number) {
    if (t < 0) {
      t = 0;
    }
    if (l < 0) {
      l = 0;
    }
    if (t + oheight > cheight) {
      t = cheight - oheight;
    }
    if (l + owidth > cwidth) {
      l = cwidth - owidth;
    }

    return {
      left: l,
      top: t
    }
  }

  const viewport = getViewPort(container);

  // 根据 viewport 重新计算位置
  if (needAdjust && placement && shouldResizePlacement(left, top, viewport)) {
    const nplacement = getNewPlacement(left, top, placement);
    // step2: 空间不够，替换位置重新计算位置
    if (placement !== nplacement) {
      let { left: nleft, top: ntop } = getXY(nplacement);

      if (shouldResizePlacement(nleft, ntop, viewport)) {
        const nnplacement = getNewPlacement(nleft, ntop, nplacement);
        // step3: 空间依然不够，说明xy轴至少有一个方向是怎么更换位置都不够的。停止计算开始补偿逻辑
        if (nplacement !== nnplacement) {
          let { left: nnleft, top: nntop } = getXY(nnplacement);

          const { left: nnnleft, top: nnntop } = ajustLeftAndTop(nnleft, nntop);

          placement = nnplacement;
          left = nnnleft;
          top = nnntop;
        }

      } else {
        placement = nplacement;
        left = nleft;
        top = ntop;
      }
    } else {
      const { left: nleft, top: ntop } = ajustLeftAndTop(left, top);
      left = nleft;
      top = ntop;
    }
  }

  const result = {
    config: {
      placement,
      points,
    },
    style: <CSSProperties>{
      position,
      left: Math.round(left),
      top: Math.round(top),
    }
  };

  /**
   * 滚动隐藏弹窗逻辑
   * 触发条件: target 和 document.body 之间存在 overflow 滚动元素， target 进入不可见区域
   */
  if (autoHideScrollOverflow && placement && scrollNode.length) {
    // 滚动改成 transform 提高性能
    result.style.transform = `translate3d(${result.style.left}px, ${result.style.top}px, 0px)`;
    result.style.left = 0;
    result.style.top = 0;

    scrollNode.forEach(node => {
      const { top, left, width, height } = node.getBoundingClientRect();
      if (ttop + theight < top || ttop > top + height || tleft + twidth < left || tleft > left + width) {
        result.style.display = 'none';
      }
    });
  }

  if (beforePosition && typeof beforePosition) {
    return beforePosition(result);
  }

  return result;
}
