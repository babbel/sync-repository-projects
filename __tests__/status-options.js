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

  test('rejects an invalid color', () => {
    expect(() => parseStatusOptions('Blocked:rd')).toThrow('invalid color');
  });

  test('rejects an empty color', () => {
    expect(() => parseStatusOptions('Blocked:')).toThrow('invalid color');
  });

  test('rejects an option without a name', () => {
    expect(() => parseStatusOptions(':RED')).toThrow('has no name');
  });
});
