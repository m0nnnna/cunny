# Syncing this repo to the public fork

This repo (private) is your **testing/deploy** setup. The **public fork** [m0nnnna/cunny](https://github.com/m0nnnna/cunny) can be updated so its content matches this directory—full NekoChat layout (app in `cinny/`, token server, Docker, scripts)—while you keep this private repo for day-to-day work.

## One-time: add the fork as a remote

From the repo root:

```bash
git remote add fork https://github.com/m0nnnna/cunny.git
```

If you already have a remote named `fork`, use a different name (e.g. `cunny`) or update the URL:

```bash
git remote set-url fork https://github.com/m0nnnna/cunny.git
```

## Replace the fork with this directory

**You must push to the branch the fork displays as default.** Plain `git push fork` pushes your current branch to the *same* branch name on the fork (e.g. `main` → `fork/main`). The fork [m0nnnna/cunny](https://github.com/m0nnnna/cunny) uses **`dev`** as its default branch, so you need to push **into `dev`** or the fork page won’t show the new content.

Use this (run from your repo root):

```bash
# Push your current branch into the fork’s dev branch (what GitHub shows)
git push fork HEAD:dev --force
```

That means: “push whatever I have now (`HEAD`) to the remote `fork`, branch name `dev`, and overwrite it.” After this, refresh the fork on GitHub; you should see your layout (cinny/, livekit-token-server/, etc.).

If your fork is set to use **`main`** as default on GitHub:

```bash
git push fork HEAD:main --force
```

Your **private repo (origin)** is unchanged.

## Ongoing workflow

- Work and commit in this repo (private) as normal.
- When you want the public fork to match:
  ```bash
  git push fork HEAD:dev --force
  ```
- To pull from the fork into this repo (if you ever make changes on the fork):
  ```bash
  git fetch fork
  git merge fork/dev
  ```

## Remotes summary

| Remote   | URL                          | Use                    |
|----------|------------------------------|------------------------|
| `origin` | your private repo            | Daily work, testing    |
| `fork`   | https://github.com/m0nnnna/cunny | Public cunny/NekoChat mirror |

## Troubleshooting

- **“Nothing changed on the fork”** — You probably pushed to a different branch than the one GitHub shows. Use `git push fork HEAD:dev --force` (or `HEAD:main` if the fork default is `main`). Then open the fork and make sure you’re viewing the `dev` (or `main`) branch.
- **“Permission denied” / “Authentication failed”** — Push to GitHub over HTTPS or SSH. If you use HTTPS, a personal access token may be required instead of a password. If you use SSH, add the fork as `git@github.com:m0nnnna/cunny.git` and ensure your SSH key has access to that repo.
- **Check remotes:** `git remote -v` should show `fork` pointing to `https://github.com/m0nnnna/cunny.git` (or your SSH URL).
- **Check fork default branch:** On GitHub, open the fork → left sidebar under the repo name, click the branch dropdown (e.g. “dev” or “main”). That’s the branch you must push to.
