import { Client } from "@notionhq/client";
import {
  BlocksChildrenListResponse,
  DatabasesQueryParameters,
  DatabasesQueryResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { Block, Page } from "@notionhq/client/build/src/api-types";

type PageWithChildren = Page & { children: Block[] };
export type PagesById = { [key: string]: PageWithChildren };

/**
 * @returns all pages from a Notion database
 */
export async function getDatabasePages({
  apiKey,
  databaseId,
  databaseQueryParameters,
}: {
  apiKey: string;
  databaseId: string;
  databaseQueryParameters?: DatabasesQueryParameters;
}): Promise<PagesById> {
  const notion = new Client({
    auth: apiKey,
  });

  const allPagesById: PagesById = {};
  let pages: DatabasesQueryResponse;
  let cursor = databaseQueryParameters?.start_cursor || undefined;

  do {
    pages = await notion.databases.query({
      database_id: databaseId,
      ...databaseQueryParameters,
      start_cursor: cursor,
    });

    // Fetch the page's content
    await Promise.allSettled(
      pages.results.map(async (page) => {
        const pageWithChildren = page as PageWithChildren;
        pageWithChildren.children = await getPageContent({
          notion,
          pageId: page.id,
        });

        allPagesById[page.id] = pageWithChildren;
      })
    );

    cursor = pages.next_cursor || undefined;
  } while (pages.has_more && cursor);

  return allPagesById;
}

async function getPageContent({
  notion,
  pageId,
}: {
  notion: Client;
  pageId: string;
}): Promise<Block[]> {
  const content: Block[] = [];
  let cursor: string | undefined = undefined;
  let children: BlocksChildrenListResponse;

  do {
    children = await notion.blocks.children.list({ block_id: pageId });
    content.push(...children.results);
    cursor = children.next_cursor || undefined;
  } while (children.has_more && cursor);

  return content;
}
