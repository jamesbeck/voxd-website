const coreBaseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_CORE_BASE_URL || "https://core.voxd.ai";

type InternalAdminApiResult<T> = {
  status: number;
  data?: T;
  error?: string;
};

export function getInternalAdminApiBaseUrl() {
  return coreBaseUrl;
}

export async function postInternalAdminApi<T>({
  path,
  body,
}: {
  path: string;
  body: Record<string, unknown>;
}): Promise<InternalAdminApiResult<T>> {
  if (!process.env.API_SECRET_KEY) {
    return {
      status: 500,
      error: "API_SECRET_KEY is not configured",
    };
  }

  try {
    const response = await fetch(`${coreBaseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.API_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    let data: T | undefined;

    try {
      data = (await response.json()) as T;
    } catch {
      data = undefined;
    }

    return {
      status: response.status,
      data,
      error: response.ok ? undefined : response.statusText,
    };
  } catch (error) {
    return {
      status: 500,
      error:
        error instanceof Error
          ? error.message
          : "Failed to reach internal admin API",
    };
  }
}
