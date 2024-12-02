# docs2llms

Transform software documentation content into formats optimized for use by artificial intelligence (AI) and large language models (LLMs). 

## Installation

```
deno install -n docs2llms https://raw.githubusercontent.com/stefanicjuraj/docs2llms/main/docs2llms.ts --allow-read --allow-net --global -f
```

## Usage

### Local

```
docs2llms --local /path/to/directory
```

### Remote

```
docs2llms https://github.com/username/repository
```

### Options

- `--local`: Local directory containing the documentation content.
- `--llms`: Output file for the processed documentation pages. Defaults to `llms.txt`.
- `-llms-full`: Output file for the full processed documentation content. Defaults to `llms-full.txt`.
- `--skip`: Folders to skip when processing the documentation content.

### Examples

```
docs2llms --local example/docs
docs2llms https://github.com/stefanicjuraj/docs2llms
```
