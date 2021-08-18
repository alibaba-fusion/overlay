import InternalOverlay from './overlay';
import Popup from './popup';

// export { pointsType } from './placement';

type InternalOverlayType = typeof InternalOverlay;

interface OverlayInterface extends InternalOverlayType {
  Popup: typeof Popup;
}

const Overlay = InternalOverlay as OverlayInterface;
Overlay.Popup = Popup;

export default Overlay
