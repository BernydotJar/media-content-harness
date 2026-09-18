# WEB021 Fixer note

The first full-suite run on beb6ea0ae650b70f535cf943baed30b9ee2a93d7 reported two test-harness failures, not product-runtime failures:

1. web-brand-v2.test.mjs matched a formatting-sensitive source expression.
2. web-visual-v4.test.mjs selected the final reduced-motion block in the whole stylesheet, which became the newer V5 block instead of the V4 block it intended to verify.

The Fixer commit fa4ba23f5a764e5079569b470455183ba77695d8 made those assertions scope/whitespace robust without changing runtime product behavior. The complete suite was rerun from the exact Fixer SHA and passed with 156 tests discovered, 155 PASS, 0 FAIL, 1 pre-existing SKIP.
