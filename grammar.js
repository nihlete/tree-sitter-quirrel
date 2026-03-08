/**
 * @file Parser for Quirrel language https://quirrel.io/
 * @author Andrei Voronin <nihlete@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  TABLE_SLOT: -1,
  PAREN: 1,
  ASSIGN: 2,
  TERNARY: 3,
  NULL_COALESCING: 4,
  LOGICAL_OR: 5,
  LOGICAL_AND: 6,
  BITWISE_OR: 7,
  BITWISE_XOR: 8,
  BITWISE_AND: 9,
  EQUALITY: 10,
  COMPARISON: 11,
  SHIFT: 12,
  ADDITIVE: 13,
  MULTIPLICATIVE: 14,
  UNARY: 15,
  CONST: 17,
  CALL: 18,
  MEMBER: 19,
};

function commaSep1(rule) {
  return seq(rule, repeat(seq(optional(','), rule)))
};

function commaSep(rule) {
  return optional(commaSep1(rule))
};

module.exports = grammar({
  name: "quirrel",

  extras: ($) => [
    /\s/, // whitespace
    $.comment,
  ],

  word: $ => $.identifier,

  supertypes: $ => [
    $.statement,
    $.expression,
    $.primary_expression,
    $.binary_expression,
    $.type_expression,
    $.number,
  ],

  rules: {
    source_file: $ => repeat($.statement),

    statement: $ => choice(
      $.empty_statement,
      $.compiler_directive,
      $.import_statement,
      $.from_import_statement,
      $.block,
      $.local_statement,
      $.let_statement,
      $.const_statement,
      $.enum_statement,
      $.class_statement,
      $.destructuring_assigment,
      $.if_statement,
      $.while_statement,
      $.do_while_statement,
      $.switch_statement,
      $.for_statement,
      $.foreach_statement,
      $.try_catch_statement,
      $.continue,
      $.break,
      $.return,
      $.yeld,
      $.throw,
      $.expression_statement,
    ),

    empty_statement: $ => ";",

    import_statement: $ => seq("import", $.string, optional(seq("as", $.identifier))),
    from_import_statement: $ => prec.right(seq("from", $.string, "import", choice("*", commaSep1($.identifier)))),

    block: $ => prec(PREC.PAREN, seq('{', repeat($.statement), '}')),

    local_statement: $ => prec.left(seq('local', commaSep1($._init_var))),
    _init_var: $ => seq($.identifier, optional($.type_annotation), optional(seq('=', $.expression))),

    let_statement: $ => prec.right(seq('let', $.identifier, optional($.type_annotation), '=', $.expression)),

    destructuring_assigment: $ => seq(
      choice("let", "local"),
      choice($.array_deconstruction, $.table_deconstruction), "=", $.expression),
    array_deconstruction: $ => seq("[", commaSep1($._init_var), "]"),
    table_deconstruction: $ => seq("{", commaSep1($._init_var), "}"),

    const_statement: $ => prec(1, seq(optional("global"), "const", $.identifier, "=", $.expression)),
    enum_statement: $ => seq(optional("global"), "enum", $.identifier, "{", commaSep1(seq($.identifier, optional(seq("=", $.expression)))), "}"),

    class_statement: $ => seq("class", $.identifier, optional(seq("(", $.identifier, ")")),
      "{", repeat(seq($._member_declaration, optional(";"))), "}"),
    _member_declaration: $ => choice(
      $.identifier,
      seq(optional("static"), $.identifier, '=', $.expression),
      seq('[', $.expression, ']', '=', $.expression),
      seq($.string , ':', $.expression),
      $.function,
      $.constructor,
    ),
    constructor: $ => seq("constructor", "(", commaSep($.param), optional($.variadic_param), ")", $.block),

    if_statement: $ => prec.right(seq("if", "(", $.expression, ")", $.statement, optional($.else_statement))),
    else_statement: $ => seq("else", $.statement),

    while_statement: $ => seq("while", "(", $.expression, ")", $.statement),
    do_while_statement: $ => seq("do", $.statement, "while", "(", $.expression, ")"),

    switch_statement: $ => seq("switch", "(", $.expression, ")", "{",
      repeat1($.case_statement),
      optional($.default_statement),
      "}"
    ),
    case_statement: $ => seq("case", $.expression, ":", repeat($.statement)),
    default_statement: $ => seq("default", ":", repeat($.statement)),

    for_statement: $ => seq("for", "(",
      optional(choice($.expression, $.local_statement)),
      ";",
      optional($.expression),
      ";",
      optional($.expression),
      ")",
      $.statement
    ),

    foreach_statement: $ => seq("foreach", "(",
      optional(seq($.identifier, ",")),
      $.identifier,
      "in",
      $.expression,
      ")",
      $.statement
    ),

    try_catch_statement: $ => seq("try", $.statement, "catch", "(", $.identifier, ")", $.statement),

    continue: $ => "continue",
    break: $ => "break",
    return: $ => prec.right(seq('return', optional($.expression))),
    throw: $ => seq("throw", $.expression),

    yeld: $ => prec.right(seq('yeld', optional($.expression))),
    resume_expression: $ => prec.right(seq('resume', optional($.expression))),

    expression_statement: $ => $.expression,

    expression: $ => choice(
      $.assignment,
      $.member_assignment,
      $.compound_assignment,
      $.resume_expression,
      $.primary_expression
    ),

    primary_expression: $ => choice(
      $.null,
      $.identifier,
      $.global_identifier,
      $.number,
      $.char,
      $.string,
      $.boolean,
      $.array,
      $.table,
      $.function,
      $.lambda,
      $.call_expression,
      $.nullable_call_expression,
      $.ternary_expression,
      $.deref_expression,
      $.index_expression,
      $.nullable_index_expression,
      $.nullable_deref_expression,
      $.builtin_deref_expression,
      $.builtin_nullable_deref_expression,
      $.parenthesized_expression,
      $.inline_const_expression,
      $.inline_static_expression,
      $.unary_expression,
      $.binary_expression,
      $.typeof_expression,
    ),

    null: $ => 'null',

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    global_identifier: $ => seq('::', $.identifier),

    number: $ => choice($.integer, $.float),

    integer: $ => token(choice(
      /[0-9_]+/,
      /0[xX][0-9A-Fa-f_]+/,
    )),

    float: $ => token(choice(
      /[0-9_]+\.[0-9_]+/,
      /[0-9_]+\.[0-9_]*[eE][+-]?[0-9_]+/,
    )),

    char: $ => seq("'",choice( $.escape_sequence, /[^\\']/ ), "'"),
    string: $ => choice($.simple_string, $.interpolated_string, $.verbatim_string),

    escape_sequence: $ => token.immediate(seq("\\", /./)),
    _string_content: $ => token.immediate(/[^"\\\n]+/),
    _interpolated_string_content: $ => token.immediate(/[^"{}\\\n]+/),
    simple_string: $ => seq('"', repeat(choice( $._string_content, $.escape_sequence )), '"'),
    interpolated_string: $ => seq('$"', repeat(choice( $.interpolation, $.escape_sequence, $._interpolated_string_content )), '"'),
    interpolation: $ => seq("{", $.expression, "}"),

    verbatim_string: $ => seq('@"', repeat(choice(token.immediate(/[^"]+/), $._verbatim_quote_escape)), '"'),
    _verbatim_quote_escape: $ => token.immediate('""'),

    boolean: $ => choice("true", "false"),

    array: $ => seq('[', repeat(seq($.expression, optional(','))), ']'),

    table: $ => seq('{', repeat(seq($._table_slot, optional(','))), '}'),
    _table_slot: $ => prec(PREC.TABLE_SLOT, choice(
      $.identifier,
      seq($.identifier, '=', $.expression),
      seq('[', $.expression, ']', '=', $.expression),
      seq($.string , ':', $.expression),
      $.function,
    )),

    function: $ => seq('function', optional($.attributes), optional($.identifier),
      "(", commaSep($.param), optional($.variadic_param), ")", optional($.type_annotation), $.block),
    lambda: $ => seq("@", optional($.attributes), "(", commaSep($.param), optional($.variadic_param), ")", optional($.type_annotation), $.expression),
    param: $ => choice(
      seq($.identifier, optional($.type_annotation), optional(seq('=', $.expression))),
      $.array_param_deconstruction,
      $.table_param_deconstruction,
    ),
    variadic_param: $ => seq(optional(","), "...", optional($.type_annotation)),
    attributes: $ => seq("[", commaSep1(alias($.identifier, $.attribute)), "]"),
    array_param_deconstruction: $ => seq("[", commaSep1($.param), "]"),
    table_param_deconstruction: $ => seq("{", commaSep1($.param), "}"),

    type_annotation: $ => seq(":", $.type_expression),
    type_expression: $ => choice(
      $.type_declaration,
      $.type_parenthesized_expression,
      $.type_pipe_expression
    ),
    type_parenthesized_expression: $ => seq("(", $.type_expression, ")"),
    type_pipe_expression: $ => prec.left(seq($.type_expression, "|", $.type_expression)),
    type_declaration: $ => choice(
      "int",
      "float",
      "number",
      "bool",
      "string",
      "table",
      "array",
      "function",
      "thread",
      "userdata",
      "generator",
      "userpointer",
      "instance",
      "class",
      "weakref",
      "null",
      "any",
    ),

    call_expression: $ => prec.left(PREC.CALL, seq($.expression, "(", commaSep($.expression), ")")),
    nullable_call_expression: $ => prec.left(PREC.CALL, seq($.expression, "?(", commaSep($.expression), ")")),

    ternary_expression: $ => prec.right(PREC.TERNARY, seq($.expression, '?', $.expression, ':', $.expression)),

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
    builtin_deref_expression: $ => prec(PREC.MEMBER, seq($.expression, ".$", $.identifier)),
    builtin_nullable_deref_expression: $ => prec(PREC.MEMBER, seq($.expression, "?.$", $.identifier)),
    index_expression: $ => prec(PREC.MEMBER, seq($.expression, '[', $.expression, ']')),
    nullable_index_expression: $ => prec(PREC.MEMBER, seq($.expression, '?[', $.expression, ']')),

    parenthesized_expression: $ => prec(PREC.PAREN, seq('(', $.expression, ')')),

    inline_const_expression: $ => prec(PREC.CONST, seq("const", $.primary_expression)),
    inline_static_expression: $ => prec(PREC.CONST, seq("static", $.primary_expression)),

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

    typeof_expression: $ => prec(PREC.UNARY, seq("typeof", $.primary_expression)),

    compiler_directive: $ => seq("#", /.*/),

    comment: $ =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
      ),

  }
});
