import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/features/user/features/profile/profileTypes';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import type { PlanState } from '@/features/subscription/subscriptionTypes';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError } from '@/shared/theme/lib/toast';

export function useSettingsScreen(subscription: PlanState) {
	const bottomPadding = useBottomPadding();
	const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

	function handleTogglePremium(premium: boolean) {
		subscription.changePlan(premium ? 'premium' : 'free', error =>
			showError(apiErrorMessage(error, "Impossible de changer d'offre"))
		);
	}

	return {
		bottomPadding,
		plan: subscription.plan,
		isChangingPlan: subscription.isChanging,
		handleTogglePremium,
		openPrivacyPolicy: () => navigation.navigate('PrivacyPolicy'),
	};
}
