import { getUncachableGitHubClient, getGitHubUsername } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const REPO_NAME = 'CRM';

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.replit',
  '.upm',
  '.config',
  '.cache',
  'dist',
  '.npm',
  'package-lock.json',
  '*.log',
  '.env',
  'project-export.zip',
  'APP_CAPABILITIES.pdf',
  'attached_assets',
  'android',
  'ios',
  '.eslintrc',
  '.prettierrc',
  'replit.nix',
  '.breakpoints',
  'snippets',
  'generated-icon.png',
  '*.d.ts',
];

function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split('/');
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.startsWith('*')) {
      const ext = pattern.slice(1);
      if (filePath.endsWith(ext)) return true;
    } else {
      if (parts.includes(pattern)) return true;
      if (filePath === pattern) return true;
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
    
    if (shouldIgnore(relativePath)) continue;
    if (entry.name.startsWith('.')) continue;
    
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

async function pushToGitHub() {
  try {
    console.log('Getting GitHub username...');
    const username = await getGitHubUsername();
    console.log(`Authenticated as: ${username}`);

    const octokit = await getUncachableGitHubClient();

    // Check if repo exists, create if not
    try {
      await octokit.repos.get({ owner: username, repo: REPO_NAME });
      console.log(`Repository ${REPO_NAME} exists`);
    } catch (e: any) {
      if (e.status === 404) {
        console.log(`Creating repository ${REPO_NAME}...`);
        await octokit.repos.createForAuthenticatedUser({
          name: REPO_NAME,
          description: 'Life Safety Ops - Professional UK regulation-compliant life safety operations and compliance management platform',
          private: false,
          auto_init: true,
        });
        console.log('Repository created, waiting for initialization...');
        await sleep(3000);
      } else {
        throw e;
      }
    }

    let mainSha: string;
    let attempts = 0;
    while (attempts < 5) {
      try {
        const { data: refData } = await octokit.git.getRef({
          owner: username,
          repo: REPO_NAME,
          ref: 'heads/main',
        });
        mainSha = refData.object.sha;
        break;
      } catch (e) {
        attempts++;
        console.log(`Waiting for repository initialization... (attempt ${attempts})`);
        await sleep(2000);
      }
    }
    
    if (!mainSha!) {
      // Initialize with README if empty
      console.log('Initializing empty repository...');
      await octokit.repos.createOrUpdateFileContents({
        owner: username,
        repo: REPO_NAME,
        path: 'README.md',
        message: 'Initial commit',
        content: Buffer.from('# Life Safety Ops CRM\n\nProfessional UK regulation-compliant life safety operations and compliance management platform.\n').toString('base64'),
      });
      await sleep(2000);
      
      const { data: refData } = await octokit.git.getRef({
        owner: username,
        repo: REPO_NAME,
        ref: 'heads/main',
      });
      mainSha = refData.object.sha;
    }
    
    console.log(`Main branch SHA: ${mainSha!}`);

    const baseDir = process.cwd();
    let allFiles = getAllFiles(baseDir);
    
    allFiles = [...new Set(allFiles)];
    
    console.log(`Found ${allFiles.length} files to upload`);

    const tree: Array<{path: string; mode: '100644'; type: 'blob'; sha: string}> = [];
    
    console.log('Creating blobs...');
    let uploadedCount = 0;
    let failedFiles: string[] = [];
    
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
        
        tree.push({
          path: filePath,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha,
        });
      } catch (error: any) {
        if (error.status === 403 && error.message?.includes('rate limit')) {
          console.log(`  Rate limited, waiting 60s...`);
          await sleep(60000);
          
          try {
            const content = fs.readFileSync(fullPath);
            const { data: blobData } = await octokit.git.createBlob({
              owner: username,
              repo: REPO_NAME,
              content: content.toString('base64'),
              encoding: 'base64',
            });
            
            tree.push({
              path: filePath,
              mode: '100644',
              type: 'blob',
              sha: blobData.sha,
            });
          } catch (retryError) {
            console.log(`  Failed to upload: ${filePath}`);
            failedFiles.push(filePath);
          }
        } else {
          console.log(`  Failed to upload: ${filePath} - ${error.message}`);
          failedFiles.push(filePath);
        }
      }
      
      uploadedCount++;
      if (uploadedCount % 50 === 0) {
        console.log(`  Processed ${uploadedCount}/${allFiles.length} files...`);
        await sleep(500);
      }
    }
    
    console.log(`  Processed ${uploadedCount}/${allFiles.length} files`);
    
    if (failedFiles.length > 0) {
      console.log(`\n  ${failedFiles.length} files failed to upload`);
    }
    
    if (tree.length === 0) {
      throw new Error('No files were successfully uploaded');
    }
    
    console.log(`Creating tree with ${tree.length} files...`);
    const { data: treeData } = await octokit.git.createTree({
      owner: username,
      repo: REPO_NAME,
      tree,
      base_tree: mainSha!,
    });

    console.log('Creating commit...');
    const { data: commitData } = await octokit.git.createCommit({
      owner: username,
      repo: REPO_NAME,
      message: 'Life Safety Ops - Complete codebase\n\nProfessional UK regulation-compliant life safety operations and compliance management platform.',
      tree: treeData.sha,
      parents: [mainSha!],
    });

    console.log('Updating main branch...');
    await octokit.git.updateRef({
      owner: username,
      repo: REPO_NAME,
      ref: 'heads/main',
      sha: commitData.sha,
      force: true,
    });

    console.log('\n✅ Successfully pushed to GitHub!');
    console.log(`\n📂 Repository URL: https://github.com/${username}/${REPO_NAME}`);

  } catch (error: any) {
    console.error('Error:', error.message || error);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

pushToGitHub();
