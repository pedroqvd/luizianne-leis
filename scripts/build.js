const { execSync } = require('child_process');

try {
  if (process.env.RENDER) {
    console.log('[Build] Detected Render environment. Building only API...');
    execSync('npm run build --workspace=@luizianne/api', { stdio: 'inherit' });
  } else if (process.env.VERCEL) {
    console.log('[Build] Detected Vercel environment. Building only Web...');
    execSync('npm run build --workspace=@luizianne/web', { stdio: 'inherit' });
  } else {
    console.log('[Build] Local/Default environment. Building all workspaces...');
    execSync('npm run build --workspaces --if-present', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('[Build] Build script failed:', error.message);
  process.exit(1);
}
