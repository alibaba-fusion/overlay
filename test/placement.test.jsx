import React, { useRef, useState, useEffect } from 'react';
import ReactTestUtils, { act } from 'react-dom/test-utils';

import getPlacements from '../src/placement';

function mockElement(object) {
  return {
    ...object,
    getBoundingClientRect: () => object,
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
  height: 1000,
  scrollWidth: 1000,
  scrollHeight: 1000,
  scrollTop: 0,
  scrollLeft: 0
});
const overlay = mockElement({
  width: 100,
  height: 100,
});

describe('placement', () => {

  it('should support placement=bl', async () => {
    const config = {
      target,
      container,
      overlay,
      placement: 'bl',
      autoAdjust: false,
    }

    const result = getPlacements(config);

    expect(result.style.left).toBe(88);
    expect(result.style.top).toBe(10 + 88);
  });

  it('should support placement=tl', async () => {
    const config = {
      target,
      container,
      overlay,
      placement: 'tl',
      autoAdjust: false,
    }

    const result = getPlacements(config);

    expect(result.style.left).toBe(88);
    expect(result.style.top).toBe(88 - 100);
  });
});
