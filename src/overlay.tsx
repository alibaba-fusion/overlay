import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CSSProperties, ReactElement } from 'react';

import ReactDOM from 'react-dom';

import getPlacements, { pointsType } from './placement';
import { useListener } from './utils';

export interface OverlayEvent extends MouseEvent, KeyboardEvent {
  target: EventTarget | null;
  targetType: string;
}

export interface OverlayProps {
  /**
   * 弹窗定位的参考元素
   */
  target?: Function;

  container?: () => Element;

  placement?: 'topLeft' | 'top' | 'topRight' | 'left' | 'right' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  /**
   * 偏离 placement 对其方向像素
   */
  placementOffset?: number;
  /**
   * 弹窗定位方式
   */
  points?: pointsType;
  /**
   * 偏移
   */
  offset?: [number, number];
  /**
   * 是否固定
   */
  fixed?: boolean;
  /**
   * 是否显示
   */
  visible?: boolean;
  onRequestClose?: (event: OverlayEvent) => void;
  /**
   * 是否展示遮罩	
   */
  hasMask?: boolean;
  /**
   * 点击遮罩区域是否关闭弹层，显示遮罩时生效	
   */
  canCloseByMask?: boolean;
  maskStyle?: CSSProperties;
  className?: string;
  /**
   * 弹窗内容
   */
  children?: ReactElement;
  style?: CSSProperties;
  safeNode?: () => Element | Array<() => Element>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * Primary UI component for user interaction
 */
const Overlay = (props: OverlayProps) => {
  const body = () => document.body;
  const {
    target = body,
    visible = false,
    children,
    className,
    points,
    offset,
    fixed,
    onRequestClose = () => { },
    container = body,
    style = {},
    placement,
    placementOffset,
    hasMask,
    canCloseByMask,
    safeNode,
    ...others
  } = props;

  const position = fixed ? 'fixed' : 'absolute';
  const [positionStyle, setPositionStyle] = useState<CSSProperties>({ position });
  const [overlayNode, setOverlayNode] = useState<any>(null);
  const maskRef = useRef(null);

  const overlayRefCallback = useCallback((node) => {
    setOverlayNode(node);

    if (typeof target === 'function' && node !== null) {
      const { style } = getPlacements({ target: target(), overlay: node, points, offset, position, placementOffset, placement });
      setPositionStyle(style)
    }

  }, []);

  const clickEvent = (e: OverlayEvent) => {
    console.log(visible)
    if (!visible) {
      return;
    }

    // 点击遮罩关闭
    if (hasMask && canCloseByMask && maskRef && maskRef.current === e.target) {
      onRequestClose(e);
      return;
    }

    const safeNodeList = Array.isArray(safeNode) ? safeNode : (typeof safeNode === 'function' ? [safeNode] : []);

    // 点击弹层不关闭
    if (overlayNode) {
      safeNodeList.push(() => overlayNode);
    }

    for (let i = 0; i < safeNodeList.length; i++) {
      const node = typeof safeNodeList[i] === 'function' ? safeNodeList[i]() : null;
      console.log(node)
      if (node && (node === e.target || node.contains(e.target as Node))) {
        return;
      }
    }

    // 点击相对目标不关闭
    // if (typeof target === 'function') {
    //   const targetNode = target();

    //   // 相对目标
    //   if (targetNode && (targetNode === e.target || targetNode.contains(e.target))) {
    //     return;
    //   }
    // }

    onRequestClose(e);
  }

  // console.log(/app/, visible, overlayNode)
  useListener(document.body, 'click', clickEvent, false, !!(visible && overlayNode));

  useEffect(() => {
    const originStyle = document.body.getAttribute('style');
    if (visible && hasMask) {
      document.body.setAttribute('style', 'overflow: hidden;');
    }
    return () => {
      document.body.setAttribute('style', originStyle);
    }
  }, [visible, hasMask]);

  if (!visible) {
    return null;
  }

  const maskProps = {
    className: 'next-overlay-mask',
    // onClick: canCloseByMask? onRequestClose
  }

  const content = (<div>
    {hasMask ? <div {...maskProps} ref={maskRef}></div> : null}
    <div {...others} className={className} ref={overlayRefCallback} style={{ ...positionStyle, ...style }} >
      {children}
    </div>
  </div>);

  return ReactDOM.createPortal(
    content,
    container()
  );
};

export default Overlay;