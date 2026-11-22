import HlsClient, { Events } from 'hls.js';
import type { StreamProtocol } from '@/shared/tracks/types/soundcloudTypes';
import type { MediaElement } from '@/features/playback/types/mediaElementTypes';

const HLS_MIME = 'application/vnd.apple.mpegurl';

export function attachStream(
	media: MediaElement,
	url: string,
	protocol: StreamProtocol,
	onFatalError: () => void,
): () => void {
	if (
		protocol === 'progressive' ||
		media.canPlayType(HLS_MIME) !== '' ||
		!HlsClient.isSupported()
	) {
		media.src = url;
		return () => clearSource(media);
	}
	const hls = new HlsClient();
	hls.on(Events.ERROR, (_event, data) => {
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
