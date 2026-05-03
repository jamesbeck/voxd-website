"use server";

import {
  ServerActionReadParams,
  ServerActionReadResponse,
} from "@/types/types";
import {
  assertDevelopmentEnvironment,
  isDevelopmentEnvironment,
} from "@/lib/development/devPartnerOverride";
import {
  getAdminUserDevContextBaseQuery,
  mapAdminUserDevContext,
} from "@/lib/adminUsers/getAdminUserDevContext";

const saSearchAdminUsersForDevLogin = async ({
  search,
  page = 1,
  pageSize = 10,
}: ServerActionReadParams): Promise<ServerActionReadResponse> => {
  if (!isDevelopmentEnvironment()) {
    return { success: false, error: "Development only." };
  }

  assertDevelopmentEnvironment();

  const trimmedSearch = search?.trim();
  const cappedPageSize = Math.min(pageSize, 20);

  const base = getAdminUserDevContextBaseQuery().where((queryBuilder) => {
    if (!trimmedSearch) {
      return;
    }

    queryBuilder
      .where("adminUser.name", "ilike", `%${trimmedSearch}%`)
      .orWhere("adminUser.email", "ilike", `%${trimmedSearch}%`)
      .orWhere("organisation.name", "ilike", `%${trimmedSearch}%`)
      .orWhere("directPartner.name", "ilike", `%${trimmedSearch}%`)
      .orWhere("organisationPartner.name", "ilike", `%${trimmedSearch}%`);
  });

  const countResult = await dbCount(base.clone());
  const rows = await base
    .clone()
    .orderByRaw('COALESCE("adminUser"."name", "adminUser"."email") asc')
    .limit(cappedPageSize)
    .offset((page - 1) * cappedPageSize);

  return {
    success: true,
    data: rows.map((row) => mapAdminUserDevContext(row as never)),
    totalAvailable: countResult,
    page,
    pageSize: cappedPageSize,
  };
};

async function dbCount(
  query: ReturnType<typeof getAdminUserDevContextBaseQuery>,
) {
  const countQuery = query
    .clone()
    .clearSelect()
    .countDistinct<{ count: string }>("adminUser.id as count")
    .first();
  const result = await countQuery;
  return result ? parseInt(result.count) : 0;
}

export default saSearchAdminUsersForDevLogin;
