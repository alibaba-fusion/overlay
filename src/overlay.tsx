import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CSSProperties, ReactElement } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import ReactDOM from 'react-dom';
import getPlacements, { pointsType, placementType } from './placement';
import { useListener, setStyle, getContainer, throttle, callRef, getOverflowNodes } from './utils';

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
  const [,forceUpdate] = useState(null);
  const positionStyleRef = useRef<CSSProperties>({ position });

  const targetRef = useRef(null);
  const overlayRef= useRef(null);
  const containerRef= useRef(null);
  const maskRef = useRef(null);
  const overflowRef = useRef<Array<HTMLElement>>([]);

  const child: ReactElement | undefined = React.Children.only(children);
  if (typeof (child as any).ref === 'string') {
    throw new Error('Can not set ref by string in Overlay, use function instead.');
  }

  const updatePosition = () => {
    const overlayNode = overlayRef.current;
    const containerNode = containerRef.current;
    const targetNode = targetRef.current;

    if (!overlayNode || !containerNode || !targetNode) {
      return;
    }
    const placements = getPlacements({
      target: targetNode,
      overlay: overlayNode,
      container: containerNode,
      points, offset,
      position,
      placement,
      placementOffset,
      beforePosition
    });

    positionStyleRef.current = placements.style;
    setStyle(overlayNode, placements.style);
    typeof onPosition === 'function' && onPosition(placements);
  }

  // 弹窗挂载
  const overlayRefCallback = useCallback((node) => {
    // overlayRef = child.ref
    overlayRef.current = node;
    callRef(ref, node);
    callRef((child as any).ref, node);

    if (node !== null) {
      !cache && typeof onOpen === 'function' && onOpen(node);

      const containerNode = getContainer(container());
      containerRef.current = containerNode;
      const targetNode = (typeof target === 'string' ? () => document.getElementById(target) : target)();
      targetRef.current = targetNode;


      overflowRef.current = getOverflowNodes(targetNode, containerNode);

      const ro = new ResizeObserver(throttle(updatePosition.bind(this, true), 100));
      ro.observe(containerNode);

      forceUpdate({});
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
    if (!visible) {
      return;
    }
    if (e.keyCode === 27 && canCloseByEsc) {
      onRequestClose(e);
    }
  }
  useListener(document.body, 'keydown', keydownEvent as any, false, !!(visible && overlayRef.current && canCloseByEsc));

  const scrollEvent =  (e: OverlayEvent) => {
    if (!visible) {
      return;
    }
    // console.log(e)
    updatePosition();
  }

  useListener(overflowRef.current, 'scroll', scrollEvent as any, false, !!(visible && overlayRef.current && overflowRef.current.length))

  // 有弹窗情况下在 body 增加 overflow:hidden
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

  // 第一次加载并且 visible=false 的情况不挂载弹窗
  useEffect(() => {
    !firstVisible && visible && setFirst(true);
  }, [visible]);

  // cache 情况下的模拟 onOpen/onClose
  useEffect(() => {
    if (cache && overlayRef.current) {
      if (visible) {
        typeof onOpen === 'function' && onOpen(overlayRef.current);
        updatePosition();
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
    style: { ...child.props.style, ...positionStyleRef.current }
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