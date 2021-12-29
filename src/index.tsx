import InternalOverlay from './overlay';
import Popup from './popup';
import OverlayContext  from './overlay-context';

type InternalOverlayType = typeof InternalOverlay;

interface OverlayInterface extends InternalOverlayType {
  Popup: typeof Popup;
  OverlayContext: typeof OverlayContext;
}

const Overlay = InternalOverlay as OverlayInterface;
Overlay.Popup = Popup;
Overlay.OverlayContext = OverlayContext;

export default Overlay
