import { useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { findDOMNode } from 'react-dom';

export function useListener(
  nodeList: HTMLElement | HTMLElement[],
  eventName: string,
  callback: EventListenerOrEventListenerObject,
  useCapture: boolean,
  condition: boolean
) {
  useEffect(() => {
    if (condition) {
      if (!Array.isArray(nodeList)) {
        nodeList = [nodeList];
      }
      nodeList.forEach((n) => {
        n && n.addEventListener && n.addEventListener(eventName, callback, useCapture || false);
      });

      return () => {
        Array.isArray(nodeList) &&
          nodeList.forEach((n) => {
            n &&
              n.removeEventListener &&
              n.removeEventListener(eventName, callback, useCapture || false);
          });
      };
    }

    return undefined;
  }, [condition]);
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
        // @ts-ignore
        fns[i].apply(this, args);
      }
    }
  };
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
  return (element: any) => {
    if (typeof ref === 'string') {
      throw new Error(`can not set ref string for ${ref}`);
    } else if (typeof ref === 'function') {
      ref(element);
    } else if (Object.prototype.hasOwnProperty.call(ref, 'current')) {
      ref.current = element;
    }
  };
}

/**
 * 获取 position != static ，用来计算相对位置的容器
 * @param container
 * @returns
 */
export const getRelativeContainer = (container: HTMLElement) => {
  if (typeof document === 'undefined') {
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
 * 获取 target 和 container 之间会滚动的元素 (不包含 target、container)
 * 用来监听滚动元素，自动更新弹窗位置
 * @param targetNode
 * @param container
 * @returns
 */
export const getOverflowNodes = (targetNode: HTMLElement, container: HTMLElement) => {
  if (typeof document === 'undefined') {
    return [];
  }

  const overflowNodes: HTMLElement[] = [];

  let calcContainer: HTMLElement = targetNode;

  while (true) {
    // 忽略 body/documentElement, 不算额外滚动元素
    if (
      !calcContainer ||
      calcContainer === container ||
      calcContainer === document.body ||
      calcContainer === document.documentElement
    ) {
      break;
    }

    const overflow = getStyle(calcContainer, 'overflow');
    if (overflow && overflow.match(/auto|scroll/)) {
      const { clientWidth, clientHeight, scrollWidth, scrollHeight } = calcContainer;
      if (clientHeight !== scrollHeight || clientWidth !== scrollWidth) {
        overflowNodes.push(calcContainer);
      }
    }

    calcContainer = calcContainer.parentNode as HTMLElement;
  }

  return overflowNodes;
};

/**
 * 获取 containing block
 * https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
 */
function getContainingBlock(element: HTMLElement): HTMLElement | null {
  function isWebKit(): boolean {
    if (typeof CSS === 'undefined' || !CSS.supports) {
      return false;
    }
    return CSS.supports('-webkit-backdrop-filter', 'none');
  }

  function isContainingBlock(ele: Element) {
    const webkit = isWebKit();
    const css = getComputedStyle(ele);

    return (
      css.transform !== 'none' ||
      css.perspective !== 'none' ||
      (css.containerType ? css.containerType !== 'normal' : false) ||
      (!webkit && (css.backdropFilter ? css.backdropFilter !== 'none' : false)) ||
      (!webkit && (css.filter ? css.filter !== 'none' : false)) ||
      ['transform', 'perspective', 'filter'].some((value) =>
        (css.willChange || '').includes(value)
      ) ||
      ['paint', 'layout', 'strict', 'content'].some((value) => (css.contain || '').includes(value))
    );
  }

  function isLastTraversableElement(ele: Element): boolean {
    return ['html', 'body'].includes(ele.tagName.toLowerCase());
  }

  let currentElement: HTMLElement | null = element.parentElement;

  while (currentElement && !isLastTraversableElement(currentElement)) {
    if (isContainingBlock(currentElement)) {
      return currentElement;
    } else {
      currentElement = currentElement.parentElement;
    }
  }

  return null;
}

/**
 * 获取可视区域，用来计算弹窗应该相对哪个节点做上下左右的位置变化。
 * @param container
 * @returns
 */
export function getViewPort(container: HTMLElement) {
  const isContentClippedElement = (element: HTMLElement) => {
    return getStyle(element, 'overflow') !== 'visible';
  };

  // 若 container 本身就是滚动容器，则直接返回
  if (isContentClippedElement(container)) {
    return container;
  }

  // 若container为 fixed 则代表其跳出父级滚动容器(若有)，使用 containing block 或 浏览器根节点 作为可视区域
  if (getStyle(container, 'position') === 'fixed') {
    return getContainingBlock(container) || document.documentElement;
  }

  // 循环寻找父级滚动容器
  let scroller: HTMLElement = container.parentElement;
  while (scroller) {
    // 若遇到滚动容器则返回
    if (isContentClippedElement(scroller)) {
      return scroller;
    }
    // 继续向上寻找
    scroller = scroller.parentElement;
  }

  // 未找到则使用根节点
  return document.documentElement;
}

export function getStyle(elt: Element, name: string) {
  if (!elt || elt.nodeType !== 1) {
    return null;
  }

  const style = window.getComputedStyle(elt, null);

  return style.getPropertyValue(name);
}

const PIXEL_PATTERN = /margin|padding|width|height|max|min|offset|size|top|left/i;

export function setStyle(
  node: HTMLElement,
  name: string | { [key: string]: unknown } | React.CSSProperties,
  value?: string
) {
  if (!node) {
    return;
  }

  if (typeof name === 'string') {
    if (typeof value === 'number' && PIXEL_PATTERN.test(name)) {
      value = `${value}px`;
    }
    // @ts-ignore
    node.style[name] = value;
  } else if (typeof name === 'object' && arguments.length === 2) {
    // @ts-ignore
    Object.keys(name).forEach((key) => setStyle(node, key, name[key]));
  }
}

// 默认首次调用是立刻执行
export function throttle(func: Function, wait: number) {
  let previous = -wait;
  return function () {
    const now = Date.now();
    const args = arguments;
    if (now - previous > wait) {
      // @ts-ignore
      func.apply(this, args);
      previous = now;
    }
  };
}

export function debounce(func: Function, wait: number) {
  let timeoutID: NodeJS.Timeout;
  return () => {
    const args = arguments;
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      // @ts-ignore
      func.apply(this, args);
    }, wait);
  };
}

/**
 * 元素相对于可视区的 left/top
 * @param node
 * @returns
 */
export function getViewTopLeft(node: HTMLElement) {
  /**
   * document.body 向下滚动后 scrollTop 一直为0，同时 top=-xx 为负数，相当于本身是没有滚动条的，这个逻辑是正确的。
   * document.documentElement 向下滚动后 scrollTop/top 都在变化，会影响计算逻辑，所以这里写死 0
   */
  if (node === document.documentElement) {
    return {
      top: 0,
      left: 0,
    };
  }
  const { left, top } = node.getBoundingClientRect();
  return {
    top,
    left,
  };
}

/**
 * get element size
 * offsetWidth/offsetHeight 更容易获取真实大小，不会受到动画影响优先使用。
 * @param       {Element} element
 * @return      {Object}
 */
export function getWidthHeight(element: HTMLElement) {
  // element like `svg` do not have offsetWidth and offsetHeight prop
  // then getBoundingClientRect
  if ('offsetWidth' in element && 'offsetHeight' in element) {
    return {
      width: element.offsetWidth,
      height: element.offsetHeight,
    };
  } else {
    const { width, height } = (element as HTMLElement).getBoundingClientRect();

    return {
      width,
      height,
    };
  }
}

/**
 * 获取默认的滚动条大小
 * @return {Number} width
 */
export function getScrollbarWidth() {
  const scrollDiv = document.createElement('div');
  scrollDiv.className += 'just-to-get-scrollbar-size';

  setStyle(scrollDiv, {
    position: 'absolute',
    width: '100px',
    height: '100px',
    overflow: 'scroll',
    top: '-9999px',
  });
  document.body && document.body.appendChild(scrollDiv);
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body.removeChild(scrollDiv);

  return scrollbarWidth;
}

/**
 * 元素是否可见
 * @private
 * @param   {Element}  node
 * @return  {Boolean}
 */
function _isVisible(node: HTMLElement) {
  while (node) {
    if (node === document.body || node === document.documentElement) {
      break;
    }
    if (node.style.display === 'none' || node.style.visibility === 'hidden') {
      return false;
    }
    node = node.parentNode as HTMLElement;
  }
  return true;
}

/**
 * 元素是否可以获取焦点
 * @private
 * @param   {Element}  node
 * @return  {Boolean}
 */
function _isFocusable(node: HTMLElement) {
  const nodeName = node.nodeName.toLowerCase();
  const tabIndex = parseInt(node.getAttribute('tabindex'), 10);
  const hasTabIndex = !isNaN(tabIndex) && tabIndex > -1;

  if (_isVisible(node)) {
    if (nodeName === 'input') {
      // @ts-ignore
      return !node.disabled && node.type !== 'hidden';
    } else if (['select', 'textarea', 'button'].indexOf(nodeName) > -1) {
      // @ts-ignore
      return !node.disabled;
    } else if (nodeName === 'a') {
      return node.getAttribute('href') || hasTabIndex;
    } else {
      return hasTabIndex;
    }
  }
  return false;
}

/**
 * 列出能获取焦点的子节点
 * @param  {Element} node 容器节点
 * @return {Array<Element>}
 */
export function getFocusNodeList(node: HTMLElement) {
  const res: any = [];
  const nodeList = node.querySelectorAll('*');

  nodeList.forEach((item: HTMLElement) => {
    if (_isFocusable(item)) {
      const method = item.getAttribute('data-auto-focus') ? 'unshift' : 'push';
      res[method](item);
    }
  });

  if (_isFocusable(node)) {
    res.unshift(node);
  }

  return res;
}

export function getHTMLElement(node: any) {
  if (node) {
    if (node.nodeType) {
      if (node.nodeType === 1) {
        return node;
      } else {
        return document.body;
      }
    } else if (node === window) {
      return document.body;
    } else {
      return findDOMNode(node);
    }
  }
  return node;
}

export function getTargetNode(target: any) {
  if (typeof target === 'function') {
    return target();
  } else if (typeof target === 'string') {
    return document.getElementById(target);
  }

  // 兼容 target = HTMLElement
  return target;
}

export function isSameObject(object1: object, object2: object) {
  if (!object1 || !object2) {
    return false;
  }
  const o1keys = Object.keys(object1);
  const o2keys = Object.keys(object2);
  if (o2keys.length !== o1keys.length) return false;

  for (let i = 0; i <= o1keys.length - 1; i++) {
    const key = o1keys[i];
    if (!o2keys.includes(key)) return false;
    // @ts-ignore
    if (object2[key] !== object1[key]) return false;
  }
  return true;
}

export const useEvent = (handler: Function) => {
  const handleRef = useRef(handler);

  useLayoutEffect(() => {
    handleRef.current = handler;
  });

  return useCallback((...args) => {
    const fn = handleRef.current;

    return fn(...args);
  }, []);
};
