import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CSSProperties, ReactElement } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import ReactDOM from 'react-dom';
import getPlacements, { pointsType, placementType } from './placement';
import { useListener, setStyle, getContainer, throttle, callRef } from './utils';

export interface OverlayEvent extends MouseEvent, KeyboardEvent {
  target: EventTarget | null;
  targetType: string;
}

export interface OverlayProps {
  /**
   * 弹窗定位的参考元素
   */
  target?: Function | string;

  container?: () => HTMLElement;

  placement?: placementType;
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
  cache?: boolean;
  /**
   * 弹窗挂载成功的回调
   */
  onOpen?: Function;
  /**
   * 弹窗卸载成功后的回调
   */
  onClose?: Function;
  /**
   * 是否展示遮罩	
   */
  hasMask?: boolean;
  /**
   * 点击遮罩区域是否关闭弹层，显示遮罩时生效	
   */
  canCloseByMask?: boolean;
  canCloseByOutSideClick?: boolean;
  canCloseByEsc?: boolean;
  wrapperClassName?: string;
  maskClassName?: string;
  maskStyle?: CSSProperties;

  /**
   * 弹窗内容
   */
  children?: ReactElement;
  style?: CSSProperties;
  safeNode?: () => Element | Array<() => Element>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  beforePosition?: Function;
  onPosition?: Function;
}

const Overlay = React.forwardRef((props: OverlayProps, ref) => {
  const body = () => document.body;
  const {
    target = body,
    children,
    wrapperClassName,
    maskClassName,
    maskStyle,
    points,
    offset,
    fixed,
    visible,
    onRequestClose = () => { },
    onOpen,
    onClose,
    container = body,
    style = {},
    placement,
    placementOffset,
    hasMask,
    canCloseByMask,
    canCloseByOutSideClick = true,
    canCloseByEsc = true,
    safeNode,
    beforePosition,
    onPosition,
    cache = false,
    ...others
  } = props;

  const position = fixed ? 'fixed' : 'absolute';
  const [firstVisible, setFirst] = useState(visible);
  const [positionStyle, setPositionStyle] = useState<CSSProperties>({ position });
  const overlayRef: any = useRef(null);
  const maskRef = useRef(null);

  const child: ReactElement | undefined = React.Children.only(children);
  if (typeof (child as any).ref === 'string') {
    throw new Error('Can not set ref by string in Overlay, use function instead.');
  }

  // 弹窗挂载
  const overlayRefCallback = useCallback((node) => {
    overlayRef.current = node;
    callRef(ref, node);

    if (node !== null) {
      !cache && typeof onOpen === 'function' && onOpen(node);

      const containerNode = getContainer(container());
      const targetNode = (typeof target === 'string' ? () => document.getElementById(target) : target)();

      const updateOverlayPosition = throttle(() => {
        if (!node || !containerNode || !targetNode) {
          return;
        }
        const placements = getPlacements({
          target: targetNode,
          overlay: node,
          container: containerNode,
          points, offset,
          position,
          placement,
          placementOffset,
          beforePosition
        });
        setPositionStyle(placements.style);
        typeof onPosition === 'function' && onPosition(placements);
      }, 100);

      const ro = new ResizeObserver(updateOverlayPosition);
      ro.observe(containerNode);
    } else {
      !cache && typeof onClose === 'function' && onClose(node);
    }
  }, []);

  const clickEvent = (e: OverlayEvent) => {
    if (!visible) {
      return;
    }

    // 点击遮罩关闭
    if (hasMask && canCloseByMask && maskRef && maskRef.current === e.target) {
      onRequestClose(e);
      return;
    }

    const safeNodeList = Array.isArray(safeNode) ? safeNode : (typeof safeNode === 'function' ? [safeNode] : []);

    // 弹层默认是安全节点
    if (overlayRef.current) {
      safeNodeList.push(() => overlayRef.current);
    }

    // 安全节点不关闭
    for (let i = 0; i < safeNodeList.length; i++) {
      const node = typeof safeNodeList[i] === 'function' ? safeNodeList[i]() : null;
      if (node && (node === e.target || node.contains(e.target as Node))) {
        return;
      }
    }

    if (canCloseByOutSideClick) {
      onRequestClose(e);
    }
  }

  useListener(document.body, 'click', clickEvent as any, false, !!(visible && overlayRef.current));

  const keydownEvent = (e: OverlayEvent) => {
    console.log(e)
    if (!visible) {
      return;
    }
    if (e.keyCode === 27 && canCloseByEsc) {
      onRequestClose(e);
    }
  }
  useListener(document.body, 'keydown', keydownEvent as any, false, !!(visible && overlayRef.current && canCloseByEsc));

  useEffect(() => {
    if (visible && hasMask) {
      const originStyle = document.body.getAttribute('style');
      setStyle(document.body, 'overflow', 'hidden');
      return () => {
        document.body.setAttribute('style', originStyle || '');
      }
    }

    return undefined;
  }, [visible && hasMask]);

  // 第一次加载 visible=false 不挂在弹窗
  useEffect(() => {
    !firstVisible && visible && setFirst(true);
  }, [visible]);

  // cache 情况下的调用
  useEffect(() => {
    if (cache && overlayRef.current) {
      if (visible) {
        typeof onOpen === 'function' && onOpen(overlayRef.current);
      } else {
        typeof onClose === 'function' && onClose();
      }
    }
  }, [visible, cache && overlayRef.current])

  if (firstVisible === false) {
    return null;
  }

  if (!visible && !cache) {
    return null;
  }

  const newChildren = child ? React.cloneElement(child, {
    ...others,
    ref: overlayRefCallback,
    style: { ...child.props.style, ...positionStyle }
  }) : null;

  const wrapperStyle: any = {};
  if (cache && !visible) {
    wrapperStyle.display = 'none';
  }

  const content = (<div className={wrapperClassName} style={wrapperStyle}>
    {hasMask ? <div className={maskClassName} style={maskStyle} ref={maskRef}></div> : null}
    {newChildren}
  </div>);

  return ReactDOM.createPortal(
    content,
    container()
  );
});

export default Overlay;