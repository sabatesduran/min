SHELL := /bin/sh

HOST ?= 127.0.0.1
PORT ?= 4321

.DEFAULT_GOAL := help

.PHONY: help install web dev web-assets web-build web-preview web-check web-deploy app-web check

help:
	@printf '%s\n' \
		'make web          Inicia la landing i el generador Astro' \
		'make web-assets   Regenera captures i la imatge social' \
		'make web-build    Genera el lloc estàtic a web/dist' \
		'make web-preview  Construeix i previsualitza el resultat' \
		'make web-check    Comprova els tipus del lloc Astro' \
		'make web-deploy   Publica web/dist a Cloudflare' \
		'make app-web      Inicia l’app Expo al navegador' \
		'make check        Executa totes les comprovacions' \
		'make install      Instal·la les dependències' \
		'' \
		'Variables opcionals: HOST=127.0.0.1 PORT=4321'

install:
	npm install

web:
	npm run site:dev -- --host $(HOST) --port $(PORT)

dev: web

web-assets:
	npm run site:assets

web-build:
	npm run site:build

web-preview: web-build
	npm run site:preview -- --host $(HOST) --port $(PORT)

web-check:
	npm run site:check

web-deploy: web-build
	npx wrangler deploy

app-web:
	npm run web

check:
	npm run site:check
	npm run lint
	npm run typecheck
	npm test
