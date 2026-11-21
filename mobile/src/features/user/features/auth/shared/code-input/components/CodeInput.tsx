import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { CODE_BOX_KEYS } from '@/features/user/features/auth/shared/code-input/codeInputConfig';
import { CodeDigitBox } from '@/features/user/features/auth/shared/code-input/components/CodeDigitBox';
import type {
	CodeBoxOptions,
	CodeInputState,
} from '@/features/user/features/auth/shared/code-input/codeInputTypes';

type CodeInputProps = {
	code: CodeInputState;
	onChangeDigit: (index: number, text: string) => void;
	options: CodeBoxOptions;
};

export function CodeInput({ code, onChangeDigit, options }: CodeInputProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={options.compact ? styles.compactRow : styles.row}>
			{CODE_BOX_KEYS.map((boxKey, index) => (
				<CodeDigitBox
					key={boxKey}
					index={index}
					code={code}
					onChangeDigit={onChangeDigit}
					options={options}
				/>
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: {
			flexDirection: 'row',
			justifyContent: 'center',
			gap: theme.spacing.smd,
			marginBottom: theme.spacing.lg,
		},
		compactRow: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginBottom: theme.spacing.xl,
		},
	});
	return styles;
}
