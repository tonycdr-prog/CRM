import { getUncachableGitHubClient, getGitHubUsername } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const REPO_NAME = 'CRM';
const BRANCH_NAME = 'feature/modern-minimal-redesign';

const IGNORE_PATTERNS = [
  'node_modules', '.git', '.replit', '.upm', '.config', '.cache', 'dist', '.npm',
  'package-lock.json', '*.log', '.env', 'project-export.zip', 'APP_CAPABILITIES.pdf',
  'attached_assets', 'android', 'ios', '.eslintrc', '.prettierrc', 'replit.nix',
  '.breakpoints', 'snippets', 'generated-icon.png', '*.d.ts',
];

function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split('/');
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.startsWith('*')) {
      if (filePath.endsWith(pattern.slice(1))) return true;
    } else {
      if (parts.includes(pattern) || filePath === pattern) return true;
    }
  }
  return false;
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    if (shouldIgnore(relativePath) || entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  return files;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pushToBranch() {
  try {
    console.log('Getting GitHub username...');
    const username = await getGitHubUsername();
    console.log(`Authenticated as: ${username}`);

    const octokit = await getUncachableGitHubClient();

    // Get branch SHA
    const { data: refData } = await octokit.git.getRef({
      owner: username,
      repo: REPO_NAME,
      ref: `heads/${BRANCH_NAME}`,
    });
    const branchSha = refData.object.sha;
    console.log(`Branch SHA: ${branchSha}`);

    const baseDir = process.cwd();
    let allFiles = [...new Set(getAllFiles(baseDir))];
    console.log(`Found ${allFiles.length} files to upload`);

    const tree: Array<{path: string; mode: '100644'; type: 'blob'; sha: string}> = [];
    
    console.log('Creating blobs...');
    let uploadedCount = 0;
    
    for (const filePath of allFiles) {
      const fullPath = path.join(baseDir, filePath);
      try {
        const content = fs.readFileSync(fullPath);
        const { data: blobData } = await octokit.git.createBlob({
          owner: username,
          repo: REPO_NAME,
          content: content.toString('base64'),
          encoding: 'base64',
        });
        tree.push({ path: filePath, mode: '100644', type: 'blob', sha: blobData.sha });
      } catch (error: any) {
        if (error.status === 403 && error.message?.includes('rate limit')) {
          console.log('Rate limited, waiting 60s...');
          await sleep(60000);
          const content = fs.readFileSync(fullPath);
          const { data: blobData } = await octokit.git.createBlob({
            owner: username,
            repo: REPO_NAME,
            content: content.toString('base64'),
            encoding: 'base64',
          });
          tree.push({ path: filePath, mode: '100644', type: 'blob', sha: blobData.sha });
        }
      }
      uploadedCount++;
      if (uploadedCount % 50 === 0) {
        console.log(`  Processed ${uploadedCount}/${allFiles.length} files...`);
        await sleep(500);
      }
    }
    
    console.log(`Creating tree with ${tree.length} files...`);
    const { data: treeData } = await octokit.git.createTree({
      owner: username,
      repo: REPO_NAME,
      tree,
      base_tree: branchSha,
    });

    console.log('Creating commit...');
    const { data: commitData } = await octokit.git.createCommit({
      owner: username,
      repo: REPO_NAME,
      message: 'Modern minimal redesign\n\n- Updated colour scheme with teal-blue accent\n- Cleaner landing page hero and sections\n- Simplified typography and spacing\n- New design guidelines\n- Generated app icon',
      tree: treeData.sha,
      parents: [branchSha],
    });

    console.log('Updating branch...');
    await octokit.git.updateRef({
      owner: username,
      repo: REPO_NAME,
      ref: `heads/${BRANCH_NAME}`,
      sha: commitData.sha,
      force: true,
    });

    console.log('\n✅ Successfully pushed to feature branch!');
    console.log(`\n📂 Branch URL: https://github.com/${username}/${REPO_NAME}/tree/${BRANCH_NAME}`);
    console.log(`\n🔀 Create PR: https://github.com/${username}/${REPO_NAME}/compare/main...${BRANCH_NAME}`);

  } catch (error: any) {
    console.error('Error:', error.message || error);
    process.exit(1);
  }
}

pushToBranch();
