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
	};
}
