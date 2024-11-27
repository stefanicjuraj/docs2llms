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

get_raw_content() {
    local owner="$1"
    local repo="$2"
    local branch="$3"
    local file_path="$4"
    local token="$5"

    local raw_url="https://raw.githubusercontent.com/$owner/$repo/$branch/$file_path"
    if [[ -n "$token" ]]; then
        curl -s -H "Authorization: token $token" "$raw_url"
    else
        curl -s "$raw_url"
    fi
}

process_directory() {
    local owner="$1"
    local repo="$2"
    local branch="$3"
    local path="$4"
    local token="$5"

    local response=$(get_content "$owner" "$repo" "$branch" "$path" "$token")
    local items=$(echo "$response" | jq -c '.[]')

    while IFS= read -r item; do
        local type=$(echo "$item" | jq -r '.type')
        local name=$(echo "$item" | jq -r '.name')
        local file_path=$(echo "$item" | jq -r '.path')

        if [[ "$type" == "file" ]] && [[ "$name" =~ \.md$|\.mdx$ ]]; then
            get_raw_content "$owner" "$repo" "$branch" "$file_path" "$token" >>"$output_file"
            echo -e "\n\n" >>"$output_file"
            echo "Processing: $file_path"
        elif [[ "$type" == "dir" ]]; then
            process_directory "$owner" "$repo" "$branch" "$file_path" "$token"
        fi
    done <<<"$items"
}