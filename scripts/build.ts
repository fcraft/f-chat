import concurrently from 'concurrently';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

const colorConsole = {
  info: (...args: any[]) => {
    console.log(
      `\x1B[34m[open-chat] ${'%s'.repeat(args.length)}\x1B[0m`,
      ...args
    );
  },
  warn: (...args: any[]) => {
    console.log(
      `\x1B[33m[open-chat] ${'%s'.repeat(args.length)}\x1B[0m`,
      ...args
    );
  },
  success: (...args: any[]) => {
    console.log(
      `\x1B[32m[open-chat] ${'%s'.repeat(args.length)}\x1B[0m`,
      ...args
    );
  },
  error: (...args: any[]) => {
    console.log(
      `\x1B[31m[open-chat] ${'%s'.repeat(args.length)}\x1B[0m`,
      ...args
    );
  },
};

// Build client and server using concurrently
colorConsole.info('Start Building...');
const platform = os.platform();
const basePath = path.resolve(__dirname, '../');
let buildCommands: string[];

if (platform === 'win32') {
  buildCommands = [
    'cd ./server',
    'set GOOS=linux GOARCH=amd64 && go build -o dist\\FChat_linux_amd64',
    'set GOOS=darwin GOARCH=amd64 && go build -o dist\\FChat_darwin_amd64',
    'set GOOS=windows GOARCH=amd64 && go build -o dist\\FChat_windows_amd64.exe'
  ];
} else {
  buildCommands = [
    'cd ./server',
    'GOOS=linux GOARCH=amd64 go build -o dist/FChat_linux_amd64',
    'GOOS=darwin GOARCH=amd64 go build -o dist/FChat_darwin_amd64',
    'GOOS=windows GOARCH=amd64 go build -o dist/FChat_windows_amd64.exe'
  ];
}

const {result} = concurrently(
  [
    {command: 'pnpm run build:client', name: 'client'},
    {
      command: buildCommands.join(' && '),
      name: 'server'
    },
  ],
  {
    prefix: 'build-{name}',
    killOthers: ['failure'],
    restartTries: 1,
    cwd: basePath,
  }
);

result
  .then(() => {
    // Concurrent tasks are completed
    colorConsole.info('✓ Build Completed.');

    try {
      // Copy file to ./dist
      colorConsole.info('Start Copying Dist Files...');

      const distPath = path.resolve(basePath, './dist');
      !fs.existsSync(distPath) && fs.mkdirSync(distPath);

      fs.cpSync(
        path.resolve(basePath, './client/dist'),
        path.resolve(distPath, './client'),
        {recursive: true}
      );
      fs.cpSync(
        path.resolve(basePath, './server/dist'),
        path.resolve(distPath, './server'),
        {recursive: true}
      );

      colorConsole.success('✓ Copy Completed.');
    } catch (e) {
      colorConsole.error(e);
    }
  })
  .catch((e: any) => {
    // Error during concurrent tasks
    colorConsole.error(e);
  });
