import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

import { describeChanges, parseFixed, shouldCheck } from './register'

const typed = (text: string) => ({ text, origin: { kind: 'composer' as const }, wait: false })

// The model is stood in for by a model.complete hook beneath the plugin: no real API call.
function fakeModel(on: On, reply: string) {
  const asked: string[] = []
  on('model.complete', async (_$, e) => {
    asked.push(e.prompt)
    const usage = { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }
    return { value: { isAnswered: true, text: reply, usage } }
  })
  return asked
}

function captureSubmit(on: On) {
  const seen: string[] = []
  on('prompt.submit', async (_$, e) => {
    seen.push(e.text)
    return { text: e.text }
  })
  return seen
}

test('rewrites a typed prompt with the corrected text', async ($, on) => {
  const asked = fakeModel(on, '<fixed>look up claude code mods</fixed>')
  const seen = captureSubmit(on)
  mock.store(on)

  await $.prompt.submit(typed('look uo claude code mods'))

  expect(asked.length).toBe(1)
  expect(seen).toEqual(['look up claude code mods'])
})

test('passes the prompt through when the model answers instead of fixing', async ($, on) => {
  const asked = fakeModel(on, '<fixed>Sure! Here is a long explanation of Claude Code mods and how they work.</fixed>')
  const seen = captureSubmit(on)
  mock.store(on)

  await $.prompt.submit(typed('look uo mods'))

  expect(asked.length).toBe(1)
  expect(seen).toEqual(['look uo mods'])
})

test('skips slash commands, code fences and non-human prompts without calling the model', async ($, on) => {
  const asked = fakeModel(on, '<fixed>x</fixed>')
  captureSubmit(on)
  mock.store(on)

  await $.prompt.submit(typed('/spellcheck off'))
  await $.prompt.submit(typed('fix this ```py\nprnt(1)\n```'))
  await $.prompt.submit({ ...typed('task finsihed ok'), origin: { kind: 'task-notification' } })

  expect(asked.length).toBe(0)
})

test('/spellcheck off stops the check', async ($, on) => {
  const asked = fakeModel(on, '<fixed>look up claude code mods</fixed>')
  const seen = captureSubmit(on)
  mock.store(on)

  const off = await $.command.run({
    command: 'spellcheck',
    args: 'off',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 120 },
  })
  expect(off.text).toBe('Spellcheck off.')
  await $.prompt.submit(typed('look uo claude code mods'))

  expect(asked.length).toBe(0)
  expect(seen).toEqual(['look uo claude code mods'])
})

test('helpers', () => {
  expect(shouldCheck('hi')).toBe(false)
  expect(shouldCheck('!ls -la')).toBe(false)
  expect(shouldCheck('make a mod')).toBe(true)
  expect(parseFixed('teh cat', 'no tags')).toBe(null)
  expect(parseFixed('teh cat', '<fixed>the cat</fixed>')).toBe('the cat')
  expect(describeChanges('look uo woth', 'look up with')).toBe('uo→up, woth→with')
})
