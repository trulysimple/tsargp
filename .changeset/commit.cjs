const { exec } = require('child_process');
const { promisify } = require('node:util');

async function getGitBranch() {
  try {
    const { stdout } = await promisify(exec)('git rev-parse --abbrev-ref HEAD');
    return stdout;
  } catch (err) {
    throw Error('Could not get git branch: ' + err.message);
  }
}

async function getIssueNumber() {
  const regex = /issues\/([0-9]+)/;
  const branch = await getGitBranch();
  const match = branch.match(regex);
  if (match.length < 2) {
    throw Error(`Invalid branch name: ${branch}. Should match ${regex}`);
  }
  return match[1];
}

async function getAddMessage(changeset, options) {
  const issue = await getIssueNumber();
  const lines = [`[changeset] ${changeset.summary}`, '', `closes #${issue}`];
  if (options?.skipCI === 'add' || options?.skipCI === true) {
    lines.push('', '[skip ci]');
  }
  return lines.join('\n');
}

function getVersionMessage(releasePlan, options) {
  const releases = releasePlan.releases.filter((release) => release.type !== 'none');
  const lines = [`[release] Releasing ${releases.length} package(s)`];
  if (releases.length) {
    lines.push('', ...releases.map((release) => `- ${release.name}@${release.newVersion}`));
  }
  if (options?.skipCI === 'version' || options?.skipCI === true) {
    lines.push('', '[skip ci]');
  }
  return lines.join('\n');
}

exports['default'] = {
  getAddMessage,
  getVersionMessage,
};
