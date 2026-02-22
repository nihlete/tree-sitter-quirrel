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
  SHIFT: 4,
  COMPARISON: 5,
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
      $.array,
      $.table,
      $.unary_expression,
      $.binary_expression,
    ),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: $ => choice($.integer, $.float),

    integer: $ => token(choice(
      /[0-9_]+/,
      /0[xX][0-9A-Fa-f_]+/,
    )),

    float: $ => token(choice(
      /-?[0-9_]+\.[0-9_]+/,
      /[0-9_]+\.[0-9_]*[eE][+-]?[0-9_]+/,
    )),

    string: $ => choice($.simple_string, $.interpolated_string, $.verbatim_string),

    _string_content: $ => /[^"]+/,
    interpolated_string_content: $ => /[^"{}]+/,
    simple_string: $ => seq('"', optional($._string_content), '"'),
    interpolated_string: $ => seq('$"', repeat(choice($.interpolation, $.interpolated_string_content)), '"'),
    interpolation: $ => seq("{", $._expression, "}"),

    verbatim_string: $ => seq('@"', repeat(choice($._string_content, $._verbatim_quotes)), '"'),
    _verbatim_quotes: $ => seq('""', optional($._string_content), '""'),

    boolean: $ => choice("true", "false"),

    array: $ => seq('[', repeat(seq($._expression, optional(','))), ']'),

    table: $ => seq('{', repeat(seq($._table_slot, optional(','))), '}'),
    _table_slot: $ => choice(
      $.identifier,
      seq($.identifier, '=', $._expression),
      seq('[', $._expression, ']', '=', $._expression),
      seq($.string , ':', $._expression),
    ),

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
      $.bit_shift_left,
      $.bit_shift_right,
      $.bit_shift_right_unsigned,
      $.lt,
      $.gt,
      $.lteq,
      $.gteq,
      $.instanceof,
      $.in,
      $.not_in,
    ),

    add: $ => prec.left(PREC.ADDITIVE, seq($._expression, '+', $._expression)),
    substract: $ => prec.left(PREC.ADDITIVE, seq($._expression, '-', $._expression)),
    multiply: $ => prec.left(PREC.MULTIPLICATIVE, seq($._expression, '*', $._expression)),
    divide: $ => prec.left(PREC.MULTIPLICATIVE, seq($._expression, '/', $._expression)),
    mod: $ => prec.left(PREC.MULTIPLICATIVE, seq($._expression, '%', $._expression)),
    bit_shift_left: $ => prec.left(PREC.SHIFT, seq($._expression, '<<', $._expression)),
    bit_shift_right: $ => prec.left(PREC.SHIFT, seq($._expression, '>>', $._expression)),
    bit_shift_right_unsigned: $ => prec.left(PREC.SHIFT, seq($._expression, '>>>', $._expression)),
    lt: $ => prec.left(PREC.COMPARISON, seq($._expression, '<', $._expression)),
    gt: $ => prec.left(PREC.COMPARISON, seq($._expression, '>', $._expression)),
    lteq: $ => prec.left(PREC.COMPARISON, seq($._expression, '<=', $._expression)),
    gteq: $ => prec.left(PREC.COMPARISON, seq($._expression, '>=', $._expression)),
    instanceof: $ => prec.left(PREC.COMPARISON, seq($._expression, 'instanceof', $._expression)),
    in: $ => prec.left(PREC.COMPARISON, seq($._expression, 'in', $._expression)),
    not_in: $ => prec.left(PREC.COMPARISON, seq($._expression, 'not in', $._expression)),

    comment: $ =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
      ),

  }
});
