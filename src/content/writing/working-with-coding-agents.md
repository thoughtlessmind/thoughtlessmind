---
# Placeholder: replace with a real post.
title: How I work with coding agents
description: The setup I use with coding agents every day. House rules in the repo, small diffs, one owner per file, proof in a real browser, and nothing called done until I have seen it.
date: 2026-10-09
code: 'pnpm check && pnpm build'
---

I use coding agents every day (Claude Code, Codex and Cursor among them), and the agent matters less than the setup around it. An agent with clear rules and a way to check its own work does good work. The same agent with a vague ask and no checks writes a confident summary of code that doesn't run. Most of my effort goes into the setup.

## House rules live in the repo

Every project gets an instruction file at the root: `AGENTS.md`, with a `CLAUDE.md` that points at it for the tools that look there. It holds what a new colleague would need on day one: how to run things, where things live, and the rules that are easy to break. These are a few lines from the one for this site:

> Tokens only: no ad-hoc colours or fonts in components. Change a colour in `global.css` and nowhere else.
>
> Copy is sentence case. No emoji, no em or en dashes.
>
> Idle means zero work: stop rAF loops when nothing moves.
>
> Check changes at 1440 and 375 wide with a clean console before calling them done.

Each rule is short and checkable. "Write clean code" is useless to an agent and to me. "No em dashes" is something it can grep for. When an agent gets something wrong twice, that is a missing rule, and it goes in the file the same day. The file is a record of every mistake I don't want to explain again.

It also says what not to touch. This repo's `README.md` is my GitHub profile, and the file says so in as many words: never overwrite it. Agents are eager to tidy, and a sentence costs less than a revert.

## Small diffs, one owner per file

I give an agent one change at a time, small enough that I can read the whole diff. A big diff from an agent means a big review, and I review big diffs badly.

When I run several agents at once, each one owns a set of files and touches nothing else. One builds a component, one writes content, one handles a page. The ownership goes in the brief, with the shared contract each side can rely on, like props and file names. Agents that share files overwrite each other, and the last one to write wins without knowing it. Separate files make the merge boring, which is what I want from a merge.

## Done means shown

An agent will say a task is done when the code is written. For me, done means the checks pass and the change works where a user would see it. So the instruction file defines done:

```bash
pnpm check && pnpm build
```

Types clean, build passing, then the page opened in a real browser at both widths with the console clean. The agent does this itself before reporting back, and the report has to include the proof, like the command output and a screenshot. "Should work" is not a report.

The browser detail matters more than it sounds. A browser pane that is hidden behind another window pauses `requestAnimationFrame` and IntersectionObserver, so an animation can look broken when it isn't, and an agent will happily "fix" it. My instruction file says to check in a visible Chrome window for exactly that reason.

## Skills for jobs, hooks for rules

Anything I ask for more than a couple of times becomes a skill: a short file of instructions the agent loads when the task matches, like how to review a branch or how to make a video for a project. A skill keeps the instruction file short, because the steps for a job only load when that job comes up.

Rules that must hold every single time go in hooks, because a hook runs whether the model remembers or not. The classic one formats every file the agent edits. In Claude Code it lives in `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "jq -r '.tool_input.file_path' | xargs pnpm exec prettier --write" }]
      }
    ]
  }
}
```

The hook gets the tool call as JSON on stdin, pulls out the file path and formats it. The model never has to think about formatting again. A rule in the instruction file is a request. A hook is a guarantee.

## A second pass that didn't write the code

The agent that wrote a change is the worst one to review it. It knows what it meant, so it reads what it meant. I run review as a separate pass in a fresh context, given the diff and the original ask, and nothing else. It checks two things: does the change follow the house rules, and does it do what was asked. Those are different questions, and a change can pass one and fail the other.

Then I read the diff myself. Agents are fast, and they make a mess at the same speed if nobody looks. I don't merge a diff I haven't read.
