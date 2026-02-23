/**
 * @file Parser for Quirrel language https://quirrel.io/
 * @author Andrei Voronin <nihlete@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  PAREN: 1,
  ASSIGN: 2,
  NULL_COALESCING: 3,
  LOGICAL_OR: 4,
  LOGICAL_AND: 5,
  BITWISE_OR: 6,
  BITWISE_XOR: 7,
  BITWISE_AND: 8,
  EQUALITY: 9,
  COMPARISON: 10,
  SHIFT: 11,
  ADDITIVE: 12,
  MULTIPLICATIVE: 13,
  UNARY: 14,
  MEMBER: 15,
};

module.exports = grammar({
  name: "quirrel",

  extras: ($) => [
    /\s/, // whitespace
    $.comment,
  ],

  word: $ => $.identifier,

  supertypes: $ => [
    $.expression,
    $.statement,
    $.binary_expression
  ],

  rules: {
    source_file: $ => repeat($.statement),

    statement: $ => choice(
      $.block,
      $.local_statement,
      $.let_statement,
      $.return,
      $.expression_statement
    ),

    block: $ => prec(PREC.PAREN, seq('{', repeat($.statement), '}')),

    local_statement: $ => prec.right(seq('local', $._initVar, optional(';'))),
    _initVar: $ => seq(
      $.identifier,
      optional(seq('=', $.expression)),
      optional(seq(',', $._initVar)),
    ),

    let_statement: $ => prec.right(seq('let', $.identifier, '=', $.expression)),

    return: $ => prec.right(seq(
      'return',
      optional($.expression),
      optional(';'),
    )),

    expression_statement: $ => prec.left(choice(
      seq($.expression, optional(';')),
      ';',
    )),

    expression: $ => choice(
      $.null,
      $.identifier,
      $.number,
      $.string,
      $.boolean,
      $.array,
      $.table,
      $.function,
      $.lambda,
      $.assignment,
      $.member_assignment,
      $.compound_assignment,
      $.deref_expression,
      $.index_expression,
      $.nullable_index_expression,
      $.nullable_deref_expression,
      $.parenthesized_expression,
      $.unary_expression,
      $.binary_expression,
    ),

    null: $ => 'null',

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    number: $ => choice($.integer, $.float),

    integer: $ => token(choice(
      /[0-9_]+/,
      /0[xX][0-9A-Fa-f_]+/,
    )),

    float: $ => token(choice(
      /[0-9_]+\.[0-9_]+/,
      /[0-9_]+\.[0-9_]*[eE][+-]?[0-9_]+/,
    )),

    string: $ => choice($.simple_string, $.interpolated_string, $.verbatim_string),

    _string_content: $ => /[^"]+/,
    interpolated_string_content: $ => /[^"{}]+/,
    simple_string: $ => seq('"', optional($._string_content), '"'),
    interpolated_string: $ => seq('$"', repeat(choice($.interpolation, $.interpolated_string_content)), '"'),
    interpolation: $ => seq("{", $.expression, "}"),

    verbatim_string: $ => seq('@"', repeat(choice($._string_content, $._verbatim_quotes)), '"'),
    _verbatim_quotes: $ => seq('""', optional($._string_content), '""'),

    boolean: $ => choice("true", "false"),

    array: $ => seq('[', repeat(seq($.expression, optional(','))), ']'),

    table: $ => prec.right(seq('{', repeat(seq($._table_slot, optional(','))), '}')),
    _table_slot: $ => prec(PREC.ASSIGN, choice(
      $.identifier,
      seq($.identifier, '=', $.expression),
      seq('[', $.expression, ']', '=', $.expression),
      seq($.string , ':', $.expression),
    )),

    function: $ => seq('function', optional($.identifier), '(', repeat($.param), ')', $.block),
    lambda: $ => seq('@(', repeat($.param), ')', $.expression),
    param: $ => seq(
      choice(
        seq(
          $.identifier,
          optional(seq('=', $.expression))
        ),
        '...', // vaiadic arg
      ),
      optional(',')
    ),

    assignment: $ => prec.right(PREC.ASSIGN, seq($.expression, '=', $.expression)),
    member_assignment: $ => prec.right(PREC.ASSIGN, seq($.expression, '<-', $.expression)),
    compound_assignment: $ => prec.right(PREC.ASSIGN, seq(
      $.expression,
      token(choice(
        '+=',
        '-=',
        '*=',
        '/=',
        '%=',
       )),
      $.expression,
    )),

    deref_expression: $ => prec(PREC.MEMBER, seq($.expression, '.', $.identifier)),
    nullable_deref_expression: $ => prec(PREC.MEMBER, seq($.expression, '?.', $.identifier)),
    index_expression: $ => prec(PREC.MEMBER, seq($.expression, '[', $.expression, ']')),
    nullable_index_expression: $ => prec(PREC.MEMBER, seq($.expression, '?[', $.expression, ']')),

    parenthesized_expression: $ => prec(PREC.PAREN, seq('(', $.expression, ')')),

    unary_expression: $ => choice(
      $._unary_post_expression,
      $._unary_pre_expression
    ),

    _unary_post_expression: $ => prec.left(PREC.UNARY, seq($.expression, choice( "++", "--" ))),
    _unary_pre_expression: $ => prec.left(PREC.UNARY, seq(choice( "-", "!", "~", "++", "--" ), $.expression)),

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
      $.equal,
      $.not_equal,
      $.three_way,
      $.bitwise_and,
      $.bitwise_xor,
      $.bitwise_or,
      $.logical_and,
      $.logical_or,
      $.null_coalescing,
    ),

    add: $ => prec.left(PREC.ADDITIVE, seq($.expression, '+', $.expression)),
    substract: $ => prec.left(PREC.ADDITIVE, seq($.expression, '-', $.expression)),
    multiply: $ => prec.left(PREC.MULTIPLICATIVE, seq($.expression, '*', $.expression)),
    divide: $ => prec.left(PREC.MULTIPLICATIVE, seq($.expression, '/', $.expression)),
    mod: $ => prec.left(PREC.MULTIPLICATIVE, seq($.expression, '%', $.expression)),
    bit_shift_left: $ => prec.left(PREC.SHIFT, seq($.expression, '<<', $.expression)),
    bit_shift_right: $ => prec.left(PREC.SHIFT, seq($.expression, '>>', $.expression)),
    bit_shift_right_unsigned: $ => prec.left(PREC.SHIFT, seq($.expression, '>>>', $.expression)),
    lt: $ => prec.left(PREC.COMPARISON, seq($.expression, '<', $.expression)),
    gt: $ => prec.left(PREC.COMPARISON, seq($.expression, '>', $.expression)),
    lteq: $ => prec.left(PREC.COMPARISON, seq($.expression, '<=', $.expression)),
    gteq: $ => prec.left(PREC.COMPARISON, seq($.expression, '>=', $.expression)),
    instanceof: $ => prec.left(PREC.COMPARISON, seq($.expression, 'instanceof', $.expression)),
    in: $ => prec.left(PREC.COMPARISON, seq($.expression, 'in', $.expression)),
    not_in: $ => prec.left(PREC.COMPARISON, seq($.expression, 'not in', $.expression)),
    equal: $ => prec.left(PREC.EQUALITY, seq($.expression, '==', $.expression)),
    not_equal: $ => prec.left(PREC.EQUALITY, seq($.expression, '!=', $.expression)),
    three_way: $ => prec.left(PREC.EQUALITY, seq($.expression, '<=>', $.expression)),
    bitwise_and: $ => prec.left(PREC.BITWISE_AND, seq($.expression, '&', $.expression)),
    bitwise_xor: $ => prec.left(PREC.BITWISE_XOR, seq($.expression, '^', $.expression)),
    bitwise_or: $ => prec.left(PREC.BITWISE_OR, seq($.expression, '|', $.expression)),
    logical_and: $ => prec.left(PREC.LOGICAL_AND, seq($.expression, '&&', $.expression)),
    logical_or: $ => prec.left(PREC.LOGICAL_OR, seq($.expression, '||', $.expression)),
    null_coalescing: $ => prec.right(PREC.NULL_COALESCING, seq($.expression, '??', $.expression)),

    comment: $ =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
      ),

  }
});
