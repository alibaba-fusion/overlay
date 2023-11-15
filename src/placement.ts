import { CSSProperties } from 'react';
import { getViewTopLeft, getViewPort, getWidthHeight } from './utils';

type point = 'tl' | 'tc' | 'tr' | 'cl' | 'cc' | 'cr' | 'bl' | 'bc' | 'br';
export type pointsType = [point, point];
export type placementType =
  | 'tl'
  | 't'
  | 'tr'
  | 'rt'
  | 'r'
  | 'rb'
  | 'bl'
  | 'b'
  | 'br'
  | 'lt'
  | 'l'
  | 'lb';

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
}

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
  scrollNode?: HTMLElement[];
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
  };
  style: CSSProperties;
}

function getXY(p: placementType | undefined, staticInfo: any) {
  const {
    targetInfo,
    containerInfo,
    overlayInfo,
    points: opoints,
    placementOffset,
    offset,
    rtl,
  } = staticInfo;
  let basex = targetInfo.left - containerInfo.left + containerInfo.scrollLeft;
  let basey = targetInfo.top - containerInfo.top + containerInfo.scrollTop;

  function setPointX(point: string, positive = true, width: number) {
    const plus = positive ? 1 : -1;
    switch (point) {
      case 'l':
        basex += 0;
        break;
      case 'c':
        basex += (plus * width) / 2;
        break;
      case 'r':
        basex += plus * width;
        break;
      // no default
    }
  }

  function setPointY(point: string, positive = true, height: number) {
    const plus = positive ? 1 : -1;
    switch (point) {
      case 't':
        basey += 0;
        break;
      case 'c':
        basey += (plus * height) / 2;
        break;
      case 'b':
        basey += plus * height;
        break;
      // no default
    }
  }

  let points = [...opoints];
  if (p && p in placementMap) {
    points = placementMap[p];
  }

  // rtl 左右对调
  if (rtl) {
    if (points[0].match(/l/)) {
      points[0] = points[0].replace('l', 'r') as placementType;
    } else if (points[0].match(/r/)) {
      points[0] = points[0].replace('r', 'l') as placementType;
    }
    if (points[1].match(/l/)) {
      points[1] = points[1].replace('l', 'r') as placementType;
    } else if (points[1].match(/r/)) {
      points[1] = points[1].replace('r', 'l') as placementType;
    }
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
      // no default
    }
  }

  return {
    points: points as pointsType,
    left: basex + offset[0],
    top: basey + offset[1],
  };
}

function shouldResizePlacement(l: number, t: number, viewport: HTMLElement, staticInfo: any) {
  const { container, containerInfo, overlayInfo } = staticInfo;
  if (viewport !== container) {
    // 说明 container 不具备滚动属性
    const { left: vleft, top: vtop } = getViewTopLeft(viewport);
    const {
      scrollWidth: vwidth,
      scrollHeight: vheight,
      scrollTop: vscrollTop,
      scrollLeft: vscrollLeft,
    } = viewport;

    const nt = t + containerInfo.top - vtop + vscrollTop;
    const nl = l + containerInfo.left - vleft + vscrollLeft;

    return nt < 0 || nl < 0 || nt + overlayInfo.height > vheight || nl + overlayInfo.width > vwidth;
  }

  return (
    t < 0 ||
    l < 0 ||
    t + overlayInfo.height > containerInfo.height ||
    l + overlayInfo.width > containerInfo.width
  );
}

function getNewPlacements(
  l: number,
  t: number,
  p: placementType,
  staticInfo: any
): placementType[] {
  const { overlayInfo, containerInfo } = staticInfo;
  const npArr: string[] = [];
  const [direction, align = ''] = p.split('');

  const topOut = t < 0;
  const leftOut = l < 0;
  const rightOut = l + overlayInfo.width > containerInfo.width;
  const bottomOut = t + overlayInfo.height > containerInfo.height;
  const outNumber = [topOut, leftOut, rightOut, bottomOut].filter(Boolean).length;
  const preferHoz = ['l', 'r'].includes(direction);

  const push = (...ps: string[]) => npArr.push(...ps);
  switch (outNumber) {
    case 0:
    case 4: {
      // 任意placement都不可能四面超出
      // 四侧超出或未超出，不处理
      return null;
    }
    case 3: {
      if (topOut && leftOut && rightOut) {
        // 左上右超出, try b
        push('b', 'bl', 'br');
      }
      if (topOut && leftOut && bottomOut) {
        // 左上下超出, try r
        push('r', 'rt', 'rb');
      }
      if (topOut && rightOut && bottomOut) {
        // 上右下超出, try l
        push('l', 'lt', 'lb');
      }

      if (bottomOut && leftOut && rightOut) {
        // 左下右超出, try t
        push('t', 'tl', 'tr');
      }
      break;
    }
    case 2: {
      if (topOut && leftOut) {
        // 左上超出, try bl rt
        push('bl', 'rt');
      }
      if (topOut && rightOut) {
        // 右上超出, try br lt
        push('br', 'lt');
      }
      if (rightOut && bottomOut) {
        // 右下超出, try tr lb
        push('tr', 'lb');
      }
      if (leftOut && bottomOut) {
        // 左下超出, try tl rb
        push('tl', 'rb');
      }
      break;
    }
    case 1: {
      if (topOut) {
        if (align) {
          push(direction.replace('t', 'b') + align.replace('b', 't'));
        } else {
          push('lt', 'rt', 'b');
        }
      }
      if (leftOut) {
        if (align) {
          push(direction.replace('l', 'r') + align.replace('r', 'l'));
        } else {
          push('tl', 'bl', 'r');
        }
      }
      if (bottomOut) {
        if (align) {
          push(direction.replace('b', 't') + align.replace('t', 'b'));
        } else {
          push('lb', 'rb', 't');
        }
      }
      if (rightOut) {
        if (align) {
          push(direction.replace('r', 'l') + align.replace('l', 'r'));
        } else {
          push('tr', 'br', 'l');
        }
      }
      break;
    }
    // no default
  }
  const hozGroup = direction === 'l' ? ['l', 'r'] : ['r', 'l'];
  const verGroup = direction === 't' ? ['t', 'b'] : ['b', 't'];
  const hozOrders = hozGroup.concat(verGroup);
  const verOrders = verGroup.concat(hozGroup);
  const orders = preferHoz ? hozOrders : verOrders;
  npArr.sort((a, b) => {
    return orders.indexOf(a[0]) - orders.indexOf(b[0]);
  });
  return npArr as placementType[];
}

function getBackupPlacement(
  l: number,
  t: number,
  p: placementType,
  staticInfo: any
): placementType | null {
  const { overlayInfo, containerInfo } = staticInfo;
  const [direction, align] = p.split('');

  const topOut = t < 0;
  const leftOut = l < 0;
  const rightOut = l + overlayInfo.width > containerInfo.width;
  const bottomOut = t + overlayInfo.height > containerInfo.height;
  const outNumber = [topOut, leftOut, rightOut, bottomOut].filter(Boolean).length;

  if (outNumber === 3) {
    // 三面超出，则使用未超出的方向
    const maps: Array<{ direction: string; value: boolean }> = [
      { direction: 't', value: topOut },
      { direction: 'r', value: rightOut },
      { direction: 'b', value: bottomOut },
      { direction: 'l', value: leftOut },
    ];
    const backDirection = maps.find((t) => !t.value)?.direction;
    // 若原来的方向跟调整后不一致，则使用调整后的
    if (backDirection && backDirection !== direction) {
      return backDirection as placementType;
    }
  }
  return null;
}

function autoAdjustPosition(
  l: number,
  t: number,
  p: placementType,
  staticInfo: any
): { left: number; top: number; placement: placementType } | null {
  let left = l;
  let top = t;
  const { overlayInfo, targetInfo, viewport } = staticInfo;
  let { container, containerInfo } = staticInfo;
  const { width: oWidth, height: oHeight } = overlayInfo;
  const { width: tWidth, height: tHeight } = targetInfo;
  const { width: cWidth, height: cHeight, left: cLeft, top: cTop } = containerInfo;

  // 若容器空间不足以支撑overlay + target，则使用viewport作为参考调整内容
  if (viewport !== container && oWidth + tWidth > cWidth && oHeight + tHeight > cHeight) {
    left += cLeft;
    top += cTop;
    container = viewport;
    const { left: vLeft, top: vTop } = getViewTopLeft(viewport);
    containerInfo = {
      width: viewport.clientWidth || viewport.offsetWidth,
      height: viewport.clientHeight || viewport.offsetHeight,
      left: vLeft,
      top: vTop,
    };
  }

  if (!shouldResizePlacement(left, top, viewport, staticInfo)) {
    return null;
  }

  // 根据位置超出情况，获取所有可以尝试的位置列表
  const placements = getNewPlacements(left, top, p, staticInfo);
  // 按顺序寻找能够容纳的位置
  for (const placement of placements) {
    const { left: nLeft, top: nTop } = getXY(placement, staticInfo);
    if (!shouldResizePlacement(nLeft, nTop, viewport, staticInfo)) {
      return {
        left: nLeft,
        top: nTop,
        placement,
      };
    }
  }

  const backupPlacement = getBackupPlacement(left, top, p, staticInfo);

  if (backupPlacement) {
    const { left: nLeft, top: nTop } = getXY(backupPlacement, staticInfo);
    return {
      left: nLeft,
      top: nTop,
      placement: backupPlacement,
    };
  }

  return null;
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

  let placement = oplacement;

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
  const { width: owidth, height: oheight } = getWidthHeight(overlay);
  if (position === 'fixed') {
    const result: PositionResult = {
      config: {
        placement: undefined,
        points: undefined,
      },
      style: {
        position,
        left: offset[0],
        top: offset[1],
      },
    };

    if (beforePosition && typeof beforePosition) {
      return beforePosition(result, {
        overlay: {
          node: overlay,
          width: owidth,
          height: oheight,
        },
      });
    }

    return result;
  }

  const { width: twidth, height: theight, left: tleft, top: ttop } = target.getBoundingClientRect();
  const { left: cleft, top: ctop } = getViewTopLeft(container);
  const {
    scrollWidth: cwidth,
    scrollHeight: cheight,
    scrollTop: cscrollTop,
    scrollLeft: cscrollLeft,
  } = container;

  // 获取可视区域，来计算容器相对位置
  const viewport = getViewPort(container);

  const staticInfo = {
    targetInfo: { width: twidth, height: theight, left: tleft, top: ttop },
    containerInfo: {
      left: cleft,
      top: ctop,
      width: cwidth,
      height: cheight,
      scrollTop: cscrollTop,
      scrollLeft: cscrollLeft,
    },
    overlayInfo: { width: owidth, height: oheight },
    points: opoints,
    placementOffset,
    offset,
    container,
    rtl,
    viewport,
  };

  // step1: 根据 placement 计算位置
  let { left, top, points } = getXY(placement, staticInfo);

  // step2: 根据 viewport（挂载容器不一定是可视区, eg: 挂载在父节点，但是弹窗超出父节点）重新计算位置. 根据可视区域优化位置
  // 位置动态优化思路见 https://github.com/alibaba-fusion/overlay/issues/2
  if (autoAdjust && placement && shouldResizePlacement(left, top, viewport, staticInfo)) {
    const adjustResult = autoAdjustPosition(left, top, placement, staticInfo);

    if (adjustResult) {
      left = adjustResult.left;
      top = adjustResult.top;
      placement = adjustResult.placement;
    }
  }

  const result: PositionResult = {
    config: {
      placement,
      points,
    },
    style: {
      position,
      left: Math.round(left),
      top: Math.round(top),
    },
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

    for (const node of scrollNode) {
      const { top, left, width, height } = node.getBoundingClientRect();
      if (
        ttop + theight < top ||
        ttop > top + height ||
        tleft + twidth < left ||
        tleft > left + width
      ) {
        result.style.display = 'none';
        break;
      } else {
        result.style.display = '';
      }
    }
  }

  if (beforePosition && typeof beforePosition) {
    return beforePosition(result, {
      target: {
        node: target,
        width: twidth,
        height: theight,
        left: tleft,
        top: ttop,
      },
      overlay: {
        node: overlay,
        width: owidth,
        height: oheight,
      },
    });
  }

  return result;
}
