import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NameWithHandle } from '@/shared/theme/components/NameWithHandle';

type SidebarAccountNameProps = {
	name: string;
	username: string;
};

export function SidebarAccountName({ name, username }: SidebarAccountNameProps) {
	return (
		<View style={styles.info}>
			<NameWithHandle name={name} username={username} size="medium" />
		</View>
	);
}

const styles = StyleSheet.create({
	info: {
		flex: 1,
		minWidth: 0,
	},
});
