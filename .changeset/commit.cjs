const { exec } = require('child_process');
const { promisify } = require('node:util');

async function getGitBranch() {
  try {
    const { stdout } = await promisify(exec)('git rev-parse --abbrev-ref HEAD');
    return stdout.trimEnd();
  } catch (err) {
    throw Error('Could not get git branch: ' + err.message);
  }
}

async function getIssueNumber() {
  const regex = /^issues\/([0-9]+)$/;
  const branch = await getGitBranch();
  const match = branch.match(regex);
  if (!match || match.length != 2) {
    throw Error(`Invalid branch name: ${branch}. Should match ${regex}`);
  }
  return match[1];
}

async function getAddMessage(changeset) {
  const issue = await getIssueNumber();
  const lines = [`[changeset] ${changeset.summary}`, '', `closes #${issue}`];
  return lines.join('\n');
}

function getVersionMessage(releasePlan) {
  const releases = releasePlan.releases.filter((release) => release.type !== 'none');
  const lines = [`[release] Releasing ${releases.length} package(s)`];
  if (releases.length) {
    lines.push('', ...releases.map((release) => `- ${release.name}@${release.newVersion}`));
  }
  return lines.join('\n');
}

exports['default'] = {
  getAddMessage,
  getVersionMessage,
};
