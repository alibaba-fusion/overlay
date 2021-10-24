import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CSSProperties, ReactElement } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { createPortal } from 'react-dom';
import getPlacements, { pointsType, alignType, PositionResult } from './placement';
import { useListener, getHTMLElement, getStyle, setStyle, getMountContainer, throttle, callRef, getOverflowNodes, getScrollbarWidth, getFocusNodeList } from './utils';

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

  align?: alignType;
  /**
   * 偏离 placement 对其方向像素
   */
  alignOffset?: number;
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
   * 弹窗打开后的回调（此时弹窗挂载成功)
   */
  afterOpen?: Function;
  /**
   * 弹窗关闭后的回调
   */
  afterClose?: Function;

  hasMask?: boolean; // 仅仅为了兼容
  canCloseByMask?: boolean; // 仅仅为了兼容
  disableScroll?: boolean; // 仅仅为了兼容

  canCloseByOutSideClick?: boolean;
  canCloseByEsc?: boolean;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
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
  beforePosition?: (result: PositionResult) => PositionResult;
  onPosition?: Function;
  autoAdjust?: boolean;
  autoHideScrollOverflow?: boolean;
  /**
   * 是否自动聚焦弹窗
   */
  autoFocus?: boolean;
}


const isScrollDisplay = function (element: HTMLElement) {
  try {
    const scrollbarStyle = window.getComputedStyle(element, '::-webkit-scrollbar');
    return !scrollbarStyle || scrollbarStyle.getPropertyValue('display') !== 'none';
  } catch (e) {
    // ignore error for firefox
  }

  return true;
};
const hasScroll = (containerNode: HTMLElement) => {
  const parentNode = containerNode.parentNode as HTMLElement;

  return (
    parentNode &&
    parentNode.scrollHeight > parentNode.clientHeight &&
    getScrollbarWidth() > 0 &&
    isScrollDisplay(parentNode) &&
    isScrollDisplay(containerNode)
  );
};

const Overlay = React.forwardRef((props: OverlayProps, ref) => {
  const body = () => document.body;
  const {
    target,
    children,
    wrapperClassName,
    maskClassName,
    maskStyle,
    points,
    offset,
    fixed,
    visible,
    onRequestClose = () => { },
    afterOpen,
    afterClose,
    container: popupContainer = body,
    style = {},
    align,
    alignOffset,
    hasMask,
    canCloseByMask = true,
    disableScroll = true,
    canCloseByOutSideClick = true,
    canCloseByEsc = true,
    safeNode,
    /**
     * 弹窗
     */
    beforePosition,
    onPosition,
    cache = false,
    autoAdjust,
    autoFocus = false,
    ...others
  } = props;

  const position = fixed ? 'fixed' : 'absolute';
  const [firstVisible, setFirst] = useState(visible);
  const [, forceUpdate] = useState(null);
  const positionStyleRef = useRef<CSSProperties>({ position });
  const getContainer = typeof popupContainer === 'string' ? () => document.getElementById(popupContainer) :
    typeof popupContainer !== 'function' ? () => popupContainer : popupContainer;
  const [container, setContainer] = useState(null);
  const targetRef = useRef(null);
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const maskRef = useRef(null);
  const overflowRef = useRef<Array<HTMLElement>>([]);
  const lastFocus = useRef(null);
  const ro = useRef(null);

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
      scrollNode: overflowRef.current,
      points, offset,
      position,
      align,
      alignOffset,
      beforePosition,
      autoAdjust
    });

    positionStyleRef.current = placements.style;
    setStyle(overlayNode, placements.style);
    typeof onPosition === 'function' && onPosition(placements);
  }

  // 弹窗挂载
  const overlayRefCallback = useCallback((nodeRef) => {
    const node = getHTMLElement(nodeRef);
    overlayRef.current = node;
    callRef(ref, node);
    callRef((child as any).ref, node);

    if (node !== null && container) {
      const containerNode = getMountContainer(getHTMLElement(container));
      containerRef.current = containerNode;

      let taretElement = target && target !== 'viewport' ? (typeof target === 'string' ? () => document.getElementById(target) : target)() :
        (hasMask ? maskRef.current : body());
      const targetNode = getHTMLElement(taretElement);
      targetRef.current = targetNode;

      overflowRef.current = getOverflowNodes(targetNode, containerNode);

      if (autoFocus) {
        const focusableNodes = getFocusNodeList(node);
        if (focusableNodes.length > 0 && focusableNodes[0]) {
          lastFocus.current = document.activeElement;
          focusableNodes[0].focus();
        }
      }

      ro.current = new ResizeObserver(throttle(updatePosition.bind(this), 100));
      ro.current.observe(containerNode);

      forceUpdate({});
      !cache && typeof afterOpen === 'function' && afterOpen(node);
    } else {
      !cache && typeof afterClose === 'function' && afterClose(node);
      if (ro.current) {
        ro.current.disconnect();
        ro.current = null;
      }
    }
  }, [container]);

  const clickEvent = (e: OverlayEvent) => {
    if (!visible) {
      return;
    }

    // 点击遮罩关闭
    if (hasMask && maskRef.current === e.target) {
      if (canCloseByMask) {
        onRequestClose(e);
      }
      return;
    }

    const safeNodeList = Array.isArray(safeNode) ? safeNode : (typeof safeNode === 'function' ? [safeNode] : []);

    // 弹层默认是安全节点
    if (overlayRef.current) {
      safeNodeList.push(() => overlayRef.current);
    }

    // 安全节点不关闭
    for (let i = 0; i < safeNodeList.length; i++) {
      let node = getHTMLElement(typeof safeNodeList[i] === 'function' ? safeNodeList[i]() : null);

      if (node && (node === e.target || node.contains(e.target as Node))) {
        return;
      }
    }

    if (canCloseByOutSideClick) {
      onRequestClose(e);
    }
  }

  // 这里用 mousedown 而不是用 click。因为 click 是 mouseup 才触发。
  // 如果用 click 带来的问题: mousedown 在弹窗内部，然后按住鼠标不放拖动到弹窗外触发 mouseup 结果弹窗关了，这是不期望的展示。 https://github.com/alibaba-fusion/next/issues/742
  useListener(document.body, 'mousedown', clickEvent, false, !!(visible && overlayRef.current && (canCloseByOutSideClick || (hasMask && canCloseByMask))));

  const keydownEvent = (e: OverlayEvent) => {
    if (!visible) {
      return;
    }

    if (e.keyCode === 27 && canCloseByEsc) {
      onRequestClose(e);
    }
  }
  useListener(document.body, 'keydown', keydownEvent, false, !!(visible && overlayRef.current && canCloseByEsc));

  const scrollEvent = (e: OverlayEvent) => {
    if (!visible) {
      return;
    }
    updatePosition();
  }

  useListener(overflowRef.current, 'scroll', scrollEvent as any, false, !!(visible && overlayRef.current && overflowRef.current.length))

  // 有弹窗情况下在 body 增加 overflow:hidden，两个弹窗同时存在也没问题，会按照堆的方式依次 pop
  useEffect(() => {
    if (visible && hasMask) {
      const originStyle = document.body.getAttribute('style');
      disableScroll && setStyle(document.body, 'overflow', 'hidden');

      if (hasScroll(document.body)) {
        const scrollWidth = getScrollbarWidth();
        if (scrollWidth) {
          setStyle(document.body, 'padding-right', `calc(${getStyle(document.body, 'padding-right')} + ${scrollWidth}px)`);
        }
      }

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

  // cache 情况下的模拟 afterOpen/afterClose
  const overlayNode = overlayRef.current; // overlayRef.current 可能会异步变化，所以要先接下
  useEffect(() => {
    if (cache && overlayNode) {
      if (visible) {
        updatePosition();
        typeof afterOpen === 'function' && afterOpen(overlayNode);
      } else {
        typeof afterClose === 'function' && afterClose();
      }
    }
  }, [visible, cache && overlayNode]);

  // autoFocus 弹窗关闭后回到触发点
  useEffect(() => {
    if (!visible && autoFocus && lastFocus.current) {
      lastFocus.current.focus();
      lastFocus.current = null;
    }
  }, [!visible && autoFocus && lastFocus.current]);

  // container 异步加载, 因为 container 很可能还没渲染完成，所以 visible 后这里异步设置下
  useEffect(() => {
    if(visible) {
      // 首次更新
      if (!container) {
        setContainer(getContainer());
      } else if (getContainer() !== container) {
        setContainer(getContainer());
      }
    }
  }, [visible, popupContainer]);

  if (firstVisible === false || !container) {
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

  return createPortal(
    content,
    container
  );
});

export default Overlay;