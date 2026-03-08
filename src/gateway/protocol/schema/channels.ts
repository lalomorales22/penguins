import { Type } from "@sinclair/typebox";

export const TalkModeParamsSchema = Type.Object(
  {
    enabled: Type.Boolean(),
    phase: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const TalkConfigParamsSchema = Type.Object(
  {
    includeSecrets: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

export const TalkConfigResultSchema = Type.Object(
  {
    config: Type.Object(
      {
        talk: Type.Optional(
          Type.Object(
            {
              voiceId: Type.Optional(Type.String()),
              voiceAliases: Type.Optional(Type.Record(Type.String(), Type.String())),
              modelId: Type.Optional(Type.String()),
              outputFormat: Type.Optional(Type.String()),
              apiKey: Type.Optional(Type.String()),
              interruptOnSpeech: Type.Optional(Type.Boolean()),
            },
            { additionalProperties: false },
          ),
        ),
        session: Type.Optional(
          Type.Object(
            {
              mainKey: Type.Optional(Type.String()),
            },
            { additionalProperties: false },
          ),
        ),
        ui: Type.Optional(
          Type.Object(
            {
              seamColor: Type.Optional(Type.String()),
            },
            { additionalProperties: false },
          ),
        ),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const WebLoginStartParamsSchema = Type.Object(
  {
    force: Type.Optional(Type.Boolean()),
    timeoutMs: Type.Optional(Type.Integer({ minimum: 0 })),
    verbose: Type.Optional(Type.Boolean()),
    accountId: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const WebLoginWaitParamsSchema = Type.Object(
  {
    timeoutMs: Type.Optional(Type.Integer({ minimum: 0 })),
    accountId: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);
