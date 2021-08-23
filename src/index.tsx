import InternalOverlay from './overlay';
import Popup from './popup';

type InternalOverlayType = typeof InternalOverlay;

interface OverlayInterface extends InternalOverlayType {
  Popup: typeof Popup;
}

const Overlay = InternalOverlay as OverlayInterface;
Overlay.Popup = Popup;

export default Overlay
