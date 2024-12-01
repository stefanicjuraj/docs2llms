# docs2llms

docs2llms transforms software documentation content into formats optimized for use by AI and large language models (LLMs).

## Usage

### Local

Deno
```
deno docs2llms.ts local <local_directory> [output_file] [--skip <folder1> <folder2> ...]
```

Parameters

- `local_directory`: The local directory containing the documentation content.
- `output_file`: The output file for the processed content. Defaults to `llms-full.txt`.
- `--skip`: The flag to skip specific folders during processing.

### Remote

Deno
```
deno docs2llms.ts <remote_directory> [output_file] [--skip <folder1> <folder2> ...]
```

Parameters

- `remote_directory`: The URL to the remote directory containing the documentation content.
- `output_file`: The output file for the processed content. Defaults to `llms-full.txt`.
- `--skip`: The flag to skip specific folders during processing.

### Examples

```
deno docs2llms.ts local example
```
```
deno docs2llms.ts local https://github.com/stefanicjuraj/docs2llms/tree/main/example/docs
```
