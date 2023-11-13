import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { findDOMNode } from 'react-dom';
import type { CSSProperties, ReactElement } from 'react';

import Overlay, { OverlayEvent, RefWrapper } from './overlay';
import { placementType } from './placement';
import { makeChain, saveRef } from './utils';

type TriggerType = 'click' | 'hover' | 'focus';
export type TriggerTypes = TriggerType[];

export interface PopupProps {
  /**
   * 弹窗内容
   */
  overlay: ReactElement;

  triggerType?: TriggerTypes | TriggerType;
  triggerClickKeyCode?: number | number[];
  container?: (ele: Element) => Element;

  placement?: placementType;
  /**
   * 偏离 placement 对其方向像素
   */
  placementOffset?: number;
  /**
   * 是否显示
   */
  defaultVisible?: boolean;
  /**
   * 是否显示
   */
  visible?: boolean;
  /**
   * 弹层显示或隐藏时触发的回调函数
   */
  onVisibleChange?: (visible: boolean, trigger: string, e: OverlayEvent) => void;
  cache?: boolean;
  onOpen?: Function;

  className?: string;
  /**
   * 弹窗内容
   */
  children?: ReactElement;
  style?: CSSProperties;
  delay?: number;
  overlayProps?: any;
  safeNode?: Array<() => Element>;
  beforePosition?: Function;
  onPosition?: Function;
  /**
   * 气泡被遮挡时自动调整位置
   */
  autoAdjust?: boolean;
  /**
   * 滚动超出的时候隐藏
   */
  autoHideScrollOverflow?: boolean;
  followTrigger?: boolean;
  canCloseByEsc?: boolean;
  canCloseByTrigger?: boolean;
  disabled?: boolean;
  /**
   * 和 trigger 互斥使用
   */
  target?: (() => HTMLElement) | string;
}

const Popup = React.forwardRef((props: PopupProps, ref) => {
  const body = () => document.body;
  const {
    overlay,
    triggerType = 'click',
    triggerClickKeyCode,
    children,
    defaultVisible,
    className,
    onVisibleChange = () => {},
    container = body,
    style = {},
    placement = 'bl',
    canCloseByTrigger = true,
    delay = 200,
    overlayProps = {},
    safeNode,
    followTrigger = false,
    target: otarget,
    disabled = false,
    ...others
  } = props;

  const [visible, setVisible] = useState(defaultVisible || props.visible);
  const triggerRef: any = useRef(null);
  const overlayRef: any = useRef(null);
  const mouseLeaveTimer: any = useRef(null);
  const mouseEnterTimer: any = useRef(null);
  const overlayClick = useRef(false);

  const child: ReactElement | undefined = children && React.Children.only(children);
  const overlayChild: ReactElement | undefined = React.Children.only(overlay);

  useEffect(() => {
    if ('visible' in props) {
      setVisible(props.visible);
    }
  }, [props.visible]);

  const handleVisibleChange = (visible: boolean, e: OverlayEvent, triggerType = 'fromTrigger') => {
    if (disabled) {
      return;
    }

    if (!('visible' in props)) {
      if (visible || overlayRef.current) {
        setVisible(visible);
      }
    }

    onVisibleChange(visible, triggerType, e);
  };

  const handleClick = (e: OverlayEvent) => {
    if (visible && !canCloseByTrigger) {
      return;
    }
    handleVisibleChange(!visible, e); // todo: rename to trigger in 1.x
  };

  const handleKeyDown = (e: OverlayEvent) => {
    const keycodes = Array.isArray(triggerClickKeyCode)
      ? triggerClickKeyCode
      : [triggerClickKeyCode];
    if (keycodes.includes(e.keyCode)) {
      handleVisibleChange(!visible, e); // todo: rename to trigger in 1.x
    }
  };

  const handleMouseEnter = (targetType: string) => {
    return (e: OverlayEvent) => {
      if (mouseLeaveTimer.current && visible) {
        clearTimeout(mouseLeaveTimer.current);
        mouseLeaveTimer.current = null;
        return;
      }

      if (!mouseEnterTimer.current && !visible) {
        mouseEnterTimer.current = setTimeout(() => {
          handleVisibleChange(true, e, targetType);
          mouseEnterTimer.current = null;
        }, delay);
      }
    };
  };

  const handleMouseLeave = (targetType: string) => {
    return (e: OverlayEvent) => {
      if (!mouseLeaveTimer.current && visible) {
        mouseLeaveTimer.current = setTimeout(() => {
          handleVisibleChange(false, e, targetType);
          mouseLeaveTimer.current = null;
        }, delay);
      }

      if (mouseEnterTimer.current && !visible) {
        clearTimeout(mouseEnterTimer.current);
        mouseEnterTimer.current = null;
      }
    };
  };

  const handleFocus = (e: OverlayEvent) => {
    handleVisibleChange(true, e);
  };
  const handleBlur = (e: OverlayEvent) => {
    if (overlayClick.current) {
      overlayClick.current = false;
      return;
    }
    handleVisibleChange(false, e);
  };

  // 点击弹窗的时候不能被 onBlur 关闭
  const handleOverlayClick = (e: OverlayEvent) => {
    overlayClick.current = true;
  };

  const handleRequestClose = (targetType: string, e: OverlayEvent) => {
    handleVisibleChange(false, e, targetType);
  };

  const triggerProps: any = {};
  const overlayOtherProps: any = {};
  const safeNodes = Array.isArray(safeNode) ? safeNode : [safeNode];

  if (child && !disabled) {
    const triggerTypeList: TriggerTypes =
      typeof triggerType === 'string' ? [triggerType] : triggerType;
    triggerTypeList.forEach((t) => {
      switch (t) {
        case 'click':
          triggerProps.onClick = makeChain(handleClick, child.props?.onClick);
          triggerProps.onKeyDown = makeChain(handleKeyDown, child.props?.onKeyDown);
          break;
        case 'hover':
          triggerProps.onMouseEnter = makeChain(
            handleMouseEnter('fromTrigger'),
            child.props?.onMouseEnter
          );
          triggerProps.onMouseLeave = makeChain(
            handleMouseLeave('fromTrigger'),
            child.props?.onMouseLeave
          );
          overlayOtherProps.onMouseEnter = makeChain(
            handleMouseEnter('overlay'),
            overlayProps.onMouseEnter
          );
          overlayOtherProps.onMouseLeave = makeChain(
            handleMouseLeave('overlay'),
            overlayProps.onMouseLeave
          );
          break;
        case 'focus':
          triggerProps.onFocus = makeChain(handleFocus, child.props?.onFocus);
          triggerProps.onBlur = makeChain(handleBlur, child.props?.onBlur);
          overlayOtherProps.onMouseDown = makeChain(handleOverlayClick, overlayProps.onMouseDown);
          break;
      }
    });

    // trigger 是安全节点
    safeNodes.push(() => findDOMNode(triggerRef.current) as HTMLElement);
  }

  const target = otarget || (child ? () => findDOMNode(triggerRef.current) : body);
  const getContainer =
    typeof container === 'string'
      ? () => document.getElementById(container)
      : typeof container !== 'function'
        ? () => container
        : () => container(findDOMNode(triggerRef.current) as HTMLElement);
  const overlayContainer = followTrigger
    ? () => findDOMNode(triggerRef.current)?.parentNode
    : getContainer;

  // triggerRef 可能会更新，等计算的时候再通过 findDOMNode 取真实值
  const refWrapperRef = useCallback((ref) => {
    triggerRef.current = ref;
  }, []);
  return (
    <>
      {child && (
        <RefWrapper ref={refWrapperRef}>{React.cloneElement(child, triggerProps)}</RefWrapper>
      )}
      <Overlay
        {...others}
        {...overlayOtherProps}
        placement={placement}
        container={overlayContainer}
        safeNode={safeNodes}
        visible={visible}
        target={target}
        onRequestClose={handleRequestClose}
        ref={useCallback(makeChain(saveRef(overlayRef), saveRef(ref)), [])}
      >
        {overlayChild}
      </Overlay>
    </>
  );
});

export default Popup;
