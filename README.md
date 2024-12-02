# docs2llms

Transform software documentation content into formats optimized for use by artificial intelligence (AI) and large language models (LLMs). 

## Installation

```
deno install --allow-read --allow-net --unstable --global -n docs2llms https://raw.githubusercontent.com/stefanicjuraj/docs2llms/main/docs2llms.ts
```

## Usage

### Local

```
docs2llms local <local_directory> [llms_file] [llms_full_file] [--skip <folder1> <folder2> ...]
```

### Remote

```
docs2llms <remote_directory> [llms_file] [llms_full_file] [--skip <folder1> <folder2> ...]
```

### Options

- `local_directory`: The local directory containing the documentation content.
- `remote_directory`: The URL to the remote directory containing the documentation content.
- `llms_file`: The output file for the processed content. Defaults to `llms.txt`.
- `llms_full_file`: The output file for the processed content. Defaults to `llms-full.txt`.
- `--skip`: The flag to skip specific folders during processing.

### Examples

```
docs2llms local example/docs
```
```
docs2llms remote https://github.com/stefanicjuraj/docs2llms/tree/main/example/docs
```
