import { useEffect, useCallback } from 'react'

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
        if (condition && node && node.addEventListener) {
            node.addEventListener(eventName, callback, useCapture || false);

            return () => {
                node.removeEventListener(eventName, callback, useCapture || false);
            }
        }

        return undefined;
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

    return useCallback((...args: any[]) => {
        for (let i = 0, j = fns.length; i < j; i++) {
            if (fns[i] && fns[i].apply) {
                //@ts-ignore
                fns[i].apply(this, args);
            }
        }
    }, fns);
}

export function saveRef(ref: any) {
    if (!ref) {
        return null;
    }
    return useCallback((element: any) => {
        if (typeof ref === 'string') {
            throw new Error(`can not set ref string for ${ref}`);
        } else if (typeof ref === 'function') {
            ref(element);
        } else if (Object.prototype.hasOwnProperty.call(ref, 'current')) {
            ref.current = element;
        }
    }, [])
}

export const getContainer = (container: HTMLElement) => {
    if (typeof document === undefined) {
        return container;
    }

    let calcContainer: HTMLElement = container;

    while (getStyle(calcContainer, 'position') === 'static') {
        if (!calcContainer || calcContainer === document.documentElement) {
            return document.documentElement;
        }
        calcContainer = calcContainer.parentNode as HTMLElement;
    }

    return calcContainer;
};

export function getStyle(elt: Element, name: string) {
    const style = window.getComputedStyle(elt, null)

    return style.getPropertyValue(name);
}

export function setStyle(node: HTMLElement, name: string | { [key: string]: unknown }, value: string) {
    if (!node) {
        return;
    }

    if (typeof name === 'string') {
        //@ts-ignore
        node.style[name] = value;
    } else if (typeof name === 'object' && arguments.length === 2) {
        //@ts-ignore
        Object.keys(name).forEach(key => setStyle(node, key, name[key]));
    }
}

export function throttle(func: Function, wait: number) {
    let previous = 0;
    return function () {
        let now = Date.now();
        let args = arguments;
        if (now - previous > wait) {
            //@ts-ignore
            func.apply(this, args);
            previous = now;
        }
    }
}

export function debounce(func: Function, wait: number) {
    let timeoutID: NodeJS.Timeout;
    return () => {
        const args = arguments;
        clearTimeout(timeoutID);
        timeoutID = setTimeout(() => {
            //@ts-ignore
            func.apply(this, args);
        }, wait);
    }
}

export function getTopLeft(node: HTMLElement) {
    /**
     * documentElement
     */
    if (node === document.documentElement) {
        return {
            top: 0,
            left: 0
        }
    }
    const { left, top } = node.getBoundingClientRect();
    return {
        top,
        left,
    }
}