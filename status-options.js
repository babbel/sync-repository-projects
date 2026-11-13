const DefaultColor = 'GRAY';
const Colors = ['GRAY', 'BLUE', 'GREEN', 'YELLOW', 'ORANGE', 'RED', 'PINK', 'PURPLE'];

const parseStatusOption = (line) => {
  const separator = line.lastIndexOf(':');
  const name = (separator === -1 ? line : line.slice(0, separator)).trim();
  const color = (separator === -1 ? DefaultColor : line.slice(separator + 1).trim()).toUpperCase();

  if (name === '') {
    throw new Error(`status option "${line}" has no name`);
  }
  if (!Colors.includes(color)) {
    throw new Error(`status option "${line}" has an invalid color, use one of ${Colors.join(', ')}`);
  }

  return { name, color };
};

const parseStatusOptions = (input) => input
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '')
  .map(parseStatusOption);

export { parseStatusOptions };
