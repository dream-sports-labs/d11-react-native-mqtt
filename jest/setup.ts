import '../__mocks__/global';

jest.mock('child_process', () => ({
  execSync: jest.fn(() => Buffer.from('')),
}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});
