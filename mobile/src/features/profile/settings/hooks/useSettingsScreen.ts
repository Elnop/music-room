import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/features/profile/types';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import { useChangePlan, usePlan } from '@/shared/hooks/usePlan';
import { useTheme } from '@/shared/theme/ThemeContext';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showError } from '@/shared/utils/toast';

export function useSettingsScreen() {
	const { theme } = useTheme();
	const bottomPadding = useBottomPadding();
	const { plan } = usePlan();
	const changePlan = useChangePlan();
	const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

	const handleTogglePremium = (premium: boolean) => {
		changePlan.mutate(premium ? 'premium' : 'free', {
			onError: error => showError(apiErrorMessage(error, "Impossible de changer d'offre")),
		});
	};

	return {
		theme,
		bottomPadding,
		plan,
		isChangingPlan: changePlan.isPending,
		handleTogglePremium,
		openPrivacyPolicy: () => navigation.navigate('PrivacyPolicy'),
	};
}
