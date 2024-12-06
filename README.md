# docs2llms

**Transform software documentation into formats optimized for use by AI and LLMs.**

docs2llms is a command-line tool built with Deno and TypeScript.

Using the [llms.txt standard](https://llmstxt.org/), the tool ensures consistent text formatting for AI and LLMs by extracting software documentation from local directories or remote repositories and converting it into *llms.txt* and *llms-full.txt* files.

The *llms.txt* file contains hyperlinks to the documentation files, while the *llms-full.txt* file contains the fully processed documentation content. View examples of the generated [llms.txt](https://github.com/stefanicjuraj/docs2llms/blob/main/llms.txt) and [llms-full.txt](https://github.com/stefanicjuraj/docs2llms/blob/main/llms-full.txt) files for this repository.

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

➜ --llms:        Output file for hyperlinks to the documentation files. Defaults to llms.txt.
➜ --llms-full:   Output file for full documentation content. Defaults to llms-full.txt.
➜ --format:      Format of the documentation content. Available: txt, md, rst.
➜ --branch:      Repository branch to clone from. Defaults to main.
➜ --output-dir:  Output directory for the processed documentation content.
➜ --skip:        Folders to skip during processing documentation content.
➜ --exclude:     Exclude documentation files based on extensions (md, mdx, rst, txt).
➜ --max-size:    Include documentation files smaller than the specified maximum size (in MB).
➜ --summary:     Summary of the processed documentation files.
➜ --analyze:     Analysis report of the processed documentation content.
➜ --preview:     Preview the documentation files before processing.
➜ --interactive: Manually select and confirm each documentation file to be processed.
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
