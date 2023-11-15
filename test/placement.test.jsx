import getPlacements from '../src/placement';
import { getStyle, getViewPort } from '../src/utils';

function mockElement(object) {
  return {
    ...object,
    getBoundingClientRect: () => object,
    nodeType: 1,
  };
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
  height: 300,
  clientWidth: 1000,
  clientHeight: 300,
  scrollWidth: 1000,
  scrollHeight: 300,
  scrollTop: 0,
  scrollLeft: 0,
  overflow: 'auto',
});
const overlay = mockElement({
  width: 200,
  height: 100,
});

window.getComputedStyle = (node) => {
  return {
    getPropertyValue: (name) => {
      return node[name];
    },
  };
};

function testBy({ target: t, container: c, placement: p, expect: e, adjustExpect: ae }) {
  const { left: eLeft, top: eTop, placement: ePlacement } = e;
  const config = {
    target: mockElement({
      ...target,
      ...t,
    }),
    container: mockElement({ ...container, ...c }),
    overlay,
    placement: p,
    autoAdjust: false,
  };
  const result = getPlacements(config);

  expect(result.style.left).toBe(eLeft);
  expect(result.style.top).toBe(eTop);

  if (ae) {
    const { left: aeLeft, top: aeTop, placement: aePlacement } = ae;
    config.autoAdjust = true;
    const result2 = getPlacements(config);

    expect(result2.config.placement).toBe(aePlacement);
    expect(result2.style.left).toBe(aeLeft);
    expect(result2.style.top).toBe(aeTop);
  }
}

describe('utils', () => {
  it('mock getStyle', () => {
    expect(getStyle(container, 'overflow')).toBe('auto');
  });
  it('mock getViewPort', () => {
    expect(getViewPort(container, 'overflow')).toBe(container);
  });
});

describe('placement', () => {
  it('should support placement=bl', () => {
    testBy({
      placement: 'bl',
      expect: {
        left: target.left,
        top: target.height + target.top,
      },
    });
  });

  it('should support autoAdjust placement=tl -> bl', () => {
    testBy({
      placement: 'tl',
      expect: {
        left: target.left,
        top: target.top - overlay.height,
      },
      adjustExpect: {
        placement: 'bl',
        left: target.left,
        top: target.height + target.top,
      },
    });
  });

  it('should support autoAdjust placement=tr -> bl', () => {
    testBy({
      placement: 'tr',
      expect: {
        left: target.left - overlay.width + target.width,
        top: target.top - overlay.height,
      },
      adjustExpect: {
        placement: 'bl',
        left: target.left,
        top: target.height + target.top,
      },
    });
  });

  it('should support autoAdjust make top/left > 0 placement=t -> b', () => {
    testBy({
      placement: 't',
      expect: {
        left: target.left + target.width / 2 - overlay.width / 2,
        top: target.top - overlay.height,
      },
      adjustExpect: {
        placement: 'bl',
        left: target.left,
        top: target.height + target.top,
      },
    });
  });

  describe('should support autoAdjust when topOut', () => {
    it('t -> b', () => {
      testBy({
        target: { left: 200, top: 0 },
        placement: 't',
        expect: {
          left: 200 + target.width / 2 - overlay.width / 2,
          top: 0 - overlay.height,
        },
        adjustExpect: {
          placement: 'b',
          left: 200 + target.width / 2 - overlay.width / 2,
          top: target.height,
        },
      });
    });
    it('tl -> bl, tr -> br', () => {
      testBy({
        target: { left: 200, top: 10 },
        placement: 'tl',
        expect: {
          left: 200,
          top: 10 - overlay.height,
        },
        adjustExpect: {
          placement: 'bl',
          left: 200,
          top: 10 + target.height,
        },
      });
      testBy({
        target: { left: 200, top: 10 },
        placement: 'tr',
        expect: {
          left: 200 + target.width - overlay.width,
          top: 10 - overlay.height,
        },
        adjustExpect: {
          placement: 'br',
          left: 200 + target.width - overlay.width,
          top: 10 + target.height,
        },
      });
    });
    it('l -> lt, r -> rt', () => {
      testBy({
        target: { left: 200, top: 10 },
        placement: 'l',
        expect: {
          left: 200 - overlay.width,
          top: 10 + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'lt',
          left: 200 - overlay.width,
          top: 10,
        },
      });
      testBy({
        target: { left: 200, top: 10 },
        placement: 'r',
        expect: {
          left: 200 + target.width,
          top: 10 + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'rt',
          left: 200 + target.width,
          top: 10,
        },
      });
    });
    it('lb -> lt, rb -> rt', () => {
      testBy({
        target: { left: 200, top: 10 },
        placement: 'lb',
        expect: {
          left: 200 - overlay.width,
          top: 10 + target.height - overlay.height,
        },
        adjustExpect: {
          placement: 'lt',
          left: 200 - overlay.width,
          top: 10,
        },
      });
      testBy({
        target: { left: 200, top: 10 },
        placement: 'rb',
        expect: {
          left: 200 + target.width,
          top: 10 + target.height - overlay.height,
        },
        adjustExpect: {
          placement: 'rt',
          left: 200 + target.width,
          top: 10,
        },
      });
    });
  });
  describe('should support autoAdjust when rightOut', () => {
    const targetLeft = container.width - target.width;
    const targetTop = 120;
    it('r -> l', () => {
      testBy({
        target: { left: targetLeft, top: targetTop },
        placement: 'r',
        expect: {
          left: targetLeft + target.width,
          top: targetTop + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'l',
          left: targetLeft - overlay.width,
          top: targetTop + target.height / 2 - overlay.height / 2,
        },
      });
    });

    it('rt -> lt, rb -> lb', () => {
      testBy({
        target: { left: targetLeft, top: targetTop },
        placement: 'rt',
        expect: {
          left: targetLeft + target.width,
          top: targetTop,
        },
        adjustExpect: {
          placement: 'lt',
          left: targetLeft - overlay.width,
          top: targetTop,
        },
      });
      testBy({
        target: { left: targetLeft, top: targetTop },
        placement: 'rb',
        expect: {
          left: targetLeft + target.width,
          top: targetTop + target.height - overlay.height,
        },
        adjustExpect: {
          placement: 'lb',
          left: targetLeft - overlay.width,
          top: targetTop + target.height - overlay.height,
        },
      });
    });

    it('t -> tr, b -> br', () => {
      testBy({
        target: { left: targetLeft, top: targetTop },
        placement: 't',
        expect: {
          left: targetLeft + target.width / 2 - overlay.width / 2,
          top: targetTop - overlay.height,
        },
        adjustExpect: {
          placement: 'tr',
          left: targetLeft + target.width - overlay.width,
          top: targetTop - overlay.height,
        },
      });
      testBy({
        target: { left: targetLeft, top: targetTop },
        placement: 'b',
        expect: {
          left: targetLeft + target.width / 2 - overlay.width / 2,
          top: targetTop + target.height,
        },
        adjustExpect: {
          placement: 'br',
          left: targetLeft + target.width - overlay.width,
          top: targetTop + target.height,
        },
      });
    });

    it('tl -> tr, bl -> br', () => {
      testBy({
        target: { left: targetLeft, top: targetTop },
        placement: 'tl',
        expect: {
          left: targetLeft,
          top: targetTop - overlay.height,
        },
        adjustExpect: {
          placement: 'tr',
          left: targetLeft + target.width - overlay.width,
          top: targetTop - overlay.height,
        },
      });
      testBy({
        target: { left: targetLeft, top: targetTop },
        placement: 'bl',
        expect: {
          left: targetLeft,
          top: targetTop + target.height,
        },
        adjustExpect: {
          placement: 'br',
          left: targetLeft + target.width - overlay.width,
          top: targetTop + target.height,
        },
      });
    });
  });
  describe('should support autoAdjust when bottomOut', () => {
    const tLeft = 220;
    const tTop = container.height - target.height;
    it('b -> t', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'b',
        expect: {
          left: tLeft + target.width / 2 - overlay.width / 2,
          top: tTop + target.height,
        },
        adjustExpect: {
          placement: 't',
          left: tLeft + target.width / 2 - overlay.width / 2,
          top: tTop - overlay.height,
        },
      });
    });
    it('bl -> tl, br -> tr', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'bl',
        expect: {
          left: tLeft,
          top: tTop + target.height,
        },
        adjustExpect: {
          placement: 'tl',
          left: tLeft,
          top: tTop - overlay.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'bl',
        expect: {
          left: tLeft,
          top: tTop + target.height,
        },
        adjustExpect: {
          placement: 'tl',
          left: tLeft,
          top: tTop - overlay.height,
        },
      });
    });
    it('l -> lb, r -> rb', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'l',
        expect: {
          left: tLeft - overlay.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'lb',
          left: tLeft - overlay.width,
          top: tTop + target.height - overlay.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'r',
        expect: {
          left: tLeft + target.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'rb',
          left: tLeft + target.width,
          top: tTop + target.height - overlay.height,
        },
      });
    });
    it('lt -> lb, rt -> rb', () => {});
  });
  describe('should support autoAdjust when leftOut', () => {
    const tLeft = 0;
    const tTop = 120;
    it('l -> r', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'l',
        expect: {
          left: tLeft - overlay.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'r',
          left: tLeft + target.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
      });
    });
    it('lt -> rt, lb -> rb', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'lt',
        expect: {
          left: tLeft - overlay.width,
          top: tTop,
        },
        adjustExpect: {
          placement: 'rt',
          left: tLeft + target.width,
          top: tTop,
        },
      });

      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'lb',
        expect: {
          left: tLeft - overlay.width,
          top: tTop + target.height - overlay.height,
        },
        adjustExpect: {
          placement: 'rb',
          left: tLeft + target.width,
          top: tTop + target.height - overlay.height,
        },
      });
    });
    it('t -> tl, b -> bl', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 't',
        expect: {
          left: tLeft + target.width / 2 - overlay.width / 2,
          top: tTop - overlay.height,
        },
        adjustExpect: {
          placement: 'tl',
          left: tLeft,
          top: tTop - overlay.height,
        },
      });

      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'b',
        expect: {
          left: tLeft + target.width / 2 - overlay.width / 2,
          top: tTop + target.height,
        },
        adjustExpect: {
          placement: 'bl',
          left: tLeft,
          top: tTop + target.height,
        },
      });
    });
    it('tr -> tl, br -> bl', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'tr',
        expect: {
          left: tLeft + target.width - overlay.width,
          top: tTop - overlay.height,
        },
        adjustExpect: {
          placement: 'tl',
          left: tLeft,
          top: tTop - overlay.height,
        },
      });

      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'br',
        expect: {
          left: tLeft + target.width - overlay.width,
          top: tTop + target.height,
        },
        adjustExpect: {
          placement: 'bl',
          left: tLeft,
          top: tTop + target.height,
        },
      });
    });
  });
  describe('should support autoAdjust when topOut & leftOut', () => {
    const tLeft = 0;
    const tTop = 0;
    it('t -> bl, tr -> bl, tl -> bl', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 't',
        expect: {
          left: tLeft + target.width / 2 - overlay.width / 2,
          top: tTop - overlay.height,
        },
        adjustExpect: {
          placement: 'bl',
          left: tLeft,
          top: tTop + target.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'tr',
        expect: {
          left: tLeft + target.width - overlay.width,
          top: tTop - overlay.height,
        },
        adjustExpect: {
          placement: 'bl',
          left: tLeft,
          top: tTop + target.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'tl',
        expect: {
          left: tLeft,
          top: tTop - overlay.height,
        },
        adjustExpect: {
          placement: 'bl',
          left: tLeft,
          top: tTop + target.height,
        },
      });
    });
    it('l -> rt, lb -> rt, lt -> rt', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'l',
        expect: {
          left: tLeft - overlay.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'rt',
          left: tLeft + target.width,
          top: tTop,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'lb',
        expect: {
          left: tLeft - overlay.width,
          top: tTop + target.height - overlay.height,
        },
        adjustExpect: {
          placement: 'rt',
          left: tLeft + target.width,
          top: tTop,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'lt',
        expect: {
          left: tLeft - overlay.width,
          top: tTop,
        },
        adjustExpect: {
          placement: 'rt',
          left: tLeft + target.width,
          top: tTop,
        },
      });
    });
  });
  describe('should support autoAdjust when topOut & rightOut', () => {
    const tLeft = container.width - target.width;
    const tTop = 0;
    it('t -> br, tl -> br, tr -> br', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 't',
        expect: {
          left: tLeft + target.width / 2 - overlay.width / 2,
          top: tTop - overlay.height,
        },
        adjustExpect: {
          placement: 'br',
          left: tLeft + target.width - overlay.width,
          top: tTop + target.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'tl',
        expect: {
          left: tLeft,
          top: tTop - overlay.height,
        },
        adjustExpect: {
          placement: 'br',
          left: tLeft + target.width - overlay.width,
          top: tTop + target.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'tr',
        expect: {
          left: tLeft + target.width - overlay.width,
          top: tTop - overlay.height,
        },
        adjustExpect: {
          placement: 'br',
          left: tLeft + target.width - overlay.width,
          top: tTop + target.height,
        },
      });
    });
    it('r -> lt, rb -> lt, rt -> lt', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'r',
        expect: {
          left: tLeft + target.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'lt',
          left: tLeft - overlay.width,
          top: tTop,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'rb',
        expect: {
          left: tLeft + target.width,
          top: tTop + target.height - overlay.height,
        },
        adjustExpect: {
          placement: 'lt',
          left: tLeft - overlay.width,
          top: tTop,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'rt',
        expect: {
          left: tLeft + target.width,
          top: tTop,
        },
        adjustExpect: {
          placement: 'lt',
          left: tLeft - overlay.width,
          top: tTop,
        },
      });
    });
  });
  describe('should support autoAdjust when rightOut & bottomOut', () => {
    const tLeft = container.width - target.width;
    const tTop = container.height - target.height;
    it('r -> lb, rt -> lb, rb -> lb', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'r',
        expect: {
          left: tLeft + target.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'lb',
          left: tLeft - overlay.width,
          top: tTop + target.height - overlay.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'rt',
        expect: {
          left: tLeft + target.width,
          top: tTop,
        },
        adjustExpect: {
          placement: 'lb',
          left: tLeft - overlay.width,
          top: tTop + target.height - overlay.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'rb',
        expect: {
          left: tLeft + target.width,
          top: tTop + target.height - overlay.height,
        },
        adjustExpect: {
          placement: 'lb',
          left: tLeft - overlay.width,
          top: tTop + target.height - overlay.height,
        },
      });
    });
    it('b -> tr, bl -> tr, br -> tr', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'b',
        expect: {
          left: tLeft + target.width / 2 - overlay.width / 2,
          top: tTop + target.height,
        },
        adjustExpect: {
          placement: 'tr',
          left: tLeft + target.width - overlay.width,
          top: tTop - overlay.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'bl',
        expect: {
          left: tLeft,
          top: tTop + target.height,
        },
        adjustExpect: {
          placement: 'tr',
          left: tLeft + target.width - overlay.width,
          top: tTop - overlay.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'br',
        expect: {
          left: tLeft + target.width - overlay.width,
          top: tTop + target.height,
        },
        adjustExpect: {
          placement: 'tr',
          left: tLeft + target.width - overlay.width,
          top: tTop - overlay.height,
        },
      });
    });
  });
  describe('should support autoAdjust when bottomOut & leftOut', () => {
    const tLeft = 0;
    const tTop = container.height - target.height;
    it('l -> rb, lt -> rb, lb -> rb', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'l',
        expect: {
          left: tLeft - overlay.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'rb',
          left: tLeft + target.width,
          top: tTop + target.height - overlay.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'lt',
        expect: {
          left: tLeft - overlay.width,
          top: tTop,
        },
        adjustExpect: {
          placement: 'rb',
          left: tLeft + target.width,
          top: tTop + target.height - overlay.height,
        },
      });
      testBy({
        target: { left: tLeft, top: tTop },
        placement: 'lb',
        expect: {
          left: tLeft - overlay.width,
          top: tTop + target.height - overlay.height,
        },
        adjustExpect: {
          placement: 'rb',
          left: tLeft + target.width,
          top: tTop + target.height - overlay.height,
        },
      });
    });
  });
  describe('should support autoAdjust when topOut & leftOut & rightOut', () => {
    const tLeft = 0;
    const tTop = 0;
    const cWidth = target.width;
    // 若 target 在容器内，则仅在 t 的情况下有可能 左上右 都超出
    it('t -> b', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        container: { width: cWidth, clientWidth: cWidth, scrollWidth: cWidth },
        placement: 't',
        expect: {
          left: tLeft + target.width / 2 - overlay.width / 2,
          top: tTop - overlay.height,
        },
        adjustExpect: {
          placement: 'b',
          left: tLeft + target.width / 2 - overlay.width / 2,
          top: tTop + target.height,
        },
      });
    });
  });
  describe('should support autoAdjust when topOut & rightOut & bottomOut', () => {
    const cHeight = target.height;
    const tLeft = container.width - target.width;
    const tTop = 0;
    // 若 target 在容器内，则仅在 r 的情况下有可能 上右下 都超出
    it('r -> l', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        container: { height: cHeight, clientHeight: cHeight, scrollHeight: cHeight },
        placement: 'r',
        expect: {
          left: tLeft + target.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'l',
          left: tLeft - overlay.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
      });
    });
  });
  describe('should support autoAdjust when rightOut & bottomOut & leftOut', () => {
    const tLeft = 0;
    const tTop = container.height - target.height;
    const cWidth = target.width;
    // 若 target 在容器内，则仅在 b 的情况下有可能 右下左 都超出
    it('b -> t', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        container: { width: cWidth, clientWidth: cWidth, scrollWidth: cWidth },
        placement: 'b',
        expect: {
          left: tLeft + target.width / 2 - overlay.width / 2,
          top: tTop + target.height,
        },
        adjustExpect: {
          placement: 't',
          left: tLeft + target.width / 2 - overlay.width / 2,
          top: tTop - overlay.height,
        },
      });
    });
  });
  describe('should support autoAdjust when bottomOut & leftOut & topOut', () => {
    const cHeight = target.height;
    const tLeft = 0;
    const tTop = 0;
    // 若 target 在容器内，则仅在 l 的情况下有可能 上左下 都超出
    it('l -> r', () => {
      testBy({
        target: { left: tLeft, top: tTop },
        container: { height: cHeight, clientHeight: cHeight, scrollHeight: cHeight },
        placement: 'l',
        expect: {
          left: tLeft - overlay.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
        adjustExpect: {
          placement: 'r',
          left: tLeft + target.width,
          top: tTop + target.height / 2 - overlay.height / 2,
        },
      });
    });
  });
  // 任意placement都不可能四面超出，不做测试
  // describe('should do nothing when topOut & rightOut & bottomOut & leftOut', () => {});
});
