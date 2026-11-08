import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { logger } from '@/shared/utils/logger';
import { originalTheme } from '@/shared/theme/original.theme';
import { Text } from '@/shared/components/ui/Text';
import { FONT_FAMILIES } from '@/shared/theme/fonts';

interface Props {
	children: React.ReactNode;
}

interface State {
	error: Error | null;
	componentStack: string | null;
}

const NO_ERROR: State = { error: null, componentStack: null };

export class ErrorBoundary extends React.Component<Props, State> {
	state: State = NO_ERROR;

	static getDerivedStateFromError(error: Error): Partial<State> {
		return { error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		logger.error('🔴 [ErrorBoundary] Caught error:', {
			error: error.toString(),
			message: error.message,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
		});
		this.setState({ componentStack: errorInfo.componentStack ?? null });
	}

	handleReset = () => {
		this.setState(NO_ERROR);
	};

	render() {
		const { error, componentStack } = this.state;
		if (error) {
			return (
				<View style={styles.container}>
					<Text style={styles.title}>Une erreur s'est produite</Text>
					{/* The raw message is English: shown in development only. */}
					<Text style={styles.error}>
						{__DEV__ && error.message ? error.message : 'Une erreur inattendue est survenue.'}
					</Text>
					{__DEV__ && error.stack && (
						<View style={styles.stackContainer}>
							<Text style={styles.stackTitle}>Stack Trace:</Text>
							<Text style={styles.stack}>{error.stack}</Text>
						</View>
					)}
					{__DEV__ && componentStack && (
						<View style={styles.stackContainer}>
							<Text style={styles.stackTitle}>Component Stack:</Text>
							<Text style={styles.stack}>{componentStack}</Text>
						</View>
					)}
					<Pressable
						style={styles.button}
						onPress={this.handleReset}
						accessibilityLabel="Réessayer"
					>
						<Text style={styles.buttonText}>Réessayer</Text>
					</Pressable>
				</View>
			);
		}

		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
		backgroundColor: originalTheme.colors.background,
	},
	title: {
		fontSize: 24,
		fontFamily: FONT_FAMILIES.bold,
		color: originalTheme.colors.error,
		marginBottom: 16,
	},
	error: {
		fontSize: 16,
		color: originalTheme.colors.text,
		marginBottom: 16,
		textAlign: 'center',
	},
	stackContainer: {
		width: '100%',
		maxHeight: 300,
		marginBottom: 16,
		padding: 12,
		backgroundColor: originalTheme.colors.surface,
		borderWidth: 2,
		borderColor: originalTheme.colors.borderLight,
	},
	stackTitle: {
		fontSize: 14,
		fontFamily: FONT_FAMILIES.bold,
		color: originalTheme.colors.success,
		marginBottom: 8,
	},
	stack: {
		fontSize: 12,
		color: originalTheme.colors.textSecondary,
		fontFamily: FONT_FAMILIES.mono,
	},
	button: {
		backgroundColor: originalTheme.colors.primary,
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderWidth: 2,
		borderColor: originalTheme.colors.shadow,
		marginTop: 16,
	},
	buttonText: {
		fontSize: 16,
		fontFamily: FONT_FAMILIES.bold,
		color: originalTheme.colors.onColor,
	},
});
