# Duet API Server

### Getting Started
```
npm i
```
##### Nodemon
nodemon is a tool that helps develop node.js based applications by automatically restarting the node application when file changes in the directory are detected. Recommended to install globally.

```
npm install -g nodemon
```
To start the server locally using `/src` files:
```
nodemon --exec npm run start-dev
```
When adding changes to the `/src` folder, remember to build them into the `/dist` folder
```
npm run build
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
