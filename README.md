# docs2llms

docs2llms transforms software documentation content into formats optimized for use by AI and large language models (LLMs).

## Usage

### Local

Deno
```
deno docs2llms.ts local <local_directory> [llms_file] [llms_full_file] [--skip <folder1> <folder2> ...]
```

### Remote

Deno
```
deno docs2llms.ts <remote_directory> [llms_file] [llms_full_file] [--skip <folder1> <folder2> ...]
```

## Parameters

- `remote_directory`: The URL to the remote directory containing the documentation content.
- `llms_file`: The output file for the processed content. Defaults to `llms.txt`.
- `llms_full_file`: The output file for the processed content. Defaults to `llms-full.txt`.
- `--skip`: The flag to skip specific folders during processing.

### Examples

```
deno docs2llms.ts local example/docs
```
```
deno docs2llms.ts remote https://github.com/stefanicjuraj/docs2llms/tree/main/example/docs
```
