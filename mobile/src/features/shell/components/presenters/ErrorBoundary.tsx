import React from 'react';
import { logger } from '@/shared/logging/logger';
import { ErrorFallback } from '@/features/shell/components/presenters/ErrorFallback';

type ErrorBoundaryProps = {
	children: React.ReactNode;
};

type ErrorBoundaryState = {
	error: Error | null;
	componentStack: string | null;
};

const NO_ERROR: ErrorBoundaryState = { error: null, componentStack: null };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = NO_ERROR;

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
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
		if (!error) return this.props.children;
		return (
			<ErrorFallback error={error} componentStack={componentStack} onReset={this.handleReset} />
		);
	}
}
