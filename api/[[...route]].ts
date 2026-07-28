// Vercel serverless function entry. Re-exports the already-bundled, alias-free
// output from `server`'s build (see server/src/vercel.ts) rather than letting
// Vercel's own function bundler try to resolve our workspace path aliases.
export { default } from '../server/dist/vercel.js'
