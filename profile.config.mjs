// ─────────────────────────────────────────────────────────────────────────────
//  Profile config — edit this file, push, and the "Refresh profile" workflow
//  rebuilds every card in assets/. Or run `npm run build` locally.
//
//  Text markup: "{cyan:word}" colours a word. Colours: text soft muted dim
//  cyan aqua teal gold sand coral green violet (add "Bold", e.g. {goldBold:x}).
// ─────────────────────────────────────────────────────────────────────────────

export default {
  login: 'rexade',

  header: {
    greeting: "Ahoy, I'm",
    title: 'rexade',
    tagline: 'games · dev tools · ai agents · pixel art',
  },

  // The typing terminal under the header. `{repos}`, `{since}`, `{year}` and
  // `{yearContributions}` are filled in from live GitHub data.
  terminal: {
    host: 'rexade@harbor',
    session: [
      { cmd: 'whoami', out: ['builder of {cyan:games}, {cyan:dev tools} & tiny {cyan:procedural worlds}.'] },
      {
        cmd: 'cat now.txt',
        out: [
          '{gold:•} {text:Tidebound Harbor} {dim:.......} isometric pirate action-ARPG in Godot 4',
          '{gold:•} {text:AI Runtime Harness} {dim:.....} giving AI agents eyes & hands on live apps',
          '{gold:•} {text:Termorchestra} {dim:..........} a terminal-first home for Claude, SSH & WSL',
        ],
      },
      { cmd: 'uptime', out: ['sailing since {gold:{since}} · {gold:{repos}} public repos · {gold:{yearContributions}} contributions in {year}'] },
    ],
  },

  // Tech stack tiles. `icon` is a simple-icons slug (https://simpleicons.org),
  // or use `text` for a lettered tile.
  stack: [
    {
      group: 'languages',
      items: [
        { icon: 'typescript', label: 'TypeScript' },
        { icon: 'javascript', label: 'JavaScript' },
        { icon: 'python', label: 'Python' },
        { text: 'C#', color: '#a179dc', label: 'C#' },
        { icon: 'cplusplus', label: 'C++' },
        { icon: 'lua', label: 'Lua' },
        { icon: 'gnubash', label: 'Bash' },
      ],
    },
    {
      group: 'game dev & art',
      items: [
        { icon: 'godotengine', label: 'Godot' },
        { icon: 'unity', label: 'Unity' },
        { icon: 'unrealengine', label: 'Unreal' },
        { icon: 'aseprite', label: 'Aseprite' },
        { icon: 'threedotjs', label: 'Three.js' },
      ],
    },
    {
      group: 'apps & web',
      items: [
        { icon: 'react', label: 'React' },
        { icon: 'nodedotjs', label: 'Node.js' },
        { icon: 'vite', label: 'Vite' },
        { icon: 'tauri', label: 'Tauri' },
        { icon: 'tailwindcss', label: 'Tailwind' },
        { icon: 'supabase', label: 'Supabase' },
      ],
    },
    {
      group: 'ai · tests · ops',
      items: [
        { icon: 'claudecode', label: 'Claude Code' },
        { icon: 'pytest', label: 'pytest' },
        { icon: 'robotframework', label: 'Robot FW' },
        { icon: 'vitest', label: 'Vitest' },
        { icon: 'githubactions', label: 'Actions' },
        { icon: 'raspberrypi', label: 'Pi' },
        { icon: 'linux', label: 'Linux' },
      ],
    },
  ],

  // Featured repos, rendered as cards (live stars/forks/language). Only public
  // repos are ever shown.
  projects: [
    {
      repo: 'tidebound-harbor-godot',
      name: 'Tidebound Harbor',
      icon: 'anchor',
      tag: 'Godot 4 · action-ARPG',
      status: 'sailing',
      description: 'Isometric pirate action-ARPG: fast boarding combat in a 2.5D harbour. Built in milestones with headless contract tests.',
    },
    {
      repo: 'ai-runtime-harness',
      name: 'AI Runtime Harness',
      icon: 'robot',
      tag: 'TypeScript · MCP',
      status: 'active',
      description: 'Gives AI agents eyes and hands on running apps: observe state, act, verify, replay, through a stable debug surface.',
    },
    {
      repo: 'terminalorchestrator',
      name: 'Termorchestra',
      icon: 'terminal',
      tag: 'Tauri 2 · React · xterm.js',
      status: 'v1',
      description: 'Terminal-first desktop app for Claude, SSH, WSL, servers and logs: real PTY sessions in a clean sidebar.',
    },
    {
      repo: 'ai-skill-library',
      name: 'ai-skill-library',
      icon: 'scroll',
      tag: 'Claude Code skills',
      status: 'tool',
      description: 'On-demand Claude Code skill packs (light, TDD, embedded, robot, CI...). Swap packs per project with one command.',
    },
    {
      repo: 'Aseprite-color-Shader-Ink-Sync-',
      name: 'Color Shader Ink Sync',
      icon: 'palette',
      tag: 'Aseprite · Lua',
      status: 'tool',
      description: "Colour-theory ramps for pixel art that sync straight into Aseprite's native Shading Ink.",
    },
    {
      repo: 'mini-planet',
      name: 'Mini Planet',
      icon: 'planet',
      tag: 'Three.js · procedural',
      status: 'toy',
      description: 'A procedurally generated 3D mini-planet in the browser. Reshape terrain, water, atmosphere and sunlight live.',
    },
  ],

  stats: {
    // Languages to leave out of the "cargo hold" chart.
    hideLanguages: ['HTML', 'CSS', 'SCSS', 'ShaderLab', 'HLSL', 'Batchfile', 'PowerShell', 'Dockerfile', 'Makefile', 'CMake'],
    // Repos to leave out of the language chart (the profile repo is always skipped).
    ignoreRepos: [],
    topLanguages: 6,
  },

  footer: {
    title: 'fair winds!',
    line: 'thanks for dropping anchor · see you on the high seas',
  },
};
