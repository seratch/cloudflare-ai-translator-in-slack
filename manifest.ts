/*
Head to https://api.slack.com/reference/manifests#config-tokens
echo 'SLACK_TOOLING_REFRESH_TOKEN=xoxe-1-...' > .env
brew install bun
bun add -d bun-types
Add "bun-types" to types in tsconfig.json
bun run manifest.ts
*/
import {
  ManifestParams,
  SlackAPIClient,
  SlackAPIClientOptions,
} from "slack-web-api-client";

const clientOptions: SlackAPIClientOptions = { logLevel: "DEBUG" };
const noTokenClient = new SlackAPIClient(undefined, clientOptions);

let accessToken = process.env.SLACK_TOOLING_ACCESS_TOKEN;
let needRefresh = true;
if (accessToken) {
  try {
    await noTokenClient.auth.test({ token: accessToken });
    needRefresh = false;
  } catch (e) {
    needRefresh = true;
  }
}
if (needRefresh) {
  const refreshToken = process.env.SLACK_TOOLING_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error("SLACK_TOOLING_REFRESH_TOKEN must be set");
  }
  const response = await noTokenClient.tooling.tokens.rotate({
    refresh_token: refreshToken,
  });
  await Bun.write(
    ".env",
    `SLACK_TOOLING_ACCESS_TOKEN=${response.token}\nSLACK_TOOLING_REFRESH_TOKEN=${response.refresh_token}\n`
  );
  accessToken = response.token;
}

const client = new SlackAPIClient(accessToken, clientOptions);
const authTest = await client.auth.test();

// for local development:
// brew install cloudflare/cloudflare/cloudflared
// cloudflared tunnel --url http://localhost:3000
const requestUrl =
  "https://cloudflare-ai-translator-in-slack.seratch.workers.dev";
const manifest: ManifestParams = {
  _metadata: { major_version: 2 },
  display_information: {
    name: "Cloudflare Translator",
    description: "Translate text leveraging Cloudflare AI",
    background_color: "#9e4608",
  },
  settings: {
    org_deploy_enabled: true,
    interactivity: {
      is_enabled: true,
      request_url: requestUrl,
    },
    event_subscriptions: {
      request_url: requestUrl,
      bot_events: ["app_mention"],
    },
  },
  features: {
    bot_user: { display_name: "Cloudflare Translator" },
  },
  oauth_config: {
    scopes: {
      bot: ["commands", "app_mentions:read", "chat:write", "chat:write.public"],
    },
  },
  functions: {
    translate: {
      title: "Translate text",
      description: "Translate a given text",
      input_parameters: {
        properties: {
          text: { type: "string" },
          source_lang: { type: "string" },
          target_lang: { type: "string" },
        },
        required: ["text", "target_lang"],
      },
      output_parameters: {
        properties: {
          translated_text: { type: "string" },
        },
        required: ["translated_text"],
      },
    },
    translation_input: {
      title: "Receive a translation request",
      description: "Receive user inputs to run AI translation",
      input_parameters: {
        properties: {
          interactivity: { type: "slack#/types/interactivity" },
        },
        required: ["interactivity"],
      },
      output_parameters: {
        properties: {
          text: { type: "string" },
          source_lang: { type: "string" },
          target_lang: { type: "string" },
        },
        required: ["text", "target_lang"],
      },
    },
  },
};
const result = await client.apps.manifest.create({ manifest });

// When you make changes after creating an app, you can call apps.manifest.update API instead:
// const result = await client.apps.manifest.update({ app_id: 'A067JMQ1LJF', manifest });

console.log("\n");
console.log("\n");
console.log("\n");
console.log(
  `!!! Visit https://api.slack.com/apps/${result.app_id} to install the app !!!`
);
console.log("\n");
console.log("\n");
console.log("\n");
