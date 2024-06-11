const path = require('path');

const fs = require('fs-extra');

const SETUP_CONTENT = (() => {
  const jestSetupPath = path.resolve(process.cwd(), 'jest/jest.setup.ts');

  if (fs.existsSync(jestSetupPath)) {
    return fs.readFileSync(jestSetupPath, {
      encoding: 'utf-8',
    });
  }

  return '';
})();

const MOCKS = [SETUP_CONTENT];

function readMocks(currentPath, done, allFiles = [], i = 0) {
  fs.readdir(currentPath, function (_, files = []) {
    const fl = files.length;

    if (!fl) {
      return done();
    }

    files.forEach((file) => {
      const joinedPath = path.join(currentPath, file);
      const isDirectory = !path.extname(joinedPath);

      if (!isDirectory) {
        MOCKS.push(fs.readFileSync(joinedPath, { encoding: 'utf-8' }));
      }

      readMocks(
        joinedPath,
        () => {
          i++;
          if (i === fl) {
            done();
          }
        },
        allFiles
      );
    });
  });
}

readMocks(path.resolve(process.cwd(), '__mocks__'), () => {
  const jestDirPath = path.resolve(process.cwd(), 'jest');
  fs.writeFileSync(
    path.resolve(jestDirPath, 'setup.generated.ts'),
    MOCKS.join('\n')
  );
});
