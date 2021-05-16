import { RequestOptions } from "@elderjs/elderjs";

import { getPostsFromDatabase, Posts } from "./notion";

const route = "notionBlog";

type Plugin = { config: any; posts: Posts; requests: any[] };

const plugin = {
  name: "elderjs-plugin-notion",
  description: `Reads and collects posts from specified Notion database, then adds the posts as "requests" on "allRequests.`,
  // TODO: is it problematic that init is async? even though the official markdown plugin uses async init() too?
  init: async (plugin: Plugin) => {
    const {
      notion: { apiKey, databaseId },
    } = plugin.config;

    plugin.posts = {};
    plugin.requests = [];

    // 1 Fetch databse pages from Notion
    plugin.posts = await getPostsFromDatabase({ apiKey, databaseId });

    // 2 Save them for later
    for (const [postId, post] of Object.entries(plugin.posts)) {
      plugin.requests.push({
        route,
        slug: postId,
        id: postId,
        title: post.title,
      });
    }

    return plugin;
  },
  hooks: [
    {
      hook: "bootstrap",
      name: "addNotionPagesToDataObject",
      description: `Add parsed Notion content to the data object`,
      priority: 50,
      run: async ({ plugin, data }: { plugin: Plugin; data: any }) => {
        if (plugin.config.routes.length > 0) {
          return {
            data: { ...data, posts: plugin.posts },
          };
        }

        return data;
      },
    },
    {
      hook: "allRequests",
      name: "addNotionPagesToAllRequests",
      description: `Add collected Notion posts to allRequests array`,
      priority: 50,
      run: async ({
        allRequests,
        plugin,
      }: {
        allRequests: object[];
        plugin: any;
      }) => {
        if (plugin.config.routes.length > 0) {
          return {
            allRequests: [...allRequests, ...plugin.requests],
          };
        }

        return allRequests;
      },
    },
    {
      hook: "data",
      name: "addFrontmatterAndHtmlToDataForRequest",
      description:
        "Adds parsed frontmatter and html to the data object for the specific request.",
      priority: 50,
      run: async ({
        request,
        data,
      }: {
        request: RequestOptions;
        data: any;
      }) => {
        if (
          request.route === route &&
          request.slug &&
          data.posts &&
          data.posts[request.slug]
        ) {
          const post = data.posts[request.slug];
          return {
            data: {
              ...data,
              post,
              html: `<p>${JSON.stringify(post)}</p>`,
            },
          };
        }

        return data;
      },
    },
  ],
  config: {
    // default configs, merged with user's elder.config.js file
    routes: [route],
    notion: {
      apiKey: process.env.NOTION_API_KEY || "",

      databaseId: process.env.NOTION_DATABASE_ID || "",
    },
  },
};

export default plugin;

