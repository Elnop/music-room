import React, { createContext, useContext } from 'react';
import { Text as NativeText } from 'react-native';
import { FONT_FAMILIES } from '@/shared/theme/fonts';

const BASE_FONT = { fontFamily: FONT_FAMILIES.regular };

/** A nested Text inherits its parent's family, so only the outermost one sets the base family. */
const NestedTextContext = createContext(false);

export function Text({ style, ...rest }: React.ComponentPropsWithRef<typeof NativeText>) {
	const isNested = useContext(NestedTextContext);
	if (isNested) return <NativeText style={style} {...rest} />;

	return (
		<NestedTextContext.Provider value>
			<NativeText style={[BASE_FONT, style]} {...rest} />
		</NestedTextContext.Provider>
	);
}
