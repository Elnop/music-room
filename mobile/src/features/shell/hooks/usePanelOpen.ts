import { useContext } from 'react';
import { PanelOpenContext } from '@/features/shell/configs/panelOpenContextConfig';

export function usePanelOpen(): boolean {
	return useContext(PanelOpenContext);
}
