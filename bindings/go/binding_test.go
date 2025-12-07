package tree_sitter_quirrel_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_quirrel "github.com/nihlete/tree-sitter-quirrel/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_quirrel.Language())
	if language == nil {
		t.Errorf("Error loading Quirrel grammar")
	}
}
