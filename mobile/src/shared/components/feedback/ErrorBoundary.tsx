import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { logger } from '@/shared/utils/logger';
import { originalTheme } from '@/shared/theme/original.theme';

interface Props {
	children: React.ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<State> {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		logger.error('🔴 [ErrorBoundary] Caught error:', {
			error: error.toString(),
			message: error.message,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
		});

		this.setState({
			error,
			errorInfo,
		});
	}

	handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	render() {
		if (this.state.hasError) {
			return (
				<View style={styles.container}>
					<Text style={styles.title}>Une erreur s'est produite</Text>
					{/* The raw message is English: shown in development only. */}
					<Text style={styles.error}>
						{__DEV__ && this.state.error?.message
							? this.state.error.message
							: 'Une erreur inattendue est survenue.'}
					</Text>
					{__DEV__ && this.state.error?.stack && (
						<View style={styles.stackContainer}>
							<Text style={styles.stackTitle}>Stack Trace:</Text>
							<Text style={styles.stack}>{this.state.error.stack}</Text>
						</View>
					)}
					{__DEV__ && this.state.errorInfo?.componentStack && (
						<View style={styles.stackContainer}>
							<Text style={styles.stackTitle}>Component Stack:</Text>
							<Text style={styles.stack}>{this.state.errorInfo.componentStack}</Text>
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
		fontWeight: 'bold',
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
		borderRadius: 8,
		borderWidth: 2,
		borderColor: originalTheme.colors.borderLight,
	},
	stackTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		color: originalTheme.colors.success,
		marginBottom: 8,
	},
	stack: {
		fontSize: 12,
		color: originalTheme.colors.textSecondary,
		fontFamily: 'monospace',
	},
	button: {
		backgroundColor: originalTheme.colors.primary,
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: originalTheme.colors.shadow,
		marginTop: 16,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: originalTheme.colors.onColor,
	},
});
