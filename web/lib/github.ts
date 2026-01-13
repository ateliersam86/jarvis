
/**
 * GitHub API Helper functions
 */

interface CreateIssueParams {
  accessToken: string;
  repoUrl: string; // e.g., https://github.com/owner/repo
  title: string;
  body: string;
  labels?: string[];
}

interface GitHubIssue {
  id: number;
  number: number;
  html_url: string;
  title: string;
  state: string;
}

export async function createGitHubIssue({ 
  accessToken, 
  repoUrl, 
  title, 
  body,
  labels = ['jarvis-task']
}: CreateIssueParams): Promise<GitHubIssue> {
  // Parse owner and repo from URL
  // Supports: https://github.com/owner/repo or https://github.com/owner/repo.git
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/);
  
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }

  const [, owner, repo] = match;

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      body,
      labels
    })
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`GitHub API Error: ${error.message || res.statusText}`);
  }

  return res.json();
}
