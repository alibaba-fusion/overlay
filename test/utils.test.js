import { getViewPort } from '../src/utils';

function createElement(className, tagName = 'div') {
  const el = document.createElement(tagName);
  el.classList.add(className);
  return el;
}

// polyfill offsetParent
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent
// https://github.com/jsdom/jsdom/issues/1261
Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get() {
    // display none will return null;
    for (let el = this; el; el = el.parentNode) {
      if (el.style?.display?.toLowerCase() === 'none') {
        return null;
      }
    }

    // fixed return null
    if (this.style?.position?.toLowerCase() === 'fixed') {
      return null;
    }

    // html body element return null
    if (this.tagName.toLowerCase() in ['html', 'body']) {
      return null;
    }

    // positioned element
    // https://developer.mozilla.org/en-US/docs/Web/CSS/position
    if (this.style.position && this.style.position.toLowerCase() !== 'static') {
      const isMatch =
        this.style.position.toLowerCase() === 'sticky'
          ? (el) => {
              return el.style?.overflow && el.style.overflow.toLowerCase() !== 'visible';
            }
          : (el) => {
              // containing block 情况这里只模拟transform类型
              if (el.style?.transform && el.style.transform !== 'none') {
                return true;
              }
              return el.style?.position && el.style.position.toLowerCase() !== 'static';
            };
      for (let el = this.parentNode; el; el = el.parentNode) {
        if (isMatch(el)) {
          return el;
        }
      }
      return document.body;
    }

    return this.parentNode;
  },
});

describe('utils', () => {
  describe('getViewport', () => {
    it('normal', () => {
      const box = createElement('box');
      const app = createElement('app');
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(document.documentElement);
    });
    it('when box is clipped', () => {
      const box = createElement('box');
      box.style.overflow = 'auto';
      const app = createElement('app');
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(box);
    });
    it('when parent is clipped', () => {
      const box = createElement('box');
      const app = createElement('app');
      app.style.overflow = 'auto';
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(app);
    });
    it('when ancestor element is clipped', () => {
      const box = createElement('box');
      const parent = createElement('parent');
      const app = createElement('app');
      app.style.overflow = 'auto';
      parent.appendChild(box);
      app.appendChild(parent);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(app);
    });
    it('when box is absoluted', () => {
      const box = createElement('box');
      box.style.position = 'absolute';
      const app = createElement('app');
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(document.documentElement);
    });
    it('when box is absoluted and parent is clipped', () => {
      const box = createElement('box');
      box.style.position = 'absolute';
      const app = createElement('app');
      app.style.overflow = 'auto';
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(document.documentElement);
    });
    it('when box is absoluted and parent is clipped&relative', () => {
      const box = createElement('box');
      box.style.position = 'absolute';
      const app = createElement('app');
      app.style.overflow = 'auto';
      app.style.position = 'relative';
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(app);
    });
    it('when box is absoluted and parent is relative and ancestor is clipped', () => {
      const box = createElement('box');
      box.style.position = 'absolute';
      const parent = createElement('parent');
      parent.style.position = 'relative';
      parent.appendChild(box);
      const app = createElement('app');
      app.style.overflow = 'auto';
      app.appendChild(parent);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(app);
    });
    it('when box is absoluted and parent is clipped&containingBlock', () => {
      const box = createElement('box');
      box.style.position = 'absolute';
      const app = createElement('app');
      app.style.overflow = 'auto';
      app.style.transform = 'translate(1px)';
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(app);
    });
    it('when box is absoluted and parent is containingBlock and ancestor is clipped', () => {
      const box = createElement('box');
      box.style.position = 'absolute';
      const parent = createElement('parent');
      parent.style.transform = 'translate(1px)';
      parent.appendChild(box);
      const app = createElement('app');
      app.style.overflow = 'auto';
      app.appendChild(parent);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(app);
    });

    it('when box is fixed', () => {
      const box = createElement('box');
      box.style.position = 'fixed';
      const app = createElement('app');
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(document.documentElement);
    });

    it('when box is fixed and parent is relative', () => {
      const box = createElement('box');
      box.style.position = 'fixed';
      const app = createElement('app');
      app.style.position = 'relative';
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(document.documentElement);
    });

    it('when box is fixed and parent is clipped', () => {
      const box = createElement('box');
      box.style.position = 'fixed';
      const app = createElement('app');
      app.style.overflow = 'auto';
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(document.documentElement);
    });
    it('when box is fixed and parent is clipped&containingBlock', () => {
      const box = createElement('box');
      box.style.position = 'fixed';
      const app = createElement('app');
      app.style.transform = 'translate(1px)';
      app.style.overflow = 'auto';
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(app);
    });
    it('when box is fixed and parent is containingBlock and ancestor is clipped', () => {
      const box = createElement('box');
      box.style.position = 'fixed';
      const parent = createElement('parent');
      parent.style.transform = 'translate(1px)';
      parent.appendChild(box);
      const app = createElement('app');
      app.style.overflow = 'auto';
      app.appendChild(parent);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(app);
    });
    it('when box is sticky', () => {
      const box = createElement('box');
      box.style.position = 'sticky';
      const app = createElement('app');
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(document.documentElement);
    });
    it('when box is sticky and parent is clipped', () => {
      const box = createElement('box');
      box.style.position = 'sticky';
      const app = createElement('app');
      app.style.overflow = 'auto';
      app.appendChild(box);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(app);
    });
    it('when box is sticky and ancestor is clipped', () => {
      const box = createElement('box');
      box.style.position = 'sticky';
      const parent = createElement('parent');
      parent.appendChild(box);
      const app = createElement('app');
      app.style.overflow = 'auto';
      app.appendChild(parent);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(app);
    });
    it('when box is sticky and parent is containingBlock and ancestor is clipped', () => {
      const box = createElement('box');
      box.style.position = 'sticky';
      const parent = createElement('parent');
      parent.style.transform = 'translate(1px)';
      parent.appendChild(box);
      const app = createElement('app');
      app.style.overflow = 'auto';
      app.appendChild(parent);
      document.body.appendChild(app);
      expect(getViewPort(box)).toBe(app);
    });
  });
});
