/**
 * @file Parser for Quirrel language https://quirrel.io/
 * @author Andrei Voronin <nihlete@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "quirrel",

  extras: ($) => [
    /\s/, // whitespace
    $.comment,
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.local_statement,
      $.let_statement
    ),

    local_statement: $ => seq(
      'local',
      $.identifier,
      '=',
      $.expression
    ),

    let_statement: $ => seq(
      'let',
      $.identifier,
      '=',
      $.expression
    ),

    expression: $ => choice(
      $.identifier,
      $.number,
      $.string,
    ),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: $ => choice(
      $.integer,
      $.float
    ),

    integer: $ => token(choice(
      /-?[1-9][0-9_]*/,
      /0[xX][0-9A-Fa-f_]+/,
    )),

    float: $ => token(choice(
      /-?[0-9_]+\.[0-9_]+/,
      /[0-9_]+\.[0-9_]*[eE][+-]?[0-9_]+/,
    )),

    string: $ => choice(
      $.simple_string,
      $.interpolated_string,
    ),

    string_content: $ => /[^"]+/,
    simple_string: $ => seq(
      choice('"', '@"'), // @" is verbatim string start
      optional($.string_content),
      '"'
    ),
    interpolated_string: $ => seq(
      '$"',
      repeat(choice($.interpolation, $.string_content)),
      '"'
    ),
    interpolation: $ => seq(
      "{",
      $.expression,
      "}"
    ),


    comment: $ =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
      ),

  }
});
