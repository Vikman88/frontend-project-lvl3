install:
	npm ci

develop:
	npm start

build:
	npm run build

dev:
	npm run dev

test:
	npm test

lint:
	npx eslint .

.PHONY: test