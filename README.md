# Footage

Vite dashboard for reviewing pole inspection and typical-checker sessions.

## Local development

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Deploy to GitHub and Vercel

1. Create an empty repository on GitHub.
2. From this folder, initialize Git and push the project:

   ```bash
   git init
   git add .
   git commit -m "Initial project setup"
   git branch -M main
   git remote add origin https://github.com/<your-user>/<your-repository>.git
   git push -u origin main
   ```

3. In Vercel, choose **Add New Project**, import the GitHub repository, and deploy.
4. Vercel uses `vercel.json` to run `npm run build` and serve the `dist` folder.

The generated Pole Inspector and Typical Checker builds are kept under `public/`, so the dashboard can load them after deployment.
