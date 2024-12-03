# docs2llms

**Transform software documentation content into formats optimized for use by AI and LLMs.** 

docs2llms is a command-line tool built with Deno and TypeScript. 

The tool utilizes [llms.txt standard](https://llmstxt.org/) to provide consistent formatting for AI and LLMs by extracting content from local directories or remote repositories and processing them into *llms.txt* and *llms-full.txt* files.

The *llms.txt* file contains hyperlinks to the extracted content, while the *llms-full.txt* file contains the processed content.

## Installation

```sh
deno install -n docs2llms https://raw.githubusercontent.com/stefanicjuraj/docs2llms/main/docs2llms.ts --allow-read --allow-net --allow-write --allow-run --global -f
```

## Usage

### Local

```sh
docs2llms --local /path/to/directory
```

### Remote

```sh
docs2llms --github username/repository
```

```sh
docs2llms --gitlab username/repository
```

### Options

---

#### **`--llms`**

Name of the output file processing the `llms.txt` content hyperlinks.

```bash
docs2llms --github username/repository --llms llms
```
  
`✅ llms.txt`
  
---

#### **`--llms-full`**

Name of the output file processing the `llms-full.txt` full content.

```bash
docs2llms --github username/repository --llms-full llms-full
```

`✅ llms.txt`

---

#### **`--skip`**

Skip specified folders.

```bash
docs2llms --github username/repository --skip assets
```

`✅ llms.txt    ✅llms-full.txt`

---

#### **`--format`**

  Format of the processed content. Available: `txt`, `md`, `rst`. Defaults to `txt`.

```bash
docs2llms --github username/repository --format md
```

`✅ llms.md    ✅llms-full.md`

---

#### **`--branch`**

The repository branch to clone from. Defaults to `main`.

```bash
docs2llms --github username/repository --branch main
```

`✅ llms.txt    ✅llms-full.txt`

---

#### **`--summary`**

Display a summary of the processed content.

```bash
docs2llms --github username/repository --summary
```

```txt
✅ llms.txt     ✅ llms-full.txt
📄 Summary:
🗂️ : [
"example/docs/markdown.md",
"example/docs/restructuredtext.rst",
"example/docs/plain-text.txt",
"README.md"
]
```

---

#### **`--preview`**

  Preview the content in the terminal before processing.

```bash
docs2llms --github username/repository --preview
```

```txt
📂 Preview:
example/docs/
- markdown.md
- restructuredtext.rst
- plain-text.txt
./
- README.md
```

---

#### **`--interactive`**

Manually select and confirm each file to be processed.

```bash
docs2llms --github username/repository --interactive
```

`(1/4): example/docs/markdown.md? (y/n)`

---

#### **`--max-size`**

Skip files larger than the specified size (in MB).

```bash
docs2llms --github username/repository --max-size 10
```

`✅ llms.txt    ✅llms-full.txt`

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
