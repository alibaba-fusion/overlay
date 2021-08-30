import { useEffect, useCallback } from 'react'

export function useListener(nodeList: HTMLElement | Array<HTMLElement>, eventName: string, callback: EventListenerOrEventListenerObject, useCapture: boolean, condition: boolean) {
    useEffect(() => {
        if (condition) {
            if (!Array.isArray(nodeList)) {
                nodeList = [nodeList]
            }
            nodeList.forEach(n => {
                n && n.addEventListener && n.addEventListener(eventName, callback, useCapture || false);
            });

            return () => {
                Array.isArray(nodeList) && nodeList.forEach(n => {
                    n && n.removeEventListener && n.removeEventListener(eventName, callback, useCapture || false);
                });
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

export function callRef(ref: any, element: HTMLElement) {
    if (!ref) {
        return;
    }

    if (typeof ref === 'string') {
        throw new Error(`can not set ref string for ${ref}`);
    } else if (typeof ref === 'function') {
        ref(element);
    } else if (Object.prototype.hasOwnProperty.call(ref, 'current')) {
        ref.current = element;
    }
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

/**
 * 获取 position != static 的容器
 * @param container 
 * @returns 
 */
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

/**
 * 获取会滚动的元素
 * @param targetNode 
 * @param targetContainer 
 * @returns 
 */
export const getOverflowNodes = (targetNode: HTMLElement, targetContainer: HTMLElement) => {
    if (typeof document === undefined) {
        return [];
    }

    const overflowNodes: Array<HTMLElement> = [];

    let calcContainer: HTMLElement = targetNode;

    while (true) {
        if (!calcContainer
            || calcContainer === targetContainer
            || calcContainer === document.body
            || calcContainer === document.documentElement) {
            break;
        }

        const overflow = getStyle(calcContainer, 'overflow');
        if (overflow.match(/auto|scroll/)) {
            const { clientWidth, clientHeight, scrollWidth, scrollHeight } = calcContainer;
            if (clientHeight !== scrollHeight || clientWidth !== scrollWidth) {
                // console.log('overflow node is: ', calcContainer )
                overflowNodes.push(calcContainer)
            }
        }

        calcContainer = calcContainer.parentNode as HTMLElement;
    }

    return overflowNodes;
};

export function getStyle(elt: Element, name: string) {
    const style = window.getComputedStyle(elt, null)

    return style.getPropertyValue(name);
}

const PIXEL_PATTERN = /margin|padding|width|height|max|min|offset|size|top|left/i;

export function setStyle(node: HTMLElement, name: string | { [key: string]: unknown } | React.CSSProperties, value?: string) {
    if (!node) {
        return;
    }

    if (typeof name === 'string') {
        if (typeof value === 'number' && PIXEL_PATTERN.test(name)) {
            value = `${value}px`;
        }
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

/**
 * 元素相对于可视区的 left/top
 * @param node 
 * @returns 
 */
export function getViewTopLeft(node: HTMLElement) {
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
