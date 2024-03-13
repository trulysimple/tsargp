function getVersionMessage(releasePlan) {
  const releases = releasePlan.releases.filter((release) => release.type !== 'none');
  const lines = [`[release] Releasing ${releases.length} package(s)`];
  if (releases.length) {
    lines.push('', ...releases.map((release) => `- ${release.name}@${release.newVersion}`));
  }
  return lines.join('\n');
}

exports['default'] = {
  getVersionMessage,
};
