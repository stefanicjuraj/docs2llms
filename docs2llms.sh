#!/bin/bash

validate_github_url() {
    local url="$1"
    if [[ "$url" =~ ^https://github.com/[^/]+/[^/]+(/tree/[^/]+/.+)?$ ]]; then
        return 0
    else
        return 1
    fi
}