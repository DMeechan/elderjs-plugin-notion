var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// src/index.ts
__export(exports, {
  default: () => src_default
});

// src/notion.ts
var import_client = __toModule(require("@notionhq/client"));
async function getDatabasePages({
  apiKey,
  databaseId,
  databaseQueryParameters
}) {
  const notion = new import_client.Client({
    auth: apiKey
  });
  const allPagesById = {};
  let pages;
  let cursor = (databaseQueryParameters == null ? void 0 : databaseQueryParameters.start_cursor) || void 0;
  do {
    pages = await notion.databases.query(__spreadProps(__spreadValues({
      database_id: databaseId
    }, databaseQueryParameters), {
      start_cursor: cursor
    }));
    await Promise.allSettled(pages.results.map(async (page) => {
      const pageWithChildren = page;
      pageWithChildren.children = await getPageContent({
        notion,
        pageId: page.id
      });
      allPagesById[page.id] = pageWithChildren;
    }));
    cursor = pages.next_cursor || void 0;
  } while (pages.has_more && cursor);
  return allPagesById;
}
async function getPageContent({
  notion,
  pageId
}) {
  const content = [];
  let cursor = void 0;
  let children;
  do {
    children = await notion.blocks.children.list({ block_id: pageId });
    content.push(...children.results);
    cursor = children.next_cursor || void 0;
  } while (children.has_more && cursor);
  return content;
}

// src/index.ts
var mainRoute = "notionBlog";
var plugin = {
  name: "elderjs-plugin-notion",
  description: `Fetches all pages from a Notion database, then adds the pages as "requests" on "allRequests.`,
  init: async (plugin2) => {
    const {
      notion: { apiKey, databaseId, databaseQueryParameters }
    } = plugin2.config;
    if (!apiKey) {
      throw new Error("Missing notion.apiKey: please enter a Notion API key in your plugin config. Follow these steps to create a Notion API key: https://developers.notion.com/docs/getting-started");
    }
    if (!databaseId) {
      throw new Error("Missing notion.databaseId: please enter a Notion database ID. Learn more about Notion databases here: https://developers.notion.com/docs/working-with-databases");
    }
    plugin2.pages = await getDatabasePages({
      apiKey,
      databaseId,
      databaseQueryParameters
    });
    plugin2.requests = [];
    for (const [id, page] of Object.entries(plugin2.pages)) {
      plugin2.requests.push({
        route: mainRoute,
        slug: id,
        page
      });
    }
    return plugin2;
  },
  hooks: [
    {
      hook: "bootstrap",
      name: "addNotionPagesToDataObject",
      description: `Add Notion pages to the data object`,
      priority: 50,
      run: async ({ plugin: plugin2, data }) => {
        if (plugin2.config.routes.length > 0) {
          return {
            data: __spreadProps(__spreadValues({}, data), { pages: plugin2.pages })
          };
        }
        return data;
      }
    },
    {
      hook: "allRequests",
      name: "addNotionPagesToAllRequests",
      description: `Add collected Notion pages to allRequests array`,
      priority: 50,
      run: async ({
        allRequests,
        plugin: plugin2
      }) => {
        if (plugin2.config.routes.length > 0) {
          return {
            allRequests: [...allRequests, ...plugin2.requests]
          };
        }
        return allRequests;
      }
    },
    {
      hook: "data",
      name: "addFrontmatterAndHtmlToDataForRequest",
      description: "Adds parsed frontmatter and html to the data object for the specific request.",
      priority: 50,
      run: async ({
        request,
        data
      }) => {
        if (request.route === mainRoute && request.slug && data.pages && data.pages[request.slug]) {
          const page = data.pages[request.slug];
          return {
            data: __spreadProps(__spreadValues({}, data), {
              page,
              html: `<p>${JSON.stringify(page)}</p>`
            })
          };
        }
        return data;
      }
    }
  ],
  config: {
    routes: [],
    notion: {
      apiKey: "",
      databaseId: "",
      databaseQueryParameters: {}
    }
  }
};
var src_default = plugin;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
