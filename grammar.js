/**
 * @file Parser for Quirrel language https://quirrel.io/
 * @author Andrei Voronin <nihlete@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  UNARY: 1,
  MULTIPLICATIVE: 2,
  ADDITIVE: 3,
};

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

    local_statement: $ => seq('local', $._initVar, optional(';')),
    _initVar: $ => seq(
      $.identifier,
      optional(seq('=', $._expression)),
      optional(seq(',', $._initVar)),
    ),

    let_statement: $ => seq('let', $.identifier, '=', $._expression),

    _expression: $ => choice(
      $.identifier,
      $.number,
      $.string,
      $.boolean,
      $.unary_expression,
      $.binary_expression
    ),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: $ => choice($.integer, $.float),

    integer: $ => token(choice(
      /-?[1-9][0-9_]*/,
      /0[xX][0-9A-Fa-f_]+/,
    )),

    float: $ => token(choice(
      /-?[0-9_]+\.[0-9_]+/,
      /[0-9_]+\.[0-9_]*[eE][+-]?[0-9_]+/,
    )),

    string: $ => choice($.simple_string, $.interpolated_string, $.verbatim_string),

    string_content: $ => /[^"]+/,
    interpolated_string_content: $ => /[^"{}]+/,
    simple_string: $ => seq('"', optional($.string_content), '"'),
    interpolated_string: $ => seq('$"', repeat(choice($.interpolation, $.interpolated_string_content)), '"'),
    interpolation: $ => seq("{", $._expression, "}"),

    verbatim_string: $ => seq('@"', repeat(choice($.string_content, $.verbatim_quotes)), '"'),
    verbatim_quotes: $ => seq('""', optional($.string_content), '""'),

    boolean: $ => choice("true", "false"),

    unary_expression: $ => choice(
      $._unary_post_expression,
      $._unary_pre_expression
    ),

    _unary_post_expression: $ => prec.left(PREC.UNARY, seq($._expression, choice( "++", "--" ))),
    _unary_pre_expression: $ => prec.left(PREC.UNARY, seq(choice( "-", "!", "~", "++", "--" ), $._expression)),

    binary_expression: $ => choice(
      $.add,
      $.substract,
      $.multiply,
      $.divide,
      $.mod,
    ),

    add: $ => prec.left(PREC.ADDITIVE, seq($._expression, '+', $._expression)),
    substract: $ => prec.left(PREC.ADDITIVE, seq($._expression, '-', $._expression)),
    multiply: $ => prec.left(PREC.MULTIPLICATIVE, seq($._expression, '*', $._expression)),
    divide: $ => prec.left(PREC.MULTIPLICATIVE, seq($._expression, '/', $._expression)),
    mod: $ => prec.left(PREC.MULTIPLICATIVE, seq($._expression, '%', $._expression)),

    comment: $ =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
      ),

  }
});
