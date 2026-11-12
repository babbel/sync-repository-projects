import { parseStatusOptions } from '../status-options.js';

describe('parseStatusOptions()', () => {
  test('returns no options for an empty input', () => {
    expect(parseStatusOptions('')).toEqual([]);
  });

  test('reads one option per line with an optional color', () => {
    expect(parseStatusOptions('Blocked:red\n  On Hold  \n\n')).toEqual([
      { name: 'Blocked', color: 'RED' },
      { name: 'On Hold', color: 'GRAY' },
    ]);
  });
});
