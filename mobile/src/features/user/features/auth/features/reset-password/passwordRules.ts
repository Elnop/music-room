export function newPasswordError(password: string, confirmation: string): string | null {
	if (!password) return 'Le mot de passe est requis';
	if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
	if (!/[A-Z]/u.test(password)) return 'Le mot de passe doit contenir au moins une majuscule';
	if (!/[a-z]/u.test(password)) return 'Le mot de passe doit contenir au moins une minuscule';
	if (!/[0-9]/u.test(password)) return 'Le mot de passe doit contenir au moins un chiffre';
	if (password !== confirmation) return 'Les mots de passe ne correspondent pas';
	return null;
}
