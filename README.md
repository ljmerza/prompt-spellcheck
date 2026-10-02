# prompt-spellcheck

A Claude Code plugin that fixes spelling mistakes and typos in your prompt before the model reads it.

```
you type:     look uo claude code mods woth tests
model reads:  look up claude code mods with tests
toast:        ✎ spellcheck: uo→up, woth→with
```

When you press Enter, the plugin sends the prompt to a small, fast model (Haiku) with instructions to fix spelling only. Wording, punctuation, code, paths, URLs, flags and ticket keys stay as typed. The corrected text replaces the prompt, and a toast lists what changed.

## Install

From a marketplace:

```
/plugin marketplace add ljmerza/prompt-spellcheck
/plugin install prompt-spellcheck@prompt-spellcheck
```

From a clone:

```
git clone https://github.com/ljmerza/prompt-spellcheck.git
claude --plugin-dir prompt-spellcheck/plugins/prompt-spellcheck
```

`CLAUDE_CODE_PLUGIN_DIRS=/path/to/prompt-spellcheck/plugins/prompt-spellcheck` does the same where you can't pass a flag (desktop app, SDK hosts).

The plugin is written against Claude Code's function-hook API (`hooks.json` `"modules"`), which is in early access and can change between releases. Built and tested on Claude Code 2.1.287.

## Usage

The check runs on every prompt you type. Toggle it with:

```
/spellcheck off
/spellcheck on
/spellcheck status
```

The setting persists across sessions.

## What it skips

- Slash commands (`/…`) and shell-mode input (`!…`)
- Prompts containing a code fence
- Prompts under two words or over 4,000 characters
- Prompts that didn't come from you: background-task notifications, scheduled runs, messages from other sessions, auto-continuations

## When the check fails

Your prompt goes through unchanged when:

- the model takes longer than 8 seconds
- the API returns an error
- the reply isn't wrapped in `<fixed>` tags
- the reply's length differs from the original by more than 20–25% (this guards against the model answering the prompt instead of correcting it)

## Cost and privacy

Each checked prompt is one extra Haiku request on your own Claude Code account, through the same client and provider as the rest of the session. It adds that request's latency to every submit. Turn it off with `/spellcheck off` when you don't want it.

## Changing the model

The model is set by `MODEL` in `plugins/prompt-spellcheck/hooks/register.ts`. Any alias or model ID that `--model` accepts works there.

## Development

```
claude plugin validate plugins/prompt-spellcheck
claude plugin test plugins/prompt-spellcheck
```

The tests replace the model with a fake `model.complete` hook, so they make no API calls.

## License

MIT
