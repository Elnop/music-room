import React from 'react';
import { StyleSheet } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FriendsListState } from '@/features/user/features/friends/features/friends-list/friendsListTypes';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

type FriendsListEmptyProps = {
	friendsList: FriendsListState;
	onGoToSearch: () => void;
};

export function FriendsListEmpty({ friendsList, onGoToSearch }: FriendsListEmptyProps) {
	const { styles } = useThemedStyles(createStyles);

	return friendsList.loadFailed ? (
		<EmptyState
			style={styles.emptyState}
			icon={ExclamationTriangleSolid}
			message="Impossible de charger vos amis"
			action={{ label: 'Réessayer', onPress: friendsList.onRetry }}
		/>
	) : (
		<EmptyState
			style={styles.emptyState}
			icon={UsersSolid}
			message="Aucun ami pour l'instant. Suivez des utilisateurs qui vous suivent en retour pour devenir amis."
			action={{
				label: 'Rechercher des utilisateurs',
				onPress: onGoToSearch,
			}}
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		emptyState: {
			paddingTop: theme.spacing.xxl,
		},
	});
	return styles;
}
