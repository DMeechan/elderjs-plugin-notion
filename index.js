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
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {enumerable: true, configurable: true, writable: true, value}) : obj[key] = value;
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
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};

// src/index.ts
__markAsModule(exports);
__export(exports, {
  default: () => src_default
});

// src/notion.ts
var import_client = __toModule(require("@notionhq/client"));
async function getPostsFromDatabase({
  apiKey,
  databaseId
}) {
  const notion = new import_client.Client({
    auth: apiKey
  });
  const posts = {};
  async function getPageOfTasks(cursor) {
    var _a;
    const currentPages = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor || void 0
    });
    for (const page of currentPages.results) {
      const {properties} = page;
      const {Name, Status} = properties;
      const post = {
        id: page.id,
        title: "No title",
        status: "No Status"
      };
      if (isTitle(Name) && ((_a = Name.title) == null ? void 0 : _a.length) > 0) {
        post.title = Name.title.map((richText) => richText.plain_text).join("");
      }
      if (isSelect(Status)) {
        post.status = Status.select.name;
      }
      posts[page.id] = post;
    }
    if (currentPages.has_more && currentPages.next_cursor) {
      await getPageOfTasks(currentPages.next_cursor);
    }
  }
  await getPageOfTasks();
  return posts;
}
function isTitle(property) {
  return property.type === "title";
}
function isSelect(property) {
  return property.type === "select";
}

// src/index.ts
var route = "notionBlog";
var plugin = {
  name: "elderjs-plugin-notion",
  description: `Reads and collects posts from specified Notion database, then adds the posts as "requests" on "allRequests.`,
  init: async (plugin2) => {
    const {
      notion: {apiKey, databaseId}
    } = plugin2.config;
    plugin2.posts = {};
    plugin2.requests = [];
    plugin2.posts = await getPostsFromDatabase({apiKey, databaseId});
    for (const [postId, post] of Object.entries(plugin2.posts)) {
      plugin2.requests.push({
        route,
        slug: postId,
        id: postId,
        title: post.title
      });
    }
    return plugin2;
  },
  hooks: [
    {
      hook: "bootstrap",
      name: "addNotionPagesToDataObject",
      description: `Add parsed Notion content to the data object`,
      priority: 50,
      run: async ({plugin: plugin2, data}) => {
        if (plugin2.config.routes.length > 0) {
          return {
            data: __spreadProps(__spreadValues({}, data), {posts: plugin2.posts})
          };
        }
        return data;
      }
    },
    {
      hook: "allRequests",
      name: "addNotionPagesToAllRequests",
      description: `Add collected Notion posts to allRequests array`,
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
        if (request.route === route && request.slug && data.posts && data.posts[request.slug]) {
          const post = data.posts[request.slug];
          return {
            data: __spreadProps(__spreadValues({}, data), {
              post,
              html: `<p>${JSON.stringify(post)}</p>`
            })
          };
        }
        return data;
      }
    }
  ],
  config: {
    routes: [route],
    notion: {
      apiKey: process.env.NOTION_API_KEY || "",
      databaseId: process.env.NOTION_DATABASE_ID || ""
    }
  }
};
var src_default = plugin;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
