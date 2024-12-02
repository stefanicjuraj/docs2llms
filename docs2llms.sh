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

skip_directory() {
    local dir_name="$1"
    shift
    local skip_folders=("$@")

    for skip_folder in "${skip_folders[@]}"; do
        if [[ "$dir_name" == "$skip_folder" ]]; then
            return 0
        fi
    done
    return 1
}

process_directory() {
    local owner="$1"
    local repo="$2"
    local branch="$3"
    local path="$4"
    local token="$5"
    local output_file="$6"
    shift 6
    local skip_folders=("$@")

    local response=$(get_content "$owner" "$repo" "$branch" "$path" "$token")
    local items=$(echo "$response" | jq -c '.[]')

    while IFS= read -r item; do
        local type=$(echo "$item" | jq -r '.type')
        local name=$(echo "$item" | jq -r '.name')
        local file_path=$(echo "$item" | jq -r '.path')

        if [[ "$type" == "file" ]] && [[ "$name" =~ \.md$|\.mdx$|\.txt$|\.rst$ ]]; then
            get_raw_content "$owner" "$repo" "$branch" "$file_path" "$token" >>"$output_file"
            echo -e "\n\n" >>"$output_file"
            echo "Processing: $file_path"
        elif [[ "$type" == "dir" ]]; then
            if ! skip_directory "$name" "${skip_folders[@]}"; then
                process_directory "$owner" "$repo" "$branch" "$file_path" "$token" "$output_file" "${skip_folders[@]}"
            else
                echo "Skipping: $file_path"
            fi
        fi
    done <<<"$items"
}

process_local_directory() {
    local dir_path="$1"
    local output_file="$2"
    shift 2
    local skip_folders=("$@")

    local exclude_args=()
    for folder in "${skip_folders[@]}"; do
        exclude_args+=(-path "$dir_path/$folder" -prune -o)
    done

    find "$dir_path" "${exclude_args[@]}" -type f \( -name "*.md" -o -name "*.mdx" -o -name "*.txt" -o -name "*.rst" \) -print | while read -r file; do
        cat "$file" >>"$output_file"
        echo "\n\n" >>"$output_file"
        echo "Processing: $file"
    done
}

main() {
    local skip_folders=()
    local input
    local local_docs_dir=""
    local output_file=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
        local)
            input="local"
            shift
            ;;
        --skip)
            break
            ;;
        *)
            if [[ -z "$input" ]]; then
                input="$1"
            elif [[ -z "$local_docs_dir" ]]; then
                local_docs_dir="$1"
            elif [[ -z "$output_file" ]]; then
                output_file="$1"
            fi
            shift
            ;;
        esac
    done

    if [[ "$1" == "--skip" ]]; then
        shift
        while [[ $# -gt 0 ]] && [[ "$1" != -* ]]; do
            skip_folders+=("$1")
            shift
        done
    fi

    if [[ -z "$output_file" ]]; then
        output_file="llms-full.txt"
    fi

    if [[ -z "$input" ]]; then
        echo "Usage (local):  $0 local <local_directory> [output_file] [--skip folder1 folder2 ...]"
        echo "Usage (remote): $0 <remote_directory> [output_file] [--skip folder1 folder2 ...]"
        exit 1
    fi

    if [[ "$input" == "local" ]]; then
        if [[ -d "$local_docs_dir" ]]; then
            >"$output_file"
            process_local_directory "$local_docs_dir" "$output_file" "${skip_folders[@]}"
            echo "\n✅ $output_file"
        else
            echo "\n❌ Local docs directory '$local_docs_dir' not found."
            exit 1
        fi
    elif validate_github_url "$input"; then
        github_url="$input"
        parse_github_url "$github_url"

        echo "\nRepository: $owner/$repo"
        echo "Branch: $branch"
        echo "Path: $path"

        token="${GITHUB_TOKEN:-}"
        if [[ -z "$token" ]]; then
            echo "\n⚠️ GitHub token not found. Rate limit is restricted to 60 requests per hour.\n"
        fi

        >"$output_file"
        process_directory "$owner" "$repo" "$branch" "$path" "$token" "$output_file" "${skip_folders[@]}"

        echo "\n✅ $output_file"
    else
        echo "Invalid input. Provide a valid GitHub URL or use 'local'."
        exit 1
    fi
}

main "$@"
