import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CSSProperties, ReactElement } from 'react';

import Overlay, { OverlayEvent } from './overlay';

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

  placement?: 'topLeft' | 'top' | 'topRight' | 'left' | 'right' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
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
    placement,
    placementOffset,
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
  const triggerRef = useRef(null);
  const mouseTimer = useRef(null);

  useEffect(() => {
    if ('visible' in props) {
      setVisible(props.visible);
    }
  }, [props.visible]);

  const handleVisibleChange = (visible: boolean, e: OverlayEvent) => {
    if (!('visible' in props)) {
      setVisible(visible);
    }

    onVisibleChange(visible, e);
  }

  const handleClick = (e: OverlayEvent) => {
    e.targetType = 'trigger';
    handleVisibleChange(true, e);
    onClick && onClick(e);
  }

  const handleKeyDown = (e: OverlayEvent) => {
    const keycodes = Array.isArray(triggerClickKeycode) ? triggerClickKeycode : [triggerClickKeycode];
    if (keycodes.includes(e.keyCode)) {
      e.preventDefault();
      e.targetType = 'trigger';
      handleVisibleChange(true, e);
    }

    onKeyDown && onKeyDown(e);
  }

  const handleMouseEnter = (callback: Function, targetType: string) => {
    return (e: OverlayEvent) => {
      if (mouseTimer.current) {
        clearTimeout(mouseTimer.current);
        mouseTimer.current = null;
        return;
      }

      e.targetType = targetType;
      handleVisibleChange(true, e);
      typeof callback === 'function' && callback(e);
    }
  }

  const handleMouseLeave = (callback: Function, targetType: string) => {
    return (e: OverlayEvent) => {
      if (!mouseTimer.current) {
        mouseTimer.current = setTimeout(() => {
          e.targetType = targetType;
          handleVisibleChange(false, e);
          mouseTimer.current = null;
        }, delay);
      }
      typeof callback === 'function' && callback(e);
    }
  }

  const handleFocus = (e: OverlayEvent) => {
    e.targetType = 'trigger';
    handleVisibleChange(true, e);
    onFocus && onFocus(e);
  }
  const handleBlur = (e: OverlayEvent) => {
    e.targetType = 'trigger';
    handleVisibleChange(false, e);
    onBlur && onBlur(e);
  }

  const triggerProps: any = {};
  const overlayOtherProps: any = {}

  const triggerTypeList: TriggerTypes = typeof triggerType === 'string' ? [triggerType] : triggerType;

  triggerTypeList.forEach(t => {
    switch (t) {
      case 'click':
        triggerProps.onClick = handleClick;
        triggerProps.onKeyDown = handleKeyDown;
        break;
      case 'hover':
        triggerProps.onMouseEnter = handleMouseEnter(onMouseEnter, 'trigger');
        triggerProps.onMouseLeave = handleMouseLeave(onMouseLeave, 'trigger');
        overlayOtherProps.onMouseEnter = handleMouseEnter(overlayProps.onMouseEnter, 'overlay');
        overlayOtherProps.onMouseLeave = handleMouseLeave(overlayProps.onMouseLeave, 'overlay');
        break;
      case 'focus':
        triggerProps.onFocus = handleFocus;
        triggerProps.onBlur = handleBlur;
        break;
    }
  })

  triggerProps.ref = (ref: any) => {
    triggerRef.current = ref;
    // @ts-ignore
    typeof children.ref === 'function' && children.ref(ref);
  }

  const triggerEl = React.cloneElement(children, triggerProps);

  const getContainer = () => {
    return container(triggerRef.current);
  }

  return <>
    {triggerEl}
    <Overlay
      {...others}
      {...overlayOtherProps}
      container={getContainer}
      safeNode={safeNode}
      visible={visible}
      target={() => triggerRef.current}
      onRequestClose={(e) => handleVisibleChange(false, e)}
    >
      {overlay}
    </Overlay>
  </>
};

export default Popup;