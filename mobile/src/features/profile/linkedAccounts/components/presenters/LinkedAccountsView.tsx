import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';
import { ProfileScreenLayout } from '@/features/profile/common/components/presenters/ProfileScreenLayout';
import { LinkedAccountRow } from '@/features/profile/linkedAccounts/components/presenters/LinkedAccountRow';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type {
	GoogleButtonSlot,
	LinkedProvider,
	OAuthProvider,
} from '@/shared/services/linkedAccountsBridge';

type MethodType = LinkedProvider['type'];

interface MethodRow {
	type: MethodType;
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
}

const METHODS: MethodRow[] = [
	{ type: 'password', label: 'Email et mot de passe', icon: 'mail-outline' },
	{ type: 'google', label: 'Google', icon: 'logo-google' },
	{ type: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
];

interface LinkedAccountsViewProps {
	theme: Theme;
	bottomPadding: number;
	isLoading: boolean;
	linkedProviders?: LinkedProvider[];
	pending: OAuthProvider | null;
	onLink: (provider: OAuthProvider) => void;
	onUnlink: (provider: OAuthProvider) => void;
	googleButton?: GoogleButtonSlot;
}

export function LinkedAccountsView({
	bottomPadding,
	isLoading,
	linkedProviders,
	pending,
	onLink,
	onUnlink,
	googleButton,
}: LinkedAccountsViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<ProfileScreenLayout
			subtitle="Choisissez comment vous connecter à Zumik"
			bottomPadding={bottomPadding}
			isLoading={isLoading}
			errorMessage={!linkedProviders ? 'Impossible de charger les comptes liés' : null}
		>
			{linkedProviders && (
				<View style={styles.list}>
					{METHODS.map((method, index) => {
						const linked = linkedProviders.find(p => p.type === method.type);
						return (
							<View key={method.type}>
								{index > 0 && <View style={styles.divider} />}
								<LinkedAccountRow
									method={method}
									linked={linked}
									pending={pending}
									onLink={onLink}
									onUnlink={onUnlink}
									googleButton={method.type === 'google' ? googleButton : undefined}
								/>
							</View>
						);
					})}
				</View>
			)}
		</ProfileScreenLayout>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		list: {
			backgroundColor: theme.colors.surface,
			borderRadius: 16,
			paddingHorizontal: theme.spacing.lg,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
		},
	});
