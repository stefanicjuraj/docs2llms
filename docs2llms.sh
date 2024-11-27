#!/bin/bash

validate_github_url() {
    local url="$1"
    if [[ "$url" =~ ^https://github.com/[^/]+/[^/]+(/tree/[^/]+/.+)?$ ]]; then
        return 0
    else
        return 1
    fi
}

parse_github_url() {
    local url="$1"
    owner=$(echo "$url" | awk -F '/' '{print $4}')
    repo=$(echo "$url" | awk -F '/' '{print $5}')
    branch=$(echo "$url" | awk -F '/' '{print $7}')
    path=$(echo "$url" | cut -d '/' -f8-)
    branch="${branch:-main}"
    path="${path:-}"
}