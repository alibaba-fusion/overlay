import React, { useEffect, useState, useRef, useCallback } from 'react';
import { CSSProperties, ReactElement } from 'react';

import Overlay, { OverlayEvent } from './overlay';
import { alignType } from './placement';
import { makeChain, saveRef } from './utils';

type TriggerType = 'click' | 'hover' | 'focus';
export type TriggerTypes = Array<TriggerType>;


export interface PopupProps {
  /**
   * 弹窗内容
   */
  overlay: ReactElement;

  triggerType?: TriggerTypes | TriggerType;
  triggerClickKeyCode?: number | Array<number>;
  container?: (ele: Element) => Element;

  align?: alignType;
  /**
   * 偏离 align 对其方向像素
   */
  alignOffset?: number;
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
  onVisibleChange?: (visible: boolean, e: OverlayEvent) => void;
  cache?: boolean;
  onOpen?: Function;

  className?: string;
  /**
   * 弹窗内容
   */
  children?: ReactElement;
  style?: CSSProperties;
  onClick?: (e: Event) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onMouseEnter?: (e: Event) => void;
  onMouseLeave?: (e: Event) => void;
  onFocus?: (e: Event) => void;
  onBlur?: (e: Event) => void;
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
    onVisibleChange = () => { },
    container = body,
    style = {},
    align = "bl",
    onClick,
    onKeyDown,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    delay = 200,
    overlayProps = {},
    safeNode,
    followTrigger = false,
    ...others
  } = props;

  const [visible, setVisible] = useState(defaultVisible || props.visible);
  const triggerRef: any = useRef(null);
  const overlayRef: any = useRef(null);
  const mouseLeaveTimer: any = useRef(null);
  const mouseEnterTimer: any = useRef(null);
  const overlayClick = useRef(false);

  const safeNodes = Array.isArray(safeNode) ? safeNode : (typeof safeNode === 'function' ? [safeNode] : []);

  const child: ReactElement | undefined = React.Children.only(children);
  if (typeof (child as any).ref === 'string') {
    throw new Error('Can not set ref by string in Overlay, use function instead.');
  }

  const overlayChild: ReactElement | undefined = React.Children.only(overlay);
  if (typeof (overlayChild as any).ref === 'string') {
    throw new Error('Can not set ref by string in Overlay, use function instead.');
  }

  useEffect(() => {
    if ('visible' in props) {
      setVisible(props.visible);
    }
  }, [props.visible]);

  const handleVisibleChange = (visible: boolean, e: OverlayEvent) => {
    if (!('visible' in props)) {
      if (visible || overlayRef.current) {
        setVisible(visible);
      }
    }

    onVisibleChange(visible, e);
  }

  const handleClick = (e: OverlayEvent) => {
    e.targetType = 'trigger';
    handleVisibleChange(!visible, e);
  }

  const handleKeyDown = (e: OverlayEvent) => {
    const keycodes = Array.isArray(triggerClickKeyCode) ? triggerClickKeyCode : [triggerClickKeyCode];
    if (keycodes.includes(e.keyCode)) {
      e.targetType = 'trigger';
      handleVisibleChange(!visible, e);
    }
  }

  const handleMouseEnter = (targetType: string) => {
    return (e: OverlayEvent) => {
      console.log(/enter/)
      if (mouseLeaveTimer.current && visible) {
        clearTimeout(mouseLeaveTimer.current);
        mouseLeaveTimer.current = null;
        return;
      }

      if (!mouseEnterTimer.current && !visible) {
        mouseEnterTimer.current = setTimeout(() => {
          e.targetType = targetType;
          handleVisibleChange(true, e);
          mouseEnterTimer.current = null;
        }, delay);
      }
    }
  }

  const handleMouseLeave = (targetType: string) => {
    return (e: OverlayEvent) => {
      console.log(/out/)
      if (!mouseLeaveTimer.current && visible) {
        mouseLeaveTimer.current = setTimeout(() => {
          e.targetType = targetType;
          handleVisibleChange(false, e);
          mouseLeaveTimer.current = null;
        }, delay);
      }

      if (mouseEnterTimer.current && !visible) {
        clearTimeout(mouseEnterTimer.current);
        mouseEnterTimer.current = null;
      }
    }
  }

  const handleFocus = (e: OverlayEvent) => {
    e.targetType = 'trigger';
    handleVisibleChange(true, e);
  }
  const handleBlur = (e: OverlayEvent) => {
    if (overlayClick.current) {
      overlayClick.current = false;
      return;
    }
    e.targetType = 'trigger';
    handleVisibleChange(false, e);
  }

  // 点击弹窗的时候不能被 onBlur 关闭
  const handleOverlayClick = (e: OverlayEvent) => {
    overlayClick.current = true;
  }

  const triggerProps: any = {
    ref: useCallback(makeChain(saveRef(triggerRef), saveRef((child as any).ref)), [])
  };
  const overlayOtherProps: any = {}

  const triggerTypeList: TriggerTypes = typeof triggerType === 'string' ? [triggerType] : triggerType;
  triggerTypeList.forEach(t => {
    switch (t) {
      case 'click':
        triggerProps.onClick = makeChain(handleClick, onClick);
        triggerProps.onKeyDown = makeChain(handleKeyDown, onKeyDown);
        break;
      case 'hover':
        triggerProps.onMouseEnter = makeChain(handleMouseEnter('trigger'), onMouseEnter);
        triggerProps.onMouseLeave = makeChain(handleMouseLeave('trigger'), onMouseLeave);
        overlayOtherProps.onMouseEnter = makeChain(handleMouseEnter('overlay'), overlayProps.onMouseEnter);
        overlayOtherProps.onMouseLeave = makeChain(handleMouseLeave('overlay'), overlayProps.onMouseLeave);
        break;
      case 'focus':
        triggerProps.onFocus = makeChain(handleFocus, onFocus);
        triggerProps.onBlur = makeChain(handleBlur, onBlur);
        overlayOtherProps.onMouseDown = makeChain(handleOverlayClick, overlayProps.onMouseDown);
        break;
    }
  });
  safeNodes.push(() => triggerRef.current);

  const newOverlay = React.cloneElement(overlayChild, {
    ref: useCallback(makeChain(saveRef(overlayRef), saveRef(ref), saveRef((overlayChild as any).ref)), [])
  });

  const handleRequestClose = (e: OverlayEvent) => {
    handleVisibleChange(false, e);
  }

  const getContainer = typeof container === 'string' ? () => document.getElementById(container) :
    typeof container !== 'function' ? () => container : () => container(triggerRef.current);


  return <>
    {child && React.cloneElement(child, triggerProps)}
    <Overlay
      {...others}
      {...overlayOtherProps}
      align={align}
      container={followTrigger ? () => triggerRef.current && triggerRef.current.parentNode : getContainer}
      safeNode={safeNodes}
      visible={visible}
      target={() => triggerRef.current}
      onRequestClose={handleRequestClose}
    >
      {newOverlay}
    </Overlay>
  </>
});

export default Popup;