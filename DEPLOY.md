# Deployment Guide

## Option 1: Railway (Recommended)

1.  **Push to GitHub**: Make sure this code is in a GitHub repository.
2.  **Create Project**: Go to [Railway.app](https://railway.app/) and create a new project.
3.  **Deploy from GitHub**: Select your repository.
4.  **Configuration**: Railway should automatically detect the `Dockerfile`.
5.  **Variables**: If you have a `DWR_API_KEY`, add it in the "Variables" tab.
6.  **Public URL**: Go to "Settings" -> "Networking" and generate a domain.
7.  **Use**: Your MCP server URL will be `https://<your-railway-url>/sse`.

## Option 2: Render

1.  **Push to GitHub**.
2.  **Create Web Service**: Go to [Render.com](https://render.com/) and create a new "Web Service".
3.  **Connect GitHub**: Select your repository.
4.  **Runtime**: Select "Docker".
5.  **Plan**: Select the "Free" plan (note: it will spin down after inactivity, causing a delay on the first request).
6.  **Deploy**: Click "Create Web Service".
7.  **Use**: Your MCP server URL will be `https://<your-render-url>/sse`.
