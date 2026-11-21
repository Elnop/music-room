import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useLicenseToggle } from '@/features/playback/features/control-delegation/features/my-devices/hooks/useLicenseToggle';
import { useMyDevicesData } from '@/features/playback/features/control-delegation/features/my-devices/hooks/useMyDevicesData';
import { useRenameDevice } from '@/features/playback/features/control-delegation/features/my-devices/hooks/useRenameDevice';
import { myDevicesModel } from '@/features/playback/features/control-delegation/features/my-devices/lib/myDevicesModel';

export function useMyDevicesScreen() {
	const navigation = useNavigation<NavigationProp<{ FriendsTab: undefined }>>();
	const bottomPadding = useBottomPadding();
	const devicesData = useMyDevicesData();
	const licenses = useLicenseToggle(devicesData.updateLicensed);
	const rename = useRenameDevice(devicesData.load);

	return {
		...myDevicesModel(devicesData.screen, licenses.pending),
		bottomPadding,
		actions: {
			onRefresh: devicesData.onRefresh,
			onToggle: licenses.onToggle,
			onOpenRename: rename.onOpenRename,
			onNavigateFriends: () => navigation.navigate('FriendsTab'),
		},
		rename,
	};
}
