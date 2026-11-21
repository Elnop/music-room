import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { ProfileScreenFrame } from '@/features/user/shared/profile-layout/ProfileScreenFrame';
import { LinkedAccountRow } from '@/features/user/features/auth/features/linked-accounts/components/presenters/LinkedAccountRow';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type {
	GoogleButtonSlot,
	LinkedProvider,
	OAuthProvider,
} from '@/features/user/features/auth/types';
import EnvelopeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/envelope-solid.svg';
import FacebookRoundBrand from '@hackernoon/pixel-icon-library/icons/SVG/brands/facebook-round.svg';
import GoogleBrand from '@hackernoon/pixel-icon-library/icons/SVG/brands/google.svg';

type MethodType = LinkedProvider['type'];

interface MethodRow {
	type: MethodType;
	label: string;
	icon: PixelIconSource;
}

const METHODS: MethodRow[] = [
	{ type: 'password', label: 'Email et mot de passe', icon: EnvelopeSolid },
	{ type: 'google', label: 'Google', icon: GoogleBrand },
	{ type: 'facebook', label: 'Facebook', icon: FacebookRoundBrand },
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
		<ProfileScreenFrame
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
		</ProfileScreenFrame>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		list: {
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.lg,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
		},
	});
}
