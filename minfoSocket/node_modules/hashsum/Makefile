BIN=./node_modules/.bin
JSHINT=$(BIN)/jshint
MOCHA=$(BIN)/mocha

all: lint test

lint:
	@$(JSHINT) --show-non-errors **/*.js

test:
	@$(MOCHA) --reporter spec

watch:
	@$(MOCHA) --reporter min --watch

.PHONY: test
