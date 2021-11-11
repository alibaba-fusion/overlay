import { createContext } from 'react';

export interface OverlayContextProps {
  getChildrenVisibleState: Function;
}

const OverlayContext = createContext<OverlayContextProps>({
  getChildrenVisibleState: () => {},
});

export default OverlayContext;
