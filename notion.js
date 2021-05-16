// Get a paginated list of Posts currently in a database.
async function getPostsFromDatabase(notion, databaseId) {
  const posts = {};

  async function getPageOfTasks(cursor) {
    const requestBody = cursor ? { start_cursor: cursor } : {};
    const currentPages = await notion.request({
      path: `databases/${databaseId}/query`,
      method: 'POST',
      body: requestBody,
    });

    for (const page of currentPages.results) {
      const { properties } = page;

      const post = {
        id: page.id,
        title: properties.Name?.title[0]?.text?.content || 'no title found',
      };

      if (page.properties.Status) {
        post['status'] = properties.Status.select.name;
      } else {
        post['status'] = 'No Status';
      }

      posts[page.id] = post;
    }
    if (currentPages.has_more) {
      await getPageOfTasks(currentPages.next_cursor);
    }
  }

  await getPageOfTasks();

  return posts;
}

module.exports.getPostsFromDatabase = getPostsFromDatabase;
