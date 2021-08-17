import { useEffect } from 'react'

export interface onReturn {
    off: Function
}

/**
 * 取消事件绑定
 * @param  {*}   node       DOM节点或任何可以绑定事件的对象
 * @param  {String}   eventName  事件名
 * @param  {Function} callback   回调方法
 * @param  {Boolean}   [useCapture=false] 是否开启事件捕获优先
 */
export function off(node: HTMLElement, eventName: string, callback: EventListenerOrEventListenerObject, useCapture: boolean) {
    /* istanbul ignore else */
    if (node.removeEventListener) {
        node.removeEventListener(eventName, callback, useCapture || false);
    }
}

/**
 * 绑定事件
 * @param  {*}   node       DOM节点或任何可以绑定事件的对象
 * @param  {String}   eventName  事件名
 * @param  {Function} callback   回调方法
 * @param  {Boolean}   useCapture 是否开启事件捕获优先
 * @returns {Object} 返回的object中包含一个off方法，用于取消事件监听
 *
 * @example
 * const handler = events.on(document.body, 'click', e => {
 *     // handle click ...
 * });
 * // 取消事件绑定
 * handler.off();
 */
export function on(node: HTMLElement, eventName: string, callback: EventListenerOrEventListenerObject, useCapture: boolean) {
    /* istanbul ignore else */
    if (node.addEventListener) {
        node.addEventListener(eventName, callback, useCapture || false);
    }

    return {
        off: () => off(node, eventName, callback, useCapture)
    };
}

 
export function useListener(node: HTMLElement, eventName: string, callback: EventListenerOrEventListenerObject, useCapture: boolean, deps?: any[]) { 
  useEffect(() => {
    if (node.addEventListener) {
        node.addEventListener(eventName, callback, useCapture || false);
    }
    return () => {
        node.removeEventListener(eventName, callback, useCapture || false);
    }
  }, deps)
  
  return;
}
