import React, { type ReactNode } from 'react';
import { useFriendListening } from '@/features/playback/features/control-delegation/hooks/useFriendListening';
import type { FriendListeningResult } from '@/features/playback/features/control-delegation/shared/delegation/lib/types';

interface FriendListeningContainerProps {
	userId: string;
	children: (listening: FriendListeningResult) => ReactNode;
}

export function FriendListeningContainer({ userId, children }: FriendListeningContainerProps) {
	const listening = useFriendListening(userId);
	return <>{children(listening)}</>;
}
