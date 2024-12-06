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
const SUPPORTED_EXTENSIONS = [".md", ".mdx", ".txt", ".rst"];

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
  const command = new Deno.Command("git", {
    args: ["clone", "-b", branch, "--single-branch", url, temporaryDirectory],
    stdout: "piped",
    stderr: "piped",
  });

  const { success, stderr } = await command.output();
  if (!success) {
    throw new Error(`🚫 Error cloning a Git repository: ${new TextDecoder().decode(stderr)}`);
  }

  return temporaryDirectory;
}

async function getDirectory(
  dirPath: string,
  basePath: string,
  skip: string[] = [],
  exclude: string[] = [],
  maxSize: number = Infinity,
): Promise<{ files: string[]; fullPaths: string[] }> {
  const files: string[] = [];
  const fullPaths: string[] = [];

  async function processDirectory(currentPath: string) {
    for await (const entry of Deno.readDir(currentPath)) {
      const entryPath = join(currentPath, entry.name);
      if (entry.isDirectory) {
        if (!skipDirectory(entry.name, skip)) {
          await processDirectory(entryPath);
        }
      } else if (
        SUPPORTED_EXTENSIONS.some((ext) => entry.name.endsWith(ext)) &&
        !exclude.some((ext) => entry.name.endsWith(ext))
      ) {
        const { size } = await Deno.stat(entryPath);
        if (size <= maxSize * 1024 * 1024) {
          files.push(relative(basePath, entryPath));
          fullPaths.push(entryPath);
        }
      }
    }
  }

  await processDirectory(dirPath);

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

  const fileLinks = files.map((file) => `- [${basename(file)}](${file})`).join(
    "\n",
  );
  await Deno.writeTextFile(llmsFilePath, fileLinks);

  const fileContents = await Promise.all(
    fullPaths.map((path) => Deno.readTextFile(path)),
  );
  await Deno.writeTextFile(llmsFullFilePath, fileContents.join("\n\n"));

  console.log(`\n✅ ${llmsFilePath}   ✅ ${llmsFullFilePath}`);
}

function previewOption(files: string[]) {
  const previewMap = files.reduce((map, file) => {
    const dir = file.substring(0, file.lastIndexOf("/") || 0);
    map[dir] = map[dir] || [];
    map[dir].push(basename(file));
    return map;
  }, {} as Record<string, string[]>);

  console.log("📂 Preview:");
  for (const [dir, fileNames] of Object.entries(previewMap)) {
    console.log(`\n${dir}/`);
    fileNames.forEach((file) => console.log(`  - ${file}`));
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

  console.log(`
📊 Analysis Report:
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
`);
}

async function main() {
  const args = Deno.args;

  const config: {
    localDir?: string;
    llmsFile: string;
    llmsFullFile: string;
    format: string;
    skip: string[];
    exclude: string[];
    branch: string;
    outputDir: string;
    githubUrl?: string;
    gitlabUrl?: string;
    preview: boolean;
    analyze: boolean;
    summary: boolean;
    maxSize: number;
  } = {
    llmsFile: "llms.txt",
    llmsFullFile: "llms-full.txt",
    format: "txt",
    skip: [],
    exclude: [],
    branch: DEFAULT_BRANCH,
    outputDir: ".",
    preview: false,
    analyze: false,
    summary: false,
    maxSize: Infinity,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--local":
        config.localDir = args[++i];
        break;
      case "--llms":
        config.llmsFile = args[++i];
        if (!config.llmsFile.includes(".")) {
          config.llmsFile += ".txt";
        }
        break;
      case "--llms-full":
        config.llmsFullFile = args[++i];
        if (!config.llmsFullFile.includes(".")) {
          config.llmsFullFile += ".txt";
        }
        break;
      case "--format":
        config.format = args[++i].replace(/^\./, "");
        config.llmsFile = config.llmsFile.replace(/\.[^.]+$/, `.${config.format}`);
        config.llmsFullFile = config.llmsFullFile.replace(/\.[^.]+$/, `.${config.format}`);
        break;
      case "--skip":
        config.skip.push(...args[++i].split(","));
        break;
      case "--exclude":
        config.exclude.push(...args[++i].split(","));
        break;
      case "--branch":
        config.branch = args[++i];
        break;
      case "--output-dir":
        config.outputDir = args[++i];
        break;
      case "--preview":
        config.preview = true;
        break;
      case "--analyze":
        config.analyze = true;
        break;
      case "--summary":
        config.summary = true;
        break;
      case "--max-size":
        config.maxSize = parseFloat(args[++i]);
        break;
      case "--github":
        config.githubUrl = args[++i];
        break;
      case "--gitlab":
        config.gitlabUrl = args[++i];
        break;
      case "--help":
        helpOption();
        Deno.exit(0);
    }
  }

  if (!config.localDir && !config.githubUrl && !config.gitlabUrl) {
    console.error(
      "⚠️ Provide a valid local directory, GitHub or GitLab URL.",
    );
    helpOption();
    Deno.exit(1);
  }

  try {
    let dirPath = config.localDir;

    if (config.githubUrl) {
      const { owner, repo, branch, path } = parseURL(
        config.githubUrl,
        "https://github.com/",
      );
      dirPath = await cloneRepository(
        `https://github.com/${owner}/${repo}.git`,
        branch || config.branch,
      );
      if (path) dirPath = join(dirPath, path);
    } else if (config.gitlabUrl) {
      const { owner, repo, branch, path } = parseURL(
        config.gitlabUrl,
        "https://gitlab.com/",
      );
      dirPath = await cloneRepository(
        `https://gitlab.com/${owner}/${repo}.git`,
        branch || config.branch,
      );
      if (path) dirPath = join(dirPath, path);
    }

    const { files, fullPaths } = await getDirectory(
      dirPath!,
      dirPath!,
      config.skip,
      config.exclude,
      config.maxSize,
    );

    if (config.preview) {
      previewOption(files);
      const userInput = prompt("➜ Continue with processing the content? (y/n)");
      if (userInput?.toLowerCase() !== "y") {
        Deno.exit(0);
      }
    }

    if (config.analyze) {
      await analyzeOption(files, fullPaths);
      Deno.exit(0);
    }

    if (config.summary) {
      console.log("📄 Summary:");
      files.forEach((file) => console.log(`+ ${file}`));
      Deno.exit(0);
    }

    await writeFiles(
      config.llmsFile,
      config.llmsFullFile,
      files,
      fullPaths,
      config.outputDir,
    );

    if ((config.githubUrl || config.gitlabUrl) && dirPath) {
      await Deno.remove(dirPath, { recursive: true });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("🚫 Error:", error.message);
    } else {
      console.error("🚫 Error:", error);
    }
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
