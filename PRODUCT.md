# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Engineers, hiring managers and founders who arrive from a link (GitHub, LinkedIn, X, a post shared somewhere) and
  decide in under a minute whether Rajiv knows his stuff and is worth contacting or reading.
- Readers who land on a single post from search or an AI answer and should find the next post worth reading.
- Agents and AI search tools that fetch the site for a user: they get clean Markdown per post and `/llms.txt`.

## Product Purpose

The personal site of Rajiv Kumar (brand rajiv.me): portfolio and writing. Success is a visitor leaving with four
impressions: "I met a person", "he knows his stuff", "I want to read more", "that was made with care".

## Positioning

A software engineer in New Delhi, shipping since 2019, who builds web and native apps, their backends and
infrastructure, and now spends much of his time putting language models to work inside real products. The AI depth is
shown, never titled: no "AI engineer" label. It shows through specifics (MCP servers and agent tools, LLM features in
production, evals and guardrails, coding agents as daily tools), the writing, and a site agents can read.

## Capabilities and Constraints

- Static Astro site, no backend, no login, no comments, no newsletter form.
- Routes: home, /writing, /writing/<slug>, /writing/<slug>.md, /llms.txt, /rss.xml, 404. No about or work page: the
  home page is the about page, with Now and Experience under the landing.
- Both themes (dark default), WCAG AA, reduced-motion paths, idle means zero work, no scroll listeners.

## Brand Commitments

- Voice: first person, plain, exact, short declaratives, no hype. Sentence case, no emoji, no em or en dashes.
- The hexagon mark in orange #ff5f1f; the Bits intro and the landing doodle are final (2026-10-30).
- The headline "Software you don't have to think about." with his name above it in orange.
- Name the employer only in the home page's Experience rows (Senior Frontend Engineer, swipejobs). Never "freelancer".
  Client work is never named or hinted at.

## Evidence on Hand

- Projects: css-only-tooltip (npm), Diver (Chrome Web Store), YouTube Playlist Info (web app), this site.
- Writing: six real posts (two from 2021 and 2023, four Material UI answers rewritten in 2026) and six placeholder
  posts on his AI and web topics, marked with a YAML comment and `draft: true`, so they are not built or listed
  until he has rewritten or confirmed each one (hidden 11 Nov, his call).
- Orca (a macOS menu bar timer that people and agents drive over MCP) is unreleased: mention only, no link, until it
  ships. Then it becomes a project with a screenshot.
- No testimonials, client logos, metrics or user counts exist. Never fabricate them.

## Product Principles

- Show, don't title: specifics and working artifacts over labels.
- Every page is easy to leave for the next good thing: a post always offers more writing.
- Calm by default: one authored motion moment (the intro and doodle), everything else quiet and fast.
