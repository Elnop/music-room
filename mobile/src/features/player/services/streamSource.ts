import Hls from 'hls.js';
import type { StreamProtocol } from '@/types/soundcloud.types';
import type { MediaElement } from './mediaElement';

const HLS_MIME = 'application/vnd.apple.mpegurl';

/** A progressive file and, in Safari, an HLS stream play natively; elsewhere hls.js feeds the element, transport only. */
export function attachStream(
	media: MediaElement,
	url: string,
	protocol: StreamProtocol,
	onFatalError: () => void
): () => void {
	if (protocol === 'progressive' || media.canPlayType(HLS_MIME) !== '' || !Hls.isSupported()) {
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
