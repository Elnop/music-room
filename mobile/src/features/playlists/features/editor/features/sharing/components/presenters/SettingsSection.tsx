import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import {
	editModeDescription,
	visibilityDescription,
} from '@/features/playlists/features/editor/features/sharing/lib/settingTexts';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { SettingRow } from '@/features/playlists/features/editor/features/sharing/components/presenters/SettingRow';
import { createSharingStyles } from '@/features/playlists/features/editor/features/sharing/components/presenters/createSharingStyles';
import type {
	SharingMode,
	SharingSettings,
} from '@/features/playlists/features/editor/features/sharing/sharingTypes';
import GlobeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/globe-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';

type SettingsSectionProps = {
	mode: SharingMode;
	settings: SharingSettings;
};

export function SettingsSection({ mode, settings }: SettingsSectionProps) {
	const { styles: shared } = useThemedStyles(createSharingStyles);
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.settings}>
			<Text style={shared.sectionTitle}>Paramètres</Text>
			<SettingRow
				icon={mode.isPrivate ? LockSolid : GlobeSolid}
				label="Visibilité"
				description={visibilityDescription(mode.isPrivate)}
				value={mode.isPrivate}
				onToggle={settings.toggleVisibility}
				busy={settings.isUpdating}
			/>
			<SettingRow
				icon={PencilSolid}
				label="Mode de modification"
				description={editModeDescription(mode.isEditRestricted)}
				value={mode.isEditRestricted}
				onToggle={settings.toggleEditMode}
				busy={settings.isUpdating}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		settings: { marginBottom: theme.spacing.lg },
	});
	return styles;
}
