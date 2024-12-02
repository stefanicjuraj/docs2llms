# docs2llms

**Transform software documentation content into formats optimized for use by AI and LLMs.** 

docs2llms is a command-line tool built with Deno and TypeScript. It uses the [llms.txt](https://llmstxt.org/) standard to provide a consistent format for the AI and LLMs to consume.

## Installation

```
deno install -n docs2llms https://raw.githubusercontent.com/stefanicjuraj/docs2llms/main/docs2llms.ts --allow-read --allow-net --allow-write --allow-run --global -f
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

&rarr; **`--llms`**: Output file for the processed documentation pages. Defaults to `llms.txt`.

&rarr; **`--llms-full`**: Output file for the full processed documentation content. Defaults to `llms-full.txt`.

&rarr; **`--skip`**: Folders to skip when processing the documentation content.

&rarr; **`--format`**: Format of the processed documentation content. Available: `txt`, `md`, `rst`. Defaults to `txt`.

&rarr; **`--preview`**: Preview the processed documentation content in the terminal. Does not create output files.

&rarr; **`--interactive`**: Interactively select individual files to be processed.

### Examples

```bash
# From a local directory
docs2llms --local path/to/directory

# From a remote repository
docs2llms https://github.com/username/repository

# Custom output files
docs2llms https://github.com/username/repository --llms llms-file.txt --llms-full llms-full-file.txt

# Custom format
docs2llms https://github.com/username/repository --format txt

# Skip folders
docs2llms https://github.com/username/repository --skip api,examples

# Preview the processed content
docs2llms https://github.com/username/repository --preview

# Interactively select individual files
docs2llms https://github.com/username/repository --interactive
```
