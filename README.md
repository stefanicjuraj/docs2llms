# docs2llms

**Transform software documentation content into formats optimized for use by AI and LLMs.** 

docs2llms is a command-line tool built with Deno and TypeScript. 

The tool utilizes [llms.txt standard](https://llmstxt.org/) to provide consistent formatting for AI and LLMs by extracting content from local directories or remote repositories and processing them into *llms.txt* and *llms-full.txt* files.

The *llms.txt* file contains hyperlinks to the extracted content, while the *llms-full.txt* file contains the processed content.

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
docs2llms --github username/repository
```

```
docs2llms --gitlab username/repository
```

### Options

&rarr; **`--llms`**: Name of the output file processing the `llms.txt` content hyperlinks.

&rarr; **`--llms-full`**: Name of the output file processing the `llms-full.txt` full content.

&rarr; **`--skip`**: Skip specified folders.

&rarr; **`--format`**: Format of the processed content. Available: `txt`, `md`, `rst`. Defaults to `txt`.

&rarr; **`--branch`**: The repository branch to clone from. Defaults to `main`.

&rarr; **`--summary`**: Display a summary of the processed content.

&rarr; **`--preview`**: Preview the content in the terminal before processing.

&rarr; **`--interactive`**: Manually select and confirm each file to be processed.

&rarr; **`--max-size`**: Skip files larger than the specified size (in MB).

### Examples

```bash
# From a local directory
docs2llms --local path/to/directory

# From a GitHub repository
docs2llms --github username/repository

# From a GitLab repository
docs2llms --gitlab username/repository

# Custom output files
docs2llms --github username/repository --llms llms-file --llms-full llms-full-file

# Custom format
docs2llms --github username/repository --format txt

# Specify branch
docs2llms --github username/repository --branch main

# Skip folders
docs2llms --github username/repository --skip api,examples

# Summarize processed content
docs2llms --github username/repository --summary

# Preview processed content
docs2llms --github username/repository --preview

# Interactively select individual files
docs2llms --github username/repository --interactive

# Skip files larger than 1 MB
docs2llms --github username/repository --max-size 1
```
