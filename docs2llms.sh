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

get_content() {
    local owner="$1"
    local repo="$2"
    local branch="$3"
    local path="$4"
    local token="$5"

    local api_url="https://api.github.com/repos/$owner/$repo/contents/$path?ref=$branch"
    if [[ -n "$token" ]]; then
        curl -s -H "Authorization: token $token" "$api_url"
    else
        curl -s "$api_url"
    fi
}