'use strict'

import * as Immutable from 'immutable'

import debug     from './debug'


// polyfill
function repeat(count) {
    'use strict';
    if (this == null) {
      throw new TypeError('can\'t convert ' + this + ' to object');
    }
    var str = '' + this;
    count = +count;
    if (count != count) {
      count = 0;
    }
    if (count < 0) {
      throw new RangeError('repeat count must be non-negative');
    }
    if (count == Infinity) {
      throw new RangeError('repeat count must be less than infinity');
    }
    count = Math.floor(count);
    if (str.length == 0 || count == 0) {
      return '';
    }
    // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (August 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so:
    if (str.length * count >= 1 << 28) {
      throw new RangeError('repeat count must not overflow maximum string size');
    }
    var rpt = '';
    for (;;) {
      if ((count & 1) == 1) {
        rpt += str;
      }
      count >>>= 1;
      if (count == 0) {
        break;
      }
      str += str;
    }
    // Could we try:
    // return Array(count + 1).join(this);
    return rpt;
  }

// polyfill end

export interface Formatter {
  padCommand: () => (options: any) => string
  padSubCommand: () => (options: any) => string
  padOption: () => (options: any) => string
  padArgument: () => (options: any) => string
  padShortOption: () => (options: any) => string
  padDescription: () => (options: any) => string
  padSubCommandOption: () => (options: any) => string
  pad: (options: any) => (text: string) => string
  stringPad: (text: string, amount: number, direction: Direction, character: string) => string
  log: () => void
}

export enum Direction {'LEFT', 'RIGHT'}

const _config = Immutable.fromJS({
  'padArguments': 10,
  'padCommands': 40,
  'padDescriptions': 30,
  'padOptions': 16,
  'padShortOptions': 6,
  'padSubCommands': 20,
  'padSubCommandOptions': 24,
})

  /**
   * Prints out debugging information.
   */
 const log = () => debug.log('Formatter: %j', _config.toObject())

/**
 * Generates a padding function based on the given options.
 *
 * @return {function}   The generated padding function.
 *
 * @access private
 */
const pad = ({
  amount = 0,
  character = ' ',
  direction = Direction.LEFT,
  prefix = ' ',
  suffix = ''
}) => {
  return text => {
    if (typeof text !== 'string') {
      text = ''
    }
    if (prefix && text.length > 0) {
      text = prefix + text
    }
    if (suffix && text.length > 0) {
      text = text + suffix
    }
    return stringPad(text, amount, direction, character)
  }
}

/**
 * Pad a string to be of at leas the specified size.
 */
const stringPad = (text: string, amount: number, direction: Direction, character: string) => {
  const chunkLen = amount - text.length
  const chunk = chunkLen > 0 ? repeat.call(character, chunkLen) : ''
  const pre = direction === Direction.LEFT ? chunk : ''
  const pos = direction !== Direction.LEFT ? chunk : ''
  return `${pre}${text}${pos}`
}

/**
 * Returns a padding function for commands.
 *
 * @return {function(text: string): string} The generated function.
 */
const padCommand = () => pad({
  amount: _config.get('padCommands'),
  direction: Direction.RIGHT
})

/**
 * Returns a padding function for sub commands.
 *
 * @return {function(text: string): string} The generated function.
 */
const padSubCommand = () => pad({
  amount: _config.get('padSubCommands'),
  direction: Direction.RIGHT
})

/**
 * Returns a padding function for command options.
 *
 * @return {function(text: string): string} The generated function.
 */
const padSubCommandOption = () => pad({
  amount: _config.get('padSubCommandOptions'),
  direction: Direction.RIGHT,
})

/**
 * Returns a padding function for short options
 *
 * @return {function(text: string): string} The generated function.
 */
const padShortOption = () => pad({
  amount: _config.get('padShortOptions'),
  prefix: '-'
})

/**
 * Returns a padding function for long options.
 *
 * @return {function(text: string): string} The generated function.
 */
const padOption = () => pad({
  amount: _config.get('padOptions'),
  direction: Direction.RIGHT,
  prefix: '--',
})

/**
 * Returns a padding function for arguments.
 *
 * @return {function(text: string, required: boolean): string} The generated
 *   function.
 */
const padArgument = () => {
  let size = _config.get('padArguments')
  return (text = '', required = false) => {
    let prefix = required ? '<' : '['
    let suffix = required ? '>' : ']'
    let padFn = pad({
      amount: size,
      direction: Direction.RIGHT,
      prefix,
      suffix,
    })
    return padFn(text)
  }
}

/**
 * Returns a padding function for descriptions.
 *
 * @return {function(text: string): string} The generated function.
 */
const padDescription = () => pad({
  amount: _config.get('padDescriptions'),
  direction: Direction.RIGHT,
})

/**
 * Helper class for formatting help output.
 */
export const formatter: Formatter = {
  log,
  pad,
  stringPad,
  padCommand,
  padSubCommand,
  padSubCommandOption,
  padShortOption,
  padOption,
  padArgument,
  padDescription,
}

export default formatter
