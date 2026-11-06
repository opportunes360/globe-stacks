# Globe Stacks: setup in 6 steps (all free)

You need: a computer, a GitHub account, a Cloudflare account.

## 1. Put the files on GitHub
1. On github.com click **New repository**. Name it `globe-stacks`. Choose **Public**. Click **Create repository**.
2. Click **uploading an existing file**.
3. Unzip `globe-stacks.zip` on your computer. Open the folder, select **everything inside it** (not the folder itself) and drag it into the GitHub page.
4. Wait for the upload to finish, then click **Commit changes**.

## 2. Publish it with Cloudflare Pages
1. In Cloudflare, open **Workers & Pages**, then **Create**, then the **Pages** tab, then **Connect to Git**.
2. Choose your `globe-stacks` repository.
3. Use these settings:
   - Framework preset: **None**
   - Build command: `node build.js`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
4. Click **Save and Deploy**. After about a minute you get a web address like `https://globe-stacks.pages.dev`.

## 3. Tell the site its real address
If your address is not exactly `https://globe-stacks.pages.dev`, edit `site.json` on GitHub (pencil icon) and change the `url` line. Do the same for `site_url` in `static/admin/config.yml`. Commit. The site rebuilds by itself.

## 4. Set up your editor (one time)
1. Open `static/admin/config.yml` on GitHub, click the pencil, and change `YOUR-GITHUB-USERNAME/globe-stacks` to your real name, for example `yourname/globe-stacks`. Commit.
2. On GitHub go to **Settings, Developer settings, Personal access tokens, Fine-grained tokens, Generate new token**.
   - Repository access: **Only select repositories**, then `globe-stacks`.
   - Permissions: **Contents: Read and write**.
   - Copy the token and keep it private (it is like a password).
3. Open `https://YOUR-SITE.pages.dev/admin/`, choose **Sign in with token**, and paste it.

## 5. Add a post
In the editor, open **Scholarships** or **Guides**, click **New**, fill the boxes, and click **Publish**. The site updates in about a minute.

Before you publish any scholarship: open the official link, check the dates and rules yourself, and set **Date you last checked**.

## 6. Test on a phone
Open the site in Chrome on your phone. You should see **Install app** at the top. Open a few pages, switch on airplane mode, and check they still open.
