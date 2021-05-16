import { Client } from "@notionhq/client";
import {
  PropertyValue,
  SelectPropertyValue,
  TitlePropertyValue,
} from "@notionhq/client/build/src/api-types";

export interface Post {
  id: string;
  title: string;
  status: string;
}

export type Posts = { [key: string]: Post };

// Get a paginated list of Posts currently in a database.
export async function getPostsFromDatabase({
  apiKey,
  databaseId,
}: {
  apiKey: string;
  databaseId: string;
}): Promise<Posts> {
  const notion = new Client({
    auth: apiKey,
  });

  const posts: Posts = {};

  async function getPageOfTasks(cursor?: string) {
    const currentPages = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor || undefined,
    });

    for (const page of currentPages.results) {
      const { properties } = page;
      const { Name, Status } = properties;

      const post = {
        id: page.id,
        title: "No title",
        status: "No Status",
      };

      if (isTitle(Name) && Name.title?.length > 0) {
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

function isTitle(property: PropertyValue): property is TitlePropertyValue {
  return property.type === "title";
}

function isSelect(property: PropertyValue): property is SelectPropertyValue {
  return property.type === "select";
}
