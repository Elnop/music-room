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

        **Email verification:** with \`EMAIL_VERIFICATION_ENABLED=true\` (default) the
        account waits for the emailed code (\`requiresVerification: true\`, no session); if the
        email cannot be sent, the account is removed and the call answers 503 EMAIL_UNAVAILABLE.
        With \`EMAIL_VERIFICATION_ENABLED=false\` the account is created verified and signed in
        (\`requiresVerification: false\` and a session).

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
				'503': {
					description:
						'EMAIL_UNAVAILABLE: the verification email could not be sent, the account was not kept; or RATE_LIMIT_UNAVAILABLE: Redis is not ready',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: {
									message: 'Could not send the verification email, please try again later',
									code: 'EMAIL_UNAVAILABLE',
								},
							},
						},
					},
				},
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
				'429': {
					description:
						'RATE_LIMIT_EXCEEDED: too many failed attempts for this email from this IP within the limiter window (checked first; the usual answer to repeated failures). ACCOUNT_LOCKED: the email is locked for this IP and the limiter window has ended (longer escalated locks)',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							examples: {
								rateLimited: {
									summary: 'Login rate limit',
									value: {
										success: false,
										error: {
											message: 'Too many login attempts. Please try again later.',
											code: 'RATE_LIMIT_EXCEEDED',
											retryAfter: '2025-01-15T11:00:00.000Z',
										},
										meta: { timestamp: '2025-01-15T10:45:00.000Z' },
									},
								},
								accountLocked: {
									summary: 'Account locked',
									value: {
										success: false,
										error: {
											message:
												'Account temporarily locked due to too many failed login attempts. Please try again later.',
											code: 'ACCOUNT_LOCKED',
											lockedUntil: '2025-01-15T11:00:00.000Z',
											remainingTime: 900,
										},
										meta: { timestamp: '2025-01-15T10:45:00.000Z' },
									},
								},
							},
						},
					},
				},
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
				'401': {
					description:
						'INVALID_REFRESH_TOKEN: Supabase Auth refused the refresh token (revoked, expired, already used or unknown). The client must sign in again.',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: {
									message: 'Invalid or expired refresh token',
									code: 'INVALID_REFRESH_TOKEN',
								},
							},
						},
					},
				},
				'429': { $ref: '#/components/responses/RateLimitError' },
				'503': {
					description:
						'AUTH_UNAVAILABLE: Supabase Auth is unreachable or failing, so the token was neither accepted nor refused; the client keeps its session and retries later. RATE_LIMIT_UNAVAILABLE: Redis is not ready, so the rate limiter cannot count the request (fails closed).',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							examples: {
								authUnavailable: {
									value: {
										success: false,
										error: {
											message: 'Authentication service is unavailable',
											code: 'AUTH_UNAVAILABLE',
										},
									},
								},
								rateLimitUnavailable: {
									value: {
										success: false,
										error: {
											message: 'Rate limiting is unavailable',
											code: 'RATE_LIMIT_UNAVAILABLE',
										},
									},
								},
							},
						},
					},
				},
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

	'/api/auth/verify-email': {
		post: {
			tags: ['Authentication'],
			summary: 'Verify email with the 6-digit code',
			description: `
        Checks the 6-digit code sent by email after registration, marks the email as verified and signs the user in.
        Answers with the same \`user\` and \`session\` as login, plus a \`message\`.

        **Rate limits:**
        - 5 failed requests per 15 minutes (login limiter; successful requests are not counted). The bucket is keyed on \`login:unknown:<ip>\` because the body has no email, so it is shared with POST /api/auth/refresh
        - EMAIL_VERIFICATION_MAX_ATTEMPTS checks per user and IP while the code is valid
      `,
			operationId: 'verifyEmail',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/VerifyEmailRequest' },
						example: {
							userId: '3f1c2a9e-8b7d-4c6e-9a1f-2b3c4d5e6f70',
							code: '482915',
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Email verified; the user is signed in',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/VerifyEmailResponse' },
						},
					},
				},
				'400': {
					description:
						'VALIDATION_ERROR: userId is not a UUID or code is not 6 digits. NO_CODE_FOUND: no code is stored for this user; request a new one. CODE_EXPIRED: the code is past its lifetime; request a new one. INVALID_CODE: the code does not match. ALREADY_VERIFIED: the email is already verified; no session is issued, sign in instead',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							examples: {
								validation: {
									value: {
										success: false,
										error: {
											message: 'Validation error',
											code: 'VALIDATION_ERROR',
											details: [{ path: 'code', message: 'Verification code must be 6 digits' }],
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
								noCodeFound: {
									value: {
										success: false,
										error: {
											message: 'No verification code found. Please request a new code.',
											code: 'NO_CODE_FOUND',
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
								codeExpired: {
									value: {
										success: false,
										error: {
											message: 'Verification code expired. Please request a new code.',
											code: 'CODE_EXPIRED',
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
								invalidCode: {
									value: {
										success: false,
										error: { message: 'Invalid verification code', code: 'INVALID_CODE' },
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
								alreadyVerified: {
									value: {
										success: false,
										error: { message: 'Email already verified', code: 'ALREADY_VERIFIED' },
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
							},
						},
					},
				},
				'404': {
					description:
						'USER_NOT_FOUND: no profile for this userId. AUTH_USER_NOT_FOUND: the profile exists but Supabase Auth has no matching user',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: { message: 'User not found', code: 'USER_NOT_FOUND' },
								meta: { timestamp: '2025-01-15T10:30:00.000Z' },
							},
						},
					},
				},
				'429': {
					description:
						'RATE_LIMIT_EXCEEDED: the IP passed 5 failed requests per 15 minutes on the login limiter bucket it shares with POST /api/auth/refresh, or this user and IP passed the verification attempt limit',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							examples: {
								loginLimiter: {
									value: {
										success: false,
										error: {
											message: 'Too many login attempts. Please try again later.',
											code: 'RATE_LIMIT_EXCEEDED',
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
								verificationAttempts: {
									value: {
										success: false,
										error: {
											message: 'Rate limit exceeded. Please try again in 15 minutes.',
											code: 'RATE_LIMIT_EXCEEDED',
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
							},
						},
					},
				},
				'500': {
					description:
						'VERIFICATION_ERROR: the code matched but the profile could not be marked as verified. SESSION_GENERATION_FAILED, INVALID_SESSION_RESPONSE, SESSION_CREATION_FAILED: the email is verified but no session could be created; the user can sign in with the login endpoint',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: { message: 'Failed to create session', code: 'SESSION_CREATION_FAILED' },
								meta: { timestamp: '2025-01-15T10:30:00.000Z' },
							},
						},
					},
				},
				'503': {
					description:
						'Redis is not ready. RATE_LIMIT_UNAVAILABLE: the route rate limiter cannot count the request. REDIS_UNAVAILABLE: the verification attempt counter cannot be read',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
			},
		},
	},

	'/api/auth/resend-verification': {
		post: {
			tags: ['Authentication'],
			summary: 'Send a new email verification code',
			description: `
        Generates a new 6-digit code for the user, replaces the previous one and sends it to the account's own email.
        A code is sent only when \`userId\` is an existing, not yet verified account and \`email\` matches its email (case-insensitive).
        Otherwise nothing is generated or sent, but the answer is the same 200 (and the same cooldown 429), so the endpoint does not reveal whether an account or an email exists.

        **Rate limits:**
        - 3 requests per hour per IP (register limiter, keyed on \`register:<ip>\`: the bucket is shared with POST /api/auth/register)
        - EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS between two codes for the same user and IP
        - EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR codes per hour for the same user and IP
      `,
			operationId: 'resendVerification',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/ResendVerificationRequest' },
						example: {
							userId: '3f1c2a9e-8b7d-4c6e-9a1f-2b3c4d5e6f70',
							email: 'user@example.com',
						},
					},
				},
			},
			responses: {
				'200': {
					description:
						'Request accepted: a code was sent to the account email if the account is unverified and the email matches (same answer otherwise)',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/AuthMessageResponse' },
							example: {
								success: true,
								data: { message: 'Verification code sent. Please check your email.' },
								meta: { timestamp: '2025-01-15T10:30:00.000Z' },
							},
						},
					},
				},
				'400': {
					description:
						'VALIDATION_ERROR: userId is not a UUID or email is invalid. The verification email could not be sent: the code is the mail transport error code (for example EAUTH, ECONNECTION)',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
				'429': {
					description:
						'RESEND_COOLDOWN: a code was sent too recently; the message gives the seconds left. RESEND_LIMIT_EXCEEDED: the hourly resend limit for this user and IP is reached. RATE_LIMIT_EXCEEDED: the IP passed the register limiter, whose bucket is shared with POST /api/auth/register',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							examples: {
								cooldown: {
									value: {
										success: false,
										error: {
											message: 'Please wait 42 seconds before requesting a new code',
											code: 'RESEND_COOLDOWN',
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
								resendLimit: {
									value: {
										success: false,
										error: {
											message: 'Too many resend attempts. Please try again later.',
											code: 'RESEND_LIMIT_EXCEEDED',
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
								rateLimit: {
									value: {
										success: false,
										error: {
											message: 'Too many registration attempts. Please try again later.',
											code: 'RATE_LIMIT_EXCEEDED',
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
							},
						},
					},
				},
				'500': {
					description: 'CODE_STORE_ERROR: the new code could not be saved',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
				'503': {
					description:
						'Redis is not ready. RATE_LIMIT_UNAVAILABLE: the route rate limiter cannot count the request. REDIS_UNAVAILABLE: the resend cooldown cannot be checked',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
			},
		},
	},

	'/api/auth/forgot-password': {
		post: {
			tags: ['Authentication'],
			summary: 'Request a password reset code',
			description: `
        Sends a 6-digit reset code (valid 15 minutes) to the email.
        An account that signs in only with Google or Facebook gets a code too: resetting adds email/password sign-in to it.
        Each request starts the 60-second resend cooldown reported by GET /api/auth/reset-password/can-resend, even for an email with no account.
        The answer is the same whether the email belongs to an account or not, so it cannot be used to find accounts.

        **Rate limits:**
        - 20 requests per 15 minutes per IP (global auth limiter)
        - 3 requests per hour for the same email and IP
      `,
			operationId: 'forgotPassword',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
						example: { email: 'user@example.com' },
					},
				},
			},
			responses: {
				'200': {
					description: 'Request accepted; a code was sent if the email belongs to an account',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/AuthMessageResponse' },
							example: {
								success: true,
								data: { message: 'If this email exists, a reset code has been sent.' },
								meta: { timestamp: '2025-01-15T10:30:00.000Z' },
							},
						},
					},
				},
				'400': {
					description:
						'VALIDATION_ERROR: the email is invalid. The reset email could not be sent: the code is the mail transport error code (for example EAUTH, ECONNECTION)',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							examples: {
								validation: {
									value: {
										success: false,
										error: {
											message: 'Validation error',
											code: 'VALIDATION_ERROR',
											details: [{ path: 'email', message: 'Invalid email address' }],
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
							},
						},
					},
				},
				'429': {
					description:
						'RATE_LIMIT_EXCEEDED: the IP passed the global auth limiter, or this email and IP passed 3 requests per hour',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
				'500': {
					description:
						'USER_FETCH_ERROR: Supabase Auth users could not be listed. PASSWORD_RESET_STORE_ERROR: the code could not be saved',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
				'503': {
					description:
						'Redis is not ready. RATE_LIMIT_UNAVAILABLE: the route rate limiter cannot count the request. REDIS_UNAVAILABLE: the per-email request counter cannot be updated',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
			},
		},
	},

	'/api/auth/reset-password': {
		post: {
			tags: ['Authentication'],
			summary: 'Reset the password with the emailed code',
			description: `
        Checks the code sent by POST /api/auth/forgot-password and sets the new password.
        For an account that had no password (Google or Facebook only), the new password becomes an additional sign-in method.
        The code is single use; the user then signs in with the login endpoint.

        **Password rules:** 8 to 100 characters, with at least one uppercase letter, one lowercase letter and one digit.

        **Rate limits:**
        - 20 requests per 15 minutes per IP (global auth limiter)
        - 5 attempts per 15 minutes for the same email and IP
      `,
			operationId: 'resetPassword',
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
						example: {
							email: 'user@example.com',
							code: '739204',
							newPassword: 'NewSecurePass456',
						},
					},
				},
			},
			responses: {
				'200': {
					description: 'Password changed',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/AuthMessageResponse' },
							example: {
								success: true,
								data: {
									message: 'Password reset successful. You can now log in with your new password.',
								},
								meta: { timestamp: '2025-01-15T10:30:00.000Z' },
							},
						},
					},
				},
				'400': {
					description:
						'VALIDATION_ERROR: invalid email, code not 6 digits, or password breaking the rules. INVALID_RESET_CODE: unknown email, no code stored, or the code does not match. RESET_CODE_EXPIRED: the code is older than 15 minutes; request a new one',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							examples: {
								validation: {
									value: {
										success: false,
										error: {
											message: 'Validation error',
											code: 'VALIDATION_ERROR',
											details: [
												{
													path: 'newPassword',
													message: 'Password must contain at least one uppercase letter',
												},
											],
										},
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
								invalidCode: {
									value: {
										success: false,
										error: { message: 'Invalid reset code', code: 'INVALID_RESET_CODE' },
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
								expiredCode: {
									value: {
										success: false,
										error: { message: 'Reset code has expired', code: 'RESET_CODE_EXPIRED' },
										meta: { timestamp: '2025-01-15T10:30:00.000Z' },
									},
								},
							},
						},
					},
				},
				'429': {
					description:
						'RATE_LIMIT_EXCEEDED: the IP passed the global auth limiter, or this email and IP passed 5 attempts per 15 minutes',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
				'500': {
					description:
						'USER_FETCH_ERROR: Supabase Auth users could not be listed. PASSWORD_UPDATE_ERROR: Supabase Auth refused the new password',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
				'503': {
					description:
						'Redis is not ready. RATE_LIMIT_UNAVAILABLE: the route rate limiter cannot count the request. REDIS_UNAVAILABLE: the per-email attempt counter cannot be updated',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
						},
					},
				},
			},
		},
	},

	'/api/auth/reset-password/can-resend': {
		get: {
			tags: ['Authentication'],
			summary: 'Check whether a new reset code can be requested',
			description: `
        Reports the resend cooldown for this email and IP: \`canResend\` and the \`remainingSeconds\` before a new code can be requested.
        Reports whether a new POST /api/auth/forgot-password for this email and IP would be accepted. Each request starts a 60-second resend cooldown (advisory: the client waits for it), and at most 3 requests per hour are accepted; both count whether the email belongs to an account or not.
        When \`canResend\` is false, \`remainingSeconds\` is the real time left of whichever limit blocks the next request (up to an hour for the hourly limit).

        **Rate limit:** 20 requests per 15 minutes per IP (global auth limiter)
      `,
			operationId: 'canResendResetCode',
			parameters: [
				{
					in: 'query',
					name: 'email',
					required: true,
					schema: { type: 'string' },
					example: 'user@example.com',
					description: 'Email the reset code was requested for',
				},
			],
			responses: {
				'200': {
					description: 'Cooldown state',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/CanResendResetCodeResponse' },
							example: {
								success: true,
								data: { canResend: true, remainingSeconds: 0 },
								meta: { timestamp: '2025-01-15T10:30:00.000Z' },
							},
						},
					},
				},
				'400': {
					description:
						'VALIDATION_ERROR: the email query parameter is missing or not a valid email',
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/ErrorResponse' },
							example: {
								success: false,
								error: {
									message: 'Validation error',
									code: 'VALIDATION_ERROR',
									details: [{ path: 'email', message: 'Invalid email address' }],
								},
								meta: { timestamp: '2025-01-15T10:30:00.000Z' },
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

	VerifyEmailRequest: {
		type: 'object',
		required: ['userId', 'code'],
		properties: {
			userId: {
				type: 'string',
				format: 'uuid',
				description: 'ID of the user returned by POST /api/auth/register',
			},
			code: {
				type: 'string',
				pattern: '^\\d{6}$',
				minLength: 6,
				maxLength: 6,
				example: '482915',
				description: '6-digit code received by email',
			},
		},
	},

	VerifyEmailResponse: {
		allOf: [
			{ $ref: '#/components/schemas/AuthResponse' },
			{
				type: 'object',
				properties: {
					data: {
						type: 'object',
						properties: {
							message: { type: 'string', example: 'Email verified successfully' },
						},
					},
				},
			},
		],
	},

	ResendVerificationRequest: {
		type: 'object',
		required: ['userId', 'email'],
		properties: {
			userId: {
				type: 'string',
				format: 'uuid',
				description: 'ID of the user returned by POST /api/auth/register',
			},
			email: {
				type: 'string',
				format: 'email',
				example: 'user@example.com',
				description: 'Address the new code is sent to',
			},
		},
	},

	ForgotPasswordRequest: {
		type: 'object',
		required: ['email'],
		properties: {
			email: { type: 'string', format: 'email', example: 'user@example.com' },
		},
	},

	ResetPasswordRequest: {
		type: 'object',
		required: ['email', 'code', 'newPassword'],
		properties: {
			email: { type: 'string', format: 'email', example: 'user@example.com' },
			code: {
				type: 'string',
				pattern: '^\\d{6}$',
				minLength: 6,
				maxLength: 6,
				example: '739204',
				description: '6-digit code received by email',
			},
			newPassword: {
				type: 'string',
				format: 'password',
				minLength: 8,
				maxLength: 100,
				example: 'NewSecurePass456',
				description: 'Must contain uppercase, lowercase, and number',
			},
		},
	},

	AuthMessageResponse: {
		allOf: [
			{ $ref: '#/components/schemas/SuccessResponse' },
			{
				type: 'object',
				properties: {
					data: {
						type: 'object',
						required: ['message'],
						properties: {
							message: { type: 'string' },
						},
					},
				},
			},
		],
	},

	CanResendResetCodeResponse: {
		allOf: [
			{ $ref: '#/components/schemas/SuccessResponse' },
			{
				type: 'object',
				properties: {
					data: {
						type: 'object',
						required: ['canResend', 'remainingSeconds'],
						properties: {
							canResend: { type: 'boolean', example: true },
							remainingSeconds: {
								type: 'integer',
								minimum: 0,
								example: 0,
								description:
									'Seconds before a new forgot-password request is accepted (resend cooldown or hourly limit); 0 when canResend is true',
							},
						},
					},
				},
			},
		],
	},
};
