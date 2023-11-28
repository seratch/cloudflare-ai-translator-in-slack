import { Ai } from "@cloudflare/ai";
import {
  PlainTextOption,
  SlackApp,
  SlackEdgeAppEnv,
} from "slack-cloudflare-workers";

export interface Env extends SlackEdgeAppEnv {
  AI: any; // the binding parameter is typed as any on the library side
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const ai = new Ai(env.AI);
    const app = new SlackApp({ env });

    // The callback ID here must be consistent with the one in manifest.ts
    app.function("translate", async ({ context, payload }) => {
      const { client } = context;
      try {
        const inputs: {
          text: string;
          target_lang: string;
          source_lang?: string;
        } = {
          text: payload.inputs.text,
          target_lang: payload.inputs.target_lang,
        };
        if (payload.inputs.source_lang) {
          inputs.source_lang = payload.inputs.source_lang;
        }
        const aiResult = await ai.run("@cf/meta/m2m100-1.2b", inputs);
        await client.functions.completeSuccess({
          function_execution_id: context.functionExecutionId!,
          outputs: { translated_text: aiResult.translated_text },
        });
      } catch (e) {
        await client.functions.completeError({
          function_execution_id: context.functionExecutionId!,
          error: `Failed to handle function_executed event: ${e}`,
        });
      }
    });

    // As of November 2023, this remote function is not usuable on the Workflow Builder UI.
    // You will be able to choose this step on the UI in the near future.
    app.function("translation_input", async ({ context }) => {
      const { client } = context;
      try {
        // https://huggingface.co/facebook/m2m100_1.2B
        const languages: PlainTextOption[] = [
          { text: { type: "plain_text", text: "English" }, value: "en" },
          { text: { type: "plain_text", text: "French" }, value: "fr" },
          { text: { type: "plain_text", text: "Spanish" }, value: "es" },
          { text: { type: "plain_text", text: "German" }, value: "de" },
          { text: { type: "plain_text", text: "Portuguese" }, value: "pt" },
          { text: { type: "plain_text", text: "Japanese" }, value: "ja" },
          { text: { type: "plain_text", text: "Korean" }, value: "ko" },
          { text: { type: "plain_text", text: "Chinese" }, value: "zh" },
          { text: { type: "plain_text", text: "Arabic" }, value: "ar" },
          { text: { type: "plain_text", text: "Russian" }, value: "ru" },
        ];
        await client.views.open({
          trigger_id: context.triggerId!,
          view: {
            type: "modal",
            callback_id: "translation_input_modal",
            title: { type: "plain_text", text: "AI Translation" },
            submit: { type: "plain_text", text: "Submit" },
            blocks: [
              {
                type: "input",
                block_id: "text",
                label: { type: "plain_text", text: "Text" },
                element: {
                  type: "plain_text_input",
                  action_id: "input",
                  multiline: true,
                },
              },
              {
                type: "input",
                block_id: "source_lang",
                label: { type: "plain_text", text: "Source Language" },
                element: {
                  type: "static_select",
                  action_id: "input",
                  options: languages,
                  // You can change this to your usual language
                  initial_option: {
                    text: { type: "plain_text", text: "Japanese" },
                    value: "ja",
                  },
                },
                optional: true,
              },
              {
                type: "input",
                block_id: "target_lang",
                label: { type: "plain_text", text: "Target Language" },
                element: {
                  type: "static_select",
                  action_id: "input",
                  options: languages,
                  initial_option: {
                    text: { type: "plain_text", text: "English" },
                    value: "en",
                  },
                },
              },
            ],
          },
        });
      } catch (e) {
        await client.functions.completeError({
          function_execution_id: context.functionExecutionId!,
          error: `Failed to handle function_executed event: ${e}`,
        });
      }
    });

    app.view("translation_input_modal", async ({ payload, context }) => {
      const { client } = context;
      try {
        const values = payload.view.state.values;
        const text = values.text.input.value!;
        const source_lang = values.source_lang?.input?.selected_option?.value;
        const target_lang = values.target_lang.input.selected_option!.value;
        await client.functions.completeSuccess({
          function_execution_id: context.functionExecutionId!,
          outputs: { text, source_lang, target_lang },
        });
      } catch (e) {
        await client.functions.completeError({
          function_execution_id: context.functionExecutionId!,
          error: `Failed to handle view submission: ${e}`,
        });
      }
      return;
    });

    return await app.run(request, ctx);
  },
};
