.DEFAULT_GOAL := help

include make/config.mk
include make/echo.mk
include make/docker-helpers.mk
include make/npm-helpers.mk
include make/cleanup-helpers.mk
include make/check.mk
include make/deps.mk
include make/install.mk
include make/docker.mk
include make/local.mk
include make/tunnel.mk
include make/native.mk
include make/sync.mk
include make/quality.mk
include make/cleanup.mk
include make/utils.mk