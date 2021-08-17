import * as React from 'react';
import * as ReactDOM from 'react-dom';

import getPlacements, { pointsType } from './placement';
import { useListener } from './utils';

export interface OverlayEvent extends Event {
  target: EventTarget | null;
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
  onClose?: (event: OverlayEvent) => void;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  className?: string;
  /**
   * 弹窗内容
   */
  children?: React.ReactNode;
  style?: object;
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
    onClose = () => { },
    container = body,
    style = {},
    placement,
    placementOffset,
    ...others
  } = props;

  const position = fixed ? 'fixed' : 'absolute';
  const [positionStyle, setPositionStyle] = React.useState<React.CSSProperties>({ position });
  const [overlayNode, setOverlayNode] = React.useState<any>(null);

  const overlayRefCallback = React.useCallback((node) => {
    setOverlayNode(node);

    if (typeof target === 'function' && node !== null) {
      const { style } = getPlacements({ target: target(), overlay: node, points, offset, position, placementOffset, placement });
      setPositionStyle(style)
    }

  }, []);

  const clickEvent = (e: OverlayEvent) => {
    if (!visible) {
      return;
    }

    if (typeof target === 'function') {
      const targetNode = target();

      if (targetNode && (targetNode === e.target || targetNode.contains(e.target))) {
        return;
      }
    }

    if (overlayNode && (overlayNode === e.target || overlayNode.contains(e.target))) {
      return;
    }

    onClose(e);
  }

  useListener(document.body, 'click', clickEvent, false, [visible, overlayNode]);

  if (!visible) {
    return null;
  }

  const content = <div {...others} className={className} ref={overlayRefCallback} style={{ ...positionStyle, ...style }} >
    {children}
  </div>;

  return ReactDOM.createPortal(
    content,
    container()
  );
};

export default Overlay;