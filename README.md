# Workers API Translator in Slack

This repository concisely demonstrates a way to utilize [Cloudflare Workers AI](https://blog.cloudflare.com/workers-ai/) within Slack's workflows. Please bear in mind that this "remote" type of custom function in Slack's automation platform is currently in beta. The details can be changed until its GA date. 

This app runs on the [Cloudflare Workers](https://workers.cloudflare.com/) platform with its AI feature enabled. The [slack-cloudflare-workers](https://github.com/seratch/slack-cloudflare-workers) library provides the toolset for swiftly creating such an app in TypeScript.

## Clone this repo

```bash
git clone git@github.com:seratch/cloudflare-ai-translator-in-slack.git
cd cloudflare-ai-translator-in-slack/
```

## Create a new remote-funtion app

As of November 2023, you need to utilize either [Slack CLI](https://api.slack.com/automation/cli/install) commands or [`apps.manifest.create` API](https://api.slack.com/methods/apps.manifest.create) when initiating the development of a new Slack app that provides remote functions. This guide shows how to perform the API call without installing Slack CLI.

### Create Cloudflare Tunnel for local development

In this guide, you will first confirm whether the app functions as anticipated on your local machine, before deploying the app on Cloudflare Workers. To accomplish this smoothly, you'll need to amend the app's manifest data to utilize the public URLs of the local app.

Start by initiating a new tunnel for local development. You can do this by executing the following command:

```bash
# For other platforms: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel --url http://localhost:3000
```

Then, you will see the outputs like this:
```
$ cloudflared tunnel --url http://localhost:3000
2023-11-23T08:33:52Z INF Thank you for trying Cloudflare Tunnel. Doing so, without a Cloudflare account, is a quick way to experiment and try it out. However, be aware that these account-less Tunnels have no uptime guarantee. If you intend to use Tunnels in production you should use a pre-created named tunnel by following: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps
2023-11-23T08:33:52Z INF Requesting new quick Tunnel on trycloudflare.com...
2023-11-23T08:33:53Z INF +--------------------------------------------------------------------------------------------+
2023-11-23T08:33:53Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2023-11-23T08:33:53Z INF |  https://maps-victim-warm-registration.trycloudflare.com                                   |
2023-11-23T08:33:53Z INF +--------------------------------------------------------------------------------------------+
2023-11-23T08:33:53Z INF Cannot determine default configuration path. No file [config.yml config.yaml] in [~/.cloudflared ~/.cloudflare-warp ~/cloudflare-warp /etc/cloudflared /usr/local/etc/cloudflared]
2023-11-23T08:33:53Z INF Version 2023.8.2
2023-11-23T08:33:53Z INF GOOS: darwin, GOVersion: go1.20.7, GoArch: amd64
2023-11-23T08:33:53Z INF Settings: map[ha-connections:1 protocol:quic url:http://localhost:3000]
2023-11-23T08:33:53Z INF cloudflared will not automatically update when run from the shell. To enable auto-updates, run cloudflared as a service: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/run-tunnel/as-a-service/
2023-11-23T08:33:53Z INF Generated Connector ID: 65df45f4-8ab7-48fd-ad0b-4e52847c5924
2023-11-23T08:33:53Z INF Initial protocol quic
2023-11-23T08:33:53Z INF ICMP proxy will use 192.168.68.112 as source for IPv4
2023-11-23T08:33:53Z INF ICMP proxy will use fe80::10a5:5e5a:9e14:f080 in zone en0 as source for IPv6
2023-11-23T08:33:53Z INF Created ICMP proxy listening on 192.168.68.112:0
2023-11-23T08:33:53Z INF Created ICMP proxy listening on [fe80::10a5:5e5a:9e14:f080%en0]:0
2023-11-23T08:33:53Z INF Starting metrics server on 127.0.0.1:61237/metrics
2023-11-23T08:33:53Z WRN Your version 2023.8.2 is outdated. We recommend upgrading it to 2023.10.0
2023-11-23T08:33:54Z INF Registered tunnel connection connIndex=0 connection=d6531124-06de-4034-9f30-058c7a14e8a7 event=0 ip=198.41.200.23 location=kix04 protocol=quic
```

In this case, `https://maps-victim-warm-registration.trycloudflare.com/` is the public URL receiving requests from Slack. Open `manifest.ts` and replace the `requestUrl` variable in the code with this string.

### Perform an apps.manifest.create API call

Alright, the manifest data is now prepared, so let's proceed to make the API call.

Head to https://api.slack.com/reference/manifests#config-tokens and grab your refresh token:

<img width="500" src="https://user-images.githubusercontent.com/19658/285134796-0f4669b0-ccc5-4fae-917c-78e2f3238346.png">

You will use `.env` file located in the root directory of this project.

```bash
echo 'SLACK_TOOLING_REFRESH_TOKEN=xoxe-1-...' > .env
```

Let's use [Bun](https://bun.sh/docs/installation) for quickly running `src/manifest.ts`. If you're on macOS, the following commands set up the `bun` command for you:
```bash
brew install bun
bun add -d bun-types
```

Everything is set! Execute the command provided below to create a new Slack app with remote functions:

```bash
bun run manifest.ts
```

If everything goes well, you will see a mesage like `!!! Visit https://api.slack.com/apps/{app_id} to install the app !!!` on the terminal. Click the URL and install the app into your Slack workspace.

## Configure secrets

To configure your app, copy the following two secrets:

* SLACK_SIGNING_SECRET: Settings > Basic Information > App Credentials > Signing Secret
* SLACK_BOT_TOKEN: Settings > Install App > Bot User OAuth Token

To run the app locally, create `.dev.vars` file with the following content:
```
SLACK_SIGNING_SECRET=...
SLACK_BOT_TOKEN=xoxb-...
SLACK_LOGGING_LEVEL=DEBUG
```

## Run the app on your local machine

When you hit `npm start` on the termimnal, you will see the outputs like this:

```
$ npm start

> my-remote-func@0.0.0 start
> wrangler dev --remote --port 3000

 ⛅️ wrangler 3.17.1
-------------------
Using vars defined in .dev.vars
Your worker has access to the following bindings:
- Vars:
  - SLACK_SIGNING_SECRET: "(hidden)"
  - SLACK_BOT_TOKEN: "(hidden)"
  - SLACK_LOGGING_LEVEL: "(hidden)"
⎔ Starting local server...
[mf:inf] Ready on http://*:3000
[mf:inf] - http://127.0.0.1:3000
[mf:inf] - http://192.168.68.112:3000
[mf:inf] - http://localhost:3000
[mf:inf] - http://[::1]:3000
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ [b] open a browser, [d] open Devtools, [l] turn off local mode, [c] clear console, [x] to exit                                         │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

Once your remote function has been installed to your Slack workspace or organization, you can utilize the custom step in the Workflow Builder as follows:

<img width="600" src="https://github.com/seratch/cloudflare-ai-translator-in-slack/assets/19658/f81b3d16-73b7-403f-a579-a9dbd980fb8a">

Share the trigger URL for the workflow either in a channel or a canvas document. Clicking the link button initiates the workflow. The execution of your custom step within this workflow triggers a 'function_executed' event in your Cloudflare Workers app.

<img src="https://github.com/seratch/cloudflare-ai-translator-in-slack/assets/19658/e8bc00b8-05f0-410e-8836-3ea0a8739b24" width=500>

## Deploy the app

Now that the app is working, you can deploy this app onto Cloudflare Workers as a service ready for production. To do so, execute the commands mentioned below. You can go with the secrets that are already available in the `dev.vars` file.

```bash
wrangler deploy
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN
```

Lastly, head to `https://api.slack.com/apps/{app_id}` and finalize the two request URLs (Interactivity & Shortcuts, Event Subcriptions) to use the Cloudflware Workers URL like `https://cloudflare-ai-translator-in-slack.{your account here}.workers.dev`.

## Build your own remote function

You can customize the code in this repo to use a different AI model provided by [Cloudflare Workers AI](https://blog.cloudflare.com/workers-ai/). No configuration changes are required.

Please note, it is necessary to call either `functions.completeSuccess` or `functions.completeError` API. This action is required to instruct Slack's workflow to proceed to the subsequent step, or abort the workflow execution respectively. You can refer to `src/index.ts` for guidance on how to implement these API calls within the code.

Enjoy!
