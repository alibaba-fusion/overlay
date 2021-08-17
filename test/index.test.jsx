import React from 'react';
import { shallow } from 'enzyme';
import Overlay from '../src/index';
import '../src/main.scss';

it('renders', () => {
  const wrapper = shallow(<Overlay />);
  expect(wrapper.find('.Overlay').length).toBe(1);
});
