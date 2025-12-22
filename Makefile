.DEFAULT_GOAL := help

include make/config.mk
include make/helpers/echo.mk
include make/helpers/docker.mk
include make/helpers/npm.mk
include make/helpers/cleanup.mk
include make/helpers/check.mk
include make/helpers/utils.mk
include make/deps.mk
include make/install.mk
include make/docker.mk
include make/local.mk
include make/tunnel.mk
include make/native.mk
include make/sync.mk
include make/onboarding.mk
include make/quality.mk
include make/cleanup.mk