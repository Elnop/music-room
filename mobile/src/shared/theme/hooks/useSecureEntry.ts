import { useState } from 'react';

export function useSecureEntry() {
	const [hidden, setHidden] = useState(true);
	return { hidden, toggle: () => setHidden((current) => !current) };
}
