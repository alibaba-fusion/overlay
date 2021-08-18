import * as React from 'react';

type point = 'tl' | 'tc' | 'tr' | 'cl' | 'cc' | 'cr' | 'bl' | 'bc' | 'br';
export type pointsType = [point, point];
export type placementType = 'topLeft' | 'top' | 'topRight' | 'left' | 'right' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';

export interface PlacementsConfig {
  position: 'absolute' | 'fixed';
  target: HTMLElement;
  overlay: HTMLElement;
  container: HTMLElement;
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
  style: React.CSSProperties
}

export default function getPlacements(config: PlacementsConfig): placementStyleType {
  const {
    target,
    overlay,
    container,
    placement: oplacement,
    placementOffset = 0,
    points: opoints = ['tl', 'bl'],
    offset = [0, 0],
    position = 'absolute'
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

  const { width: twidth, height: theight, left: tleft, top: ttop } = target.getBoundingClientRect();
  const { width: cwidth, height: cheight, left: cleft, top: ctop } = container.getBoundingClientRect()
  const { width: owidth, height: oheight } = overlay.getBoundingClientRect();

  function getXY(p: placementType | undefined) {
    let basex = tleft - cleft;
    let basey = ttop - ctop;

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
      left: basex + offset[0],
      top: basey + offset[1],
    }
  }

  let { left, top } = getXY(placement);

  function shouldResizePlacement(l: number, t: number) {
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

  if (placement && shouldResizePlacement(left, top)) {
    const nplacement = getNewPlacement(left, top, placement);
    // step2: 空间不够，替换位置重新计算位置
    if (placement !== nplacement) {
      let { left: nleft, top: ntop } = getXY(nplacement);

      if (shouldResizePlacement(nleft ,ntop)) {
        const nnplacement = getNewPlacement(nleft, ntop, nplacement);
        // step3: 空间依然不够，说明xy轴至少有一个方向是怎么更换位置都不够的。停止计算开始补偿逻辑
        if (nplacement !== nnplacement) {
          let { left: nnleft, top: nntop } = getXY(nnplacement);

          if (nntop < 0) {
            nntop = 0;
          }
          if (nnleft < 0) {
            nnleft = 0;
          }
          if (nntop + oheight > cheight) {
            nntop = cheight - oheight;
          }
          if (nnleft + owidth > cwidth) {
            nnleft = cwidth - owidth;
          }
          
          placement = nnplacement;
          left = nnleft;
          top = nntop;
        }

      } else {
        placement = nplacement;
        left = nleft;
        top = ntop;
      }
    }
  }

  return {
    config: {
      placement,
    },
    style: {
      position,
      left: left,
      top: top,
    }
  }
}
