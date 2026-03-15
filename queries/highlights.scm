[
  "as"
  "case"
  "catch"
  "class"
  "clone"
  "const"
  "constructor"
  "default"
  "delete"
  "do"
  "else"
  "enum"
  "for"
  "foreach"
  "from"
  "function"
  "global"
  "if"
  "import"
  "in"
  "instanceof"
  "let"
  "local"
  "not in"
  "resume"
  "return"
  "static"
  "switch"
  "throw"
  "try"
  "typeof"
  "while"
  "yield"
  (break)
  (continue)
] @keyword

(identifier) @variable

; Highlight the entire string first
[
  (string)
  (doc_string)
] @string

; Highlight the interpolation braces specifically
(interpolation ["{" "}"] @punctuation.special)

; This "resets" the content of the expression so it doesn't
; just inherit the @string color from its parent
(interpolation (expression) @variable)

(interpolated_string "$" @punctuation.special)

(comment) @comment

[
  "null"
  "true"
  "false"
  (number)
] @constant.numeric

(boolean) @boolean

[
  (attributes)
  (compiler_directive)
] @tag

(type_declaration) @type
; Override keywords if they are used as types
(type_declaration [
  "function"
  "class"
] @type)
; Override constants if they are used as types
(type_declaration [
  "null"
] @type)
