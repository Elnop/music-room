import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export type OAuthProvider = 'google' | 'facebook';

export interface LinkedProvider {
	type: 'password' | OAuthProvider;
	connectedAt: string;
	isPrimary: boolean;
}

interface LinkedAccountsBridge {
	useLinkedProviders: () => UseQueryResult<LinkedProvider[], Error>;
	useLinkProvider: () => UseMutationResult<unknown, Error, OAuthProvider>;
	useUnlinkProvider: () => UseMutationResult<unknown, Error, OAuthProvider>;
}

let bridge: LinkedAccountsBridge | null = null;

export function registerLinkedAccountsBridge(impl: LinkedAccountsBridge): void {
	bridge = impl;
}

export function useLinkedProviders(): UseQueryResult<LinkedProvider[], Error> {
	if (!bridge) {
		throw new Error('LinkedAccountsBridge has not been registered');
	}
	return bridge.useLinkedProviders();
}

export function useLinkProvider(): UseMutationResult<unknown, Error, OAuthProvider> {
	if (!bridge) {
		throw new Error('LinkedAccountsBridge has not been registered');
	}
	return bridge.useLinkProvider();
}

export function useUnlinkProvider(): UseMutationResult<unknown, Error, OAuthProvider> {
	if (!bridge) {
		throw new Error('LinkedAccountsBridge has not been registered');
	}
	return bridge.useUnlinkProvider();
}
