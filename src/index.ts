import { RequestOptions } from "@elderjs/elderjs";
import { DatabasesQueryParameters } from "@notionhq/client/build/src/api-endpoints";

import { getDatabasePages, PagesById } from "./notion";

// TODO: get rid of this
const mainRoute = "notionBlog";

type Config = {
  notion: {
    apiKey: string;
    databaseId: string;
    databaseQueryParameters?: DatabasesQueryParameters;
  };
  routes: any[];
};
type Plugin = { config: Config; pages: PagesById; requests: any[] };

const plugin = {
  name: "elderjs-plugin-notion",
  description: `Fetches all pages from a Notion database, then adds the pages as "requests" on "allRequests.`,
  // TODO: is it problematic that init is async? even though the official markdown plugin uses async init() too?
  init: async (plugin: Plugin) => {
    const {
      notion: { apiKey, databaseId, databaseQueryParameters },
    } = plugin.config;

    if (!apiKey) {
      throw new Error(
        "Missing notion.apiKey: please enter a Notion API key in your plugin config. Follow these steps to create a Notion API key: https://developers.notion.com/docs/getting-started"
      );
    }

    if (!databaseId) {
      throw new Error(
        "Missing notion.databaseId: please enter a Notion database ID. Learn more about Notion databases here: https://developers.notion.com/docs/working-with-databases"
      );
    }

    plugin.pages = await getDatabasePages({
      apiKey,
      databaseId,
      databaseQueryParameters,
    });

    plugin.requests = [];
    for (const [id, page] of Object.entries(plugin.pages)) {
      plugin.requests.push({
        route: mainRoute,
        slug: id,
        page,
      });
    }

    return plugin;
  },
  hooks: [
    {
      hook: "bootstrap",
      name: "addNotionPagesToDataObject",
      description: `Add Notion pages to the data object`,
      priority: 50,
      run: async ({ plugin, data }: { plugin: Plugin; data: any }) => {
        if (plugin.config.routes.length > 0) {
          return {
            data: { ...data, pages: plugin.pages },
          };
        }

        return data;
      },
    },
    {
      hook: "allRequests",
      name: "addNotionPagesToAllRequests",
      description: `Add collected Notion pages to allRequests array`,
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
          request.route === mainRoute &&
          request.slug &&
          data.pages &&
          data.pages[request.slug]
        ) {
          const page = data.pages[request.slug];
          return {
            data: {
              ...data,
              page,
              html: `<p>${JSON.stringify(page)}</p>`,
            },
          };
        }

        return data;
      },
    },
  ],
  config: {
    // default configs, merged with user's elder.config.js file
    routes: [],
    notion: {
      apiKey: "",
      databaseId: "",
      databaseQueryParameters: {},
    },
  },
};

export default plugin;

