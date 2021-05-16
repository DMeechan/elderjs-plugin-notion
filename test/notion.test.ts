import { getPostsFromDatabase } from '../src/notion';

describe('getPostsFromDatabase', () => {
  it('throws an error with invalid API key', async () => {
    const promsise = getPostsFromDatabase({ apiKey: '', databaseId: '' });
    await expect(promsise).rejects.toThrowError(/Invalid request URL./);
  });
});
