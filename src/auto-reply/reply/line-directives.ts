export type ParseLineDirectivesInput = {
  text: string;
  [key: string]: unknown;
};

export type ParseLineDirectivesResult = {
  text: string;
  channelData?: {
    line?: {
      quickReplies?: string[];
      actions?: Array<{ label: string; data: string }>;
    };
  };
};

const DIRECTIVE_REGEX = /\[\[([a-z_]+):\s*([^\]]+)\]\]/gi;

export function hasLineDirectives(text: string): boolean {
  DIRECTIVE_REGEX.lastIndex = 0;
  return DIRECTIVE_REGEX.test(text);
}

export function parseLineDirectives(
  input: ParseLineDirectivesInput,
): ParseLineDirectivesResult {
  const text = input.text.replace(DIRECTIVE_REGEX, "");
  return { text };
}
