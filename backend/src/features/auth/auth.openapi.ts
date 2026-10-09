import { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI paths for Authentication feature
 */
export const authPaths: OpenAPIV3.PathsObject = {
	'/api/auth/register': {
		post: {
			tags: ['Authentication'],
			summary: 'Register new user with email/password',
			description: `
        Creates new user account.

        **Validation rules:**
        - Email must be valid and unique
        - Password minimum 8 characters with uppercase, lowercase, and number
        - Username 3-20 characters, alphanumeric and underscores only
        - Display name optional, max 50 characters

        **Rate limit:** 3 requests per hour per IP
      `,
			operationId: 'registerUser',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/RegisterRequest' },
						example: {
							email: 'user@example.com',
							password: 'SecurePass123',
							username: 'johndoe',
							displayName: 'John Doe',
						},
					},
				},
			},
			responses: {
				'201': {
					description: 'User registered successfully',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/AuthResponse' },
						},
					},
				},
				'400': { $ref: '#/components/responses/ValidationError' },
				'409': {
					description: 'Email or username already exists',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: {
									message: 'Email already registered',
									code: 'CONFLICT',
								},
								meta: {
									timestamp: '2025-01-15T10:30:00.000Z',
								},
							},
						},
					},
				},
				'429': { $ref: '#/components/responses/RateLimitError' },
				'503': { $ref: '#/components/responses/RateLimitUnavailable' },
			},
		},
	},

	'/api/auth/login': {
		post: {
			tags: ['Authentication'],
			summary: 'Login with email and password',
			description: `
        Authenticate user and receive JWT tokens.

        **Security:**
        - Account locked after 5 failed attempts (15min lockout)
        - Rate limited: 5 attempts per 15 minutes per IP
        - IP blacklist for persistent abuse

        **Response includes:**
        - Access token (expires in 1 hour)
        - Refresh token (expires in 7 days)
      `,
			operationId: 'loginUser',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/LoginRequest' },
						example: {
							email: 'user@example.com',
							password: 'SecurePass123',
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Login successful',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/AuthResponse' },
						},
					},
				},
				'401': {
					description: 'Invalid email or password',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
				'423': {
					description: 'Account locked due to failed attempts',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: {
									message: 'Account temporarily locked',
									code: 'ACCOUNT_LOCKED',
									details: { lockoutEndsAt: '2025-01-15T11:00:00Z' },
								},
							},
						},
					},
				},
				'429': { $ref: '#/components/responses/RateLimitError' },
				'503': { $ref: '#/components/responses/RateLimitUnavailable' },
			},
		},
	},

	'/api/auth/refresh': {
		post: {
			tags: ['Authentication'],
			summary: 'Refresh access token',
			description: 'Exchange refresh token for new access token when expired (after 1h)',
			operationId: 'refreshToken',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
						example: {
							refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'New access token generated',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/AuthResponse' },
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'503': { $ref: '#/components/responses/RateLimitUnavailable' },
			},
		},
	},

	'/api/auth/me': {
		get: {
			tags: ['Authentication'],
			summary: 'Get current authenticated user profile',
			operationId: 'getCurrentUser',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'User profile retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: { $ref: '#/components/schemas/UserProfile' },
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'503': { $ref: '#/components/responses/RateLimitUnavailable' },
			},
		},
	},

	'/api/auth/logout': {
		post: {
			tags: ['Authentication'],
			summary: 'Logout current user',
			description:
				"Ends the session the bearer token belongs to. The access token goes to a Redis denylist until it expires, so every authenticated route then answers 401 TOKEN_REVOKED for it. The Supabase session is revoked (scope local), so its refresh token can no longer mint tokens; the user's other sessions stay signed in.",
			operationId: 'logoutUser',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'Logout successful',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													message: { type: 'string', example: 'Logout successful' },
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'500': {
					description:
						'LOGOUT_FAILED: the access token was revoked, but the Supabase session could not be ended; the refresh token may still work',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
				'503': {
					description:
						'Redis is not ready. REVOCATION_UNAVAILABLE: the token cannot be revoked or checked. RATE_LIMIT_UNAVAILABLE: the global auth rate limiter cannot count the request',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
			},
		},
	},

	'/api/auth/google': {
		post: {
			tags: ['Authentication', 'OAuth'],
			summary: 'Login with Google account',
			description: `
        Authenticate using Google ID token (OAuth 2.0).

        **Flow:**
        1. Client obtains Google ID token via Google Sign-In SDK
        2. Send ID token to this endpoint
        3. Backend verifies with Google APIs
        4. Returns Zumik session tokens

        **Behavior:**
        - Existing user → Login
        - New user → Create account and login
        - Email required (Google provides verified email)

        **Rate limit:** 10 requests per 15 minutes per IP
      `,
			operationId: 'googleLogin',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/GoogleLoginRequest' },
						example: {
							idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU5NmI...',
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Login successful (existing account)',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/AuthResponse' },
						},
					},
				},
				'201': {
					description: 'Account created and logged in',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/AuthResponse' },
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'429': { $ref: '#/components/responses/RateLimitError' },
				'503': { $ref: '#/components/responses/RateLimitUnavailable' },
			},
		},
	},

	'/api/auth/facebook': {
		post: {
			tags: ['Authentication', 'OAuth'],
			summary: 'Login with Facebook account',
			description: `
        Authenticate using Facebook access token (OAuth 2.0).

        **Email handling:**
        - If Facebook provides email → Use real email
        - No email permission → Generate synthetic (facebook_{id}@zumik.local)
        - User can add real email later in profile

        **Rate limit:** 10 requests per 15 minutes per IP
      `,
			operationId: 'facebookLogin',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/FacebookLoginRequest' },
						example: {
							accessToken: 'EAABwzLixnjYBOwJ4x...',
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Login successful',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/AuthResponse' },
						},
					},
				},
				'201': {
					description: 'Account created',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/AuthResponse' },
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'429': { $ref: '#/components/responses/RateLimitError' },
				'503': { $ref: '#/components/responses/RateLimitUnavailable' },
			},
		},
	},

	'/api/auth/providers': {
		get: {
			tags: ['Authentication', 'OAuth'],
			summary: 'Get linked OAuth providers',
			description: 'Returns list of providers linked to current user account',
			operationId: 'getLinkedProviders',
			security: [{ bearerAuth: [] }],
			responses: {
				'200': {
					description: 'Providers retrieved',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													providers: {
														type: 'array',
														items: { $ref: '#/components/schemas/LinkedProvider' },
														example: [
															{
																type: 'password',
																connectedAt: '2025-01-15T10:00:00.000Z',
																isPrimary: true,
															},
															{
																type: 'google',
																connectedAt: '2025-01-16T14:30:00.000Z',
																isPrimary: false,
															},
														],
													},
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'503': { $ref: '#/components/responses/RateLimitUnavailable' },
			},
		},
	},

	'/api/auth/providers/{provider}': {
		delete: {
			tags: ['Authentication', 'OAuth'],
			summary: 'Unlink OAuth provider',
			description: `
        Removes link between user and OAuth provider.

        **Safety:** Cannot unlink last authentication method.
      `,
			operationId: 'unlinkProvider',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'provider',
					required: true,
					schema: {
						type: 'string',
						enum: ['google', 'facebook'],
					},
					description: 'OAuth provider to unlink',
				},
			],
			responses: {
				'200': {
					description: 'Provider unlinked',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													message: { type: 'string', example: 'Provider unlinked successfully' },
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'400': {
					description: 'Cannot unlink last authentication method',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'404': { $ref: '#/components/responses/NotFoundError' },
				'503': { $ref: '#/components/responses/RateLimitUnavailable' },
			},
		},
	},

	'/api/auth/providers/{provider}/link': {
		post: {
			tags: ['Authentication', 'OAuth'],
			summary: 'Link OAuth provider to current account',
			description: `
        Links a Google or Facebook account to the signed-in user, whatever the email of the social account.
        Afterwards the user can sign in with any linked method and reach the same account.

        **Body:** the token the app already gets for sign-in. The \`provider\` path value decides which field is required:
        - google → \`{ idToken }\` (same as POST /api/auth/google)
        - facebook → \`{ accessToken }\` (same as POST /api/auth/facebook)

        **Errors:**
        - \`INVALID_PROVIDER_TOKEN\` (400): the provider token is invalid or expired. Not a 401, so the client does not take it for an expired session
        - \`PROVIDER_ALREADY_LINKED\` (409): this social account is linked to another user
        - \`PROVIDER_ALREADY_SET\` (409): the current user already has an account of this provider linked, this one or another
      `,
			operationId: 'linkProvider',
			security: [{ bearerAuth: [] }],
			parameters: [
				{
					in: 'path',
					name: 'provider',
					required: true,
					schema: {
						type: 'string',
						enum: ['google', 'facebook'],
					},
					description: 'OAuth provider to link',
				},
			],
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							anyOf: [
								{ $ref: '#/components/schemas/GoogleLoginRequest' },
								{ $ref: '#/components/schemas/FacebookLoginRequest' },
							],
						},
						examples: {
							google: { value: { idToken: 'eyJhbGciOiJSUzI1NiIs...' } },
							facebook: { value: { accessToken: 'EAAGm0PX4ZCpsBA...' } },
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Provider linked; returns every linked provider',
					content: {
						'application/json': {
							schema: {
								allOf: [
									{ $ref: '#/components/schemas/SuccessResponse' },
									{
										type: 'object',
										properties: {
											data: {
												type: 'object',
												properties: {
													providers: {
														type: 'array',
														items: { $ref: '#/components/schemas/LinkedProvider' },
													},
												},
											},
										},
									},
								],
							},
						},
					},
				},
				'400': {
					description: 'Validation failed, or invalid provider token',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							examples: {
								validation: {
									value: {
										success: false,
										error: {
											message: 'Validation failed',
											code: 'VALIDATION_ERROR',
											details: { field: 'idToken', issue: 'ID token is required' },
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
								invalidProviderToken: {
									value: {
										success: false,
										error: {
											message: 'Invalid or expired Google token',
											code: 'INVALID_PROVIDER_TOKEN',
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
							},
						},
					},
				},
				'401': { $ref: '#/components/responses/UnauthorizedError' },
				'409': {
					description:
						'Social account already linked to another user, or this provider already linked to the current user',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							examples: {
								linkedToAnotherUser: {
									value: {
										success: false,
										error: {
											message: 'This Google account is already linked to another user',
											code: 'PROVIDER_ALREADY_LINKED',
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
								alreadySetOnThisUser: {
									value: {
										success: false,
										error: {
											message: 'A Google account is already linked to this user',
											code: 'PROVIDER_ALREADY_SET',
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
							},
						},
					},
				},
				'429': { $ref: '#/components/responses/RateLimitError' },
				'503': { $ref: '#/components/responses/RateLimitUnavailable' },
			},
		},
	},
};

/**
 * Schemas specific to Authentication
 */
export const authSchemas: OpenAPIV3.ComponentsObject['schemas'] = {
	RegisterRequest: {
		type: 'object',
		required: ['email', 'password', 'username'],
		properties: {
			email: {
				type: 'string',
				format: 'email',
				example: 'user@example.com',
				description: 'Valid email address (unique)',
			},
			password: {
				type: 'string',
				format: 'password',
				minLength: 8,
				maxLength: 100,
				example: 'SecurePass123',
				description: 'Must contain uppercase, lowercase, and number',
			},
			username: {
				type: 'string',
				minLength: 3,
				maxLength: 20,
				pattern: '^[a-zA-Z0-9_]+$',
				example: 'johndoe',
				description: 'Alphanumeric and underscores only',
			},
			displayName: {
				type: 'string',
				maxLength: 50,
				example: 'John Doe',
				description: 'Optional display name',
			},
		},
	},

	LoginRequest: {
		type: 'object',
		required: ['email', 'password'],
		properties: {
			email: {
				type: 'string',
				format: 'email',
				example: 'user@example.com',
			},
			password: {
				type: 'string',
				format: 'password',
				example: 'SecurePass123',
			},
		},
	},

	RefreshTokenRequest: {
		type: 'object',
		required: ['refreshToken'],
		properties: {
			refreshToken: {
				type: 'string',
				description: 'Refresh token from login/register',
			},
		},
	},

	GoogleLoginRequest: {
		type: 'object',
		required: ['idToken'],
		properties: {
			idToken: {
				type: 'string',
				description: 'Google ID token from @react-native-google-signin/google-signin',
			},
		},
	},

	FacebookLoginRequest: {
		type: 'object',
		required: ['accessToken'],
		properties: {
			accessToken: {
				type: 'string',
				description: 'Facebook access token from react-native-fbsdk-next',
			},
		},
	},

	LinkedProvider: {
		type: 'object',
		required: ['type', 'connectedAt', 'isPrimary'],
		properties: {
			type: {
				type: 'string',
				enum: ['password', 'google', 'facebook'],
			},
			connectedAt: {
				type: 'string',
				format: 'date-time',
			},
			isPrimary: {
				type: 'boolean',
			},
		},
	},

	UserProfile: {
		type: 'object',
		properties: {
			id: { type: 'string', format: 'uuid' },
			email: { type: 'string', format: 'email' },
			username: { type: 'string' },
			displayName: { type: 'string', nullable: true },
			avatarUrl: { type: 'string', format: 'uri', nullable: true },
			bio: { type: 'string', nullable: true },
			createdAt: { type: 'string', format: 'date-time' },
			updatedAt: { type: 'string', format: 'date-time' },
			connectedProviders: {
				type: 'object',
				properties: {
					hasPassword: { type: 'boolean' },
					hasGoogle: { type: 'boolean' },
					hasFacebook: { type: 'boolean' },
				},
			},
		},
	},

	AuthResponse: {
		allOf: [
			{ $ref: '#/components/schemas/SuccessResponse' },
			{
				type: 'object',
				properties: {
					data: {
						type: 'object',
						properties: {
							user: { $ref: '#/components/schemas/UserProfile' },
							session: {
								type: 'object',
								properties: {
									accessToken: {
										type: 'string',
										description: 'JWT access token (expires in 1 hour)',
									},
									refreshToken: {
										type: 'string',
										description: 'JWT refresh token (expires in 7 days)',
									},
									expiresIn: {
										type: 'integer',
										description: 'Token lifetime in seconds',
										example: 3600,
									},
									expiresAt: {
										type: 'integer',
										description: 'Unix timestamp when token expires',
										example: 1705318200,
									},
								},
							},
						},
					},
				},
			},
		],
	},
};
