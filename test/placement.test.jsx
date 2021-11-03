import React, { useRef, useState, useEffect } from 'react';
import ReactTestUtils, { act } from 'react-dom/test-utils';

import getPlacements from '../src/placement';
import { getStyle, getViewPort } from '../src/utils';

function mockElement(object) {
  return {
    ...object,
    getBoundingClientRect: () => object,
    nodeType: 1,
  }
}

const target = mockElement({
  width: 20,
  height: 10,
  left: 88,
  top: 88,
});
const container = mockElement({
  left: 0,
  top: 0,
  width: 1000,
  height: 200,
  clientWidth: 1000,
  clientHeight: 200,
  scrollWidth: 1000,
  scrollHeight: 200,
  scrollTop: 0,
  scrollLeft: 0,
  overflow: 'auto'
});
const overlay = mockElement({
  width: 200,
  height: 100,
});

window.getComputedStyle = (node) => {
  return {
    getPropertyValue: (name) => {
      return node[name]
    }
  }
}

describe('utils', () => {
  it('mock getStyle', () => {
    expect(getStyle(container, 'overflow')).toBe('auto');
  });
  it('mock getViewPort', () => {
    expect(getViewPort(container, 'overflow')).toBe(container);
  })
})

describe('placement', () => {
  it('should support placement=bl', () => {
    const config = {
      target,
      container,
      overlay,
      placement: 'bl',
      autoAdjust: false,
    }

    const result = getPlacements(config);

    expect(result.style.left).toBe(target.left);
    expect(result.style.top).toBe(target.height + target.top);
  });

  it('should support autoAdjust placement=tl -> bl', () => {
    const config = {
      target,
      container,
      overlay,
      placement: 'tl',
      autoAdjust: false,
    }

    const result = getPlacements(config);

    expect(result.style.left).toBe(target.left);
    expect(result.style.top).toBe(target.top - overlay.height);

    config.autoAdjust = true;
    const result2 = getPlacements(config);

    expect(result2.style.left).toBe(target.left);
    expect(result2.style.top).toBe(target.height + target.top);
  });

  it('should support autoAdjust  placement=tr -> bl', () => {
    const config = {
      target,
      container,
      overlay,
      placement: 'tr',
      autoAdjust: false,
    }

    const result = getPlacements(config);

    expect(result.style.left).toBe(target.left - overlay.width + target.width);
    expect(result.style.top).toBe(target.top - overlay.height);

    config.autoAdjust = true;
    const result2 = getPlacements(config);

    expect(result2.style.left).toBe(target.left);
    expect(result2.style.top).toBe(target.height + target.top);
  });
  it('should support autoAdjust make top/left > 0 placement=t -> b', () => {
    const config = {
      target,
      container,
      overlay,
      placement: 't',
      autoAdjust: false,
    }

    const result = getPlacements(config);

    expect(result.style.left).toBe(target.left + target.width/2 - overlay.width/2);
    expect(result.style.top).toBe(target.top - overlay.height);

    config.autoAdjust = true;
    const result2 = getPlacements(config);

    expect(result2.style.left).toBe(0);
    expect(result2.style.top).toBe(target.height + target.top);
  });
});
