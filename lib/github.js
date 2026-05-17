// Fetches PR diff and metadata from GitHub API
export async function fetchPRData(prUrl) {
  // Parse owner, repo, PR number from URL like:
  // https://github.com/owner/repo/pull/123
  const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) throw new Error('Invalid GitHub PR URL. Must match format: https://github.com/owner/repo/pull/number');

  const [, owner, repo, prNumber] = match;
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'CodeSage-AI-App'
  };
  
  if (process.env.GITHUB_TOKEN && 
      process.env.GITHUB_TOKEN !== 'your_github_personal_access_token_here' && 
      process.env.GITHUB_TOKEN.trim() !== '') {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  // Fetch PR metadata
  const prRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    { headers, next: { revalidate: 0 } }
  );
  if (!prRes.ok) {
    if (prRes.status === 404) {
      throw new Error('Pull Request not found. Verify the URL and repository privacy.');
    }
    throw new Error(`GitHub API error: ${prRes.status} ${prRes.statusText}`);
  }
  const prData = await prRes.json();

  // Fetch PR diff
  const diffRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    { 
      headers: { 
        ...headers, 
        Accept: 'application/vnd.github.v3.diff' 
      },
      next: { revalidate: 0 }
    }
  );
  if (!diffRes.ok) throw new Error(`Could not fetch PR diff: ${diffRes.statusText}`);
  const diff = await diffRes.text();

  // Fetch changed files
  const filesRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
    { headers, next: { revalidate: 0 } }
  );
  if (!filesRes.ok) throw new Error(`Could not fetch changed files list: ${filesRes.statusText}`);
  const files = await filesRes.json();

  return {
    title: prData.title,
    description: prData.body || 'No description provided',
    author: prData.user.login,
    authorAvatar: prData.user.avatar_url,
    baseBranch: prData.base.ref,
    headBranch: prData.head.ref,
    changedFiles: files.length,
    additions: prData.additions,
    deletions: prData.deletions,
    diff,
    files,
  };
}
