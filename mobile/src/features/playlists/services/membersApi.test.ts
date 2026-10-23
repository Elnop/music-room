import * as membersApi from './membersApi';
import { apiRequest } from '@/shared/services/api';

jest.mock('@/shared/services/api', () => ({ apiRequest: jest.fn() }));

const request = apiRequest as jest.MockedFunction<typeof apiRequest>;

beforeEach(() => {
	request.mockReset();
	request.mockResolvedValue(undefined);
});

describe('membersApi collaborators', () => {
	it('adds a collaborator', async () => {
		await membersApi.addCollaborator('p', 'u');
		expect(request).toHaveBeenCalledWith('/api/playlists/p/collaborators', {
			method: 'POST',
			body: JSON.stringify({ userId: 'u' }),
		});
	});

	it('removes a collaborator', async () => {
		await membersApi.removeCollaborator('p', 'u');
		expect(request).toHaveBeenCalledWith('/api/playlists/p/collaborators/u', { method: 'DELETE' });
	});

	it('propagates a refusal', async () => {
		request.mockRejectedValue(new Error('Only the owner can manage collaborators'));
		await expect(membersApi.addCollaborator('p', 'u')).rejects.toThrow('Only the owner');
	});
});

describe('membersApi viewers', () => {
	it('lists the viewers', async () => {
		const viewers = [{ id: 'u', username: 'bob' }];
		request.mockResolvedValue({ viewers });
		await expect(membersApi.getViewers('p')).resolves.toEqual(viewers);
		expect(request).toHaveBeenCalledWith('/api/playlists/p/viewers');
	});

	it('adds a viewer', async () => {
		await membersApi.addViewer('p', 'u');
		expect(request).toHaveBeenCalledWith('/api/playlists/p/viewers', {
			method: 'POST',
			body: JSON.stringify({ userId: 'u' }),
		});
	});

	it('removes a viewer', async () => {
		await membersApi.removeViewer('p', 'u');
		expect(request).toHaveBeenCalledWith('/api/playlists/p/viewers/u', { method: 'DELETE' });
	});
});
