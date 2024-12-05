#!/usr/bin/env

import { basename, join, relative } from "https://deno.land/std/path/mod.ts";

interface RepositoryURL {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

const DEFAULT_BRANCH = "main";
const IGNORE_DIRECTORIES = ["node_modules", ".git", "dist", "build"];

function validateURL(url: string, pattern: RegExp): boolean {
  return pattern.test(url);
}

function parseURL(url: string, baseUrl: string): RepositoryURL {
  const [owner, repo, , branch = DEFAULT_BRANCH, ...pathParts] = url.replace(
    baseUrl,
    "",
  ).split("/");
  return { owner, repo, branch, path: pathParts.join("/") };
}

function skipDirectory(dirName: string, skip: string[]): boolean {
  return skip.includes(dirName) || dirName.startsWith(".") ||
    IGNORE_DIRECTORIES.includes(dirName);
}

async function cloneRepository(url: string, branch: string): Promise<string> {
  const temporaryDirectory = await Deno.makeTempDir();
  const { success, stderr } = await new Deno.Command("git", {
    args: ["clone", "-b", branch, "--single-branch", url, temporaryDirectory],
    stdout: "piped",
    stderr: "piped",
  }).output();

  if (!success) {
    throw new Error(`Git clone failed: ${new TextDecoder().decode(stderr)}`);
  }
  return temporaryDirectory;
}

async function getDirectory(
  dirPath: string,
  basePath: string,
  skip: string[] = [],
  exclude: string[] = [],
  maxSize: number = Infinity,
  verbose = false,
): Promise<{ files: string[]; fullPaths: string[] }> {
  const files: string[] = [];
  const fullPaths: string[] = [];
  const supportedExtensions = [".md", ".mdx", ".txt", ".rst"];

  async function processDirectory(currentPath: string) {
    for await (const entry of Deno.readDir(currentPath)) {
      const directoryPath = join(currentPath, entry.name);
      if (entry.isDirectory) {
        if (!skipDirectory(entry.name, skip)) {
          await processDirectory(directoryPath);
        }
      } else if (
        supportedExtensions.some((ext) => entry.name.endsWith(ext)) &&
        !exclude.some((ext) => entry.name.endsWith(ext))
      ) {
        const { size } = await Deno.stat(directoryPath);
        if (size <= maxSize * 1024 * 1024) {
          files.push(relative(basePath, directoryPath));
          fullPaths.push(directoryPath);
        }
      }
    }
  }

  await processDirectory(dirPath);
  if (verbose) {
    files.forEach((file, idx) =>
      console.log(`(${idx + 1}/${files.length}) ➜ ${file}`)
    );
    console.log(`\nProcessed ➜ ${files.length} files`);
  }
  return { files, fullPaths };
}

async function writeFiles(
  llmsFile: string,
  llmsFullFile: string,
  files: string[],
  fullPaths: string[],
  outputDir: string,
) {
  const llmsFilePath = join(outputDir, llmsFile);
  const llmsFullFilePath = join(outputDir, llmsFullFile);

  await Deno.writeTextFile(
    llmsFilePath,
    files.map((file) => `- [${basename(file)}](${file})`).join("\n"),
  );
  const content = await Promise.all(
    fullPaths.map((path) => Deno.readTextFile(path)),
  );
  await Deno.writeTextFile(llmsFullFilePath, content.join("\n\n"));

  console.log(`\n✅ ${llmsFilePath}\n✅ ${llmsFullFilePath}`);
}

function previewOption(files: string[]) {
  const previewMap = files.reduce((map, file) => {
    const [dir, fileName] = [
      file.substring(0, file.lastIndexOf("/") || 0),
      basename(file),
    ];
    if (!map[dir]) map[dir] = [];
    map[dir].push(fileName);
    return map;
  }, {} as Record<string, string[]>);

  console.log("📂 Preview:");
  for (const dir in previewMap) {
    console.log(`\n${dir}/`);
    previewMap[dir].forEach((file) => console.log(`  - ${file}`));
  }
}

async function analyzeOption(files: string[], fullPaths: string[]) {
  const analysis = {
    totalWords: 0,
    totalSize: 0,
    folders: new Set<string>(),
  };

  for (const fullPath of fullPaths) {
    const content = await Deno.readTextFile(fullPath);
    analysis.totalWords += content.split(/\s+/).length;
    analysis.totalSize += (await Deno.stat(fullPath)).size;
    analysis.folders.add(fullPath.substring(0, fullPath.lastIndexOf("/")));
  }

  console.log(`📊 Analysis Report:
Total folders: ${analysis.folders.size}
Total files: ${files.length}
Total words: ${analysis.totalWords}
Average file size: ${
    (analysis.totalSize / files.length / 1024).toFixed(2)
  } KB`);
}

function helpOption() {
  console.log(`
Usage (local):  ➜ docs2llms --local /path/to/directory
Usage (remote): ➜ docs2llms --github username/repository
                ➜ docs2llms --gitlab username/repository

➜ --llms:        Output file for extracted content hyperlinks. Defaults to llms.txt.
➜ --llms-full:   Output file for processed content. Defaults to llms-full.txt.
➜ --format:      Format of the processed content. Available: txt, md, rst. Defaults to txt.
➜ --branch:      The repository branch to clone from. Defaults to main.
➜ --output-dir:  The output directory of the processed content. Defaults to the current directory.
➜ --skip:        Folders to skip during processing.
➜ --exclude:     Exclude files based on specified extensions (md, mdx, rst, txt).
➜ --verbose:     Log the processed files in the terminal.
➜ --summary:     Display a summary of the processed content.
➜ --analyze:     Analysis report of the content (file and word counts, average file size).
➜ --preview:     Preview the content in the terminal before processing.
➜ --interactive: Manually select and confirm each file to be processed.
`);
}

async function main() {
  const args = Deno.args;

  let localDir = "";
  let llmsName = "llms";
  let llmsFullName = "llms-full";
  let format = "txt";
  const skip: string[] = [];
  const exclude: string[] = [];
  let githubUrl = "";
  let gitlabUrl = "";
  let branch = "main";
  let preview = false;
  let interactive = false;
  let summary = false;
  let analyze = false;
  let maxSize = Infinity;
  let outputDir = ".";
  let verbose = false;

  if (args.includes("--help")) {
    helpOption();
    Deno.exit(0);
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--local":
        localDir = args[++i];
        break;
      case "--llms":
        llmsName = args[++i];
        break;
      case "--llms-full":
        llmsFullName = args[++i];
        break;
      case "--format":
        format = args[++i].replace(/^\./, "");
        break;
      case "--skip":
        i++;
        while (i < args.length && !args[i].startsWith("--")) {
          skip.push(args[i++]);
        }
        i--;
        break;
      case "--exclude":
        i++;
        while (i < args.length && !args[i].startsWith("--")) {
          exclude.push(args[i++]);
        }
        if (exclude.length === 0) {
          console.error(
            "⚠️ The --exclude option requires a value (txt, md, mdx, rst) to be specified.",
          );
          Deno.exit(1);
        }
        i--;
        break;
      case "--preview":
        preview = true;
        break;
      case "--interactive":
        interactive = true;
        break;
      case "--summary":
        summary = true;
        break;
      case "--analyze":
        analyze = true;
        break;
      case "--max-size":
        maxSize = parseFloat(args[++i]);
        break;
      case "--github":
        if (
          validateURL(
            args[++i],
            /^(https:\/\/github\.com\/|[^/]+\/[^/]+$)/,
          )
        ) {
          githubUrl = args[i].startsWith("https://github.com/")
            ? args[i]
            : `https://github.com/${args[i]}`;
        }
        break;
      case "--gitlab":
        if (
          validateURL(
            args[++i],
            /^(https:\/\/gitlab\.com\/|[^/]+\/[^/]+$)/,
          )
        ) {
          gitlabUrl = args[i].startsWith("https://gitlab.com/")
            ? args[i]
            : `https://gitlab.com/${args[i]}`;
        }
        break;
      case "--branch":
        branch = args[++i];
        break;
      case "--output-dir":
        outputDir = args[++i];
        break;
      case "--verbose":
        verbose = true;
        break;
    }
  }

  const llmsFile = `${llmsName}.${format}`;
  const llmsFullFile = `${llmsFullName}.${format}`;

  if (!localDir && !githubUrl && !gitlabUrl) {
    helpOption();
    Deno.exit(1);
  }

  if (
    (preview || interactive) &&
    (summary ||
      analyze ||
      maxSize !== Infinity ||
      skip.length > 0 ||
      llmsName !== "llms" ||
      llmsFullName !== "llms-full" ||
      format !== "txt" ||
      branch !== "main" ||
      outputDir !== ".")
  ) {
    console.log(
      "⚠️ The --preview and --interactive options cannot be combined with other options.",
    );
    Deno.exit(1);
  }

  try {
    let dirPath: string;
    if (localDir) {
      dirPath = localDir;
    } else if (githubUrl) {
      const {
        owner,
        repo,
        branch: urlBranch,
        path,
      } = parseURL(githubUrl, "https://github.com/");
      dirPath = await cloneRepository(
        `https://github.com/${owner}/${repo}.git`,
        branch || urlBranch,
      );

      if (path) {
        dirPath = join(dirPath, path);
      }
    } else if (gitlabUrl) {
      const {
        owner,
        repo,
        branch: urlBranch,
        path,
      } = parseURL(gitlabUrl, "https://gitlab.com/");
      dirPath = await cloneRepository(
        `https://gitlab.com/${owner}/${repo}.git`,
        branch || urlBranch,
      );

      if (path) {
        dirPath = join(dirPath, path);
      }
    } else {
      console.log(
        '⚠️ Invalid input. Provide a valid GitHub or GitLab URL, or use "--local".',
      );
      Deno.exit(1);
    }

    const { files, fullPaths } = await getDirectory(
      dirPath,
      dirPath,
      skip,
      exclude,
      maxSize,
      verbose,
    );

    if (analyze) {
      await analyzeOption(files, fullPaths);
      Deno.exit(0);
    }

    if (preview) {
      previewOption(files);
      const userInput = prompt("Do you want to process the content? (y/n)");
      if (userInput?.toLowerCase() !== "y") {
        Deno.exit(0);
      }
    }

    if (interactive) {
      const confirmFiles: string[] = [];
      const confirmFullPaths: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fullPath = fullPaths[i];
        const userInput = prompt(
          `(${i + 1}/${files.length}): ${file}? (y/n)`,
        );
        if (userInput?.toLowerCase() === "y") {
          confirmFiles.push(file);
          confirmFullPaths.push(fullPath);
        }
      }

      await writeFiles(
        llmsFile,
        llmsFullFile,
        confirmFiles,
        confirmFullPaths,
        outputDir,
      );
    } else {
      await writeFiles(
        llmsFile,
        llmsFullFile,
        files,
        fullPaths,
        outputDir,
      );
    }

    if (summary) {
      console.log("📄 Summary:");
      files.forEach((file) => console.log(`+ ${file}`));
    }

    if ((githubUrl || gitlabUrl) && !preview && !interactive) {
      await Deno.remove(dirPath, { recursive: true });
    }
  } catch (error) {
    console.error("Error:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
