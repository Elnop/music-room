import { CONTACT_EMAIL, CONTACT_MAILTO } from '@/shared/constants/links';

export type PolicySpan =
	string | { bold: string } | { code: string } | { link: string; url: string };

type PolicyBlock = { paragraph: PolicySpan[] } | { list: PolicySpan[][] };

interface PolicySection {
	title: string;
	blocks: PolicyBlock[];
}

export const POLICY_UPDATED_AT = 'Dernière mise à jour : 25 octobre 2026';

const contactLink = { link: CONTACT_EMAIL, url: CONTACT_MAILTO };

export const POLICY_INTRO: PolicySpan[] = [
	"Cette politique explique quelles données personnelles l'application mobile Zumik («\u00a0Zumik\u00a0», «\u00a0nous\u00a0») collecte, pourquoi, et ce que vous pouvez y faire. Zumik est un projet étudiant développé à 42 ; il est gratuit, n'affiche aucune publicité et ne vend aucune donnée.",
];

export const POLICY_SECTIONS: PolicySection[] = [
	{
		title: 'Données collectées',
		blocks: [
			{
				list: [
					[
						{ bold: 'Données du compte' },
						" : votre adresse email, votre nom d'utilisateur, votre nom affiché et, si vous en définissez un, un mot de passe (stocké uniquement sous forme de hash).",
					],
					[
						{ bold: 'Données issues de la connexion Google ou Facebook' },
						" : quand vous vous connectez avec Google ou Facebook, nous recevons l'identifiant de votre compte, votre adresse email, votre nom et votre photo de profil. Nous ne demandons aucune autre autorisation et n'accédons jamais à vos contacts, fichiers ou publications.",
					],
					[
						{ bold: "Données de profil que vous choisissez d'ajouter" },
						' : photo de profil, bio, artiste préféré et genres musicaux, avec un réglage de visibilité par champ.',
					],
					[
						{ bold: 'Données sociales et musicales' },
						' : les personnes que vous suivez, vos playlists, les titres que vous ajoutez, votre file de lecture et les autorisations de contrôle de la musique que vous accordez.',
					],
					[
						{ bold: "Données de l'appareil" },
						" : la plateforme, le modèle de l'appareil, la version de l'application et le nom d'appareil que vous choisissez, utilisés pour lister vos appareils et vous permettre de déléguer le contrôle de la musique.",
					],
					[
						{ bold: 'Données de sécurité' },
						' : votre adresse IP et vos tentatives de connexion échouées, conservées temporairement pour limiter le débit des requêtes et protéger les comptes contre les attaques par force brute.',
					],
				],
			},
		],
	},
	{
		title: 'Utilisation',
		blocks: [
			{
				paragraph: [
					"Uniquement pour fournir les fonctionnalités de l'application : créer et sécuriser votre compte, vous connecter, synchroniser les playlists et la lecture entre utilisateurs et appareils, afficher votre profil selon vos réglages de visibilité, et envoyer des emails transactionnels (vérification du compte, réinitialisation du mot de passe). Nous n'utilisons pas vos données pour la publicité, le profilage ou l'analyse d'audience, et nous ne les vendons jamais.",
				],
			},
		],
	},
	{
		title: 'Données utilisateur Google',
		blocks: [
			{
				paragraph: [
					'Zumik utilise Google Sign-In uniquement pour vous authentifier, avec les scopes ',
					{ code: 'openid' },
					', ',
					{ code: 'email' },
					' et ',
					{ code: 'profile' },
					". Les données reçues servent uniquement à créer votre compte Zumik et à vous y connecter ; elles ne sont pas partagées avec des tiers et ne servent à entraîner aucun modèle d'IA. L'utilisation par Zumik des informations reçues des API Google respecte le ",
					{
						link: "Règlement sur les données utilisateur des services d'API Google",
						url: 'https://developers.google.com/terms/api-services-user-data-policy',
					},
					", y compris les exigences d'utilisation limitée (Limited Use).",
				],
			},
		],
	},
	{
		title: 'Qui traite vos données',
		blocks: [
			{
				list: [
					[
						{ bold: 'Supabase' },
						' : base de données, authentification et stockage des photos de profil.',
					],
					[
						{ bold: 'Google et Facebook' },
						' : uniquement si vous choisissez de vous connecter avec eux.',
					],
					[
						{ bold: 'SoundCloud' },
						' : catalogue musical et streaming ; aucune donnée personnelle ne lui est envoyée.',
					],
					[{ bold: 'Gmail' }, ' : envoi des emails transactionnels.'],
				],
			},
			{ paragraph: ['Aucun autre tiers ne reçoit vos données personnelles.'] },
		],
	},
	{
		title: 'Conservation et suppression',
		blocks: [
			{
				paragraph: [
					'Vos données sont conservées tant que votre compte existe. Les compteurs de sécurité (adresses IP, tentatives échouées) expirent automatiquement sous 24 heures ; les journaux du serveur, qui peuvent contenir votre adresse IP, ne sont conservés que pour le dépannage et la sécurité. Pour supprimer votre compte et toutes les données associées, écrivez à ',
					contactLink,
					" depuis l'adresse liée à votre compte ; la suppression est faite sous 30 jours.",
				],
			},
		],
	},
	{
		title: 'Vos droits',
		blocks: [
			{
				paragraph: [
					"En vertu du RGPD, vous pouvez accéder à vos données, les rectifier, les exporter ou les supprimer, et vous opposer à leur traitement ou en demander la limitation. Contactez-nous à l'adresse ci-dessous. Vous pouvez aussi introduire une réclamation auprès de votre autorité de protection des données (en France, la ",
					{ link: 'CNIL', url: 'https://www.cnil.fr' },
					').',
				],
			},
		],
	},
	{
		title: 'Sécurité',
		blocks: [
			{
				paragraph: [
					"Les données sont transmises en HTTPS, les mots de passe sont hashés, et l'accès à la base de données est réservé au backend de Zumik.",
				],
			},
		],
	},
	{
		title: 'Enfants',
		blocks: [
			{
				paragraph: [
					"Zumik ne s'adresse pas aux enfants de moins de 13 ans et ne collecte pas sciemment leurs données.",
				],
			},
		],
	},
	{
		title: 'Modifications',
		blocks: [
			{
				paragraph: [
					'Nous mettrons cette page à jour quand la politique changera, avec une nouvelle date de «\u00a0Dernière mise à jour\u00a0».',
				],
			},
		],
	},
	{ title: 'Contact', blocks: [{ paragraph: [contactLink] }] },
];
