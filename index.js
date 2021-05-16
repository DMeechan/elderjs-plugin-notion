const { Client } = require('@notionhq/client');

const { getPostsFromDatabase } = require('./notion');

const route = 'notionBlog';

const plugin = {
  name: 'elderjs-plugin-notion',
  description: `Reads and collects posts from specified Notion database, then adds the posts as "requests" on "allRequests.`,
  // TODO: is it problematic that init is async? even though the official markdown plugin uses async init() too?
  init: async (plugin) => {
    const {
      notion: { apiKey, databaseId },
    } = plugin.config;

    plugin.posts = {};
    plugin.requests = [];

    const notion = new Client({
      auth: apiKey,
    });

    // 1 Fetch databse pages from Notion
    plugin.posts = await getPostsFromDatabase(notion, databaseId);

    // 2 put them somewhere?
    for (const [postId, post] of Object.entries(plugin.posts)) {
      plugin.requests.push({ route, slug: postId, id: postId, title: post.title });
    }

    return plugin;
  },
  hooks: [
    {
      hook: 'bootstrap',
      name: 'addNotionPagesToDataObject',
      description: `Add parsed Notion content to the data object`,
      priority: 50,
      run: async ({ plugin, data }) => {
        if (plugin.config.routes.length > 0) {
          return {
            data: { ...data, posts: plugin.posts },
          };
        }
      },
    },
    {
      hook: 'allRequests',
      name: 'addNotionPagesToAllRequests',
      description: `Add collected Notion posts to allRequests array`,
      priority: 50,
      run: async ({ allRequests, plugin }) => {
        if (plugin.config.routes.length > 0) {
          return {
            allRequests: [...allRequests, ...plugin.requests],
          };
        }
      },
    },
    {
      hook: 'data',
      name: 'addFrontmatterAndHtmlToDataForRequest',
      description: 'Adds parsed frontmatter and html to the data object for the specific request.',
      priority: 50,
      run: async ({ request, data }) => {
        if (request.route === route && data.posts && data.posts[request.slug]) {
          const post = data.posts[request.slug];
          return {
            data: {
              ...data,
              post,
              html: `<p>${JSON.stringify(post)}</p>`,
            },
          };
        }
      },
    },
  ],
  config: {
    // default configs, merged with user's elder.config.js file
    routes: [route],
    notion: {
      apiKey: process.env.NOTION_API_KEY || '',
      databaseId: process.env.NOTION_DATABASE_ID || '',
    },
  },
};

module.exports = plugin;
