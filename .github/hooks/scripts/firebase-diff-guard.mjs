import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const FIREBASE_PATH_PATTERNS = [
  /^firestore\.rules$/,
  /^firebase-applet\.json$/,
  /^FIREBASE_SETUP\.md$/,
  /^src\/firebase\.ts$/,
  /^src\/App\.tsx$/,
  /^src\/types\.ts$/,
  /^src\/components\/TeacherDashboard\.tsx$/,
  /^src\/components\/StudentDashboard\.tsx$/,
];

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function parseJson(text) {
  if (!text || !text.trim()) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getChangedFiles(cwd) {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd,
    encoding: 'utf8',
    timeout: 5000,
  });

  if (result.status !== 0 || !result.stdout) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const statusAndPath = line.slice(3);
      if (statusAndPath.includes(' -> ')) {
        return statusAndPath.split(' -> ').pop();
      }
      return statusAndPath;
    })
    .filter(Boolean)
    .map((file) => file.replace(/\\/g, '/'));
}

function isFirebaseSensitive(path) {
  return FIREBASE_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

function readTranscriptText(transcriptPath) {
  if (!transcriptPath) {
    return '';
  }

  try {
    return readFileSync(transcriptPath, 'utf8');
  } catch {
    return '';
  }
}

function makeAllow(extraContext) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: 'firebase-diff-guard: policy checks passed.',
      additionalContext: extraContext,
    },
  };
}

function makeAsk(reason, extraContext) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: reason,
      additionalContext: extraContext,
    },
  };
}

function main() {
  const input = parseJson(readStdin());
  const toolName = input.tool_name || '';

  if (toolName !== 'task_complete') {
    process.stdout.write(JSON.stringify(makeAllow('')));
    return;
  }

  const cwd = input.cwd || process.cwd();
  const changedFiles = getChangedFiles(cwd);
  const firebaseFiles = changedFiles.filter(isFirebaseSensitive);

  if (firebaseFiles.length === 0) {
    process.stdout.write(JSON.stringify(makeAllow('')));
    return;
  }

  const transcriptText = readTranscriptText(input.transcript_path).toLowerCase();
  const lintSeen = /npm\s+run\s+lint/.test(transcriptText);
  const buildSeen = /npm\s+run\s+build/.test(transcriptText);
  const logsTouched = changedFiles.includes('.github/logs.md');

  const missing = [];
  if (!lintSeen) {
    missing.push('`npm run lint` evidence');
  }
  if (!buildSeen) {
    missing.push('`npm run build` evidence');
  }
  if (!logsTouched) {
    missing.push('an update to `.github/logs.md`');
  }

  const context = [
    `Firebase-sensitive files changed: ${firebaseFiles.join(', ')}`,
    'Before completing, confirm Firebase validation and closeout details from the firebase-change-safety workflow.',
  ].join('\n');

  if (missing.length > 0) {
    const reason = `firebase-diff-guard: missing ${missing.join(', ')} before completion.`;
    process.stdout.write(JSON.stringify(makeAsk(reason, context)));
    return;
  }

  process.stdout.write(JSON.stringify(makeAllow(context)));
}

main();