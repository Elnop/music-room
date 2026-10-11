import { describe, expect, it } from 'vitest';
import { USERNAME_MAX_LENGTH, usernameBase, withSuffix } from '@/features/auth/utils/username.js';

describe('username', () => {
	it('keeps lowercase letters and digits of a name, cut to the maximum length', () => {
		expect(usernameBase('John Doe')).toBe('johndoe');
		expect(usernameBase('AccrobrancheKing lebest')).toBe('accrobranchekinglebe');
	});

	it('cuts the username so a suffix keeps it within the maximum length', () => {
		expect(withSuffix('johndoe', '1')).toBe('johndoe1');
		expect(withSuffix('accrobranchekinglebe', '12')).toBe('accrobranchekingle12');
		expect(withSuffix('accrobranchekinglebe', String(Date.now()))).toHaveLength(
			USERNAME_MAX_LENGTH
		);
	});
});
