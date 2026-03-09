[
  "case"
  "catch"
  "class"
  "clone"
  "const"
  "constructor"
  "default"
  "delete"
  "else"
  "enum"
  "false"
  "for"
  "foreach"
  "function"
  "if"
  "in"
  "instanceof"
  "let"
  "local"
  "not in"
  "null"
  "resume"
  "return"
  "static"
  "switch"
  "throw"
  "true"
  "try"
  "typeof"
  "while"
  "yield"
  (break)
  (continue)
] @keyword

(identifier) @variable

; Highlight the entire string first
(string) @string

; Highlight the interpolation braces specifically
(interpolation ["{" "}"] @punctuation.special)

; This "resets" the content of the expression so it doesn't
; just inherit the @string color from its parent
(interpolation (expression) @variable)

(interpolated_string "$" @punctuation.special)

(comment) @comment
