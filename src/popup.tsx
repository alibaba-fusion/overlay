import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CSSProperties, ReactElement } from 'react';

import Overlay, { OverlayEvent } from './overlay';
import { placementType } from './placement';
import { makeChain, saveRef } from './utils';

type TriggerType = 'click' | 'hover' | 'focus';
export type TriggerTypes = Array<TriggerType>;


export interface PopupProps {
  /**
   * 弹窗内容
   */
  overlay: ReactElement;

  triggerType?: TriggerTypes | TriggerType;
  triggerClickKeycode?: number | Array<number>;
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
  onVisibleChange?: (visible: boolean, e: OverlayEvent) => void;
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
}

const Popup = (props: PopupProps) => {
  const body = () => document.body;
  const {
    overlay,
    triggerType = 'click',
    triggerClickKeycode,
    children,
    defaultVisible,
    className,
    onVisibleChange = () => { },
    container = body,
    style = {},
    placement="bottomLeft",
    onClick,
    onKeyDown,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    delay = 200,
    overlayProps = {},
    safeNode,
    ...others
  } = props;

  const [visible, setVisible] = useState(defaultVisible || props.visible);
  const triggerRef: any = useRef(null);
  const overlayRef: any = useRef(null);
  const mouseLeaveTimer: any = useRef(null);
  const mouseEnterTimer: any = useRef(null);
  const safeNodes = Array.isArray(safeNode) ? safeNode : (typeof safeNode === 'function' ? [safeNode] : []);


  const child: ReactElement | undefined = React.Children.only(children);
  if (typeof (child as any).ref === 'string') {
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
    handleVisibleChange(true, e);
  }

  const handleKeyDown = (e: OverlayEvent) => {
    const keycodes = Array.isArray(triggerClickKeycode) ? triggerClickKeycode : [triggerClickKeycode];
    if (keycodes.includes(e.keyCode)) {
      e.preventDefault();
      e.targetType = 'trigger';
      handleVisibleChange(true, e);
    }
  }

  const handleMouseEnter = (targetType: string) => {
    return (e: OverlayEvent) => {
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
    e.targetType = 'trigger';
    handleVisibleChange(false, e);
  }

  const triggerProps: any = {
    //@ts-ignore
    ref: makeChain(saveRef(triggerRef), saveRef(child.ref))
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
        // hover不允许点击关闭
        safeNodes.push(() => triggerRef.current);
        break;
      case 'focus':
        triggerProps.onFocus = makeChain(handleFocus, onFocus);
        triggerProps.onBlur = makeChain(handleBlur, onBlur);
        // focus不允许点击关闭
        safeNodes.push(() => triggerRef.current);
        break;
    }
  });

  return <>
    {child && React.cloneElement(child, triggerProps)}
    <Overlay
      {...others}
      {...overlayOtherProps}
      //@ts-ignore
      ref={makeChain(saveRef(overlayRef), saveRef(child.ref))}
      placement={placement}
      container={() => container(triggerRef.current)}
      safeNode={safeNodes}
      visible={visible}
      target={() => triggerRef.current}
      onRequestClose={(e) => handleVisibleChange(false, e)}
    >
      {overlay}
    </Overlay>
  </>
};

export default Popup;