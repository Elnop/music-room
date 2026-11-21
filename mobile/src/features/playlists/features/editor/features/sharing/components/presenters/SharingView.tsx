import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SearchBar } from '@/shared/theme/components/SearchBar';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PlaylistSharing } from '@/features/playlists/features/editor/features/sharing/hooks/usePlaylistSharing';
import {
	membersTitle,
	noMembersMessage,
	sharingHeader,
} from '@/features/playlists/features/editor/features/sharing/lib/sharingTexts';
import { MembersSection } from '@/features/playlists/features/editor/features/sharing/components/presenters/MembersSection';
import { OpenPlaylistInfo } from '@/features/playlists/features/editor/features/sharing/components/presenters/OpenPlaylistInfo';
import { SettingRow } from '@/features/playlists/features/editor/features/sharing/components/presenters/SettingRow';
import { createSharingStyles } from '@/features/playlists/features/editor/features/sharing/components/presenters/sharingStyles';
import { UserResults } from '@/features/playlists/features/editor/features/sharing/components/presenters/UserResults';
import { Text } from '@/shared/theme/components/Text';
import GlobeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/globe-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';

export function SharingView({ sharing }: { sharing: PlaylistSharing }) {
	const { styles: shared } = useThemedStyles(createSharingStyles);
	const { styles } = useThemedStyles(createStyles);
	const { mode, isInfoOnly, members, settings, userSearch } = sharing;

	if (members.isLoading) return <LoadingSpinner fullScreen message="Chargement…" />;

	const header = sharingHeader(mode);
	const typed = userSearch.search.text.trim() !== '';

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={[styles.scroll, { paddingBottom: sharing.bottomPadding }]}
			>
				<View style={styles.header}>
					<Text style={styles.title}>{header.title}</Text>
					<Text style={styles.subtitle}>{header.subtitle}</Text>
				</View>

				<View style={styles.content}>
					<View style={styles.settings}>
						<Text style={shared.sectionTitle}>Paramètres</Text>
						<SettingRow
							icon={mode.isPrivate ? LockSolid : GlobeSolid}
							label="Visibilité"
							description={
								mode.isPrivate
									? 'Privée : visible uniquement par les invités'
									: 'Publique : visible par tous'
							}
							value={mode.isPrivate}
							onToggle={settings.toggleVisibility}
							busy={settings.isUpdating}
						/>
						<SettingRow
							icon={mode.isEditRestricted ? PencilSolid : PencilSolid}
							label="Mode de modification"
							description={
								mode.isEditRestricted
									? 'Restreint : seuls les éditeurs peuvent modifier'
									: 'Ouvert : tout le monde peut modifier'
							}
							value={mode.isEditRestricted}
							onToggle={settings.toggleEditMode}
							busy={settings.isUpdating}
						/>
					</View>

					{isInfoOnly ? (
						<OpenPlaylistInfo />
					) : (
						<SearchBar
							value={userSearch.search.text}
							onChangeText={userSearch.search.change}
							placeholder="Rechercher un utilisateur…"
							style={styles.searchBar}
						/>
					)}

					{typed && !isInfoOnly && (
						<UserResults
							results={userSearch.results}
							isSearching={userSearch.isSearching}
							busy={members.busy}
							onAdd={sharing.addUser}
						/>
					)}

					{(!isInfoOnly || members.members.length > 0) && (
						<MembersSection
							title={membersTitle(mode, members.members.length)}
							members={members.members}
							emptyMessage={isInfoOnly ? null : noMembersMessage(mode)}
							onRemove={sharing.removeUser}
						/>
					)}
				</View>
			</ScrollView>
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		container: { flex: 1, backgroundColor: theme.colors.background },
		scroll: { flexGrow: 1 },
		header: {
			padding: theme.spacing.lg,
			borderBottomWidth: theme.borders.medium,
			borderBottomColor: theme.colors.border,
			backgroundColor: theme.colors.surface,
		},
		title: {
			fontSize: theme.typography.sizes.xl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		subtitle: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
		content: { flex: 1, padding: theme.spacing.lg },
		settings: { marginBottom: theme.spacing.lg },
		searchBar: { marginBottom: theme.spacing.md },
	});
}
