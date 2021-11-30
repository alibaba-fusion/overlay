import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ReactTestUtils, { act } from 'react-dom/test-utils';
import simulateEvent from 'simulate-event';
import { shallow, mount, configure } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
configure({ adapter: new Adapter() });

import Overlay from '../src/index';

const { Popup } = Overlay;
const delay = time => new Promise(resolve => setTimeout(resolve, time));

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
      const node = document.querySelectorAll(selector);
      if (node.length) {
        node.simulate = (eventType) => {
          simulateEvent.simulate(node[0], eventType);
        }
      }
      return node;
    },
    update: () => {},
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

  it('renders', async () => {
    const wrapper = mount(<Overlay
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

  it('should support wrapperStyle & wrapperClassname', async () => {
    const wrapper = mount(<Overlay
      visible
      wrapperClassName="wrapper"
      wrapperStyle={{left: 1}}
    >
      <div style={style} className="content" />
    </Overlay>);

    expect(wrapper.find('.wrapper').length).toBe(1);
    expect(wrapper.find('.wrapper').getDOMNode().style.left).toBe('1px');
  });

  it('should support rendering overlay and mask', async () => {
    wrapper = mount(
      <Overlay
        visible={false}
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
    wrapper.update();

    expect(wrapper.find('.next-overlay-wrapper').length).toBe(1);
    expect(wrapper.find('.content').length).toBe(1);
    expect(wrapper.find('.next-overlay-backdrop').length).toBe(0);

    wrapper.setProps({
      visible: true,
      hasMask: true,
    });
    wrapper.update();
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

  it('should support canCloseByOutSideClick by click button', async () => {
    const handleClose = jest.fn();

    // 需要冒泡环境
    wrapper = render(
      <div>
        <button>click</button>
        <Overlay visible onRequestClose={handleClose}>
          <div className="content" />
        </Overlay>
      </div>);

    wrapper.find('button').simulate('mousedown');
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

  const maskStyle = {
    position: 'fixed',
    zIndex: 1001,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,.2)',
  };

  it('should support canCloseByMask', async () => {
    const handleClose = jest.fn();

    wrapper = render(
    <Overlay visible hasMask canCloseByMask={false} onRequestClose={handleClose} maskClassName="next-overlay-backdrop" maskStyle={maskStyle}>
      <div className="content" />
    </Overlay>);

    await delay(200)
    expect(document.querySelectorAll('.next-overlay-backdrop').length).toBe(1)
    simulateEvent.simulate(document.querySelector('.next-overlay-backdrop'), 'mousedown');
    expect(handleClose).toBeCalledTimes(0);

    wrapper.setProps({
        canCloseByMask: true,
    });
    wrapper.update();

    simulateEvent.simulate(document.querySelector('.next-overlay-backdrop'), 'mousedown');

    wrapper.update();

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

  it('should support autoFocus', async () => {
    wrapper = render(<Overlay autoFocus visible>
      <div className="content" >
        <input id="input" />
      </div>
    </Overlay>);
    await delay(200);

    expect(document.activeElement).toBe(document.querySelector('input'));
    wrapper.setProps({
      visible: false
    });
    await delay(200);

    expect(document.activeElement).toBe(document.body);
  });
  it('should propagate click event to parent DOM', async () => {
    const clickHandler = jest.fn();

    wrapper = render(
        <div id="overlay-container" onClick={clickHandler}>
            <Overlay visible container={'overlay-container'}>
                <div className="content-element" />
            </Overlay>
        </div>
    );

    await delay(20);
    expect(wrapper.find('.content-element').length).toBe(1);

    simulateEvent.simulate(document.querySelector('.content-element'), 'click');

    expect(clickHandler).toBeCalledTimes(1);
  });
});

describe('Popup', () => {
  let wrapper;

  beforeEach(() => {
    const nodeListArr = [].slice.call(document.querySelectorAll('div'));

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
    const wrapper = mount(<Popup overlay={<div style={style} id="content" className="content">Hello World From Popup!</div>}>
      <button>Open</button>
    </Popup>);

    expect(wrapper.find('.content').length).toBe(0);
    expect(wrapper.find('button').length).toBe(1);

    wrapper.setProps({
      visible: true,
    });
    wrapper.update();

    expect(wrapper.find('button').length).toBe(1);
    expect(wrapper.find('.content').length).toBe(1);

    wrapper.setProps({
      visible: false,
    });
    wrapper.update();

    expect(wrapper.find('.content').length).toBe(0);
  });

  it('should support triggerType=click', async () => {
    wrapper = mount(<Popup
      triggerType="click"
      overlay={<div style={style} id="content" className="content">Hello World From Popup!</div>}>
      <button>Open</button>
    </Popup>);

    expect(wrapper.find('button').length).toBe(1);
    expect(wrapper.find('.content').length).toBe(0);

    wrapper.find('button').simulate('click');
    wrapper.update();
    expect(wrapper.find('.content').length).toBe(1);

    act(() => {
      simulateEvent.simulate(document.body, 'mousedown');
    })
    wrapper.update();

    expect(wrapper.find('.content').length).toBe(0);
  });

  it('should support triggerType=focus', async () => {
    wrapper = mount(<Popup
      triggerType="focus"
      overlay={<div style={style} id="content" className="content">Hello World From Popup!</div>}>
      <button>Open</button>
    </Popup>);

    expect(wrapper.find('button').length).toBe(1);
    expect(wrapper.find('.content').length).toBe(0);

    wrapper.find('button').simulate('focus');
    wrapper.update();
    expect(wrapper.find('.content').length).toBe(1);

    wrapper.find('button').simulate('blur');
    wrapper.update();
    expect(wrapper.find('.content').length).toBe(0);
  });

  it('should support triggerType=hover', async () => {
    jest.useFakeTimers();

    wrapper = mount(<Popup
      triggerType="hover"
      overlay={<div style={style} id="content" className="content">Hello World From Popup!</div>}>
      <button>Open</button>
    </Popup>);

    expect(wrapper.find('button').length).toBe(1);
    expect(wrapper.find('.content').length).toBe(0);

    wrapper.find('button').at(0).simulate('mouseenter');
    act(() => {
      jest.runAllTimers();
    });
    wrapper.update();
    expect(wrapper.find('.content').length).toBe(1);

    wrapper.find('button').simulate('mouseleave');
    act(() => {
      jest.runAllTimers();
    });
    wrapper.update();
    expect(wrapper.find('.content').length).toBe(0);
    jest.useRealTimers();
  });

  it('should placement be bottom', async () => {
    const overlay = <div
      className="next-overlay-inner"
      style={{
          width: '200px',
          height: '200px',
          background: 'red',
      }}
    >
      Hello World From Popup!
    </div>;
    wrapper = render(<Popup visible cache overlay={overlay} placement="b" autoAdjust={false}>
      <button style={{width: 10, height: 10}}>click</button>
    </Popup>);

    await delay(100)
    expect(wrapper.find('.next-overlay-inner').length).toBe(1);
    // jest 环境无法精确模拟
    // expect(document.querySelector('.next-overlay-inner').style.left).toBe('10px');
  });

  it('should support Functional component', async () => {
    const ref = jest.fn();

    const FunctionalButton = (props) => <button {...props}>Open</button>;
    const FunctionalOverlay = () => <div style={style} id="content" className="content">Hello World From Popup!</div>;
    const wrapper = mount(<Popup overlay={<FunctionalOverlay/>} ref={ref}>
      <FunctionalButton />
    </Popup>);

    expect(wrapper.find('.content').length).toBe(0);
    expect(wrapper.find('button').length).toBe(1);

    wrapper.find('button').simulate('click');
    wrapper.update();

    expect(wrapper.find('.content').length).toBe(1);
    expect(ref).toBeCalledTimes(1);
  });
})
