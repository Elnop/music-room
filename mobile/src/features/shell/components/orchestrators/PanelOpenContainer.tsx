import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

const PanelOpenContext = createContext(false);

export function PanelOpenContainer({ open, children }: { open: boolean; children: ReactNode }) {
	return <PanelOpenContext.Provider value={open}>{children}</PanelOpenContext.Provider>;
}

export function usePanelOpen(): boolean {
	return useContext(PanelOpenContext);
}
