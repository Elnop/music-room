import { useRef } from 'react';
import type { View } from 'react-native';
import { useAnchoredPress } from '@/features/playlists/features/editor/features/detail/hooks/useAnchoredPress';
import type { OwnerActions } from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';
import type { HeaderSheetButton } from '@/features/playlists/features/editor/features/detail/types/detailPageTypes';

export function useHeaderSheetButton(owner: OwnerActions): HeaderSheetButton {
	const buttonRef = useRef<View>(null);
	const onPress = useAnchoredPress(buttonRef, owner.openSheet);
	return { visible: owner.isOwner, buttonRef, onPress };
}
