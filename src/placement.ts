import { CSSProperties } from 'react';
import { getViewTopLeft, getViewPort } from './utils';

type point = 'tl' | 'tc' | 'tr' | 'cl' | 'cc' | 'cr' | 'bl' | 'bc' | 'br';
export type pointsType = [point, point];
export type alignType = 'tl' | 't' | 'tr' | 'rt' | 'r' | 'rb' | 'bl' | 'b' | 'br' | 'lt' | 'l' | 'lb';

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
  align?: alignType;
  /**
   * 偏离 align 对其方向像素
   */
  alignOffset?: number;
  /**
   * 对齐点 [弹窗, 相对目标]
   */
  points?: pointsType;
  offset?: number[];
  /**
   * 弹窗位置重新计算的回调，可以通过修改范围值自己订正弹窗位置
   */
  beforePosition?: (result: PositionResult) => PositionResult;
  autoAdjust?: boolean;
}

export interface alignMapType {
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

const alignMap: alignMapType = {
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
    align: alignType;
    points: pointsType;
  },
  style: CSSProperties;
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
    align: oalign,
    alignOffset = 0,
    points: opoints = ['tl', 'bl'],
    offset = [0, 0],
    position = 'absolute',
    beforePosition,
    autoAdjust = true,
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

  let align = oalign;

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

  function getXY(p: alignType | undefined) {
    let basex = tleft - cleft + cscrollLeft;
    let basey = ttop - ctop + cscrollTop;

    let points = opoints;
    if (p && p in alignMap) {
      points = alignMap[p];

      if (alignOffset && p.length === 2) {
        switch (p[0]) {
          case 't':
            basey -= alignOffset;
            break;
          case 'b':
            basey += alignOffset;
            break;
          case 'l':
            basex -= alignOffset;
            break;
          case 'r':
            basex += alignOffset;
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

  // step1: 根据 align 计算位置
  let { left, top, points } = getXY(align);

  function shouldResizeAlign(l: number, t: number, viewport: HTMLElement) {
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

  function getNewAlign(l: number, t: number, p: alignType) {
    if (p.length !== 2) {
      return p;
    }
    
    let np: alignType = p;
    // 区域不够
    if (t < 0) {
      // [上边 => 下边, 底部对齐 => 顶部对齐]
      np = [np[0].replace('t', 'b'), np[1].replace('b', 't')] as unknown as alignType;
    }
    // 区域不够
    if (l < 0) {
      // [左边 => 右边, 右对齐 => 左对齐]
      np = [np[0].replace('l', 'r'), np[1].replace('r', 'l')] as unknown as alignType;
    }
    // 超出区域
    if (t + oheight > cheight) {
      // [下边 => 上边, 顶部对齐 => 底部对齐]
      np = [np[0].replace('b', 't'), np[1].replace('t', 'b')] as unknown as alignType;
    }
    // 超出区域
    if (l + owidth > cwidth) {
      // [右边 => 左边, 左对齐 => 右对齐]
      np = [np[0].replace('r', 'l'), np[1].replace('l', 'r')] as unknown as alignType;
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

  // step2: 根据 viewport（挂载容器不一定是可视区）重新计算位置. 根据可视区域优化位置
  // 位置动态优化思路见 https://github.com/alibaba-fusion/overlay/issues/2
  if (autoAdjust && align && shouldResizeAlign(left, top, viewport)) {
    const nalign = getNewAlign(left, top, align);
    // step2: 空间不够，替换位置重新计算位置
    if (align !== nalign) {
      let { left: nleft, top: ntop } = getXY(nalign);

      if (shouldResizeAlign(nleft, ntop, viewport)) {
        const nnalign = getNewAlign(nleft, ntop, nalign);
        // step3: 空间依然不够，说明xy轴至少有一个方向是怎么更换位置都不够的。停止计算开始补偿逻辑
        if (nalign !== nnalign) {
          let { left: nnleft, top: nntop } = getXY(nnalign);

          const { left: nnnleft, top: nnntop } = ajustLeftAndTop(nnleft, nntop);

          align = nnalign;
          left = nnnleft;
          top = nnntop;
        }

      } else {
        align = nalign;
        left = nleft;
        top = ntop;
      }
    } else {
      const { left: nleft, top: ntop } = ajustLeftAndTop(left, top);
      left = nleft;
      top = ntop;
    }
  }

  const result = <PositionResult> {
    config: {
      align,
      points,
    },
    style: {
      position,
      left: Math.round(left),
      top: Math.round(top),
    }
  };

  /**
   * step3: 滚动隐藏弹窗逻辑
   * 触发条件: target 和 document.body 之间存在 overflow 滚动元素， target 进入不可见区域
   */
  if (autoHideScrollOverflow && align && scrollNode.length) {
    // 滚动改成 transform 提高性能, 但是有动效问题
    // result.style.transform = `translate3d(${result.style.left}px, ${result.style.top}px, 0px)`;
    // result.style.left = 0;
    // result.style.top = 0;

    scrollNode.forEach(node => {
      const { top, left, width, height } = node.getBoundingClientRect();
      if (ttop + theight < top || ttop > top + height || tleft + twidth < left || tleft > left + width) {
        result.style.display = 'none';
      } else {
        result.style.display = ''; // 这里一定要显式的删除，带上动效后会删不掉
      }
    });
  }

  if (beforePosition && typeof beforePosition) {
    return beforePosition(result);
  }

  return result;
}
