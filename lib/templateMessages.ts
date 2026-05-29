export type TemplateComponent = {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: string;
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
    body_text_named_params?: { param_name: string; example: string }[];
  };
  buttons?: {
    type: string;
    text: string;
    url?: string;
    phone_number?: string;
  }[];
};

export type TemplateRecord = {
  id: string;
  metaId: string;
  name: string;
  status: string;
  category: string;
  data: {
    language: string;
    components: TemplateComponent[];
    parameter_format?: "NAMED" | "POSITIONAL";
    sub_category?: string;
  };
};

export type TemplateParameter = {
  name: string;
  example: string;
  componentType: "HEADER" | "BODY";
  index?: number;
};

export type TemplateChatUserRecord = {
  id: string;
  name?: string | null;
  number?: string | null;
  email?: string | null;
  externalId?: string | null;
  data?: Record<string, unknown> | null;
};

export type TemplateParameterMapping = {
  sourceKey?: string;
  overrideValue?: string;
};

export type TemplateParameterMappings = Record<
  string,
  TemplateParameterMapping
>;

export type TemplateFieldSourceOption = {
  label: string;
  value: string;
  previewValue: string;
};

function stringifyTemplateValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function getTemplateFieldValue(
  chatUser: TemplateChatUserRecord,
  sourceKey?: string,
): string {
  if (!sourceKey) return "";

  if (sourceKey === "name") return stringifyTemplateValue(chatUser.name);
  if (sourceKey === "number") return stringifyTemplateValue(chatUser.number);
  if (sourceKey === "email") return stringifyTemplateValue(chatUser.email);
  if (sourceKey === "externalId") {
    return stringifyTemplateValue(chatUser.externalId);
  }

  if (sourceKey.startsWith("data.")) {
    const key = sourceKey.slice(5);
    return stringifyTemplateValue(chatUser.data?.[key]);
  }

  return "";
}

export function getTemplateFieldSourceOptions(
  chatUser: TemplateChatUserRecord,
): TemplateFieldSourceOption[] {
  const options: TemplateFieldSourceOption[] = [
    {
      label: "User Name",
      value: "name",
      previewValue: getTemplateFieldValue(chatUser, "name"),
    },
    {
      label: "Phone Number",
      value: "number",
      previewValue: getTemplateFieldValue(chatUser, "number"),
    },
    {
      label: "Email",
      value: "email",
      previewValue: getTemplateFieldValue(chatUser, "email"),
    },
    {
      label: "External ID",
      value: "externalId",
      previewValue: getTemplateFieldValue(chatUser, "externalId"),
    },
  ];

  const dataKeys = Object.keys(chatUser.data || {}).sort((left, right) =>
    left.localeCompare(right),
  );

  dataKeys.forEach((key) => {
    const value = `data.${key}`;
    options.push({
      label: `User Data: ${key}`,
      value,
      previewValue: getTemplateFieldValue(chatUser, value),
    });
  });

  return options;
}

export function getTemplateFieldSourceOptionsForChatUsers(
  chatUsers: TemplateChatUserRecord[],
): TemplateFieldSourceOption[] {
  if (chatUsers.length === 0) {
    return [];
  }

  const builtInOptions: TemplateFieldSourceOption[] = [
    {
      label: "User Name",
      value: "name",
      previewValue:
        chatUsers.find((chatUser) => getTemplateFieldValue(chatUser, "name"))
          ?.name || "",
    },
    {
      label: "Phone Number",
      value: "number",
      previewValue:
        chatUsers.find((chatUser) => getTemplateFieldValue(chatUser, "number"))
          ?.number || "",
    },
    {
      label: "Email",
      value: "email",
      previewValue:
        chatUsers.find((chatUser) => getTemplateFieldValue(chatUser, "email"))
          ?.email || "",
    },
    {
      label: "External ID",
      value: "externalId",
      previewValue:
        chatUsers.find((chatUser) =>
          getTemplateFieldValue(chatUser, "externalId"),
        )?.externalId || "",
    },
  ];

  const dataKeys = Array.from(
    new Set(chatUsers.flatMap((chatUser) => Object.keys(chatUser.data || {}))),
  ).sort((left, right) => left.localeCompare(right));

  const dataOptions = dataKeys.map((key) => {
    const value = `data.${key}`;
    return {
      label: `User Data: ${key}`,
      value,
      previewValue: chatUsers.find((chatUser) =>
        getTemplateFieldValue(chatUser, value),
      )
        ? getTemplateFieldValue(
            chatUsers.find((chatUser) =>
              getTemplateFieldValue(chatUser, value),
            )!,
            value,
          )
        : "",
    };
  });

  return [...builtInOptions, ...dataOptions];
}

export function resolveTemplateParameterValues(
  mappings: TemplateParameterMappings,
  chatUser: TemplateChatUserRecord,
): Record<string, string> {
  const resolvedValues: Record<string, string> = {};

  Object.entries(mappings).forEach(([parameterName, mapping]) => {
    const overrideValue = mapping.overrideValue?.trim();
    if (overrideValue) {
      resolvedValues[parameterName] = overrideValue;
      return;
    }

    const mappedValue = getTemplateFieldValue(chatUser, mapping.sourceKey);
    if (mappedValue) {
      resolvedValues[parameterName] = mappedValue;
    }
  });

  return resolvedValues;
}

export function extractTemplateParameters(
  template: TemplateRecord,
): TemplateParameter[] {
  const parameters: TemplateParameter[] = [];
  const components = template.data?.components || [];
  const isNamed = template.data?.parameter_format === "NAMED";

  for (const component of components) {
    if (component.type === "HEADER" || component.type === "BODY") {
      if (isNamed && component.example?.body_text_named_params) {
        for (const param of component.example.body_text_named_params) {
          parameters.push({
            name: param.param_name,
            example: param.example,
            componentType: component.type,
          });
        }
      } else if (component.example?.header_text) {
        component.example.header_text.forEach((example, index) => {
          parameters.push({
            name: `header_${index + 1}`,
            example,
            componentType: "HEADER",
            index: index + 1,
          });
        });
      } else if (component.example?.body_text) {
        const bodyParams = component.example.body_text[0] || [];
        bodyParams.forEach((example, index) => {
          parameters.push({
            name: `body_${index + 1}`,
            example,
            componentType: "BODY",
            index: index + 1,
          });
        });
      } else if (component.text) {
        const regex = isNamed ? /\{\{(\w+)\}\}/g : /\{\{(\d+)\}\}/g;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(component.text)) !== null) {
          const paramName = match[1];
          if (!parameters.find((parameter) => parameter.name === paramName)) {
            parameters.push({
              name: paramName,
              example: "",
              componentType: component.type,
              index: isNamed ? undefined : parseInt(paramName, 10),
            });
          }
        }
      }
    }
  }

  return parameters;
}

export function generateTemplatePreview(
  template: TemplateRecord,
  values: Record<string, string>,
): { header?: string; body?: string; footer?: string } {
  const components = template.data?.components || [];
  const isNamed = template.data?.parameter_format === "NAMED";
  const result: { header?: string; body?: string; footer?: string } = {};

  for (const component of components) {
    let text = component.text || "";

    if (component.type === "HEADER" || component.type === "BODY") {
      if (isNamed) {
        text = text.replace(/\{\{(\w+)\}\}/g, (_, paramName) => {
          return values[paramName] || `{{${paramName}}}`;
        });
      } else {
        text = text.replace(/\{\{(\d+)\}\}/g, (_, index) => {
          const key =
            component.type === "HEADER" ? `header_${index}` : `body_${index}`;
          return values[key] || `{{${index}}}`;
        });
      }
    }

    if (component.type === "HEADER") {
      result.header = text;
    } else if (component.type === "BODY") {
      result.body = text;
    } else if (component.type === "FOOTER") {
      result.footer = text;
    }
  }

  return result;
}
