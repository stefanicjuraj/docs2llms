# docs2llms

**Transform software documentation content into formats optimized for use by AI and LLMs.**

docs2llms is a command-line tool built with Deno and TypeScript.

Using the [llms.txt standard](https://llmstxt.org/), this tool ensures consistent text formatting for AI and LLMs by extracting content from local directories or remote repositories and converting it into *llms.txt* and *llms-full.txt* files.

The *llms.txt* file includes hyperlinks to the extracted content, whereas the *llms-full.txt* file contains the fully processed content. View the generated [llms.txt](https://github.com/stefanicjuraj/docs2llms/blob/main/llms.txt) and [llms-full.txt](https://github.com/stefanicjuraj/docs2llms/blob/main/llms-full.txt) files for this repository.

## Features

&rarr; **Content conversion**

Transform documentation content into standardized `llms.txt` and `llms-full.txt` formats optimized for AI and LLM processing.

&rarr; **Repository integration**

Extract documentation content directly from local directories or remote repositories on GitHub or GitLab.

&rarr; **Configurable options**

Configure file naming, content format, branch selection, output directory, excluded file types, folders to skip, and more.

## Installation

```sh
deno install -n docs2llms https://raw.githubusercontent.com/stefanicjuraj/docs2llms/main/index.ts --allow-read --allow-net --allow-write --allow-run --global -f
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

```txt
Usage (local):  ➜ docs2llms --local /path/to/directory
Usage (remote): ➜ docs2llms --github username/repository
                ➜ docs2llms --gitlab username/repository

➜ --llms:        Output file for extracted content hyperlinks. Defaults to llms.txt.
➜ --llms-full:   Output file for processed content. Defaults to llms-full.txt.
➜ --format:      Format of the processed content. Available: txt, md, rst.
➜ --branch:      The repository branch to clone from. Defaults to main.
➜ --output-dir:  The output directory of the processed content.
➜ --skip:        Folders to skip during processing.
➜ --exclude:     Exclude files based on specified extensions (md, mdx, rst, txt).
➜ --verbose:     Log the processed files in the terminal. 
➜ --summary:     Display a summary of the processed content.
➜ --analyze:     Analysis report of the processed content.
➜ --preview:     Preview the content in the terminal before processing.
➜ --interactive: Manually select and confirm each file to be processed.
```

#### **`--llms`**

Specify the name of the output file containing content hyperlinks. Defaults to `llms.txt`.

```bash
docs2llms --github username/repository --llms llms
```
  
`✅ llms.txt    ✅ llms-full.txt`
  
---

#### **`--llms-full`**

Specify the name of the output file containing the full content. Defaults to `llms-full.txt`.

```bash
docs2llms --github username/repository --llms-full llms-full
```

`✅ llms.txt    ✅ llms-full.txt`

---

#### **`--format`**

Specify the format of the processed content. Options: `txt`, `md`, `rst`. Defaults to `txt`.

```bash
docs2llms --github username/repository --format md
```

`✅ llms.md    ✅ llms-full.md`

---

#### **`--branch`**

Specify the repository branch to clone from. Defaults to `main`.

```bash
docs2llms --github username/repository --branch main
```

`✅ llms.txt    ✅ llms-full.txt`

---

#### **`--output-dir`**

Specify the output directory for the processed content. Defaults to the current directory.

```bash
docs2llms --github username/repository --output-dir .
```

`✅ llms.txt    ✅ llms-full.txt`

---

#### **`--skip`**

Specify folders to skip during processing.

```bash
docs2llms --github username/repository --skip assets
```

`✅ llms.txt    ✅ llms-full.txt`

---

#### **`--exclude`**

Specify file extensions to exclude from processing. Options: `md`, `mdx`, `rst`, `txt`.

```bash
docs2llms --github username/repository --exclude rst
```

`✅ llms.txt    ✅ llms-full.txt`

---

#### **`--verbose`**

Log the processed files in the terminal.

```bash
docs2llms --github username/repository --verbose
```

```txt
(1/3) ➜ example/docs/markdown.md
(2/3) ➜ example/docs/restructuredtext.rst
(3/3) ➜ example/docs/plain-text.txt
Processed ➜ 3 files

✅ llms.txt    ✅ llms-full.txt
```

---

#### **`--max-size`**

Specify the maximum file size (in MB) to include.

```bash
docs2llms --github username/repository --max-size 10
```

`✅ llms.txt    ✅ llms-full.txt`

---

#### **`--summary`**

Display a summary of the processed content after extraction.

```bash
docs2llms --github username/repository --summary
```

```txt
✅ llms.txt     ✅ llms-full.txt
📄 Summary:
+ example/docs/markdown.md
+ example/docs/restructuredtext.rst
+ example/docs/plain-text.txt
+ README.md
```

---

#### **`--analyze`**

Generate an analysis report of the content, including file count, word count, and average file size.

```bash
docs2llms --github username/repository --analyze
```

```txt
📊 Analysis Report:
Total files: 30
Total words: 50300
Average file size: 3.20 MB
```

---

#### **`--preview`**

Preview the content in the terminal prior to processing.

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
Do you want to process the content? (y/n)
```

---

#### **`--interactive`**

Manually select and confirm each file for processing.

```bash
docs2llms --github username/repository --interactive
```

```txt
(1/4): example/docs/markdown.md? (y/n)
(2/4): example/docs/restructuredtext.rst? (y/n)
(3/4): example/docs/plain-text.txt? (y/n)
(4/4): README.md? (y/n)
✅ llms.txt     ✅ llms-full.txt
```
