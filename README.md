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

&rarr; **`--llms`**: Output file for extracted content hyperlinks. Defaults to `llms.txt`.

&rarr; **`--llms-full`**: Output file for processed content. Defaults to `llms-full.txt`.

&rarr; **`--skip`**: Folders to skip during processing.

&rarr; **`--format`**: Format for the processed content. Available: `txt`, `md`, `rst`. Defaults to `txt`.

&rarr; **`--branch`**: The repository branch to clone from. Defaults to `main`.

&rarr; **`--summary`**: Display a summary of the processed content.

&rarr; **`--preview`**: Preview the content in the terminal. Does not process content.

&rarr; **`--interactive`**: Interactively select individual files to be processed.

### Examples

```bash
# From a local directory
docs2llms --local path/to/directory

# From a remote repository
docs2llms --github username/repository

# Custom output files
docs2llms --github username/repository --llms llms-file.txt --llms-full llms-full-file.txt

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
```
