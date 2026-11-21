import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { MembersSection } from '@/features/playlists/features/editor/features/sharing/components/presenters/MembersSection';
import { SettingsSection } from '@/features/playlists/features/editor/features/sharing/components/presenters/SettingsSection';
import { SharingSearch } from '@/features/playlists/features/editor/features/sharing/components/presenters/SharingSearch';
import {
	membersTitle,
	noMembersMessage,
} from '@/features/playlists/features/editor/features/sharing/lib/sharingTexts';
import type { PlaylistSharing } from '@/features/playlists/features/editor/features/sharing/sharingTypes';

type SharingBodyProps = {
	sharing: PlaylistSharing;
};

export function SharingBody({ sharing }: SharingBodyProps) {
	const { styles } = useThemedStyles(createStyles);
	const { mode, isInfoOnly, members } = sharing;

	return (
		<View style={styles.content}>
			<SettingsSection mode={mode} settings={sharing.settings} />
			<SharingSearch sharing={sharing} />
			{(!isInfoOnly || members.members.length > 0) && (
				<MembersSection
					title={membersTitle(mode, members.members.length)}
					members={members.members}
					emptyMessage={isInfoOnly ? null : noMembersMessage(mode)}
					onRemove={sharing.removeUser}
				/>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		content: { flex: 1, padding: theme.spacing.lg },
	});
	return styles;
}
