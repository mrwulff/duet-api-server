# Duet API Server

### Getting Started
```
npm i
```
##### ENV Variables
Create a `.env` file in the root of the repo and find env vars on Notion here: https://www.notion.so/env-Files-19e14fc506ca44a08e2728d55c4c4de0

##### Nodemon
nodemon is a tool that helps develop node.js based applications by automatically restarting the node application when file changes in the directory are detected. Recommended to install globally.

```
npm install -g nodemon
```
To start the server locally using `/src` files:
```
nodemon --exec npm run start-dev
```

##### Running server
In development:
```
npm run start-dev
```
In production:
```
npm run start
```
