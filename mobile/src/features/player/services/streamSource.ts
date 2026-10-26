import Hls from 'hls.js';
import type { MediaElement } from './mediaElement';

const HLS_MIME = 'application/vnd.apple.mpegurl';

/** Safari plays the HLS stream itself; elsewhere hls.js feeds the element, transport only. */
export function attachStream(
	media: MediaElement,
	url: string,
	onFatalError: () => void
): () => void {
	if (media.canPlayType(HLS_MIME) !== '' || !Hls.isSupported()) {
		media.src = url;
		return () => clearSource(media);
	}
	const hls = new Hls();
	hls.on(Hls.Events.ERROR, (_event, data) => {
		if (data.fatal) onFatalError();
	});
	hls.loadSource(url);
	hls.attachMedia(media);
	return () => {
		hls.destroy();
		clearSource(media);
	};
}

function clearSource(media: MediaElement): void {
	media.removeAttribute('src');
	media.load();
}
