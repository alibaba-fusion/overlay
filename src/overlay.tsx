import React, { useEffect, useState, useCallback, useRef, cloneElement, useContext } from 'react';
import { CSSProperties, ReactElement } from 'react';
import { findDOMNode } from 'react-dom';
import ResizeObserver from 'resize-observer-polyfill';
import { createPortal } from 'react-dom';
import getPlacements, { pointsType, placementType, PositionResult, TargetRect } from './placement';
import { useListener, getHTMLElement, getTargetNode, getStyle, setStyle, getRelativeContainer, throttle, callRef, getOverflowNodes, getScrollbarWidth, getFocusNodeList } from './utils';
import OverlayContext from './overlay-context';

export interface OverlayEvent extends MouseEvent, KeyboardEvent {
  target: EventTarget | null;
}

export interface OverlayProps {
  /**
   * 弹窗定位的参考元素
   */
  target?: (() => TargetRect | HTMLElement) | string;

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
  onRequestClose?: (targetType: string, event: OverlayEvent) => void;
  cache?: boolean;
  /**
   * 弹窗打开后的回调（此时弹窗挂载成功)
   */
  onOpen?: Function;
  /**
   * 弹窗关闭后的回调
   */
  onClose?: Function;

  hasMask?: boolean; // 仅仅为了兼容
  canCloseByMask?: boolean; // 仅仅为了兼容
  /**
   * 是否禁止滚动
   */
  disableScroll?: boolean;

  canCloseByOutSideClick?: boolean;
  canCloseByEsc?: boolean;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
  maskClassName?: string;
  maskStyle?: CSSProperties;
  maskRender?: (node: ReactElement) => ReactElement;

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
  isAnimationEnd?: boolean;
  rtl?: boolean;
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
  const overflow = getStyle(containerNode, 'overflow');
  if (overflow === 'hidden') {
    return false;
  }

  const parentNode = containerNode.parentNode as HTMLElement;

  return (
    parentNode &&
    parentNode.scrollHeight > parentNode.clientHeight &&
    getScrollbarWidth() > 0 &&
    isScrollDisplay(parentNode) &&
    isScrollDisplay(containerNode)
  );
};

/**
 * 传入的组件可能是没有 forwardRef 包裹的 Functional Component, 会导致取不到 ref
 */
export class RefWrapper extends React.Component {
  render() {
    return this.props.children;
  }
}

const Overlay = React.forwardRef<HTMLDivElement, OverlayProps>((props, ref) => {
  const body = () => document.body;
  const {
    target,
    children,
    wrapperClassName,
    maskClassName,
    maskStyle,
    hasMask,
    canCloseByMask = true,
    maskRender,
    points,
    offset,
    fixed,
    visible,
    onRequestClose = () => { },
    onOpen,
    onClose,
    container: popupContainer = body,
    placement,
    placementOffset,
    disableScroll = false,
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
    isAnimationEnd = true,
    rtl,
    wrapperStyle: owrapperStyle,
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
  const preTarget = useRef(target);
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const maskRef = useRef(null);
  const overflowRef = useRef<Array<HTMLElement>>([]);
  const lastFocus = useRef(null);
  const ro = useRef(null);
  const [uuid] = useState((Date.now()).toString(36));
  const { setVisibleOverlayToParent, ...otherContext } = useContext(OverlayContext);
  const childIDMap = useRef<Map<string, HTMLElement>>(new Map());

  const handleOpen = (node: HTMLElement) => {
    setVisibleOverlayToParent(uuid, node);
    onOpen?.(node);
  };
  const handleClose = () => {
    setVisibleOverlayToParent(uuid, null);
    onClose?.();
  }

  const getVisibleOverlayFromChild = (id: string, node: HTMLElement) => {
    if (node) {
      childIDMap.current.set(id, node);
    } else {
      childIDMap.current.delete(id);
    }
    // 让父级也感知
    setVisibleOverlayToParent(id, node);
  }

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
      placement,
      placementOffset,
      beforePosition,
      autoAdjust,
      rtl
    });

    positionStyleRef.current = placements.style;
    setStyle(overlayNode, placements.style);
    typeof onPosition === 'function' && onPosition(placements);
  }

  // 弹窗挂载
  const overlayRefCallback = useCallback((nodeRef) => {
    const node = findDOMNode(nodeRef) as HTMLElement;
    overlayRef.current = node;
    callRef(ref, node);

    if (node !== null && container) {
      const containerNode = getRelativeContainer(getHTMLElement(container));
      containerRef.current = containerNode;

      const targetElement = target === 'viewport'? (hasMask ? maskRef.current : body()) : (getTargetNode(target) || body());
      const targetNode = getHTMLElement(targetElement);
      targetRef.current = targetNode;

      overflowRef.current = getOverflowNodes(targetNode, containerNode);

      // 1. 这里提前先设置好 position 属性，因为有的节点可能会因为设置了 position 属性导致宽度变小
      // 2. 提前设置 top/left -1000 先把弹窗藏起来，以免影响了 container 的高度计算
      setStyle(node, { position: fixed ? 'fixed' : 'absolute', top: -1000, left: -1000 });

      const waitTime = 100;
      ro.current = new ResizeObserver(throttle(updatePosition.bind(this), waitTime));
      ro.current.observe(containerNode);
      ro.current.observe(node);

      forceUpdate({});

      if (autoFocus) {
        // 这里setTimeout是等弹窗位置计算完成再进行 focus，否则弹窗还在页面最低端，会出现突然滚动到页面最下方的情况
        setTimeout(() => {
          const focusableNodes = getFocusNodeList(node);
          if (focusableNodes.length > 0 && focusableNodes[0]) {
            lastFocus.current = document.activeElement;
            focusableNodes[0].focus();
          }
        }, waitTime);
      }

      !cache && handleOpen(node);
    } else {
      !cache && handleClose();
      if (ro.current) {
        ro.current.disconnect();
        ro.current = null;
      }
    }
  }, [container]);

  const clickEvent = (e: OverlayEvent) => {
    // 点击在子元素上面，则忽略。为了兼容 react16，这里用 contains 判断而不利用 e.stopPropagation() 阻止冒泡的特性来处理
    for (let [, oNode] of childIDMap.current.entries()) {
      const node = getHTMLElement(oNode);
      if (node && (node === e.target || node.contains(e.target as Node))) {
        return;
      }
    }

    if (!visible) {
      return;
    }

    // 点击遮罩关闭
    if (hasMask && maskRef.current === e.target) {
      if (canCloseByMask) {
        onRequestClose('maskClick', e); // TODO: will rename to `mask` in 1.0
      }
      return;
    }

    const safeNodeList = Array.isArray(safeNode) ? safeNode : [safeNode];

    // 弹层默认是安全节点
    if (overlayRef.current) {
      safeNodeList.push(() => overlayRef.current);
    }

    // 安全节点不关闭
    for (let i = 0; i < safeNodeList.length; i++) {
      const safeNode = getTargetNode(safeNodeList[i]);
      const node = getHTMLElement(safeNode);

      if (node && (node === e.target || node.contains(e.target as Node))) {
        return;
      }
    }

    if (canCloseByOutSideClick) {
      onRequestClose('docClick', e); // TODO: will rename to `doc` in 1.0
    }
  }

  // 这里用 mousedown 而不是用 click。因为 click 是 mouseup 才触发。
  // 如果用 click 带来的问题: mousedown 在弹窗内部，然后按住鼠标不放拖动到弹窗外触发 mouseup 结果弹窗关了，这是不期望的展示。 https://github.com/alibaba-fusion/next/issues/742
  // react 17 冒泡问题: 
  //  - react17 中，如果弹窗 mousedown 阻止了 e.stopPropagation(), 那么 document 就不会监听到事件，因为事件冒泡到挂载节点 rootElement 就中断了。
  //  - https://reactjs.org/blog/2020/08/10/react-v17-rc.html#changes-to-event-delegation
  useListener(document as unknown as HTMLElement, 'mousedown', clickEvent, false, !!(visible && overlayRef.current && (canCloseByOutSideClick || (hasMask && canCloseByMask))));

  const keydownEvent = (e: OverlayEvent) => {
    if (!visible) {
      return;
    }

    // 无子元素才能 esc 取消关闭
    if (e.keyCode === 27 && canCloseByEsc && !childIDMap.current.size) {
      onRequestClose('esc', e);
    }
  }
  useListener(document as unknown as HTMLElement, 'keydown', keydownEvent, false, !!(visible && overlayRef.current && canCloseByEsc));

  const scrollEvent = (e: OverlayEvent) => {
    if (!visible) {
      return;
    }
    updatePosition();
  }
  useListener(overflowRef.current, 'scroll', scrollEvent as any, false, !!(visible && overlayRef.current && overflowRef.current?.length))

  // 有弹窗情况下在 body 增加 overflow:hidden，两个弹窗同时存在也没问题，会按照堆的方式依次 pop
  useEffect(() => {
    if (visible && disableScroll) {
      const originStyle = document.body.getAttribute('style');
      setStyle(document.body, 'overflow', 'hidden');

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
  }, [visible && disableScroll]);

  // 第一次加载并且 visible=false 的情况不挂载弹窗
  useEffect(() => {
    if (!firstVisible && visible) {
      setFirst(true);
    }
  }, [visible]);

  // cache 情况下的模拟 onOpen/onClose
  const overlayNode = overlayRef.current; // overlayRef.current 可能会异步变化，所以要先接下
  useEffect(() => {
    if (cache && overlayNode) {
      if (visible) {
        updatePosition();
        handleOpen(overlayNode);
      } else {
        handleClose();
      }
    }
  }, [visible, cache && overlayNode]);

  // target 有更新则重新刷新定位
  useEffect(() => {
    if (visible && overlayNode && target && preTarget.current !== target) {
      const targetElement = target === 'viewport'? (hasMask ? maskRef.current : body()) : (getTargetNode(target) || body());
      const targetNode = getHTMLElement(targetElement);
      if (targetNode && targetRef.current !== targetNode) {
        targetRef.current = targetNode;
        updatePosition();
      }
      preTarget.current = target;
    }
  }, [target])

  // autoFocus 弹窗关闭后回到触发点
  useEffect(() => {
    if (!visible && autoFocus && lastFocus.current) {
      lastFocus.current.focus();
      lastFocus.current = null;
    }
  }, [!visible && autoFocus && lastFocus.current]);

  // container 异步加载, 因为 container 很可能还没渲染完成，所以 visible 后这里异步设置下
  useEffect(() => {
    if (visible) {
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

  if (!visible && !cache && isAnimationEnd) {
    return null;
  }

  const newChildren = child ? <RefWrapper ref={overlayRefCallback}>{cloneElement(child, {
    ...others,
    style: { top: 0, left: 0, ...child.props.style, ...positionStyleRef.current }
  })}</RefWrapper> : null;

  const wrapperStyle = { ...owrapperStyle };
  if (cache && !visible && isAnimationEnd) {
    wrapperStyle.display = 'none';
  }

  const maskNode = <div className={maskClassName} style={maskStyle} ref={maskRef}></div>

  const content = (<div className={wrapperClassName} style={wrapperStyle}>
    {hasMask ? (maskRender ? maskRender(maskNode) : maskNode) : null}
    {newChildren}
  </div>);

  return <OverlayContext.Provider
    value={{
      ...otherContext,
      setVisibleOverlayToParent: getVisibleOverlayFromChild,
    }}
  >
    {createPortal(content, container)}
  </OverlayContext.Provider>
});

export default Overlay;