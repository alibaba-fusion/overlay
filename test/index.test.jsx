import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils, { act } from 'react-dom/test-utils';
import simulateEvent from 'simulate-event';
import { shallow, mount, configure } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
configure({ adapter: new Adapter() });

import Overlay from '../src/index';
const { Popup } = Overlay;

const style = {
  width: 200,
  height: 200,
  background: '#999',
  borderRadius: 2,
  boxShadow: '0 3px 6px -4px #0000001f, 0 6px 16px #00000014, 0 9px 28px 8px #0000000d'
};

const render = element => {
  let inc;
  const container = document.createElement('div');
  container.className = 'container';
  document.body.appendChild(container);
  ReactDOM.render(element, container, function () {
    inc = this;
  });
  return {
    setProps: props => {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
        ReactDOM.render(React.cloneElement(element, props), container);
      })
    },
    unmount: () => {
      ReactDOM.unmountComponentAtNode(container);
      document.body.removeChild(container);
    },
    instance: () => {
      return inc;
    },
    find: selector => {
      return container.querySelectorAll(selector);;
    },
  };
};

describe('Overlay', () => {
  let wrapper;

  beforeEach(() => {
    const nodeListArr = [].slice.call(document.querySelectorAll('.next-overlay-wrapper'));

    nodeListArr.forEach(node => {
      node.parentNode.removeChild(node);
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
  });

  it('renders', () => {
    const wrapper = shallow(<Overlay
      visible
      points={['lt', 'tr']}
    >
      <div style={style} className="content" />
    </Overlay>);

    expect(wrapper.find('.content').length).toBe(1);

    wrapper.setProps({
      visible: false,
    });
    expect(wrapper.find('.content').length).toBe(0);

    wrapper.setProps({
      visible: true,
    });
    expect(wrapper.find('.content').length).toBe(1);
  });

  it('should support rendering overlay and mask', () => {
    wrapper = shallow(
      <Overlay
        wrapperClassName="next-overlay-wrapper"
        maskClassName="next-overlay-backdrop"
      >
        <div className="content" />
      </Overlay>
    );
    expect(wrapper.find('.next-overlay-wrapper').length).toBe(0);

    wrapper.setProps({
      visible: true,
    });
    expect(wrapper.find('.next-overlay-wrapper').length).toBe(1);
    expect(wrapper.find('.content').length).toBe(1);
    expect(wrapper.find('.next-overlay-backdrop').length).toBe(0);

    wrapper.setProps({
      visible: true,
      hasMask: true,
    });
    expect(wrapper.find('.next-overlay-wrapper').length).toBe(1);
    expect(wrapper.find('.content').length).toBe(1);
    expect(wrapper.find('.next-overlay-backdrop').length).toBe(1);
  });

  it('should support canCloseByOutSideClick', () => {
    const handleClose = jest.fn();

    wrapper = mount(<Overlay visible hasMask={false} canCloseByOutSideClick onRequestClose={handleClose}>
      <div className="content" />
    </Overlay>);

    expect(wrapper.find('.content').length).toBe(1);
    simulateEvent.simulate(document.body, 'mousedown', { target: document.body });
    expect(handleClose).toBeCalledTimes(1);
  });

  it('should support canCloseByOutSideClick by click button', () => {
    const handleClose = jest.fn();

    wrapper = render(
      <div>
        <button>click</button>
        <Overlay visible onRequestClose={handleClose}>
          <div className="content" />
        </Overlay>
      </div>);

    simulateEvent.simulate(document.querySelector('button'), 'mousedown');
    expect(handleClose).toBeCalledTimes(1);
  });

  it('should support safeNode && canCloseByOutSideClick', () => {
    const handleClose = jest.fn();
    const ref = React.createRef();

    wrapper = render(
      <div>
        <button ref={ref}>click</button>
        <Overlay visible safeNode={() => ref.current} onRequestClose={handleClose}>
          <div className="content" />
        </Overlay>
      </div>);

    simulateEvent.simulate(document.querySelector('button'), 'mousedown');
    expect(handleClose).toBeCalledTimes(0);
  });

  it('should support canCloseByEsc', () => {
    const handleClose = jest.fn();

    wrapper = mount(<Overlay visible canCloseByEsc={false} onRequestClose={handleClose}>
      <div className="content" />
    </Overlay>);

    expect(wrapper.find('.content').length).toBe(1);
    simulateEvent.simulate(document.body, 'keydown', { keyCode: 27 });
    expect(handleClose).toBeCalledTimes(0);

    wrapper.setProps({
      canCloseByEsc: true,
    });
    simulateEvent.simulate(document.body, 'keydown', { keyCode: 27 });
    expect(handleClose).toBeCalledTimes(1);
  });

  it('should support cache', () => {
    wrapper = mount(<Overlay visible cache>
      <div className="content" />
    </Overlay>);

    expect(wrapper.find('.content').length).toBe(1);
    wrapper.setProps({
      visible: false,
    });
    expect(wrapper.find('.content').length).toBe(1);
  });

  it('should support onOpen & onClose', () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();

    wrapper = mount(<Overlay visible onOpen={onOpen} onClose={onClose}>
      <div className="content" />
    </Overlay>);

    expect(wrapper.find('.content').length).toBe(1);

    expect(onOpen).toBeCalledTimes(1);
    expect(onClose).toBeCalledTimes(0);

    wrapper.setProps({
      visible: false,
    });
    expect(onClose).toBeCalledTimes(1);
  });

  it('should support onOpen & onClose with cache', () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();

    wrapper = mount(<Overlay visible cache onOpen={onOpen} onClose={onClose}>
      <div className="content" />
    </Overlay>);

    expect(wrapper.find('.content').length).toBe(1);

    expect(onOpen).toBeCalledTimes(1);
    expect(onClose).toBeCalledTimes(0);

    wrapper.setProps({
      visible: false,
    });
    expect(onClose).toBeCalledTimes(1);
  });

  it('should support autoFocus', () => {
    wrapper = mount(<Overlay autoFocus visible>
      <div className="content" >
        <input id="input" />
      </div>
    </Overlay>);
    expect(document.activeElement).toBe(document.querySelector('input'));
    wrapper.setProps({
      visible: false
    });
    expect(document.activeElement).toBe(document.body);
  });
});

const delay = time => new Promise(resolve => setTimeout(resolve, time));

describe('Popup', () => {
  let wrapper;

  beforeEach(() => {
    const nodeListArr = [].slice.call(document.querySelectorAll('.next-overlay-wrapper'));

    nodeListArr.forEach(node => {
      node.parentNode.removeChild(node);
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
  });

  it('renders', async () => {
    wrapper = render(<Popup overlay={<div style={style} id="content" className="content">Hello World From Popup!</div>}>
      <button>Open</button>
    </Popup>);

    expect(document.querySelectorAll('.content').length).toBe(0);
    expect(document.querySelectorAll('button').length).toBe(1);

    wrapper.setProps({
      visible: true,
    });

    expect(wrapper.find('button').length).toBe(1);
    expect(document.querySelectorAll('.content').length).toBe(1);

    wrapper.setProps({
      visible: false,
    });
    expect(document.querySelectorAll('.content').length).toBe(0);
  });

  it('should support triggerType=click', async () => {
    wrapper = render(<Popup
      triggerType="click"
      overlay={<div style={style} id="content" className="content">Hello World From Popup!</div>}>
      <button>Open</button>
    </Popup>);

    expect(document.querySelectorAll('button').length).toBe(1);
    expect(document.querySelectorAll('.content').length).toBe(0);

    simulateEvent.simulate(document.querySelector('button'), 'click');
    expect(document.querySelectorAll('.content').length).toBe(1);

    act(() => {
      simulateEvent.simulate(document.body, 'mousedown');
    })
    expect(document.querySelectorAll('.content').length).toBe(0);
  });

  it('should support triggerType=hover', async () => {
    wrapper = render(<Popup
      triggerType="hover"
      overlay={<div style={style} id="content" className="content">Hello World From Popup!</div>}>
      <button>Open</button>
    </Popup>);

    expect(document.querySelectorAll('button').length).toBe(1);
    expect(document.querySelectorAll('.content').length).toBe(0);

    simulateEvent.simulate(document.querySelector('button'), 'mouseover');
    await delay(220);
    expect(document.querySelectorAll('.content').length).toBe(1);

    simulateEvent.simulate(document.querySelector('button'), 'mouseout');
    await delay(220);
    expect(document.querySelectorAll('.content').length).toBe(0);
  });
})