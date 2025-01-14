# fragments
A node.js based REST API using express. It includes various scripts to run the server in different modes.

# Available Scripts
Below are the scripts available in this project, along with their usage instructions.

## lint

Run the 'lint' to check for code style and potential errors. It checks for any linting errors using ESLint.

```bash
npm run lint
```
## start
Runs the server normally, without any additional development tools or debugging capabilities.

```bash
npm start
```

## dev

This script starts the server in development mode, using nodemon. Nodemon watches for file changes in the src/ folder and automatically restarts the server when changes are detected.

```bash
npm run dev
```

## debug

This script starts the server in debug mode, using nodemon and enabling the Node.js inspector. We have attached VSCode debugger to the server for in-depth debugging.

```bash
npm run debug
```
