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
  const [direction, align = ''] = p.split('');

  const topOut = t < 0;
  const leftOut = l < 0;
  const rightOut = l + overlayInfo.width > containerInfo.width;
  const bottomOut = t + overlayInfo.height > containerInfo.height;
  const forbiddenSet = new Set<placementType>();
  const forbid = (...ps: placementType[]) => ps.forEach((t) => forbiddenSet.add(t));
  // 上方超出
  if (topOut) {
    forbid('t', 'tl', 'tr');
  }

  // 右侧超出
  if (rightOut) {
    forbid('r', 'rt', 'rb');
  }

  // 下方超出
  if (bottomOut) {
    forbid('b', 'bl', 'br');
  }

  // 左侧超出
  if (leftOut) {
    forbid('l', 'lt', 'lb');
  }

  const allPlacements = Object.keys(placementMap) as placementType[];
  // 过滤出所有可用的
  const canTryPlacements = allPlacements.filter((t) => !forbiddenSet.has(t));

  // 无可用
  if (!canTryPlacements.length) {
    return null;
  }

  // 排序规则: 同向 > 对向 > 其他方向; 同align > 其他align; 中间 > l = t > r = b; align规则仅在同侧比较时生效
  // 参考： https://github.com/alibaba-fusion/overlay/issues/23

  const reverseMap: Record<string, string> = {
    l: 'r',
    r: 'l',
    t: 'b',
    b: 't',
    '': '',
  };
  // direction权重, l=t > r=b
  // 权重差值 4
  const directionOrderWeights: Record<string, number> = {
    t: 10,
    b: 6,
    l: 10,
    r: 6,
  };
  // 用户的 direction 最高
  directionOrderWeights[direction] = 12;
  // 用户 direction 的反转方向其次
  directionOrderWeights[reverseMap[direction]] = 11;

  // align排序权重: '' > l=t > r=b
  // 此处取值 2, 1, 0 意为远小于 direction 权重值和其差值，使得在加权和比较时不影响 direction，达到"仅同向比较align的目的"
  const alignOrderWeights: Record<string, number> = {
    '': 2,
    l: 1,
    r: 0,
    t: 1,
    b: 0,
  };
  // 用户的 align 权重最高
  alignOrderWeights[align] = 3;

  canTryPlacements.sort((after, before) => {
    const [afterDirection, afterAlign = ''] = after.split('');
    const [beforeDirection, beforeAlign = ''] = before.split('');
    const afterDirectionWeight = directionOrderWeights[afterDirection];
    const afterAlignWeight = alignOrderWeights[afterAlign];
    const beforeDirectionWeight = directionOrderWeights[beforeDirection];
    const beforeAlighWeight = alignOrderWeights[beforeAlign];
    // direction都相同，比较align weight
    if (afterDirection === beforeDirection) {
      return afterAlignWeight > beforeAlighWeight ? -1 : 1;
    }

    // align 相同，比较 direction weight
    if (afterAlign === beforeAlign) {
      return afterDirectionWeight > beforeDirectionWeight ? -1 : 1;
    }

    // 都不同
    // 与用户 direction相同情况优先最高
    if ([afterDirection, beforeDirection].includes(direction)) {
      return afterDirection === direction ? -1 : 1;
    }

    const reverseDirection = reverseMap[direction];
    // 与用户 reverse direction 相同则优先级其次
    if ([afterDirection, beforeDirection].includes(reverseDirection)) {
      return afterDirection === reverseDirection ? -1 : 1;
    }

    // 与用户align相同,则优先级更高
    if ([afterAlign, beforeAlign].includes(align)) {
      return afterAlign === align ? -1 : 1;
    }

    // 没有特殊情况，进行加权和比较
    return afterDirectionWeight + afterAlignWeight > beforeDirectionWeight + beforeAlighWeight
      ? -1
      : 1;
  });

  return canTryPlacements;
}

/**
 * 任意预设位置都无法完全容纳overlay，则走兜底逻辑，原则是哪边空间大用哪边
 * fixme: 在overlay尺寸宽高超过滚动容器宽高情况没有考虑，先走adjustXY逻辑
 */
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

/**
 * 基于xy的兜底调整
 * @param left overlay距离定位节点左侧距离
 * @param top overlay距离定位节点上方距离
 * @param placement 位置
 * @param staticInfo 其它信息
 */
function adjustXY(
  left: number,
  top: number,
  placement: placementType,
  staticInfo: any
): { left: number; top: number; placement: placementType } | null {
  const { viewport, container, containerInfo, overlayInfo, rtl } = staticInfo;
  if (!shouldResizePlacement(left, top, viewport, staticInfo)) {
    // 无需调整
    return null;
  }
  // 仍然需要调整
  let x = left;
  let y = top;
  let xAdjust = 0;
  let yAdjust = 0;
  // 调整为基于 viewport 的xy
  if (viewport !== container) {
    const { left: cLeft, top: cTop, scrollLeft, scrollTop } = containerInfo;
    xAdjust = cLeft - scrollLeft;
    yAdjust = cTop - scrollTop;
    x += xAdjust;
    y += yAdjust;
  }
  const { width: oWidth, height: oHeight } = overlayInfo;
  const { scrollWidth: vWidth, scrollHeight: vHeight } = viewport;
  const leftOut = x < 0;
  const topOut = y < 0;
  const rightOut = x + oWidth > vWidth;
  const bottomOut = y + oHeight > vHeight;

  if (oWidth > vWidth || oHeight > vHeight) {
    // overlay 比 可视区域还要大，方案有：
    // 1. 根据rtl模式，强制对齐习惯侧边缘，忽略另一侧超出
    // 2. 强制调整overlay宽高，并设置overflow
    // 第二种会影响用户布局，先采用第一种办法吧

    if (oWidth > vWidth) {
      if (rtl) {
        x = vWidth - oWidth;
      } else {
        x = 0;
      }
    }
    if (oHeight > vHeight) {
      y = 0;
    }
  } else {
    // viewport可以容纳 overlay
    // 则哪边超出，哪边重置为边缘位置
    if (leftOut) {
      x = 0;
    }
    if (topOut) {
      y = 0;
    }
    if (rightOut) {
      x = vWidth - oWidth;
    }
    if (bottomOut) {
      y = vHeight - oHeight;
    }
  }

  return {
    left: x - xAdjust,
    top: y - yAdjust,
    placement,
  };
}

function autoAdjustPosition(
  l: number,
  t: number,
  p: placementType,
  staticInfo: any
): { left: number; top: number; placement: placementType } | null {
  let left = l;
  let top = t;
  const { viewport, container, containerInfo } = staticInfo;
  const { left: cLeft, top: cTop, scrollLeft, scrollTop } = containerInfo;

  // 此时left&top是相对于container的，若container不是 viewport，则需要调整为相对 viewport 的 left & top 再计算
  if (viewport !== container) {
    left += cLeft - scrollLeft;
    top += cTop - scrollTop;
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
    overlay,
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
  // 位置动态优化思路见 https://github.com/alibaba-fusion/overlay/issues/23
  if (autoAdjust && placement && shouldResizePlacement(left, top, viewport, staticInfo)) {
    const adjustResult = autoAdjustPosition(left, top, placement, staticInfo);
    if (adjustResult) {
      left = adjustResult.left;
      top = adjustResult.top;
      placement = adjustResult.placement;
    }
  }

  const adjustXYResult = adjustXY(left, top, placement, staticInfo);
  if (adjustXYResult) {
    left = adjustXYResult.left;
    top = adjustXYResult.top;
    placement = adjustXYResult.placement;
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
