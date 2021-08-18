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

 
export function useListener(node: HTMLElement, eventName: string, callback: EventListenerOrEventListenerObject, useCapture: boolean, condition: boolean) { 
  useEffect(() => {
    const shouldCall = condition && node && node.addEventListener;

    if (shouldCall) {
        node.addEventListener(eventName, callback, useCapture || false);
    }
    return () => {
        if (shouldCall) {
            node.removeEventListener(eventName, callback, useCapture || false);
        }
    }
  }, [condition])
  
  return;
}

/**
 * 将N个方法合并为一个链式调用的方法
 * @return {Function}     合并后的方法
 *
 * @example
 * func.makeChain(this.handleChange, this.props.onChange);
 */
 export function makeChain(...fns: any[]) {
    if (fns.length === 1) {
        return fns[0];
    }

    return (...args: any[]) => {
        for (let i = 0, j = fns.length; i < j; i++) {
            if (fns[i] && fns[i].apply) {
                //@ts-ignore
                fns[i].apply(this, args);
            }
        }
    };
}

function getStyle(elt: Element, name: string) {
    const style = window.getComputedStyle(elt, null)

    return style.getPropertyValue(name);
}


export const getContainer = (container: Element) => {
    if (typeof document === undefined) {
        return container;
    }

    let calcContainer: Element = container;
  
    while (getStyle(calcContainer, 'position') === 'static') {
        if (!calcContainer || calcContainer === document.body) {
            return document.body;
        }
        calcContainer = calcContainer.parentNode as Element;
    }
  
    return calcContainer;
  };