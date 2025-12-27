import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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
    console.error('🔴 [ErrorBoundary] Caught error:', {
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
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.error}>{this.state.error?.message || 'Unknown error'}</Text>
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
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
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
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E63946',
    marginBottom: 16,
  },
  error: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  stackContainer: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#282828',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#404040',
  },
  stackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1DB954',
    marginBottom: 8,
  },
  stack: {
    fontSize: 12,
    color: '#B3B3B3',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000000',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
