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

  it('should not call onclose with disabled=true', async () => {
    wrapper = mount(<Popup
      disabled
      triggerType="click"
      overlay={<div style={style} id="content" className="content">Hello World From Popup!</div>}>
      <button>Open</button>
    </Popup>);

    expect(wrapper.find('button').length).toBe(1);
    expect(wrapper.find('.content').length).toBe(0);

    wrapper.find('button').simulate('click');
    wrapper.update();
    expect(wrapper.find('.content').length).toBe(0);
  });

  it('should not call onclose with disabled=true and visible=true', async () => {
    wrapper = mount(<Popup
      disabled
      visible
      triggerType="click"
      overlay={<div style={style} id="content" className="content">Hello World From Popup!</div>}>
      <button>Open</button>
    </Popup>);

    expect(wrapper.find('button').length).toBe(1);
    expect(wrapper.find('.content').length).toBe(1);

    wrapper.find('button').simulate('click');
    wrapper.update();
    expect(wrapper.find('.content').length).toBe(1);
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

  it('should support target without children(trigger)', async () => {
    const Demo = () => {
      const [visible, setVisible] = useState(false);
      const divref = useRef(null);
      return <>
        <Popup 
          target={()=>divref.current}
          visible={visible} 
          overlay={<div style={style} id="content" className="content-nochildren">Hello World From Popup!</div>} 
        />
        <button onClick={()=>setVisible(true)} >target</button>
        <div ref={divref} style={{width: 20, height: 20, marginLeft: 100}}/>
      </>
    }

    const wrapper = mount(<Demo />);

    expect(wrapper.find('.content-nochildren').length).toBe(0);
    expect(wrapper.find('button').length).toBe(1);

    wrapper.find('button').simulate('click');
    wrapper.update();

    expect(wrapper.find('.content-nochildren').length).toBe(1);
  });


  // 测试环境不支持真实的 dom 渲染，所以 placement 计算没有被调用到
  it.skip('should support dynamic triggger DOM', async (done) => {
    const DyncButton = (props) => {
      const [disabled, setDisabled] = useState(false);
    
      useEffect(() => {
        setTimeout(() => {
          act(() => {
            setDisabled(false);
          });
        }, 100);
      }, []);
    
      if (disabled) {
          return <span className="button">
              <button {...props} disabled style={{width: 80, height: 20}}>Disabled button</button>
          </span>
      }
      
      return <button {...props} className="button" style={{width: 80, height: 20}}>Open</button>
    };

    const beforePosition = (result, info) => {
      expect(info.target).toBe(1);
      done()

      return result;
    }

    wrapper = render(<Popup 
      overlay={<div style={style} id="content" className="content">Hello World From Popup!</div>}
      triggerType="click"
      beforePosition={beforePosition}
    >
      <DyncButton />
    </Popup>);
    
    expect(wrapper.find('.content').length).toBe(0);

    wrapper.find('button').simulate('click');
    wrapper.update();
  });
})
