/**
 * @file Parser for Quirrel language https://quirrel.io/
 * @author Andrei Voronin <nihlete@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "quirrel",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
